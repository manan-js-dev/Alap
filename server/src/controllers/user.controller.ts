import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

export const searchByEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    // Can't search yourself
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.userId)
      return res.status(400).json({ message: 'You cannot search yourself' });

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username, bio, avatar } = req.body;

    const exists = await User.findOne({
      username,
      _id: { $ne: req.userId },
    });
    if (exists) return res.status(400).json({ message: 'Username already taken' });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { username, bio, avatar },
      { new: true },
    ).select('-password');

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
