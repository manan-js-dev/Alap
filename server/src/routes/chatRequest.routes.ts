import { Router } from 'express';
import {
  sendRequest,
  getRequests,
  updateRequest,
  getSentRequests,
  getDirectRooms,
} from '../controllers/chatRequest.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { sendRequestSchema, updateRequestSchema } from '../utils/validators';

const router = Router();

// POST /api/requests
router.post('/', protect, validate(sendRequestSchema), sendRequest);

// GET /api/requests (pending received requests)
router.get('/', protect, getRequests);

// GET /api/requests/sent
router.get('/sent', protect, getSentRequests);

// GET /api/requests/direct-rooms
router.get('/direct-rooms', protect, getDirectRooms);

// PUT /api/requests/:id
router.put('/:id', protect, validate(updateRequestSchema), updateRequest);

export default router;
