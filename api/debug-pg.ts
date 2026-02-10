import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const result = await client.query('SELECT NOW()');
        await client.end();
        return res.status(200).json({ message: 'PG works', time: result.rows[0] });
    } catch (error: any) {
        return res.status(500).json({ message: 'PG failed', error: error.message });
    }
}
