import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import cloudinary from '../config/cloudinary';
import { sendEmail } from '../services/email';
import { baseTemplate } from '../services/email/baseTemplate';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── helpers ───────────────────────────────────────────────────────────────

async function getArtistProfileByPartnerId(partnerId: number) {
  return (prisma as any).makeupArtistProfile.findUnique({
    where: { partnerId },
  });
}

async function requireArtistProfile(res: Response, partnerId: number) {
  const profile = await getArtistProfileByPartnerId(partnerId);
  if (!profile) {
    res.status(404).json({ error: 'Makeup artist profile not found' });
    return null;
  }
  return profile;
}

async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string,
): Promise<string> {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `twp/${folder}`,
    resource_type: 'auto',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
  return result.secure_url;
}

function getPartnerIdFromReq(req: AuthRequest): number {
  return (req as any).partnerId as number;
}

// ─── Profile (Settings) ─────────────────────────────────────────────────────

/** GET /api/makeup/profile — returns makeup artist profile for the logged-in partner */
export async function getMyMakeupProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const profile = await (prisma as any).makeupArtistProfile.findUnique({
      where: { partnerId: partner.id },
      include: {
        packages: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        portfolioAlbums: { orderBy: { sortOrder: 'asc' } },
        certifications: { orderBy: { sortOrder: 'asc' } },
        events: { orderBy: { sortOrder: 'asc' } },
        enquiries: { orderBy: { createdAt: 'desc' }, take: 3 },
        availabilityBlocks: { where: { endDate: { gte: new Date() } }, orderBy: { startDate: 'asc' } },
      },
    });

    if (!profile) return res.json({ data: null });
    res.json({ data: profile });
  } catch (err) {
    console.error('[getMyMakeupProfile]', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
}

/** POST /api/makeup/profile — create makeup artist profile */
export async function createMakeupProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const exists = await getArtistProfileByPartnerId(partner.id);
    if (exists) return res.status(409).json({ error: 'Profile already exists' });

    const {
      artistType, teamSize, yearsExperience, specialistBio,
      brandsUsed, languages, serviceAreas, homeService,
      travelIslandWide, outstationTravel, travelFee,
      advanceNoticeDays, depositRequired, depositPercent,
      earlySurcharge, earlySurchargeAmt, cancellationPolicy,
      whatsapp, instagram, facebook, website,
    } = req.body;

    const profile = await (prisma as any).makeupArtistProfile.create({
      data: {
        partnerId: partner.id,
        artistType: artistType || 'freelance',
        teamSize: teamSize ? Number(teamSize) : 1,
        yearsExperience: yearsExperience ? Number(yearsExperience) : null,
        specialistBio: specialistBio || null,
        brandsUsed: Array.isArray(brandsUsed) ? brandsUsed : [],
        languages: Array.isArray(languages) ? languages : [],
        serviceAreas: serviceAreas || null,
        homeService: homeService === true || homeService === 'true',
        travelIslandWide: travelIslandWide === true || travelIslandWide === 'true',
        outstationTravel: outstationTravel === true || outstationTravel === 'true',
        travelFee: travelFee || null,
        advanceNoticeDays: advanceNoticeDays ? Number(advanceNoticeDays) : 7,
        depositRequired: depositRequired === true || depositRequired === 'true',
        depositPercent: depositPercent ? Number(depositPercent) : null,
        earlySurcharge: earlySurcharge === true || earlySurcharge === 'true',
        earlySurchargeAmt: earlySurchargeAmt ? Number(earlySurchargeAmt) : null,
        cancellationPolicy: cancellationPolicy || null,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        facebook: facebook || null,
        website: website || null,
      },
    });

    res.status(201).json({ message: 'Profile created', data: profile });
  } catch (err) {
    console.error('[createMakeupProfile]', err);
    res.status(500).json({ error: 'Failed to create profile' });
  }
}

/** PUT /api/makeup/profile — update makeup artist profile */
export async function updateMakeupProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const {
      artistType, teamSize, yearsExperience, specialistBio,
      brandsUsed, languages, serviceAreas, homeService,
      travelIslandWide, outstationTravel, travelFee,
      advanceNoticeDays, depositRequired, depositPercent,
      earlySurcharge, earlySurchargeAmt, cancellationPolicy,
      whatsapp, instagram, facebook, website, isActive,
    } = req.body;

    const data: any = {};
    if (artistType !== undefined) data.artistType = artistType;
    if (teamSize !== undefined) data.teamSize = Number(teamSize);
    if (yearsExperience !== undefined) data.yearsExperience = yearsExperience ? Number(yearsExperience) : null;
    if (specialistBio !== undefined) data.specialistBio = specialistBio;
    if (brandsUsed !== undefined) data.brandsUsed = Array.isArray(brandsUsed) ? brandsUsed : [];
    if (languages !== undefined) data.languages = Array.isArray(languages) ? languages : [];
    if (serviceAreas !== undefined) data.serviceAreas = serviceAreas;
    if (homeService !== undefined) data.homeService = homeService === true || homeService === 'true';
    if (travelIslandWide !== undefined) data.travelIslandWide = travelIslandWide === true || travelIslandWide === 'true';
    if (outstationTravel !== undefined) data.outstationTravel = outstationTravel === true || outstationTravel === 'true';
    if (travelFee !== undefined) data.travelFee = travelFee;
    if (advanceNoticeDays !== undefined) data.advanceNoticeDays = Number(advanceNoticeDays);
    if (depositRequired !== undefined) data.depositRequired = depositRequired === true || depositRequired === 'true';
    if (depositPercent !== undefined) data.depositPercent = depositPercent ? Number(depositPercent) : null;
    if (earlySurcharge !== undefined) data.earlySurcharge = earlySurcharge === true || earlySurcharge === 'true';
    if (earlySurchargeAmt !== undefined) data.earlySurchargeAmt = earlySurchargeAmt ? Number(earlySurchargeAmt) : null;
    if (cancellationPolicy !== undefined) data.cancellationPolicy = cancellationPolicy;
    if (whatsapp !== undefined) data.whatsapp = whatsapp;
    if (instagram !== undefined) data.instagram = instagram;
    if (facebook !== undefined) data.facebook = facebook;
    if (website !== undefined) data.website = website;
    if (isActive !== undefined) data.isActive = isActive === true || isActive === 'true';

    const updated = await (prisma as any).makeupArtistProfile.update({
      where: { id: profile.id },
      data,
    });

    res.json({ message: 'Profile updated', data: updated });
  } catch (err) {
    console.error('[updateMakeupProfile]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

// ─── Packages ───────────────────────────────────────────────────────────────

/** GET /api/makeup/packages */
export async function getPackages(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const packages = await (prisma as any).makeupPackage.findMany({
      where: { makeupArtistProfileId: profile.id },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    });
    res.json({ data: packages });
  } catch (err) {
    console.error('[getPackages]', err);
    res.status(500).json({ error: 'Failed to load packages' });
  }
}

/** POST /api/makeup/packages */
export async function createPackage(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const {
      name, tagline, description, price, currency,
      isNegotiable, maxPersons, durationHours, validityNote,
      inclusions, exclusions, isFeatured, isActive, sortOrder,
    } = req.body;

    if (!name || !price) return res.status(400).json({ error: 'name and price are required' });

    let coverImageUrl: string | null = null;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file) {
      coverImageUrl = await uploadToCloudinary(file, 'makeup/packages');
    }

    const pkg = await (prisma as any).makeupPackage.create({
      data: {
        makeupArtistProfileId: profile.id,
        name,
        tagline: tagline || null,
        description: description || null,
        price: Number(price),
        currency: currency || 'LKR',
        isNegotiable: isNegotiable === true || isNegotiable === 'true',
        maxPersons: maxPersons ? Number(maxPersons) : 1,
        durationHours: durationHours ? Number(durationHours) : null,
        validityNote: validityNote || null,
        coverImageUrl,
        inclusions: Array.isArray(inclusions) ? inclusions : (inclusions ? [inclusions] : []),
        exclusions: Array.isArray(exclusions) ? exclusions : (exclusions ? [exclusions] : []),
        isFeatured: isFeatured === true || isFeatured === 'true',
        isActive: isActive !== false && isActive !== 'false',
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ message: 'Package created', data: pkg });
  } catch (err) {
    console.error('[createPackage]', err);
    res.status(500).json({ error: 'Failed to create package' });
  }
}

/** PUT /api/makeup/packages/:id */
export async function updatePackage(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });

    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const pkg = await (prisma as any).makeupPackage.findFirst({
      where: { id, makeupArtistProfileId: profile.id },
    });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const {
      name, tagline, description, price, currency,
      isNegotiable, maxPersons, durationHours, validityNote,
      inclusions, exclusions, isFeatured, isActive, sortOrder,
    } = req.body;

    let coverImageUrl = pkg.coverImageUrl;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file) {
      coverImageUrl = await uploadToCloudinary(file, 'makeup/packages');
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (tagline !== undefined) data.tagline = tagline;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (currency !== undefined) data.currency = currency;
    if (isNegotiable !== undefined) data.isNegotiable = isNegotiable === true || isNegotiable === 'true';
    if (maxPersons !== undefined) data.maxPersons = Number(maxPersons);
    if (durationHours !== undefined) data.durationHours = durationHours ? Number(durationHours) : null;
    if (validityNote !== undefined) data.validityNote = validityNote;
    if (inclusions !== undefined) data.inclusions = Array.isArray(inclusions) ? inclusions : [inclusions];
    if (exclusions !== undefined) data.exclusions = Array.isArray(exclusions) ? exclusions : [exclusions];
    if (isFeatured !== undefined) data.isFeatured = isFeatured === true || isFeatured === 'true';
    if (isActive !== undefined) data.isActive = isActive === true || isActive === 'true';
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    data.coverImageUrl = coverImageUrl;

    const updated = await (prisma as any).makeupPackage.update({ where: { id }, data });
    res.json({ message: 'Package updated', data: updated });
  } catch (err) {
    console.error('[updatePackage]', err);
    res.status(500).json({ error: 'Failed to update package' });
  }
}

/** DELETE /api/makeup/packages/:id */
export async function deletePackage(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const pkg = await (prisma as any).makeupPackage.findFirst({
      where: { id, makeupArtistProfileId: profile.id },
    });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    await (prisma as any).makeupPackage.delete({ where: { id } });
    res.json({ message: 'Package deleted' });
  } catch (err) {
    console.error('[deletePackage]', err);
    res.status(500).json({ error: 'Failed to delete package' });
  }
}

// ─── Portfolio Albums ────────────────────────────────────────────────────────

/** GET /api/makeup/albums */
export async function getAlbums(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const albums = await (prisma as any).portfolioAlbum.findMany({
      where: { makeupArtistProfileId: profile.id },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    });
    res.json({ data: albums });
  } catch (err) {
    console.error('[getAlbums]', err);
    res.status(500).json({ error: 'Failed to load albums' });
  }
}

/** POST /api/makeup/albums — multipart (coverImage + photos[]) */
export async function createAlbum(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const {
      title, eventType, eventDate, location, description,
      styleTags, youtubeLinks, isPublic, isFeatured, sortOrder,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'title is required' });

    const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let coverImageUrl: string | null = null;
    const photoObjects: { url: string; publicId: string }[] = [];

    if (files?.coverImage?.[0]) {
      coverImageUrl = await uploadToCloudinary(files.coverImage[0], 'makeup/albums');
    }
    if (files?.photos) {
      for (const f of files.photos) {
        const dataUri = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'twp/makeup/albums',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        photoObjects.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    const album = await (prisma as any).portfolioAlbum.create({
      data: {
        makeupArtistProfileId: profile.id,
        title,
        eventType: eventType || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        location: location || null,
        description: description || null,
        coverImageUrl,
        photos: photoObjects.length ? photoObjects : null,
        youtubeLinks: youtubeLinks ? (typeof youtubeLinks === 'string' ? JSON.parse(youtubeLinks) : youtubeLinks) : null,
        styleTags: Array.isArray(styleTags) ? styleTags : (styleTags ? styleTags.split(',') : []),
        isPublic: isPublic !== false && isPublic !== 'false',
        isFeatured: isFeatured === true || isFeatured === 'true',
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ message: 'Album created', data: album });
  } catch (err) {
    console.error('[createAlbum]', err);
    res.status(500).json({ error: 'Failed to create album' });
  }
}

/** PUT /api/makeup/albums/:id */
export async function updateAlbum(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const album = await (prisma as any).portfolioAlbum.findFirst({
      where: { id, makeupArtistProfileId: profile.id },
    });
    if (!album) return res.status(404).json({ error: 'Album not found' });

    const {
      title, eventType, eventDate, location, description,
      styleTags, youtubeLinks, photos, isPublic, isFeatured, sortOrder,
    } = req.body;

    const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let coverImageUrl = album.coverImageUrl;
    let photoObjects = album.photos || [];

    if (files?.coverImage?.[0]) {
      coverImageUrl = await uploadToCloudinary(files.coverImage[0], 'makeup/albums');
    }
    if (files?.photos) {
      const newPhotos: { url: string; publicId: string }[] = [];
      for (const f of files.photos) {
        const dataUri = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'twp/makeup/albums',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        newPhotos.push({ url: result.secure_url, publicId: result.public_id });
      }
      photoObjects = [...(Array.isArray(photoObjects) ? photoObjects : []), ...newPhotos];
    }
    if (photos !== undefined) {
      // Allow replacing the photos array entirely (e.g., after reorder/delete)
      photoObjects = typeof photos === 'string' ? JSON.parse(photos) : photos;
    }

    const data: any = { coverImageUrl, photos: photoObjects };
    if (title !== undefined) data.title = title;
    if (eventType !== undefined) data.eventType = eventType;
    if (eventDate !== undefined) data.eventDate = eventDate ? new Date(eventDate) : null;
    if (location !== undefined) data.location = location;
    if (description !== undefined) data.description = description;
    if (styleTags !== undefined) data.styleTags = Array.isArray(styleTags) ? styleTags : styleTags.split(',');
    if (youtubeLinks !== undefined) data.youtubeLinks = typeof youtubeLinks === 'string' ? JSON.parse(youtubeLinks) : youtubeLinks;
    if (isPublic !== undefined) data.isPublic = isPublic === true || isPublic === 'true';
    if (isFeatured !== undefined) data.isFeatured = isFeatured === true || isFeatured === 'true';
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const updated = await (prisma as any).portfolioAlbum.update({ where: { id }, data });
    res.json({ message: 'Album updated', data: updated });
  } catch (err) {
    console.error('[updateAlbum]', err);
    res.status(500).json({ error: 'Failed to update album' });
  }
}

/** DELETE /api/makeup/albums/:id */
export async function deleteAlbum(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const album = await (prisma as any).portfolioAlbum.findFirst({ where: { id, makeupArtistProfileId: profile.id } });
    if (!album) return res.status(404).json({ error: 'Album not found' });

    await (prisma as any).portfolioAlbum.delete({ where: { id } });
    res.json({ message: 'Album deleted' });
  } catch (err) {
    console.error('[deleteAlbum]', err);
    res.status(500).json({ error: 'Failed to delete album' });
  }
}

// ─── Events ─────────────────────────────────────────────────────────────────

/** GET /api/makeup/events */
export async function getEvents(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const events = await (prisma as any).makeupEvent.findMany({
      where: { makeupArtistProfileId: profile.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { reviews: true, photoLikes: true } },
        reviews: { select: { rating: true } },
      },
    });
    res.json({ data: events });
  } catch (err) {
    console.error('[getEvents]', err);
    res.status(500).json({ error: 'Failed to load events' });
  }
}

/** POST /api/makeup/events — multipart (bannerImage + photos[]) */
export async function createEvent(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const { name, description, eventDate, location, isPublic, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let bannerImageUrl: string | null = null;
    const photoObjects: { url: string; publicId: string }[] = [];

    if (files?.bannerImage?.[0]) {
      bannerImageUrl = await uploadToCloudinary(files.bannerImage[0], 'makeup/events');
    }
    if (files?.photos) {
      for (const f of files.photos) {
        const dataUri = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'twp/makeup/events',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        photoObjects.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    const event = await (prisma as any).makeupEvent.create({
      data: {
        makeupArtistProfileId: profile.id,
        name,
        description: description || null,
        bannerImageUrl,
        photos: photoObjects.length ? photoObjects : null,
        eventDate: eventDate ? new Date(eventDate) : null,
        location: location || null,
        isPublic: isPublic !== false && isPublic !== 'false',
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ message: 'Event created', data: event });
  } catch (err) {
    console.error('[createEvent]', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

/** PUT /api/makeup/events/:id */
export async function updateEvent(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const ev = await (prisma as any).makeupEvent.findFirst({ where: { id, makeupArtistProfileId: profile.id } });
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const { name, description, eventDate, location, isPublic, sortOrder, photos } = req.body;
    const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let bannerImageUrl = ev.bannerImageUrl;
    let photoObjects = ev.photos || [];

    if (files?.bannerImage?.[0]) {
      bannerImageUrl = await uploadToCloudinary(files.bannerImage[0], 'makeup/events');
    }
    if (files?.photos) {
      for (const f of files.photos) {
        const dataUri = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'twp/makeup/events',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        photoObjects = [...(Array.isArray(photoObjects) ? photoObjects : []), { url: result.secure_url, publicId: result.public_id }];
      }
    }
    if (photos !== undefined) {
      photoObjects = typeof photos === 'string' ? JSON.parse(photos) : photos;
    }

    const data: any = { bannerImageUrl, photos: photoObjects };
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (eventDate !== undefined) data.eventDate = eventDate ? new Date(eventDate) : null;
    if (location !== undefined) data.location = location;
    if (isPublic !== undefined) data.isPublic = isPublic === true || isPublic === 'true';
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const updated = await (prisma as any).makeupEvent.update({ where: { id }, data });
    res.json({ message: 'Event updated', data: updated });
  } catch (err) {
    console.error('[updateEvent]', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
}

/** DELETE /api/makeup/events/:id */
export async function deleteEvent(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const ev = await (prisma as any).makeupEvent.findFirst({ where: { id, makeupArtistProfileId: profile.id } });
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    await (prisma as any).makeupEvent.delete({ where: { id } });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('[deleteEvent]', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

// ─── Certifications ──────────────────────────────────────────────────────────

/** GET /api/makeup/certifications */
export async function getCertifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const certs = await (prisma as any).makeupCertification.findMany({
      where: { makeupArtistProfileId: profile.id },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ data: certs });
  } catch (err) {
    console.error('[getCertifications]', err);
    res.status(500).json({ error: 'Failed to load certifications' });
  }
}

/** POST /api/makeup/certifications — multipart (file upload) */
export async function createCertification(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const { name, description, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'file is required' });

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const isPdf = file.mimetype === 'application/pdf';
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'twp/makeup/certifications',
      resource_type: isPdf ? 'raw' : 'image',
    });

    const cert = await (prisma as any).makeupCertification.create({
      data: {
        makeupArtistProfileId: profile.id,
        name,
        description: description || null,
        fileUrl: result.secure_url,
        fileType: isPdf ? 'pdf' : 'image',
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ message: 'Certification uploaded', data: cert });
  } catch (err) {
    console.error('[createCertification]', err);
    res.status(500).json({ error: 'Failed to upload certification' });
  }
}

/** DELETE /api/makeup/certifications/:id */
export async function deleteCertification(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const cert = await (prisma as any).makeupCertification.findFirst({
      where: { id, makeupArtistProfileId: profile.id },
    });
    if (!cert) return res.status(404).json({ error: 'Certification not found' });

    await (prisma as any).makeupCertification.delete({ where: { id } });
    res.json({ message: 'Certification deleted' });
  } catch (err) {
    console.error('[deleteCertification]', err);
    res.status(500).json({ error: 'Failed to delete certification' });
  }
}

// ─── Enquiries ───────────────────────────────────────────────────────────────

/** GET /api/makeup/enquiries — dashboard: list enquiries (auth) */
export async function getEnquiries(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const { status } = req.query;
    const where: any = { makeupArtistProfileId: profile.id };
    if (status && status !== 'ALL') where.status = String(status);

    const enquiries = await (prisma as any).makeupEnquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: enquiries });
  } catch (err) {
    console.error('[getEnquiries]', err);
    res.status(500).json({ error: 'Failed to load enquiries' });
  }
}

/** PUT /api/makeup/enquiries/:id — update status (auth) */
export async function updateEnquiryStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const enquiry = await (prisma as any).makeupEnquiry.findFirst({
      where: { id, makeupArtistProfileId: profile.id },
    });
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

    const { status } = req.body;
    const valid = ['NEW', 'SEEN', 'REPLIED', 'CLOSED'];
    if (!status || !valid.includes(status)) {
      return res.status(400).json({ error: 'status must be one of: NEW, SEEN, REPLIED, CLOSED' });
    }

    const updated = await (prisma as any).makeupEnquiry.update({
      where: { id },
      data: { status },
    });
    res.json({ message: 'Status updated', data: updated });
  } catch (err) {
    console.error('[updateEnquiryStatus]', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
}

// ─── Availability ────────────────────────────────────────────────────────────

/** GET /api/makeup/availability */
export async function getAvailability(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const blocks = await (prisma as any).availabilityBlock.findMany({
      where: { makeupArtistProfileId: profile.id },
      orderBy: { startDate: 'asc' },
    });
    res.json({ data: blocks });
  } catch (err) {
    console.error('[getAvailability]', err);
    res.status(500).json({ error: 'Failed to load availability' });
  }
}

/** POST /api/makeup/availability */
export async function createAvailabilityBlock(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const { startDate, endDate, reason, privateNote } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });

    const block = await (prisma as any).availabilityBlock.create({
      data: {
        makeupArtistProfileId: profile.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || 'Booked',
        privateNote: privateNote || null,
      },
    });
    res.status(201).json({ message: 'Block created', data: block });
  } catch (err) {
    console.error('[createAvailabilityBlock]', err);
    res.status(500).json({ error: 'Failed to create block' });
  }
}

/** DELETE /api/makeup/availability/:id */
export async function deleteAvailabilityBlock(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const block = await (prisma as any).availabilityBlock.findFirst({ where: { id, makeupArtistProfileId: profile.id } });
    if (!block) return res.status(404).json({ error: 'Block not found' });

    await (prisma as any).availabilityBlock.delete({ where: { id } });
    res.json({ message: 'Block removed' });
  } catch (err) {
    console.error('[deleteAvailabilityBlock]', err);
    res.status(500).json({ error: 'Failed to remove block' });
  }
}

// ─── PUBLIC ENDPOINTS ────────────────────────────────────────────────────────

/** GET /api/makeup/public/:partnerId — public profile view */
export async function getPublicProfile(req: Request, res: Response) {
  try {
    const { partnerId } = req.params;

    const partner = await (prisma as any).partner.findUnique({
      where: { id: Number(partnerId) },
      include: {
        user: { select: { email: true } },
        addresses: true,
        phones: true,
        makeupProfile: {
          include: {
            packages: { where: { isActive: true }, orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }] },
            portfolioAlbums: { where: { isPublic: true }, orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }] },
            certifications: { orderBy: { sortOrder: 'asc' } },
            events: {
              where: { isPublic: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                reviews: {
                  where: { isApproved: true },
                  orderBy: { createdAt: 'desc' },
                },
                _count: { select: { reviews: true } },
              },
            },
            availabilityBlocks: {
              where: { endDate: { gte: new Date() } },
              orderBy: { startDate: 'asc' },
            },
          },
        },
      },
    });

    if (!partner || !partner.makeupProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Track view
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const userId = (req as any).user?.userId || null;

    // Increment totalViews and record view (fire-and-forget)
    Promise.all([
      (prisma as any).makeupArtistProfile.update({
        where: { id: partner.makeupProfile.id },
        data: { totalViews: { increment: 1 } },
      }),
      (prisma as any).makeupProfileView.create({
        data: {
          makeupArtistProfileId: partner.makeupProfile.id,
          userId: userId || null,
          ipAddress: ip || null,
        },
      }),
    ]).catch(() => {});

    res.json({ data: partner });
  } catch (err) {
    console.error('[getPublicProfile]', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
}

/** GET /api/makeup/public/:partnerId/certifications — public certifications page */
export async function getPublicCertifications(req: Request, res: Response) {
  try {
    const { partnerId } = req.params;
    const profile = await (prisma as any).makeupArtistProfile.findUnique({
      where: { partnerId: Number(partnerId) },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const certs = await (prisma as any).makeupCertification.findMany({
      where: { makeupArtistProfileId: profile.id },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ data: certs });
  } catch (err) {
    console.error('[getPublicCertifications]', err);
    res.status(500).json({ error: 'Failed to load certifications' });
  }
}

/** POST /api/makeup/public/enquiry — public enquiry (no auth) */
export async function submitEnquiry(req: Request, res: Response) {
  try {
    const { partnerId, senderName, senderPhone, senderEmail, description, eventType, eventDate, packageId, numberOfPersons } = req.body;

    if (!partnerId || !senderName || !senderPhone || !description) {
      return res.status(400).json({ error: 'partnerId, senderName, senderPhone, description are required' });
    }

    const profile = await (prisma as any).makeupArtistProfile.findUnique({
      where: { partnerId: Number(partnerId) },
      include: {
        partner: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const enquiry = await (prisma as any).makeupEnquiry.create({
      data: {
        makeupArtistProfileId: profile.id,
        senderName,
        senderPhone,
        senderEmail: senderEmail || null,
        description,
        eventType: eventType || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        packageId: packageId || null,
        numberOfPersons: numberOfPersons ? Number(numberOfPersons) : 1,
        status: 'NEW',
      },
    });

    // Notify partner via email + in-app notification (fire-and-forget)
    const partnerEmail = profile.partner?.user?.email;
    const partnerUserId = profile.partner?.userId;

    Promise.all([
      // In-app notification
      partnerUserId
        ? (prisma as any).notification.create({
            data: {
              userId: partnerUserId,
              type: 'ENQUIRY',
              title: 'New Enquiry Received',
              body: `${senderName} has sent you an enquiry. Phone: ${senderPhone}`,
              link: '/partners/dashboard/makeup-artist?tab=enquiries',
            },
          })
        : Promise.resolve(),
      // Email
      partnerEmail
        ? sendEmail({
            to: partnerEmail,
            subject: `New enquiry from ${senderName}`,
            html: baseTemplate({
              preheader: `${senderName} wants to know about your services`,
              headline: 'You have a new enquiry!',
              body: `
                <p>Hi,</p>
                <p><strong>${senderName}</strong> has sent you an enquiry from your profile on The Wedding Partners.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#7A6A5A;width:40%">Phone</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${senderPhone}</strong></td></tr>
                  ${senderEmail ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#7A6A5A">Email</td><td style="padding:8px;border-bottom:1px solid #eee">${senderEmail}</td></tr>` : ''}
                  ${eventType ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#7A6A5A">Event Type</td><td style="padding:8px;border-bottom:1px solid #eee">${eventType}</td></tr>` : ''}
                  ${eventDate ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#7A6A5A">Event Date</td><td style="padding:8px;border-bottom:1px solid #eee">${new Date(eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>` : ''}
                  <tr><td style="padding:8px;color:#7A6A5A;vertical-align:top">Message</td><td style="padding:8px">${description}</td></tr>
                </table>
              `,
              ctaText: 'View Enquiry',
              ctaUrl: `${CLIENT_URL}/partners/dashboard/makeup-artist?tab=enquiries`,
            }),
          })
        : Promise.resolve(),
    ]).catch(() => {});

    res.status(201).json({ message: 'Enquiry submitted successfully', data: { id: enquiry.id } });
  } catch (err) {
    console.error('[submitEnquiry]', err);
    res.status(500).json({ error: 'Failed to submit enquiry' });
  }
}

/** POST /api/makeup/public/review — public event review (no auth) */
export async function submitReview(req: Request, res: Response) {
  try {
    const { eventId, reviewerName, rating, comment, userId } = req.body;

    if (!eventId || !reviewerName || !rating) {
      return res.status(400).json({ error: 'eventId, reviewerName, rating are required' });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: 'rating must be 1-5' });
    }

    const event = await (prisma as any).makeupEvent.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const review = await (prisma as any).eventReview.create({
      data: {
        eventId,
        userId: userId ? Number(userId) : null,
        reviewerName,
        rating: Number(rating),
        comment: comment || null,
        isApproved: true,
      },
    });

    res.status(201).json({ message: 'Review submitted', data: review });
  } catch (err) {
    console.error('[submitReview]', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
}

/** POST /api/makeup/public/like — toggle photo like */
export async function togglePhotoLike(req: Request, res: Response) {
  try {
    const { photoUrl, albumId, eventId, userId } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';

    if (!photoUrl) return res.status(400).json({ error: 'photoUrl is required' });

    const whereClause = userId
      ? { photoUrl_userId: { photoUrl, userId: Number(userId) } }
      : { photoUrl_ipAddress: { photoUrl, ipAddress: ip } };

    const existing = await (prisma as any).photoLike.findUnique({ where: whereClause });

    if (existing) {
      await (prisma as any).photoLike.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }

    await (prisma as any).photoLike.create({
      data: {
        photoUrl,
        albumId: albumId || null,
        eventId: eventId || null,
        userId: userId ? Number(userId) : null,
        ipAddress: userId ? null : ip,
      },
    });
    res.json({ liked: true });
  } catch (err) {
    console.error('[togglePhotoLike]', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
}

/** GET /api/makeup/public/likes — get like counts for a batch of photoUrls */
export async function getPhotoLikes(req: Request, res: Response) {
  try {
    const { urls, userId } = req.query;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';

    const urlList: string[] = typeof urls === 'string' ? urls.split(',') : (Array.isArray(urls) ? urls as string[] : []);

    const counts = await (prisma as any).photoLike.groupBy({
      by: ['photoUrl'],
      where: { photoUrl: { in: urlList } },
      _count: { _all: true },
    });

    const userLikes = userId || ip
      ? await (prisma as any).photoLike.findMany({
          where: {
            photoUrl: { in: urlList },
            OR: [
              userId ? { userId: Number(userId) } : {},
              { ipAddress: ip },
            ],
          },
          select: { photoUrl: true },
        })
      : [];

    const likedSet = new Set(userLikes.map((l: any) => l.photoUrl));

    const result: Record<string, { count: number; liked: boolean }> = {};
    for (const url of urlList) {
      const found = counts.find((c: any) => c.photoUrl === url);
      result[url] = { count: found ? found._count._all : 0, liked: likedSet.has(url) };
    }

    res.json({ data: result });
  } catch (err) {
    console.error('[getPhotoLikes]', err);
    res.status(500).json({ error: 'Failed to get likes' });
  }
}

/** POST /api/makeup/public/share — increment share count */
export async function recordShare(req: Request, res: Response) {
  try {
    const { partnerId } = req.body;
    if (!partnerId) return res.status(400).json({ error: 'partnerId is required' });

    await (prisma as any).makeupArtistProfile.update({
      where: { partnerId: Number(partnerId) },
      data: { totalShares: { increment: 1 } },
    });
    res.json({ message: 'Share recorded' });
  } catch (err) {
    console.error('[recordShare]', err);
    res.status(500).json({ error: 'Failed to record share' });
  }
}

/** GET /api/makeup/public/list — list all makeup artist profiles for public browse */
export async function listPublicProfiles(req: Request, res: Response) {
  try {
    const { country, city, page = '1', limit = '12' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    if (country) where.searchCountry = { contains: String(country), mode: 'insensitive' };
    if (city) where.searchCity = { contains: String(city), mode: 'insensitive' };

    const [profiles, total] = await Promise.all([
      (prisma as any).makeupArtistProfile.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { totalViews: 'desc' },
        include: {
          partner: {
            select: {
              id: true,
              businessName: true,
              logoImage: true,
              bannerPath: true,
              bio: true,
              addresses: { take: 1 },
            },
          },
          packages: {
            where: { isFeatured: true, isActive: true },
            take: 1,
            select: { name: true, price: true, currency: true },
          },
          _count: { select: { portfolioAlbums: true, events: true } },
        },
      }),
      (prisma as any).makeupArtistProfile.count({ where }),
    ]);

    res.json({ data: profiles, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[listPublicProfiles]', err);
    res.status(500).json({ error: 'Failed to list profiles' });
  }
}

/** GET /api/makeup/stats — dashboard stats for the logged-in partner */
export async function getMakeupStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const partner = await (prisma as any).partner.findUnique({ where: { userId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    const profile = await requireArtistProfile(res, partner.id);
    if (!profile) return;

    const [packageCount, albumCount, eventCount, enquiryCount] = await Promise.all([
      (prisma as any).makeupPackage.count({ where: { makeupArtistProfileId: profile.id, isActive: true } }),
      (prisma as any).portfolioAlbum.count({ where: { makeupArtistProfileId: profile.id } }),
      (prisma as any).makeupEvent.count({ where: { makeupArtistProfileId: profile.id } }),
      (prisma as any).makeupEnquiry.count({ where: { makeupArtistProfileId: profile.id, status: 'NEW' } }),
    ]);

    res.json({
      data: {
        packages: packageCount,
        albums: albumCount,
        events: eventCount,
        newEnquiries: enquiryCount,
        totalViews: profile.totalViews,
        totalShares: profile.totalShares,
      },
    });
  } catch (err) {
    console.error('[getMakeupStats]', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
}
