import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import crypto from 'crypto';

// --- Inline Auth Utils ---
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_me_in_prod';
const SALT_LENGTH = 16;
const HASH_LENGTH = 64;
const ITERATIONS = 10000;
const DIGEST = 'sha512';

function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
        crypto.pbkdf2(password, salt, ITERATIONS, HASH_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
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

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid JSON body' });
        }
    }
    body = body || {};

    const { email, password, name } = body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required.' });
    }

    // Hash password (Lightweight PBKDF2) - BEFORE DB connection
    const hashedPassword = await hashPassword(password);

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Check existing
        const existingUserResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            await client.end();
            return res.status(409).json({ message: 'User already exists.', code: 'USER_EXISTS' });
        }

        const resInsert = await client.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
            [name, email, hashedPassword]
        );
        const newUser = { id: resInsert.rows[0].id, email, name };

        await client.end();

        // Generate Token
        const token = signToken({ id: newUser.id, email: newUser.email });

        return res.status(200).json({ message: 'User registered successfully.', user: newUser, token });
    } catch (error: any) {
        return res.status(500).json({ message: 'Signup failed', error: error.message });
    }
}