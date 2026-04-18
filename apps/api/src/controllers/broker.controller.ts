import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Minimal profile select for listing
const BROKER_PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  maritalStatus: true,
  status: true,
  createdByType: true,
  photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
};

// ── GET /api/brokers/profiles ─────────────────────────────────────────────────
// Returns all profiles managed by the current user as a broker
export async function getBrokerProfiles(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const page   = Number(req.query.page) || 1;
    const limit  = 12;
    const skip   = (page - 1) * limit;

    const where: any = {
      matchMakerUserId: userId,
      createdByType: { not: 'MATCHMAKER' },
      status: { not: 'DELETED' },
    };

    const [profiles, total] = await Promise.all([
      (prisma.profile as any).findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: BROKER_PROFILE_SELECT }),
      (prisma.profile as any).count({ where }),
    ]);

    return res.json({ profiles, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[getBrokerProfiles]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/brokers/stats ────────────────────────────────────────────────────
export async function getBrokerStats(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const where: any = { matchMakerUserId: userId, createdByType: { not: 'MATCHMAKER' } };

    const [total, active, deleted] = await Promise.all([
      (prisma.profile as any).count({ where: { ...where, status: { not: 'DELETED' } } }),
      (prisma.profile as any).count({ where: { ...where, status: 'ACTIVE' } }),
      (prisma.profile as any).count({ where: { ...where, status: 'DELETED' } }),
    ]);

    return res.json({ total, active, deleted });
  } catch (err) {
    console.error('[getBrokerStats]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/brokers/profiles ────────────────────────────────────────────────
// Create a profile for a family member
export async function createBrokerProfile(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const { firstName, lastName, gender, dateOfBirth, maritalStatus, createdByType } = req.body;

    if (!firstName || !lastName || !gender || !dateOfBirth || !maritalStatus) {
      return res.status(400).json({ message: 'firstName, lastName, gender, dateOfBirth, maritalStatus are required' });
    }

    const profile = await (prisma.profile as any).create({
      data: {
        matchMakerUserId: userId,
        createdByType: createdByType || 'PARENT_OR_RELATIVE',
        firstName, lastName, gender,
        dateOfBirth: new Date(dateOfBirth),
        maritalStatus,
        status: 'INCOMPLETE',
      },
    });

    return res.status(201).json({ message: 'Profile created', profile });
  } catch (err) {
    console.error('[createBrokerProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── DELETE /api/brokers/profiles/:id ─────────────────────────────────────────
// Soft delete
export async function deleteBrokerProfile(req: AuthRequest, res: Response) {
  try {
    const userId    = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    const profile = await (prisma.profile as any).findUnique({ where: { id: profileId }, select: { matchMakerUserId: true } });
    if (!profile || profile.matchMakerUserId !== userId) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await (prisma.profile as any).update({ where: { id: profileId }, data: { status: 'DELETED' } });
    return res.json({ message: 'Profile deleted' });
  } catch (err) {
    console.error('[deleteBrokerProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/brokers/profiles/:id/restore ───────────────────────────────────
export async function restoreBrokerProfile(req: AuthRequest, res: Response) {
  try {
    const userId    = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    const profile = await (prisma.profile as any).findUnique({ where: { id: profileId }, select: { matchMakerUserId: true } });
    if (!profile || profile.matchMakerUserId !== userId) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await (prisma.profile as any).update({ where: { id: profileId }, data: { status: 'INCOMPLETE' } });
    return res.json({ message: 'Profile restored' });
  } catch (err) {
    console.error('[restoreBrokerProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/brokers/deleted-profiles ────────────────────────────────────────
export async function getBrokerDeletedProfiles(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profiles = await (prisma.profile as any).findMany({
      where: { matchMakerUserId: userId, createdByType: { not: 'MATCHMAKER' }, status: 'DELETED' },
      orderBy: { updatedAt: 'desc' },
      select: BROKER_PROFILE_SELECT,
    });
    return res.json({ profiles });
  } catch (err) {
    console.error('[getBrokerDeletedProfiles]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
