import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import { verifyToken } from '../../lib/auth-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        const client = new Client({
            connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        const query = 'SELECT id, name, email FROM users WHERE id = $1';
        const result = await client.query(query, [decoded.id]);
        const user = result.rows[0];
        await client.end();

        if (!user) {
            return res.status(401).json({ message: 'User not found.' });
        }

        return res.status(200).json({
            valid: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
