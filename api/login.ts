import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import crypto from 'crypto';

// --- Inline Auth Utils ---
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_me_in_prod';
const SALT_LENGTH = 16;
const HASH_LENGTH = 64;
const ITERATIONS = 10000;
const DIGEST = 'sha512';

function verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(':');
        if (!salt || !key) return resolve(false); // Invalid format

        crypto.pbkdf2(password, salt, ITERATIONS, HASH_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key === derivedKey.toString('hex'));
        });
    });
}

function base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function signToken(payload: object, expiresIn: string | number = '7d'): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    let exp = now + (7 * 24 * 60 * 60);
    if (typeof expiresIn === 'number') exp = now + expiresIn;
    const fullPayload = { ...payload, iat: now, exp };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

    const signature = crypto.createHmac('sha256', JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}
// -------------------------

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
            return res.status(404).json({ message: 'User not found.', code: 'USER_NOT_FOUND' });
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