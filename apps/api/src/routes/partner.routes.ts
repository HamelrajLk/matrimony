import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getMe, updateMe, uploadPartnerImage, uploadPartnerImageMiddleware, getPartnerCounts, getPartnerList, getPartnerById } from '../controllers/partner.controller';

const router = Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.post('/me/images', authenticate, uploadPartnerImageMiddleware, uploadPartnerImage as any);

// Public
router.get('/counts', getPartnerCounts);
router.get('/list', getPartnerList);
router.get('/:id', getPartnerById);

export default router;
