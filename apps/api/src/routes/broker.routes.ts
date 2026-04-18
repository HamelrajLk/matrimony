import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getBrokerProfiles,
  getBrokerStats,
  createBrokerProfile,
  deleteBrokerProfile,
  restoreBrokerProfile,
  getBrokerDeletedProfiles,
} from '../controllers/broker.controller';

const router = Router();

router.use(authenticate);

router.get('/stats',                      getBrokerStats);
router.get('/profiles',                   getBrokerProfiles);
router.post('/profiles',                  createBrokerProfile);
router.delete('/profiles/:id',            deleteBrokerProfile);
router.post('/profiles/:id/restore',      restoreBrokerProfile);
router.get('/deleted-profiles',           getBrokerDeletedProfiles);

export default router;
