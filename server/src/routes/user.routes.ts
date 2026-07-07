import { Router } from 'express';
import { searchByEmail, updateProfile } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { searchUserSchema } from '../utils/validators';

const router = Router();

// POST /api/users/search
router.post('/search', protect, validate(searchUserSchema), searchByEmail);

// PUT /api/users/profile
router.put('/profile', protect, updateProfile);

export default router;
