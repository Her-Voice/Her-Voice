import { VercelRequest, VercelResponse } from '@vercel/node';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
import { Client } from 'pg';

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

        // Compare password
        // DEBUG: Disable bcrypt for resource check
        // const isPasswordValid = await bcrypt.compare(password, user.password);

        // Strictly check string equality to rule out bcrypt completely
        const isPasswordValid = password === user.password;

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT token
        // DEBUG: Disable JWT
        // const token = jwt.sign(
        //     { id: user.id, email: user.email },
        //     process.env.JWT_SECRET || 'your_jwt_secret',
        //     { expiresIn: '7d' }
        // );
        const token = 'dummy_token_no_jwt';

        return res.status(200).json({
            message: 'Login successful (No JWT, No Bcrypt).',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        await client.end();
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}