import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const email = `debug_${Date.now()}@test.com`;
        const resInsert = await client.query(
            "INSERT INTO users (name, email, password) VALUES ('Debug', $1, 'pass') RETURNING id",
            [email]
        );
        await client.end();
        return res.status(200).json({ message: 'Signup (Cloned Debug PG) works', id: resInsert.rows[0].id, token: 'dummy_token' });
    } catch (error: any) {
        return res.status(500).json({ message: 'Signup failed', error: error.message });
    }
}