import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// ── GET /api/partners/me ───────────────────────────────────────────────────────
export async function getMe(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const partner = await (prisma.partner as any).findUnique({
      where: { userId },
      include: {
        types: true,
        phones: { where: { status: 'ACTIVE' } },
        addresses: { where: { status: 'ACTIVE' } },
      },
    });
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    return res.json({ partner });
  } catch (err) {
    console.error('[partner.getMe]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/partners/me ──────────────────────────────────────────────────────
export async function updateMe(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const existing = await (prisma.partner as any).findUnique({ where: { userId } });
    if (!existing) return res.status(404).json({ message: 'Partner not found' });

    const {
      businessName, businessEmail, contactPerson,
      website, bio, yearsOfExperience,
      phone, whatsapp, logoImage, bannerPath, services,
    } = req.body;

    const updated = await (prisma.partner as any).update({
      where: { userId },
      data: {
        ...(businessName   !== undefined && { businessName }),
        ...(businessEmail  !== undefined && { businessEmail }),
        ...(contactPerson  !== undefined && { contactPerson }),
        ...(website        !== undefined && { website }),
        ...(bio            !== undefined && { bio }),
        ...(yearsOfExperience !== undefined && {
          yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
        }),
        ...(logoImage !== undefined && { logoImage }),
        ...(bannerPath !== undefined && { bannerPath }),
      },
      include: { types: true, phones: { where: { status: 'ACTIVE' } } },
    });

    // Update service types if provided
    if (Array.isArray(services) && services.length > 0) {
      await (prisma.partnerTypeAssignment as any).deleteMany({ where: { partnerId: existing.id } });
      await (prisma.partnerTypeAssignment as any).createMany({
        data: services.map((type: string) => ({ partnerId: existing.id, type })),
      });
    }

    // Upsert primary phone
    if (phone !== undefined) {
      const existingPhone = await (prisma.partnerPhone as any).findFirst({
        where: { partnerId: existing.id, label: 'Primary', status: 'ACTIVE' },
      });
      if (phone) {
        if (existingPhone) {
          await (prisma.partnerPhone as any).update({ where: { id: existingPhone.id }, data: { number: phone } });
        } else {
          await (prisma.partnerPhone as any).create({ data: { partnerId: existing.id, label: 'Primary', number: phone, status: 'ACTIVE' } });
        }
      } else if (existingPhone) {
        await (prisma.partnerPhone as any).update({ where: { id: existingPhone.id }, data: { status: 'INACTIVE' } });
      }
    }

    // Upsert WhatsApp phone
    if (whatsapp !== undefined) {
      const existingWa = await (prisma.partnerPhone as any).findFirst({
        where: { partnerId: existing.id, label: 'WhatsApp', status: 'ACTIVE' },
      });
      if (whatsapp) {
        if (existingWa) {
          await (prisma.partnerPhone as any).update({ where: { id: existingWa.id }, data: { number: whatsapp } });
        } else {
          await (prisma.partnerPhone as any).create({ data: { partnerId: existing.id, label: 'WhatsApp', number: whatsapp, status: 'ACTIVE' } });
        }
      } else if (existingWa) {
        await (prisma.partnerPhone as any).update({ where: { id: existingWa.id }, data: { status: 'INACTIVE' } });
      }
    }

    return res.json({ message: 'Partner info updated', partner: updated });
  } catch (err) {
    console.error('[partner.updateMe]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/partners/me/images ──────────────────────────────────────────────
export const uploadPartnerImageMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
}).single('image');

export async function uploadPartnerImage(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const existing = await (prisma.partner as any).findUnique({ where: { userId }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: 'Partner not found' });

    const imageType = req.body.type as string;
    if (!['banner', 'logo'].includes(imageType)) {
      return res.status(400).json({ message: 'type must be banner or logo' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `wedding-partners/partners/${imageType}s`,
      transformation: imageType === 'banner'
        ? [{ width: 1200, height: 400, crop: 'fill', quality: 'auto' }]
        : [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
    });

    const field = imageType === 'banner' ? 'bannerPath' : 'logoImage';
    const updated = await (prisma.partner as any).update({
      where: { userId },
      data: { [field]: result.secure_url },
    });

    return res.json({ message: 'Image uploaded', url: result.secure_url, partner: updated });
  } catch (err) {
    console.error('[uploadPartnerImage]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/partners/counts ──────────────────────────────────────────────────
// Public: returns count of active partners per type
export async function getPartnerCounts(req: AuthRequest, res: Response) {
  try {
    const rows = await (prisma.partnerTypeAssignment as any).groupBy({
      by: ['type'],
      where: { partner: { status: 'ACTIVE' } },
      _count: { type: true },
    });
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.type] = r._count.type;
    return res.json({ counts });
  } catch (err) {
    console.error('[getPartnerCounts]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/partners/list ────────────────────────────────────────────────────
// Public: returns paginated partner list, optionally filtered by type
export async function getPartnerList(req: AuthRequest, res: Response) {
  try {
    const type = req.query.type ? String(req.query.type) : undefined;
    const page = Number(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };
    if (type) where.types = { some: { type } };

    const [partners, total] = await Promise.all([
      (prisma.partner as any).findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          businessName: true,
          bio: true,
          logoImage: true,
          bannerPath: true,
          website: true,
          yearsOfExperience: true,
          types: { select: { type: true } },
          addresses: {
            where: { status: 'ACTIVE' },
            select: { city: true, countryCode: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma.partner as any).count({ where }),
    ]);

    return res.json({ partners, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[getPartnerList]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/partners/:id ─────────────────────────────────────────────────────
// Public: full partner profile by ID
export async function getPartnerById(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid ID' });

    const partner = await (prisma.partner as any).findUnique({
      where: { id, status: 'ACTIVE' },
      select: {
        id: true,
        businessName: true,
        businessEmail: true,
        contactPerson: true,
        bio: true,
        logoImage: true,
        bannerPath: true,
        website: true,
        yearsOfExperience: true,
        createdAt: true,
        types: { select: { type: true } },
        addresses: {
          where: { status: 'ACTIVE' },
          select: { address1: true, address2: true, city: true, state: true, countryCode: true },
        },
        phones: {
          where: { status: 'ACTIVE' },
          select: { label: true, number: true },
        },
        successStories: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, coupleName: true, story: true,
            photoUrl: true, videoUrl: true, createdAt: true,
          },
        },
      },
    });

    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    return res.json({ partner });
  } catch (err) {
    console.error('[getPartnerById]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
