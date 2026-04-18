import { Router } from 'express';
import { getSubscriptionPlans, getMySubscription, subscribe } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/plans', getSubscriptionPlans);
router.get('/me', authenticate, getMySubscription);
router.post('/subscribe', authenticate, subscribe);

export default router;
