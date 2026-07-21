import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

const generateToken = (id: string | object) =>
  jwt.sign(
    { id },
    (process.env.JWT_SECRET || 'secret') as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as jwt.SignOptions,
  );

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      const field = exists.email === email ? 'email' : 'username';
      return res.status(400).json({ message: `This ${field} is already taken` });
    }
    const user = await User.create({ username, email, password });
    res.status(201).json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
