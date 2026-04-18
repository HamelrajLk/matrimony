import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createNotification } from './notification.controller';

// ── POST /api/bookings ────────────────────────────────────────────────────────
export async function createBooking(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const { partnerId, serviceType, eventDate, eventLocation, guestCount, budget, notes } = req.body;

    if (!partnerId || !serviceType || !eventDate) {
      return res.status(400).json({ message: 'partnerId, serviceType, and eventDate are required' });
    }

    const partner = await (prisma.partner as any).findUnique({
      where: { id: Number(partnerId), status: 'ACTIVE' },
      select: { id: true, businessName: true, userId: true },
    });
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    const booking = await (prisma.booking as any).create({
      data: {
        userId,
        partnerId: Number(partnerId),
        serviceType,
        eventDate: new Date(eventDate),
        eventLocation: eventLocation || null,
        guestCount: guestCount ? Number(guestCount) : null,
        budget: budget || null,
        notes: notes || null,
        status: 'PENDING',
      },
    });

    // Notify the partner
    await createNotification({
      userId: partner.userId,
      type: 'BOOKING_REQUEST',
      title: 'New Booking Request',
      body: `You have a new booking request for ${serviceType.replace(/_/g, ' ').toLowerCase()} service.`,
      link: `/partners/dashboard/bookings`,
    });

    return res.status(201).json({ message: 'Booking request sent', booking });
  } catch (err) {
    console.error('[createBooking]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/bookings/mine ────────────────────────────────────────────────────
// User: see their own bookings
export async function getMyBookings(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const page   = Number(req.query.page) || 1;
    const limit  = 10;
    const skip   = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      (prisma.booking as any).findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        include: {
          partner: {
            select: { id: true, businessName: true, logoImage: true },
          },
        },
      }),
      (prisma.booking as any).count({ where: { userId } }),
    ]);

    return res.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[getMyBookings]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/bookings/partner ─────────────────────────────────────────────────
// Partner: see all bookings for their business
export async function getPartnerBookings(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const page   = Number(req.query.page) || 1;
    const status = req.query.status ? String(req.query.status) : undefined;
    const limit  = 10;
    const skip   = (page - 1) * limit;

    const partner = await (prisma.partner as any).findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!partner) return res.status(404).json({ message: 'Partner profile not found' });

    const where: any = { partnerId: partner.id };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      (prisma.booking as any).findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        include: {
          user: {
            select: {
              id: true, email: true,
              ownProfile: { select: { firstName: true, lastName: true, photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 } } },
            },
          },
        },
      }),
      (prisma.booking as any).count({ where }),
    ]);

    return res.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[getPartnerBookings]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/bookings/:id/status ──────────────────────────────────────────────
// Partner: update booking status (CONFIRMED | CANCELLED)
export async function updateBookingStatus(req: AuthRequest, res: Response) {
  try {
    const userId    = Number(req.user?.userId);
    const bookingId = Number(req.params.id);
    const { status } = req.body;

    if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const partner = await (prisma.partner as any).findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!partner) return res.status(403).json({ message: 'Forbidden' });

    const booking = await (prisma.booking as any).findUnique({
      where: { id: bookingId },
      include: { partner: { select: { businessName: true } } },
    });
    if (!booking || booking.partnerId !== partner.id) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const updated = await (prisma.booking as any).update({
      where: { id: bookingId },
      data: { status },
    });

    // Notify the user
    const typeMap: Record<string, string> = {
      CONFIRMED: 'BOOKING_CONFIRMED',
      CANCELLED: 'BOOKING_CANCELLED',
      COMPLETED: 'BOOKING_CONFIRMED',
    };
    await createNotification({
      userId: booking.userId,
      type: typeMap[status] ?? 'SYSTEM',
      title: `Booking ${status.charAt(0) + status.slice(1).toLowerCase()}`,
      body: `Your booking with ${booking.partner.businessName} has been ${status.toLowerCase()}.`,
      link: `/dashboard/bookings`,
    });

    return res.json({ message: 'Booking updated', booking: updated });
  } catch (err) {
    console.error('[updateBookingStatus]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────────
// User: cancel their own booking (only if PENDING)
export async function cancelBooking(req: AuthRequest, res: Response) {
  try {
    const userId    = Number(req.user?.userId);
    const bookingId = Number(req.params.id);

    const booking = await (prisma.booking as any).findUnique({ where: { id: bookingId } });
    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
    }

    await (prisma.booking as any).update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    return res.json({ message: 'Booking cancelled' });
  } catch (err) {
    console.error('[cancelBooking]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
