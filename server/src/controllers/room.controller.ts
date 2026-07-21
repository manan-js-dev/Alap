import { Response } from 'express';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';
import Message from '../models/Message';

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
      admins: [req.userId],
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

export const updateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Only admins can edit
    const isAdmin = room.admins.some((a) => a.toString() === req.userId);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can edit this room' });

    const { name, description } = req.body;

    // Check name uniqueness if changed
    if (name && name !== room.name) {
      const exists = await Room.findOne({ name });
      if (exists) return res.status(400).json({ message: 'Room name already taken' });
    }

    room.name = name || room.name;
    room.description = description ?? room.description;
    await room.save();

    res.json(room);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isAdmin = room.admins.some((a) => a.toString() === req.userId);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members' });

    const { userId } = req.body;

    const alreadyMember = room.members.some((m) => m.toString() === userId);
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    room.members.push(new mongoose.Types.ObjectId(userId));
    await room.save();

    const updated = await Room.findById(req.params.id)
      .populate('members', 'username email isOnline avatar')
      .populate('admins', 'username');

    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isAdmin = room.admins.some((a) => a.toString() === req.userId);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove members' });

    const { userId } = req.params;

    // Can't remove creator
    if (room.createdBy.toString() === userId)
      return res.status(400).json({ message: 'Cannot remove room creator' });

    room.members = room.members.filter((m) => m.toString() !== userId) as mongoose.Types.ObjectId[];
    room.admins = room.admins.filter((a) => a.toString() !== userId) as mongoose.Types.ObjectId[];
    await room.save();

    res.json({ message: 'Member removed successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const makeAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isAdmin = room.admins.some((a) => a.toString() === req.userId);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can promote members' });

    const { userId } = req.body;

    const alreadyAdmin = room.admins.some((a) => a.toString() === userId);
    if (alreadyAdmin) return res.status(400).json({ message: 'User is already an admin' });

    room.admins.push(new mongoose.Types.ObjectId(userId));
    await room.save();

    res.json({ message: 'User promoted to admin' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isAdmin = room.admins.some((a) => a.toString() === req.userId);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can delete this room' });

    await Room.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ room: req.params.id });

    res.json({ message: 'Room deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
