import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    return res.status(200).json({ message: 'Signup imports OK' });
}