import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import cloudinary from '../config/cloudinary'
import multer from 'multer'

const storage = multer.memoryStorage()
export const uploadMiddleware = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single('image')

async function getPartnerOrFail(userId: number, res: Response): Promise<{ id: number } | null> {
  const partner = await (prisma as any).partner.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!partner) {
    res.status(404).json({ message: 'Partner profile not found' })
    return null
  }
  return partner
}

async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  const b64 = `data:image/jpeg;base64,${buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(b64, {
    folder,
    transformation: [{ width: 1600, height: 1200, crop: 'limit', quality: 'auto' }],
  })
  return result.secure_url
}

// ── PACKAGES ──────────────────────────────────────────────────

export async function listPackages(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const packages = await (prisma as any).photographyPackage.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ packages })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function createPackage(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const { name, description, price, photoCount, durationHours } = req.body
    if (!name || price == null) return res.status(400).json({ message: 'name and price are required' })
    const pkg = await (prisma as any).photographyPackage.create({
      data: {
        partnerId: partner.id,
        name: String(name),
        description: description ? String(description) : null,
        price: Number(price),
        photoCount: photoCount ? Number(photoCount) : null,
        durationHours: durationHours ? Number(durationHours) : null,
      },
    })
    res.status(201).json({ package: pkg })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function updatePackage(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).photographyPackage.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Package not found' })
    const { name, description, price, photoCount, durationHours } = req.body
    const pkg = await (prisma as any).photographyPackage.update({
      where: { id },
      data: {
        name: name ? String(name) : undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        price: price != null ? Number(price) : undefined,
        photoCount: photoCount !== undefined ? (photoCount ? Number(photoCount) : null) : undefined,
        durationHours: durationHours !== undefined ? (durationHours ? Number(durationHours) : null) : undefined,
      },
    })
    res.json({ package: pkg })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function deletePackage(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).photographyPackage.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Package not found' })
    await (prisma as any).photographyPackage.delete({ where: { id } })
    res.json({ message: 'Package deleted' })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ── ALBUM PHOTOS ──────────────────────────────────────────────

export async function listPhotos(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const photos = await (prisma as any).photographyPhoto.findMany({
      where: { partnerId: partner.id },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    res.json({ photos })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function uploadPhoto(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    if (!req.file) return res.status(400).json({ message: 'No image file provided' })
    const url = await uploadToCloudinary(req.file.buffer, 'wedding-partners/photography/album')
    const photo = await (prisma as any).photographyPhoto.create({
      data: {
        partnerId: partner.id,
        url,
        caption: req.body.caption ? String(req.body.caption) : null,
        isFeatured: false,
      },
    })
    res.status(201).json({ photo })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function toggleFeatured(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const photo = await (prisma as any).photographyPhoto.findFirst({ where: { id, partnerId: partner.id } })
    if (!photo) return res.status(404).json({ message: 'Photo not found' })

    if (!photo.isFeatured) {
      // Check if already 10 featured
      const featuredCount = await (prisma as any).photographyPhoto.count({
        where: { partnerId: partner.id, isFeatured: true },
      })
      if (featuredCount >= 10) {
        return res.status(400).json({ message: 'Maximum 10 featured photos allowed. Unfeature another photo first.' })
      }
    }

    const updated = await (prisma as any).photographyPhoto.update({
      where: { id },
      data: { isFeatured: !photo.isFeatured },
    })
    res.json({ photo: updated })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function deletePhoto(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const photo = await (prisma as any).photographyPhoto.findFirst({ where: { id, partnerId: partner.id } })
    if (!photo) return res.status(404).json({ message: 'Photo not found' })
    await (prisma as any).photographyPhoto.delete({ where: { id } })
    res.json({ message: 'Photo deleted' })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function updatePhotoCaption(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const photo = await (prisma as any).photographyPhoto.findFirst({ where: { id, partnerId: partner.id } })
    if (!photo) return res.status(404).json({ message: 'Photo not found' })
    const updated = await (prisma as any).photographyPhoto.update({
      where: { id },
      data: { caption: req.body.caption ? String(req.body.caption) : null },
    })
    res.json({ photo: updated })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ── EVENTS ────────────────────────────────────────────────────

export async function listEvents(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const events = await (prisma as any).photographyEvent.findMany({
      where: { partnerId: partner.id },
      include: { photos: { orderBy: { createdAt: 'asc' } } },
      orderBy: { eventDate: 'desc' },
    })
    res.json({ events })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function createEvent(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const { name, description, eventDate } = req.body
    if (!name || !eventDate) return res.status(400).json({ message: 'name and eventDate are required' })
    const event = await (prisma as any).photographyEvent.create({
      data: {
        partnerId: partner.id,
        name: String(name),
        description: description ? String(description) : null,
        eventDate: new Date(eventDate),
      },
      include: { photos: true },
    })
    res.status(201).json({ event })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function updateEvent(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).photographyEvent.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Event not found' })
    const { name, description, eventDate } = req.body
    const event = await (prisma as any).photographyEvent.update({
      where: { id },
      data: {
        name: name ? String(name) : undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        eventDate: eventDate ? new Date(eventDate) : undefined,
      },
      include: { photos: { orderBy: { createdAt: 'asc' } } },
    })
    res.json({ event })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).photographyEvent.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Event not found' })
    await (prisma as any).photographyEvent.delete({ where: { id } })
    res.json({ message: 'Event deleted' })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function uploadEventPhoto(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const eventId = Number(req.params.id)
    const event = await (prisma as any).photographyEvent.findFirst({ where: { id: eventId, partnerId: partner.id } })
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (!req.file) return res.status(400).json({ message: 'No image file provided' })
    const url = await uploadToCloudinary(req.file.buffer, 'wedding-partners/photography/events')
    const photo = await (prisma as any).photographyEventPhoto.create({
      data: {
        eventId,
        url,
        caption: req.body.caption ? String(req.body.caption) : null,
      },
    })
    res.status(201).json({ photo })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function deleteEventPhoto(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const eventId = Number(req.params.id)
    const photoId = Number(req.params.photoId)
    const event = await (prisma as any).photographyEvent.findFirst({ where: { id: eventId, partnerId: partner.id } })
    if (!event) return res.status(404).json({ message: 'Event not found' })
    const photo = await (prisma as any).photographyEventPhoto.findFirst({ where: { id: photoId, eventId } })
    if (!photo) return res.status(404).json({ message: 'Photo not found' })
    await (prisma as any).photographyEventPhoto.delete({ where: { id: photoId } })
    res.json({ message: 'Photo deleted' })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ── PUBLIC ────────────────────────────────────────────────────

export async function getPublicProfile(req: AuthRequest, res: Response) {
  try {
    const partnerId = Number(req.params.partnerId)
    const [packages, featuredPhotos, events] = await Promise.all([
      (prisma as any).photographyPackage.findMany({
        where: { partnerId },
        orderBy: { price: 'asc' },
      }),
      (prisma as any).photographyPhoto.findMany({
        where: { partnerId, isFeatured: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 10,
      }),
      (prisma as any).photographyEvent.findMany({
        where: { partnerId },
        include: {
          photos: { orderBy: { createdAt: 'asc' }, take: 6 },
        },
        orderBy: { eventDate: 'desc' },
      }),
    ])
    res.json({ packages, featuredPhotos, events })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getAllAlbumPhotos(req: AuthRequest, res: Response) {
  try {
    const partnerId = Number(req.params.partnerId)
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = 24
    const [photos, total] = await Promise.all([
      (prisma as any).photographyPhoto.findMany({
        where: { partnerId },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).photographyPhoto.count({ where: { partnerId } }),
    ])
    res.json({ photos, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}
