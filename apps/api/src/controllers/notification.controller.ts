import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// ── GET /api/notifications ────────────────────────────────────────────────────
export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const page   = Number(req.query.page) || 1;
    const limit  = 20;
    const skip   = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      (prisma.notification as any).findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      (prisma.notification as any).count({ where: { userId } }),
      (prisma.notification as any).count({ where: { userId, isRead: false } }),
    ]);

    return res.json({ notifications, total, unreadCount, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[getNotifications]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/notifications/unread-count ──────────────────────────────────────
export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const count  = await (prisma.notification as any).count({ where: { userId, isRead: false } });
    return res.json({ count });
  } catch (err) {
    console.error('[getUnreadCount]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/notifications/:id/read ─────────────────────────────────────────
export async function markRead(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const id     = Number(req.params.id);

    const notif = await (prisma.notification as any).findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      return res.status(404).json({ message: 'Not found' });
    }

    await (prisma.notification as any).update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('[markRead]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/notifications/mark-all-read ────────────────────────────────────
export async function markAllRead(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);

    await (prisma.notification as any).updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[markAllRead]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
export async function deleteNotification(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const id     = Number(req.params.id);

    const notif = await (prisma.notification as any).findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      return res.status(404).json({ message: 'Not found' });
    }

    await (prisma.notification as any).delete({ where: { id } });
    return res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('[deleteNotification]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── Helper: create a notification (used internally by other controllers) ──────
export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    return await (prisma.notification as any).create({ data });
  } catch (err) {
    console.error('[createNotification]', err);
  }
}
