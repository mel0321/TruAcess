import { Router } from 'express';
import { getProfile, getMyComments, updateProfile, uploadAvatar, deleteAccount } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { avatarUpload } from '../config/upload.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.get('/comments', getMyComments);
router.put('/profile', updateProfile);
router.delete('/profile', deleteAccount);
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
