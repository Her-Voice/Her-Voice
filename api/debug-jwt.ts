import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export default function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const token = jwt.sign({ foo: 'bar' }, 'shhh');
        const decoded = jwt.verify(token, 'shhh');
        return res.status(200).json({ message: 'JWT works', token, decoded });
    } catch (error: any) {
        return res.status(500).json({ message: 'JWT failed', error: error.message });
    }
}
