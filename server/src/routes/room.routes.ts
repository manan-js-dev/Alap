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

export default router;
