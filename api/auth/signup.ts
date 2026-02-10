import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const email = `test_${Date.now()}@example.com`;
        const name = 'Test User';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const insertUserQuery = `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email;
        `;
        const insertUserResult = await client.query(insertUserQuery, [name, email, hashedPassword]);
        const newUser = insertUserResult.rows[0];

        const token = jwt.sign({ id: newUser.id }, 'secret');

        await client.end();

        return res.status(201).json({
            message: 'Signup INSERT OK',
            user: newUser,
            token
        });
    } catch (error: any) {
        return res.status(500).json({ message: 'Signup failed', error: error.message });
    }
}