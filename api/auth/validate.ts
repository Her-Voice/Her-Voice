import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

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

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as any;

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
        await client.end().catch(() => { });
        return res.status(401).json({ message: 'Invalid token.' });
    }
}
