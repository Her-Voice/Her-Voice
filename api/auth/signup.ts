import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Check if imports work by just logging something related to them?
    const client = new Client({ connectionString: 'postgres://dummy' }); // Just accessing constructor
    const hash = await bcrypt.hash('test', 1); // Fast hash
    const token = jwt.sign({ test: true }, 'secret');

    return res.status(200).json({
        message: 'Signup minimal debug OK',
        checks: {
            client: !!client,
            hash: !!hash,
            token: !!token
        }
    });
}