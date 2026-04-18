import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/',                  getNotifications);
router.get('/unread-count',      getUnreadCount);
router.post('/mark-all-read',    markAllRead);
router.post('/:id/read',         markRead);
router.delete('/:id',            deleteNotification);

export default router;
