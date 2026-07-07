import { Response } from 'express';
import ChatRequest from '../models/ChatRequest';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

export const sendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId } = req.body;

    if (receiverId === req.userId)
      return res.status(400).json({ message: 'You cannot send request to yourself' });

    // Check if request already exists
    const existing = await ChatRequest.findOne({
      $or: [
        { sender: req.userId, receiver: receiverId },
        { sender: receiverId, receiver: req.userId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted')
        return res.status(400).json({ message: 'You are already connected' });
      if (existing.status === 'pending')
        return res.status(400).json({ message: 'Request already sent' });
      if (existing.status === 'rejected') {
        existing.status = 'pending';
        await existing.save();
        return res.json({ message: 'Request sent again' });
      }
    }

    const request = await ChatRequest.create({
      sender: req.userId,
      receiver: receiverId,
    });

    const populated = await request.populate([
      { path: 'sender', select: 'username email' },
      { path: 'receiver', select: 'username email' },
    ]);

    res.status(201).json(populated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await ChatRequest.find({
      receiver: req.userId,
      status: 'pending',
    }).populate('sender', 'username email isOnline');

    res.json(requests);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const request = await ChatRequest.findById(req.params.id)
      .populate('sender', 'username')
      .populate('receiver', 'username');

    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.receiver._id.toString() !== req.userId)
      return res.status(403).json({ message: 'Not authorized' });

    request.status = status;

    // If accepted create a private DM room
    if (status === 'accepted') {
      const room = await Room.create({
        name: `dm_${request.sender._id}_${request.receiver._id}`,
        description: 'Direct Message',
        createdBy: req.userId,
        members: [request.sender._id, request.receiver._id],
        isDirect: true,
      });
      request.room = room._id as mongoose.Types.ObjectId;
    }

    await request.save();
    res.json(request);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await ChatRequest.find({
      sender: req.userId,
    }).populate('receiver', 'username email isOnline');
    res.json(requests);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDirectRooms = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await ChatRequest.find({
      $or: [{ sender: req.userId }, { receiver: req.userId }],
      status: 'accepted',
    })
      .populate('sender', 'username isOnline')
      .populate('receiver', 'username isOnline')
      .populate('room');

    res.json(requests);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
