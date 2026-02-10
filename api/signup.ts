import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import { hashPassword, signToken } from './auth-utils';

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

    const { email, password, name } = body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required.' });
    }

    // Hash password (Lightweight PBKDF2) - BEFORE DB connection
    const hashedPassword = await hashPassword(password);

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Check existing
        const existingUserResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            await client.end();
            return res.status(400).json({ message: 'User already exists.' });
        }

        const resInsert = await client.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
            [name, email, hashedPassword]
        );
        const newUser = { id: resInsert.rows[0].id, email, name };

        await client.end();

        // Generate Token
        const token = signToken({ id: newUser.id, email: newUser.email });

        return res.status(200).json({ message: 'User registered successfully.', user: newUser, token });
    } catch (error: any) {
        return res.status(500).json({ message: 'Signup failed', error: error.message });
    }
}