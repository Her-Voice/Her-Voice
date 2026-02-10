import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Test DB Connect
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const hash = await bcrypt.hash('test', 1);
        await client.end();

        return res.status(200).json({
            message: 'Signup DB+Hash OK',
            checks: {
                db: true,
                hash: !!hash
            }
        });
    } catch (error: any) {
        return res.status(500).json({ message: 'Signup failed', error: error.message });
    }
}