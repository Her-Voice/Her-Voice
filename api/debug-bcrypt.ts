import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const hash = await bcrypt.hash('test', 10);
        return res.status(200).json({ message: 'Bcrypt works', hash });
    } catch (error: any) {
        return res.status(500).json({ message: 'Bcrypt failed', error: error.message });
    }
}
