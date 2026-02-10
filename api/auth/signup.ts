import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid JSON body' });
        }
    }
    body = body || {};

    // DEBUG: Hardcode values to test if req.body is the issue
    const email = `debug_signup_${Date.now()}@test.com`;
    const password = 'hardcoded_pass';
    const name = 'Hardcoded User';

    // const { email, password, name } = body;

    // if (!email || !password || !name) {
    //    return res.status(400).json({ message: 'Email, password, and name are required.' });
    //}

    let client;

    try {
        // PERF: Haash password before DB connection to save resources
        // DEBUG: Disable bcrypt completely to test interaction with PG
        // const hashedPassword = await bcrypt.hash(password, 1);
        const hashedPassword = 'dummy_hash_for_debug';

        client = new Client({
            connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // Check for existing user
        const existingUserQuery = 'SELECT * FROM users WHERE email = $1';
        const existingUserResult = await client.query(existingUserQuery, [email]);

        if (existingUserResult.rows.length > 0) {
            await client.end();
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Create new user
        const insertUserQuery = `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email;
        `;
        const insertUserResult = await client.query(insertUserQuery, [name, email, hashedPassword]);
        const newUser = insertUserResult.rows[0];

        // Generate JWT token
        // DEBUG: Disable JWT to test crash
        // const token = jwt.sign(
        //    { id: newUser.id, email: newUser.email },
        //    process.env.JWT_SECRET || 'your_jwt_secret',
        //    { expiresIn: '7d' }
        // );
        const token = 'dummy_token_debug';

        await client.end();
        return res.status(201).json({
            message: 'User registered successfully.',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (error: any) {
        console.error('Signup error:', error);
        if (client) {
            await client.end().catch(() => { });
        }
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}