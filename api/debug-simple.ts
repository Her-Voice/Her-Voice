import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    return res.status(200).json({ message: 'Simple debug works', env: process.env.NODE_ENV });
}
