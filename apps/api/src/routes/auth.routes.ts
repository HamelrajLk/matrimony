import { Router } from 'express';
import {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendOtp,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me as any);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);

export { router as authRoutes };
