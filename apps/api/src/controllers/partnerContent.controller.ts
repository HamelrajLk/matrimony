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
  if (!partner) { res.status(404).json({ message: 'Partner profile not found' }); return null }
  return partner
}

async function uploadImage(buffer: Buffer, folder: string): Promise<string> {
  const b64 = `data:image/jpeg;base64,${buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(b64, {
    folder,
    transformation: [{ width: 1600, height: 1200, crop: 'limit', quality: 'auto' }],
  })
  return result.secure_url
}

function getServiceType(req: AuthRequest): string {
  return String(req.query.serviceType || req.body.serviceType || '')
}

// ── PACKAGES ──────────────────────────────────────────────────

export async function listPackages(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const serviceType = getServiceType(req)
    const packages = await (prisma as any).partnerPackage.findMany({
      where: { partnerId: partner.id, serviceType },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ packages })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function createPackage(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const { name, description, price, capacity, discountPercent, salePrice, serviceType } = req.body
    if (!name || price == null) return res.status(400).json({ message: 'name and price are required' })
    const pkg = await (prisma as any).partnerPackage.create({
      data: {
        partnerId: partner.id,
        serviceType: String(serviceType || ''),
        name: String(name),
        description: description ? String(description) : null,
        price: Number(price),
        capacity: capacity != null && capacity !== '' ? Number(capacity) : null,
        discountPercent: discountPercent != null && discountPercent !== '' ? Number(discountPercent) : null,
        salePrice: salePrice != null && salePrice !== '' ? Number(salePrice) : null,
      },
    })
    res.status(201).json({ package: pkg })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function updatePackage(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).partnerPackage.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Package not found' })
    const { name, description, price, capacity, discountPercent, salePrice } = req.body
    const pkg = await (prisma as any).partnerPackage.update({
      where: { id },
      data: {
        name: name ? String(name) : undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        price: price != null ? Number(price) : undefined,
        capacity: capacity !== undefined ? (capacity != null && capacity !== '' ? Number(capacity) : null) : undefined,
        discountPercent: discountPercent !== undefined ? (discountPercent != null && discountPercent !== '' ? Number(discountPercent) : null) : undefined,
        salePrice: salePrice !== undefined ? (salePrice != null && salePrice !== '' ? Number(salePrice) : null) : undefined,
      },
    })
    res.json({ package: pkg })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function deletePackage(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).partnerPackage.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Package not found' })
    await (prisma as any).partnerPackage.delete({ where: { id } })
    res.json({ message: 'Package deleted' })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

// ── PRODUCTS ──────────────────────────────────────────────────

export async function listProducts(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const serviceType = getServiceType(req)
    const products = await (prisma as any).partnerProduct.findMany({
      where: { partnerId: partner.id, serviceType },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    res.json({ products })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const { name, description, actualPrice, discountPercent, salePrice, serviceType } = req.body
    if (!name || actualPrice == null) return res.status(400).json({ message: 'name and actualPrice are required' })
    let imageUrl: string | null = null
    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer, 'wedding-partners/products')
    }
    const product = await (prisma as any).partnerProduct.create({
      data: {
        partnerId: partner.id,
        serviceType: String(serviceType || ''),
        name: String(name),
        description: description ? String(description) : null,
        imageUrl,
        actualPrice: Number(actualPrice),
        discountPercent: discountPercent != null && discountPercent !== '' ? Number(discountPercent) : null,
        salePrice: salePrice != null && salePrice !== '' ? Number(salePrice) : null,
        isAvailable: true,
      },
    })
    res.status(201).json({ product })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function updateProduct(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).partnerProduct.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Product not found' })
    const { name, description, actualPrice, discountPercent, salePrice, isAvailable } = req.body
    let imageUrl: string | undefined = undefined
    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer, 'wedding-partners/products')
    }
    const product = await (prisma as any).partnerProduct.update({
      where: { id },
      data: {
        name: name ? String(name) : undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        actualPrice: actualPrice != null ? Number(actualPrice) : undefined,
        discountPercent: discountPercent !== undefined ? (discountPercent != null && discountPercent !== '' ? Number(discountPercent) : null) : undefined,
        salePrice: salePrice !== undefined ? (salePrice != null && salePrice !== '' ? Number(salePrice) : null) : undefined,
        isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : undefined,
      },
    })
    res.json({ product })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).partnerProduct.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Product not found' })
    await (prisma as any).partnerProduct.delete({ where: { id } })
    res.json({ message: 'Product deleted' })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

// ── ALBUM PHOTOS ──────────────────────────────────────────────

export async function listPhotos(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const serviceType = getServiceType(req)
    const photos = await (prisma as any).partnerAlbumPhoto.findMany({
      where: { partnerId: partner.id, serviceType },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    res.json({ photos })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function uploadPhoto(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    if (!req.file) return res.status(400).json({ message: 'No image file provided' })
    const url = await uploadImage(req.file.buffer, 'wedding-partners/service-albums')
    const photo = await (prisma as any).partnerAlbumPhoto.create({
      data: {
        partnerId: partner.id,
        serviceType: String(req.body.serviceType || ''),
        url,
        caption: req.body.caption ? String(req.body.caption) : null,
        isFeatured: false,
      },
    })
    res.status(201).json({ photo })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function toggleFeatured(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const photo = await (prisma as any).partnerAlbumPhoto.findFirst({ where: { id, partnerId: partner.id } })
    if (!photo) return res.status(404).json({ message: 'Photo not found' })
    if (!photo.isFeatured) {
      const count = await (prisma as any).partnerAlbumPhoto.count({
        where: { partnerId: partner.id, serviceType: photo.serviceType, isFeatured: true },
      })
      if (count >= 10) return res.status(400).json({ message: 'Maximum 10 featured photos allowed.' })
    }
    const updated = await (prisma as any).partnerAlbumPhoto.update({
      where: { id },
      data: { isFeatured: !photo.isFeatured },
    })
    res.json({ photo: updated })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function deletePhoto(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const photo = await (prisma as any).partnerAlbumPhoto.findFirst({ where: { id, partnerId: partner.id } })
    if (!photo) return res.status(404).json({ message: 'Photo not found' })
    await (prisma as any).partnerAlbumPhoto.delete({ where: { id } })
    res.json({ message: 'Photo deleted' })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

// ── EVENTS ────────────────────────────────────────────────────

export async function listEvents(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const serviceType = getServiceType(req)
    const events = await (prisma as any).partnerServiceEvent.findMany({
      where: { partnerId: partner.id, serviceType },
      include: { photos: { orderBy: { createdAt: 'asc' } } },
      orderBy: { eventDate: 'desc' },
    })
    res.json({ events })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function createEvent(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const { name, description, eventDate, serviceType } = req.body
    if (!name || !eventDate) return res.status(400).json({ message: 'name and eventDate are required' })
    const event = await (prisma as any).partnerServiceEvent.create({
      data: {
        partnerId: partner.id,
        serviceType: String(serviceType || ''),
        name: String(name),
        description: description ? String(description) : null,
        eventDate: new Date(eventDate),
      },
      include: { photos: true },
    })
    res.status(201).json({ event })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function updateEvent(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).partnerServiceEvent.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Event not found' })
    const { name, description, eventDate } = req.body
    const event = await (prisma as any).partnerServiceEvent.update({
      where: { id },
      data: {
        name: name ? String(name) : undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        eventDate: eventDate ? new Date(eventDate) : undefined,
      },
      include: { photos: { orderBy: { createdAt: 'asc' } } },
    })
    res.json({ event })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const id = Number(req.params.id)
    const existing = await (prisma as any).partnerServiceEvent.findFirst({ where: { id, partnerId: partner.id } })
    if (!existing) return res.status(404).json({ message: 'Event not found' })
    await (prisma as any).partnerServiceEvent.delete({ where: { id } })
    res.json({ message: 'Event deleted' })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function uploadEventPhoto(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const eventId = Number(req.params.id)
    const event = await (prisma as any).partnerServiceEvent.findFirst({ where: { id: eventId, partnerId: partner.id } })
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (!req.file) return res.status(400).json({ message: 'No image file provided' })
    const url = await uploadImage(req.file.buffer, 'wedding-partners/service-events')
    const photo = await (prisma as any).partnerServiceEventPhoto.create({
      data: { eventId, url, caption: req.body.caption ? String(req.body.caption) : null },
    })
    res.status(201).json({ photo })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function deleteEventPhoto(req: AuthRequest, res: Response) {
  try {
    const partner = await getPartnerOrFail(req.user!.userId, res)
    if (!partner) return
    const eventId = Number(req.params.id)
    const photoId = Number(req.params.photoId)
    const event = await (prisma as any).partnerServiceEvent.findFirst({ where: { id: eventId, partnerId: partner.id } })
    if (!event) return res.status(404).json({ message: 'Event not found' })
    const photo = await (prisma as any).partnerServiceEventPhoto.findFirst({ where: { id: photoId, eventId } })
    if (!photo) return res.status(404).json({ message: 'Photo not found' })
    await (prisma as any).partnerServiceEventPhoto.delete({ where: { id: photoId } })
    res.json({ message: 'Photo deleted' })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

// ── PUBLIC ────────────────────────────────────────────────────

export async function getPublicContent(req: AuthRequest, res: Response) {
  try {
    const partnerId = Number(req.params.partnerId)
    const serviceType = String(req.query.serviceType || '')
    const where = serviceType ? { partnerId, serviceType } : { partnerId }

    const [packages, products, featuredPhotos, events] = await Promise.all([
      (prisma as any).partnerPackage.findMany({ where, orderBy: { price: 'asc' } }),
      (prisma as any).partnerProduct.findMany({
        where: { ...where, isAvailable: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      (prisma as any).partnerAlbumPhoto.findMany({
        where: { ...where, isFeatured: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 10,
      }),
      (prisma as any).partnerServiceEvent.findMany({
        where,
        include: { photos: { orderBy: { createdAt: 'asc' }, take: 6 } },
        orderBy: { eventDate: 'desc' },
      }),
    ])
    res.json({ packages, products, featuredPhotos, events })
  } catch { res.status(500).json({ message: 'Server error' }) }
}

export async function getAllAlbumPhotos(req: AuthRequest, res: Response) {
  try {
    const partnerId = Number(req.params.partnerId)
    const serviceType = String(req.query.serviceType || '')
    const where = serviceType ? { partnerId, serviceType } : { partnerId }
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = 24
    const [photos, total] = await Promise.all([
      (prisma as any).partnerAlbumPhoto.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).partnerAlbumPhoto.count({ where }),
    ])
    res.json({ photos, total, page, totalPages: Math.ceil(total / limit) })
  } catch { res.status(500).json({ message: 'Server error' }) }
}
