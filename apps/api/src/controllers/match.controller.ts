import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

const MATCH_PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  maritalStatus: true,
  countryLiving: { select: { name: true } },
  religion: { select: { name: true } },
  occupation: { select: { name: true } },
  photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
  isVerified: true,
};

async function getMyProfileId(userId: number) {
  const p = await (prisma.profile as any).findFirst({ where: { userId }, select: { id: true } });
  return p?.id as number | null;
}

// ── POST /api/matches  (send a match request) ─────────────────────────────────
export async function sendMatchRequest(req: AuthRequest, res: Response) {
  try {
    const myProfileId = await getMyProfileId(Number(req.user?.userId));
    if (!myProfileId) return res.status(404).json({ message: 'Complete your profile before sending requests' });

    const receiverId = Number(req.body.receiverId);
    if (!receiverId || receiverId === myProfileId) return res.status(400).json({ message: 'Invalid receiver' });

    // Check receiver exists
    const receiver = await (prisma.profile as any).findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) return res.status(404).json({ message: 'Profile not found' });

    // Check no existing match in either direction
    const existing = await (prisma.match as any).findFirst({
      where: {
        OR: [
          { senderId: myProfileId, receiverId },
          { senderId: receiverId, receiverId: myProfileId },
        ],
      },
    });
    if (existing) return res.status(409).json({ message: 'A match request already exists', status: existing.status });

    const match = await (prisma.match as any).create({
      data: { senderId: myProfileId, receiverId, message: req.body.message || null },
    });
    return res.status(201).json({ message: 'Match request sent', match });
  } catch (err) {
    console.error('[sendMatchRequest]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/matches/:id  (accept or decline) ─────────────────────────────────
export async function respondToMatch(req: AuthRequest, res: Response) {
  try {
    const myProfileId = await getMyProfileId(Number(req.user?.userId));
    if (!myProfileId) return res.status(404).json({ message: 'Profile not found' });

    const matchId = Number(req.params.id);
    const action = req.body.action as string; // 'ACCEPTED' | 'DECLINED'
    if (!['ACCEPTED', 'DECLINED'].includes(action)) {
      return res.status(400).json({ message: 'action must be ACCEPTED or DECLINED' });
    }

    const match = await (prisma.match as any).findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.receiverId !== myProfileId) return res.status(403).json({ message: 'Not authorised' });
    if (match.status !== 'PENDING') return res.status(400).json({ message: `Match already ${match.status.toLowerCase()}` });

    const updated = await (prisma.match as any).update({ where: { id: matchId }, data: { status: action } });
    return res.json({ message: `Match ${action.toLowerCase()}`, match: updated });
  } catch (err) {
    console.error('[respondToMatch]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matches/sent ─────────────────────────────────────────────────────
export async function getSentRequests(req: AuthRequest, res: Response) {
  try {
    const myProfileId = await getMyProfileId(Number(req.user?.userId));
    if (!myProfileId) return res.status(404).json({ message: 'Profile not found' });

    const matches = await (prisma.match as any).findMany({
      where: { senderId: myProfileId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, message: true, createdAt: true, receiver: { select: MATCH_PROFILE_SELECT } },
    });
    return res.json({ matches });
  } catch (err) {
    console.error('[getSentRequests]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matches/received ─────────────────────────────────────────────────
export async function getReceivedRequests(req: AuthRequest, res: Response) {
  try {
    const myProfileId = await getMyProfileId(Number(req.user?.userId));
    if (!myProfileId) return res.status(404).json({ message: 'Profile not found' });

    const matches = await (prisma.match as any).findMany({
      where: { receiverId: myProfileId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, message: true, createdAt: true, sender: { select: MATCH_PROFILE_SELECT } },
    });
    return res.json({ matches });
  } catch (err) {
    console.error('[getReceivedRequests]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matches/accepted ─────────────────────────────────────────────────
export async function getAcceptedMatches(req: AuthRequest, res: Response) {
  try {
    const myProfileId = await getMyProfileId(Number(req.user?.userId));
    if (!myProfileId) return res.status(404).json({ message: 'Profile not found' });

    const matches = await (prisma.match as any).findMany({
      where: { status: 'ACCEPTED', OR: [{ senderId: myProfileId }, { receiverId: myProfileId }] },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, status: true, createdAt: true, updatedAt: true,
        sender: { select: MATCH_PROFILE_SELECT },
        receiver: { select: MATCH_PROFILE_SELECT },
      },
    });
    return res.json({ matches });
  } catch (err) {
    console.error('[getAcceptedMatches]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matches/stats ────────────────────────────────────────────────────
export async function getMatchStats(req: AuthRequest, res: Response) {
  try {
    const myProfileId = await getMyProfileId(Number(req.user?.userId));
    if (!myProfileId) return res.json({ sent: 0, received: 0, accepted: 0, pending: 0, views: 0 });

    const [sent, received, accepted, views] = await Promise.all([
      (prisma.match as any).count({ where: { senderId: myProfileId } }),
      (prisma.match as any).count({ where: { receiverId: myProfileId } }),
      (prisma.match as any).count({ where: { status: 'ACCEPTED', OR: [{ senderId: myProfileId }, { receiverId: myProfileId }] } }),
      (prisma.profileView as any).count({ where: { viewedId: myProfileId } }),
    ]);
    const pending = received - accepted;
    return res.json({ sent, received, accepted, pending, views });
  } catch (err) {
    console.error('[getMatchStats]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
