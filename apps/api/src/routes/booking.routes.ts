import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createBooking,
  getMyBookings,
  getPartnerBookings,
  updateBookingStatus,
  cancelBooking,
} from '../controllers/booking.controller';

const router = Router();

router.use(authenticate);

router.post('/',              createBooking);
router.get('/mine',           getMyBookings);
router.get('/partner',        getPartnerBookings);
router.put('/:id/status',     updateBookingStatus);
router.delete('/:id',         cancelBooking);

export default router;
