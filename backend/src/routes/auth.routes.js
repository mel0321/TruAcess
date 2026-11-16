import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  resetPassword,
  login,
  getMe
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendVerificationCode);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

export default router;
