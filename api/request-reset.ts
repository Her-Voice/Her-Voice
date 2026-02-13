import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Check if user exists
        const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];

            // Generate secure random token
            const token = crypto.randomBytes(32).toString('hex');

            // Set expiration (1 hour from now)
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour in ms

            // Save to password_resets table
            await client.query(
                'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
                [email, token, expiresAt]
            );

            // SIMULATE EMAIL SENDING
            console.log("---------------------------------------------------");
            console.log(`[SIMULATION] Password Reset Requested for: ${email}`);
            console.log(`[SIMULATION] Reset Link: http://localhost:3000/reset-password?token=${token}`);
            console.log("---------------------------------------------------");
        }

        // Always return success to prevent email enumeration
        await client.end();
        return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });

    } catch (error: any) {
        console.error('Password reset request error:', error);
        await client.end().catch(() => { });
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
