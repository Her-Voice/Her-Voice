import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User'; // Import your user model here

// Signup endpoint for user registration
export const signup = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required.' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
        email,
        password: hashedPassword,
        name,
    });

    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully.' });
};

// Export or integrate this function with your routing system accordingly.