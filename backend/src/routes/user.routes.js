import { Router } from 'express';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/user.controller.js';
<<<<<<< HEAD
import { authenticateToken } from '../middlewares/auth.middleware.js';
=======
import { authenticateToken } from '../../../src/middlewares/auth.middleware.js';
>>>>>>> 9d32ac66e021bb36362bd1d5aeaccc0f8d19a990
import { avatarUpload } from '../config/upload.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
