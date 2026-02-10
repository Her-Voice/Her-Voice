import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const results: any = {
        env: {
            DATABASE_URL: !!process.env.DATABASE_URL,
            POSTGRES_URL: !!process.env.POSTGRES_URL,
            JWT_SECRET: !!process.env.JWT_SECRET,
            NODE_ENV: process.env.NODE_ENV
        },
        steps: {}
    };

    try {
        // Test bcrypt
        results.steps.bcryptStart = true;
        await bcrypt.hash('test', 10);
        results.steps.bcryptSuccess = true;

        // Test DB
        results.steps.dbStart = true;
        const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
        if (!connectionString) {
            throw new Error('No connection string found');
        }

        const client = new Client({
            connectionString,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        results.steps.dbConnected = true;

        const result = await client.query('SELECT NOW()');
        results.steps.dbQuery = result.rows[0];

        await client.end();
        results.steps.dbSuccess = true;

        return res.status(200).json(results);
    } catch (error: any) {
        results.error = {
            message: error.message,
            stack: error.stack
        };
        return res.status(500).json(results);
    }
}
