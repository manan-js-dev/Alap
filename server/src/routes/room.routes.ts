import { Router } from 'express';
import { getRooms, createRoom, joinRoom, getRoomById } from '../controllers/room.controller';
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

export default router;
