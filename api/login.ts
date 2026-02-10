import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import { verifyPassword, signToken } from './_lib/auth-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Find user by email
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await client.query(query, [email]);
        const user = result.rows[0];

        if (!user) {
            await client.end();
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Close DB connection EARLY to free resources before CPU intensive work
        await client.end();

        // Compare password (Lightweight PBKDF2)
        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT token (Lightweight HMAC)
        const token = signToken({ id: user.id, email: user.email });

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        await client.end().catch(() => { });
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}