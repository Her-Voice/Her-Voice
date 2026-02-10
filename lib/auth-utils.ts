
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_me_in_prod';
const SALT_LENGTH = 16; // 16 bytes
const HASH_LENGTH = 64; // 64 bytes
const ITERATIONS = 10000; // PBKDF2 iterations (enough for security, fast enough for Vercel)
const DIGEST = 'sha512';

// --- Password Hashing (PBKDF2) ---

export function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
        crypto.pbkdf2(password, salt, ITERATIONS, HASH_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(':');
        if (!salt || !key) return resolve(false); // Invalid format

        crypto.pbkdf2(password, salt, ITERATIONS, HASH_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key === derivedKey.toString('hex'));
        });
    });
}

// --- JWT (Manual Implementation using HMAC SHA256) ---

function base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return Buffer.from(str, 'base64').toString();
}

export function signToken(payload: object, expiresIn: string | number = '7d'): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    // Basic expiration handling using 'exp' claim if passed? 
    // Or we add it. 
    // expiresIn '7d' logic is complex to parse manualy.
    // Let's simplified expiration: always valid for now? Or just add `iat` and `exp`.

    const now = Math.floor(Date.now() / 1000);
    let exp = now + (7 * 24 * 60 * 60); // Default 7 days

    // Simple parsing if it's a number (seconds)
    if (typeof expiresIn === 'number') {
        exp = now + expiresIn;
    }

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

export function verifyToken(token: string): any {
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
