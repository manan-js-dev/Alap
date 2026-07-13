import { Response } from 'express';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await Room.find({ isDirect: { $ne: true } })
      .populate('createdBy', 'username')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const exists = await Room.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Room name already exists' });
    }

    const room = new Room({
      name,
      description,
      createdBy: req.userId,
      members: [req.userId],
    });

    await room.save();

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const joinRoom = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const alreadyMember = room.members.some((m) => m.toString() === req.userId);
    if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

    room.members.push(new mongoose.Types.ObjectId(req.userId));
    await room.save();

    res.json({ message: 'Joined room successfully', room });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoomById = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('members', 'username isOnline lastSeen');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
