import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

const MAX_SAVED_SEARCHES = 5;

// ── GET /api/searches/:id — single saved search (ownership check) ────────────
export async function getSavedSearchById(req: AuthRequest, res: Response) {
  try {
    const userId   = Number(req.user?.userId);
    const searchId = Number(req.params.id);

    const search = await (prisma.savedSearch as any).findUnique({ where: { id: searchId } });
    if (!search)              return res.status(404).json({ message: 'Saved search not found' });
    if (search.userId !== userId) return res.status(403).json({ message: 'Forbidden' });

    return res.json({ message: 'OK', data: search });
  } catch (err) {
    console.error('[getSavedSearchById]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/searches — list user's saved searches ───────────────────────────
export async function getSavedSearches(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);

    const searches = await (prisma.savedSearch as any).findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: MAX_SAVED_SEARCHES,
    });

    return res.json({ message: 'Saved searches retrieved', data: searches });
  } catch (err) {
    console.error('[getSavedSearches]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/searches — create a saved search (max 5) ───────────────────────
export async function createSavedSearch(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const { name, filters } = req.body;

    // Validate name
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Name is required' });
    }
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (trimmedName.length > 10) {
      return res.status(400).json({ message: 'Name must be 10 characters or fewer' });
    }

    // Validate filters
    if (filters === undefined || filters === null) {
      return res.status(400).json({ message: 'Filters are required' });
    }
    if (typeof filters !== 'object' || Array.isArray(filters)) {
      return res.status(400).json({ message: 'Filters must be an object' });
    }

    // Enforce max 5 saved searches
    const count = await (prisma.savedSearch as any).count({ where: { userId } });
    if (count >= MAX_SAVED_SEARCHES) {
      return res.status(400).json({ message: 'Maximum 5 saved searches allowed' });
    }

    const search = await (prisma.savedSearch as any).create({
      data: { userId, name: trimmedName, filters },
    });

    return res.status(201).json({ message: 'Saved search created', data: search });
  } catch (err) {
    console.error('[createSavedSearch]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/searches/:id — update name/filters (ownership check) ─────────────
export async function updateSavedSearch(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const searchId = Number(req.params.id);

    if (isNaN(searchId)) {
      return res.status(400).json({ message: 'Invalid search ID' });
    }

    const existing = await (prisma.savedSearch as any).findUnique({ where: { id: searchId } });
    if (!existing) {
      return res.status(404).json({ message: 'Saved search not found' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { name, filters } = req.body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return res.status(400).json({ message: 'Name must be a string' });
      }
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      if (trimmedName.length > 10) {
        return res.status(400).json({ message: 'Name must be 10 characters or fewer' });
      }
      updateData.name = trimmedName;
    }

    if (filters !== undefined) {
      if (typeof filters !== 'object' || filters === null || Array.isArray(filters)) {
        return res.status(400).json({ message: 'Filters must be an object' });
      }
      updateData.filters = filters;
    }

    const updated = await (prisma.savedSearch as any).update({
      where: { id: searchId },
      data: updateData,
    });

    return res.json({ message: 'Saved search updated', data: updated });
  } catch (err) {
    console.error('[updateSavedSearch]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── DELETE /api/searches/:id — delete (ownership check) ──────────────────────
export async function deleteSavedSearch(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const searchId = Number(req.params.id);

    if (isNaN(searchId)) {
      return res.status(400).json({ message: 'Invalid search ID' });
    }

    const existing = await (prisma.savedSearch as any).findUnique({ where: { id: searchId } });
    if (!existing) {
      return res.status(404).json({ message: 'Saved search not found' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await (prisma.savedSearch as any).delete({ where: { id: searchId } });

    return res.json({ message: 'Saved search deleted' });
  } catch (err) {
    console.error('[deleteSavedSearch]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
