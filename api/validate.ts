import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db'; // Import the pool
import crypto from 'crypto';

// --- Inline Auth Utils (Preserved) ---
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_me_in_prod';

function base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return Buffer.from(str, 'base64').toString();
}

function verifyToken(token: string): any {
    try {
        const [encodedHeader, encodedPayload, signature] = token.split('.');
        if (!encodedHeader || !encodedPayload || !signature) return null;

        const expectedSignature = crypto.createHmac('sha256', JWT_SECRET)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        if (signature !== expectedSignature) return null;

        const payload = JSON.parse(base64UrlDecode(encodedPayload));

        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null; // Expired
        }

        return payload;
    } catch (e) {
        return null;
    }
}
// -------------------------

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

        // Use pool for query
        const query = 'SELECT id, name, email FROM users WHERE id = $1';
        const result = await pool.query(query, [decoded.id]);
        const user = result.rows[0];

        // No client.end() needed

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
