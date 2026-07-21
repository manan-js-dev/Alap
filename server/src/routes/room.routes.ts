import { Router } from 'express';
import {
  getRooms,
  createRoom,
  joinRoom,
  getRoomById,
  updateRoom,
  addMember,
  removeMember,
  makeAdmin,
} from '../controllers/room.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRoomSchema } from '../utils/validators';
import { deleteRoom } from '../controllers/room.controller';
import Room from '../models/Room';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/rooms
router.get('/', protect, getRooms);

// POST /api/rooms
router.post('/', protect, validate(createRoomSchema), createRoom);

// GET /api/rooms/:id
router.get('/:id', protect, getRoomById);

// POST /api/rooms/:id/join
router.post('/:id/join', protect, joinRoom);

// PUT /api/rooms/:id
router.put('/:id', protect, updateRoom);

// POST /api/rooms/:id/members
router.post('/:id/members', protect, addMember);

// DELETE /api/rooms/:id/members/:userId
router.delete('/:id/members/:userId', protect, removeMember);

// POST /api/rooms/:id/admins
router.post('/:id/admins', protect, makeAdmin);

// DELETE /api/rooms/:id
router.delete('/:id', protect, deleteRoom);

// DELETE /api/rooms/:id/leave
router.delete('/:id/leave', protect, async (req: AuthRequest, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    room.members = room.members.filter(
      (m) => m.toString() !== req.userId,
    ) as mongoose.Types.ObjectId[];
    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
