import { Response } from 'express';
import Message, { IMessage } from '../models/Message';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const messages = await Message.find({
      room: new mongoose.Types.ObjectId(req.params.roomId as string),
    })
      .populate('sender', 'username isOnline')
      .sort({ createdAt: 1 })
      .limit(50);

    res.json(messages);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const { content, type } = req.body;

    const message = await Message.create({
      room: new mongoose.Types.ObjectId(req.params.roomId as string),
      sender: new mongoose.Types.ObjectId(req.userId as string),
      content,
      type: type || 'text',
    });

    // Update lastMessage on room
    room.lastMessage = (message as IMessage)._id as mongoose.Types.ObjectId;
    await room.save();

    const populated = await message.populate('sender', 'username isOnline');

    res.status(201).json(populated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
