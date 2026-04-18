import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  sendMatchRequest,
  respondToMatch,
  getSentRequests,
  getReceivedRequests,
  getAcceptedMatches,
  getMatchStats,
} from '../controllers/match.controller';

const router = Router();

router.get('/stats', authenticate, getMatchStats as any);
router.get('/sent', authenticate, getSentRequests as any);
router.get('/received', authenticate, getReceivedRequests as any);
router.get('/accepted', authenticate, getAcceptedMatches as any);
router.post('/', authenticate, sendMatchRequest as any);
router.put('/:id', authenticate, respondToMatch as any);

export default router;
