import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/message.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { sendMessageSchema } from '../utils/validators';

const router = Router();

// GET /api/rooms/:roomId/messages
router.get('/:roomId/messages', protect, getMessages);

// POST /api/rooms/:roomId/messages
router.post('/:roomId/messages', protect, validate(sendMessageSchema), sendMessage);

export default router;
