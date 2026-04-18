import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { createNotification } from './notification.controller';
import { sendProfileViewEmail } from '../services/email.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  referenceCode: true,
  dateOfBirth: true,
  maritalStatus: true,
  height: true,
  weight: true,
  bodyType: true,
  physicalStatus: true,
  bloodGroup: true,
  religionId: true,
  religion: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  denomination: true,
  motherTongueId: true,
  motherTongue: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  eatingHabits: true,
  smokingHabit: true,
  drinkingHabit: true,
  aboutMe: true,
  highestEducationId: true,
  highestEducation: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  employmentStatus: true,
  occupationId: true,
  occupation: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  annualIncome: true,
  currency: true,
  fatherName: true,
  fatherOccupationId: true,
  fatherOccupation: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  motherName: true,
  motherOccupationId: true,
  motherOccupation: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  noOfBrothers: true,
  brothersMarried: true,
  noOfSisters: true,
  sistersMarried: true,
  aboutFamily: true,
  nativeCountryId: true,
  nativeCountry: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  nativeCountryState: true,
  nativeCountryCity: true,
  countryLivingId: true,
  countryLiving: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  countryLivingState: true,
  countryLivingCity: true,
  citizenshipId: true,
  citizenship: { select: { id: true, name: true, nameTa: true, nameSi: true } },
  grewUpInCountryIds: true,
  hobbies: true,
  favMusic: true,
  favMusicOther: true,
  favSports: true,
  favSportsOther: true,
  favFood: true,
  status: true,
  isVerified: true,
  createdByType: true,
  photos: { select: { id: true, imageUrl: true, isPrimary: true, createdAt: true }, orderBy: { isPrimary: 'desc' as const } },
  preference: true,
  userId: true,
};

async function getUserProfile(userId: number) {
  return (prisma.profile as any).findFirst({
    where: { userId },
    select: PROFILE_SELECT,
  });
}

// ── GET /api/profiles/me ──────────────────────────────────────────────────────
export async function getMyProfile(req: AuthRequest, res: Response) {
  try {
    const profile = await getUserProfile(Number(req.user?.userId));
    if (!profile) return res.status(404).json({ message: 'Profile not found', req: req.user });
    return res.json({ profile });
  } catch (err) {
    console.error('[getMyProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/profiles/me  (update any section) ────────────────────────────────
export async function updateMyProfile(req: AuthRequest, res: Response) {
  try {
    const profile = await (prisma.profile as any).findFirst({ where: { userId: Number(req.user?.userId) } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Whitelist updatable fields — never allow userId, matchMakerUserId, isVerified, status to be patched directly
    const {
      firstName, lastName, dateOfBirth, maritalStatus,
      height, weight, bodyType, physicalStatus, bloodGroup,
      religionId, denomination, motherTongueId,
      eatingHabits, smokingHabit, drinkingHabit, aboutMe,
      highestEducationId, employmentStatus, occupationId, annualIncome, currency,
      fatherName, fatherOccupationId, motherName, motherOccupationId,
      noOfBrothers, brothersMarried, noOfSisters, sistersMarried, aboutFamily,
      nativeCountryId, nativeCountryState, nativeCountryCity,
      countryLivingId, countryLivingState, countryLivingCity,
      citizenshipId, createdByType, grewUpInCountryIds,
      hobbies, favMusic, favMusicOther, favSports, favSportsOther, favFood,
    } = req.body;

    const updated = await (prisma.profile as any).update({
      where: { id: profile.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
        ...(maritalStatus !== undefined && { maritalStatus }),
        ...(height !== undefined && { height: height ? parseFloat(height) : null }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(bodyType !== undefined && { bodyType }),
        ...(physicalStatus !== undefined && { physicalStatus }),
        ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
        ...(religionId !== undefined && { religionId: religionId ? Number(religionId) : null }),
        ...(denomination !== undefined && { denomination }),
        ...(motherTongueId !== undefined && { motherTongueId: motherTongueId ? Number(motherTongueId) : null }),
        ...(eatingHabits !== undefined && { eatingHabits }),
        ...(smokingHabit !== undefined && { smokingHabit }),
        ...(drinkingHabit !== undefined && { drinkingHabit }),
        ...(aboutMe !== undefined && { aboutMe }),
        ...(highestEducationId !== undefined && { highestEducationId: highestEducationId ? Number(highestEducationId) : null }),
        ...(employmentStatus !== undefined && { employmentStatus }),
        ...(occupationId !== undefined && { occupationId: occupationId ? Number(occupationId) : null }),
        ...(annualIncome !== undefined && { annualIncome: annualIncome ? parseFloat(annualIncome) : null }),
        ...(currency !== undefined && { currency }),
        ...(fatherName !== undefined && { fatherName }),
        ...(fatherOccupationId !== undefined && { fatherOccupationId: fatherOccupationId ? Number(fatherOccupationId) : null }),
        ...(motherName !== undefined && { motherName }),
        ...(motherOccupationId !== undefined && { motherOccupationId: motherOccupationId ? Number(motherOccupationId) : null }),
        ...(noOfBrothers !== undefined && { noOfBrothers: noOfBrothers !== null ? Number(noOfBrothers) : null }),
        ...(brothersMarried !== undefined && { brothersMarried: brothersMarried !== null ? Number(brothersMarried) : null }),
        ...(noOfSisters !== undefined && { noOfSisters: noOfSisters !== null ? Number(noOfSisters) : null }),
        ...(sistersMarried !== undefined && { sistersMarried: sistersMarried !== null ? Number(sistersMarried) : null }),
        ...(aboutFamily !== undefined && { aboutFamily }),
        ...(nativeCountryId !== undefined && { nativeCountryId: nativeCountryId ? Number(nativeCountryId) : null }),
        ...(nativeCountryState !== undefined && { nativeCountryState }),
        ...(nativeCountryCity !== undefined && { nativeCountryCity }),
        ...(countryLivingId !== undefined && { countryLivingId: countryLivingId ? Number(countryLivingId) : null }),
        ...(countryLivingState !== undefined && { countryLivingState }),
        ...(countryLivingCity !== undefined && { countryLivingCity }),
        ...(citizenshipId !== undefined && { citizenshipId: citizenshipId ? Number(citizenshipId) : null }),
        ...(createdByType !== undefined && { createdByType }),
        ...(grewUpInCountryIds !== undefined && { grewUpInCountryIds: Array.isArray(grewUpInCountryIds) ? grewUpInCountryIds.map(Number) : [] }),
        ...(hobbies !== undefined && { hobbies }),
        ...(favMusic !== undefined && { favMusic }),
        ...(favMusicOther !== undefined && { favMusicOther }),
        ...(favSports !== undefined && { favSports }),
        ...(favSportsOther !== undefined && { favSportsOther }),
        ...(favFood !== undefined && { favFood }),
      },
      select: PROFILE_SELECT,
    });

    return res.json({ message: 'Profile updated', profile: updated });
  } catch (err) {
    console.error('[updateMyProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/profiles/:id  (view another user's profile) ─────────────────────
export async function getProfileById(req: AuthRequest, res: Response) {
  try {
    const targetId = Number(req.params.id);
    const viewerUserId = Number(req.user?.userId);

    const profile = await (prisma.profile as any).findUnique({
      where: { id: targetId },
      select: { ...PROFILE_SELECT, matchMakerUserId: true, userId: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Record view + send notifications (only for authenticated viewers, not self)
    if (viewerUserId) {
      const viewerProfile = await (prisma.profile as any).findFirst({
        where: { userId: viewerUserId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (viewerProfile && viewerProfile.id !== targetId) {
        // 1. Record the profile view
        const isNewView = await (async () => {
          const existing = await (prisma.profileView as any).findUnique({
            where: { viewerId_viewedId: { viewerId: viewerProfile.id, viewedId: targetId } },
          });
          await (prisma.profileView as any).upsert({
            where: { viewerId_viewedId: { viewerId: viewerProfile.id, viewedId: targetId } },
            create: { viewerId: viewerProfile.id, viewedId: targetId },
            update: { viewedAt: new Date() },
          });
          return !existing; // true = first time viewing
        })();

        // Only send notifications on first view to avoid spam
        if (isNewView) {
          // Resolve viewer display name
          const viewerUser = await (prisma.user as any).findUnique({
            where: { id: viewerUserId },
            select: { role: true, email: true, partner: { select: { businessName: true } } },
          });
          const viewerIsPartner = viewerUser?.role === 'PARTNER';
          const viewerDisplayName = viewerIsPartner
            ? (viewerUser?.partner?.businessName ?? 'A wedding service partner')
            : `${viewerProfile.firstName} ${viewerProfile.lastName}`;

          // 2. Notify the viewed profile's owner (if it's a regular USER-owned profile)
          if (profile.userId) {
            const viewedUser = await (prisma.user as any).findUnique({
              where: { id: profile.userId },
              select: { email: true },
            });
            const viewedName = `${profile.firstName} ${profile.lastName}`;

            await createNotification({
              userId: profile.userId,
              type: 'PROFILE_VIEW',
              title: '👀 Someone viewed your profile',
              body: `${viewerDisplayName} viewed your profile.`,
              link: '/dashboard/views',
            });

            if (viewedUser?.email) {
              const dashboardLink = `${process.env.CLIENT_URL}/dashboard/views`;
              sendProfileViewEmail(viewedUser.email, viewedName, viewerDisplayName, dashboardLink);
            }
          }

          // 3. If this profile is managed by a matchmaker, notify the matchmaker too
          if (profile.matchMakerUserId && profile.matchMakerUserId !== viewerUserId) {
            const viewerName = `${viewerProfile.firstName} ${viewerProfile.lastName}`;
            const profileName = `${profile.firstName} ${profile.lastName}`;

            const matchmakerUser = await (prisma.user as any).findUnique({
              where: { id: profile.matchMakerUserId },
              select: { email: true },
            });

            await createNotification({
              userId: profile.matchMakerUserId,
              type: 'PROFILE_VIEW',
              title: '👀 Your client profile was viewed',
              body: `${viewerName} viewed your client ${profileName}'s profile.`,
              link: '/partners/dashboard/matchmaker',
            });

            if (matchmakerUser?.email) {
              const mmLink = `${process.env.CLIENT_URL}/partners/dashboard/matchmaker`;
              sendProfileViewEmail(
                matchmakerUser.email,
                'Matchmaker',
                `${viewerName} (viewed ${profileName}'s profile)`,
                mmLink
              );
            }
          }
        }
      }
    }

    // Remove internal fields before returning
    const { matchMakerUserId: _mm, ...safeProfile } = profile;
    return res.json({ profile: safeProfile });
  } catch (err) {
    console.error('[getProfileById]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/profiles/suggestions ────────────────────────────────────────────
export async function getSuggestions(req: AuthRequest, res: Response) {
  try {
    const myProfile = await (prisma.profile as any).findFirst({
      where: { userId: Number(req.user?.userId) },
      include: { preference: true },
    });
    if (!myProfile) return res.status(404).json({ message: 'Complete your profile first' });

    const oppositeGender = myProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';
    const pref = myProfile.preference;

    const page = Number(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const where: any = {
      gender: oppositeGender,
      status: { in: ['ACTIVE', 'VERIFIED'] },
      id: { not: myProfile.id },
      // exclude already matched
      receivedMatches: {
        none: { senderId: myProfile.id },
      },
    };

    // Apply preference filters if set
    if (pref?.religionId) where.religionId = pref.religionId;
    if (pref?.motherTongueId) where.motherTongueId = pref.motherTongueId;
    if (pref?.minAge || pref?.maxAge) {
      const now = new Date();
      where.dateOfBirth = {};
      if (pref.maxAge) where.dateOfBirth.gte = new Date(now.getFullYear() - pref.maxAge, now.getMonth(), now.getDate());
      if (pref.minAge) where.dateOfBirth.lte = new Date(now.getFullYear() - pref.minAge, now.getMonth(), now.getDate());
    }

    const [profiles, total] = await Promise.all([
      (prisma.profile as any).findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          maritalStatus: true,
          countryLiving: { select: { name: true } },
          religion: { select: { name: true } },
          highestEducation: { select: { name: true } },
          occupation: { select: { name: true } },
          photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
          isVerified: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma.profile as any).count({ where }),
    ]);

    return res.json({ profiles, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[getSuggestions]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/profiles/views/mine  (profiles I viewed) ────────────────────────
export async function getViewedByMe(req: AuthRequest, res: Response) {
  try {
    const myProfile = await (prisma.profile as any).findFirst({ where: { userId: Number(req.user?.userId) }, select: { id: true } });
    if (!myProfile) return res.status(404).json({ message: 'Profile not found' });

    const views = await (prisma.profileView as any).findMany({
      where: { viewerId: myProfile.id },
      orderBy: { viewedAt: 'desc' },
      take: 50,
      select: {
        viewedAt: true,
        viewed: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            countryLiving: { select: { name: true } },
            photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
          },
        },
      },
    });
    return res.json({ views });
  } catch (err) {
    console.error('[getViewedByMe]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/profiles/views/visitors  (who viewed my profile) ────────────────
export async function getMyVisitors(req: AuthRequest, res: Response) {
  try {
    const myProfile = await (prisma.profile as any).findFirst({ where: { userId: Number(req.user?.userId) }, select: { id: true } });
    if (!myProfile) return res.status(404).json({ message: 'Profile not found' });

    const views = await (prisma.profileView as any).findMany({
      where: { viewedId: myProfile.id },
      orderBy: { viewedAt: 'desc' },
      take: 50,
      select: {
        viewedAt: true,
        viewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            countryLiving: { select: { name: true } },
            photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
          },
        },
      },
    });
    return res.json({ views });
  } catch (err) {
    console.error('[getMyVisitors]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/profiles/me/photos  (upload up to 10 photos) ───────────────────
export async function uploadPhotos(req: AuthRequest, res: Response) {
  try {
    const profile = await (prisma.profile as any).findFirst({
      where: { userId: Number(req.user?.userId) },
      include: { photos: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    const existing = profile.photos.length;
    const canUpload = 10 - existing;
    if (canUpload <= 0) return res.status(400).json({ message: 'Maximum 10 photos allowed. Delete some to upload more.' });

    const toUpload = files.slice(0, canUpload);
    const uploaded: any[] = [];

    for (const file of toUpload) {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `twp/profiles/${profile.id}`, resource_type: 'image', transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }] },
          (err: any, result: any) => { if (err) reject(err); else resolve(result); }
        );
        Readable.from(file.buffer).pipe(stream);
      });

      const isPrimary = existing === 0 && uploaded.length === 0;
      const photo = await (prisma.profilePhoto as any).create({
        data: { profileId: profile.id, imageUrl: result.secure_url, isPrimary },
      });
      uploaded.push(photo);
    }

    return res.status(201).json({ message: `${uploaded.length} photo(s) uploaded`, photos: uploaded });
  } catch (err) {
    console.error('[uploadPhotos]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── DELETE /api/profiles/me/photos/:photoId ───────────────────────────────────
export async function deletePhoto(req: AuthRequest, res: Response) {
  try {
    const profile = await (prisma.profile as any).findFirst({ where: { userId: Number(req.user?.userId) }, select: { id: true } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const photo = await (prisma.profilePhoto as any).findFirst({
      where: { id: Number(req.params.photoId), profileId: profile.id },
    });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    // Extract public_id from Cloudinary URL and delete
    const parts = photo.imageUrl.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    await cloudinary.uploader.destroy(`${folder}/${filename}`).catch(() => {});

    await (prisma.profilePhoto as any).delete({ where: { id: photo.id } });

    // If it was primary, assign the next one
    if (photo.isPrimary) {
      const next = await (prisma.profilePhoto as any).findFirst({ where: { profileId: profile.id }, orderBy: { createdAt: 'asc' } });
      if (next) await (prisma.profilePhoto as any).update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    return res.json({ message: 'Photo deleted' });
  } catch (err) {
    console.error('[deletePhoto]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/profiles/me/photos/:photoId/primary ──────────────────────────────
export async function setPhotoAsPrimary(req: AuthRequest, res: Response) {
  try {
    const profile = await (prisma.profile as any).findFirst({ where: { userId: Number(req.user?.userId) }, select: { id: true } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const photo = await (prisma.profilePhoto as any).findFirst({
      where: { id: Number(req.params.photoId), profileId: profile.id },
    });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    // Unset all primary, then set this one
    await (prisma.profilePhoto as any).updateMany({ where: { profileId: profile.id }, data: { isPrimary: false } });
    await (prisma.profilePhoto as any).update({ where: { id: photo.id }, data: { isPrimary: true } });

    return res.json({ message: 'Profile picture updated' });
  } catch (err) {
    console.error('[setPhotoAsPrimary]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST/PUT /api/profiles/me/preferences ─────────────────────────────────────
export async function upsertPreferences(req: AuthRequest, res: Response) {
  try {
    const profile = await (prisma.profile as any).findFirst({ where: { userId: Number(req.user?.userId) }, select: { id: true } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const {
      minAge, maxAge, minHeight, maxHeight,
      maritalStatus, physicalStatus,
      religionIds, motherTongueIds, educationId, occupation,
      citizenshipIds, countryLivingIds, eatingHabits, smokingHabit, drinkingHabit,
      annualIncomeMin, annualIncomeMax, aboutPartner,
    } = req.body;

    // Helper: parse array of numeric IDs sent as strings or numbers
    const toIntArr = (v: any) => Array.isArray(v) ? v.map(Number) : [];

    const prefData = {
      ...(minAge !== undefined && { minAge: minAge ? Number(minAge) : null }),
      ...(maxAge !== undefined && { maxAge: maxAge ? Number(maxAge) : null }),
      ...(minHeight !== undefined && { minHeight: minHeight ? parseFloat(minHeight) : null }),
      ...(maxHeight !== undefined && { maxHeight: maxHeight ? parseFloat(maxHeight) : null }),
      ...(maritalStatus !== undefined && { maritalStatus }),
      ...(physicalStatus !== undefined && { physicalStatus }),
      ...(religionIds !== undefined && { religionIds: toIntArr(religionIds) }),
      ...(motherTongueIds !== undefined && { motherTongueIds: toIntArr(motherTongueIds) }),
      ...(educationId !== undefined && { educationId: educationId ? Number(educationId) : null }),
      ...(occupation !== undefined && { occupation }),
      ...(citizenshipIds !== undefined && { citizenshipIds: toIntArr(citizenshipIds) }),
      ...(countryLivingIds !== undefined && { countryLivingIds: toIntArr(countryLivingIds) }),
      ...(eatingHabits !== undefined && { eatingHabits }),
      ...(smokingHabit !== undefined && { smokingHabit: smokingHabit || null }),
      ...(drinkingHabit !== undefined && { drinkingHabit: drinkingHabit || null }),
      ...(annualIncomeMin !== undefined && { annualIncomeMin: annualIncomeMin ? parseFloat(annualIncomeMin) : null }),
      ...(annualIncomeMax !== undefined && { annualIncomeMax: annualIncomeMax ? parseFloat(annualIncomeMax) : null }),
      ...(aboutPartner !== undefined && { aboutPartner }),
    };

    const pref = await (prisma.profilePreference as any).upsert({
      where:  { profileId: profile.id },
      create: { profileId: profile.id, ...prefData },
      update: prefData,
    });

    return res.json({ message: 'Preferences saved', preference: pref });
  } catch (err) {
    console.error('[upsertPreferences]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/profiles  (browse profiles) ──────────────────────────────────────
export async function browseProfiles(req: AuthRequest, res: Response) {
  try {
    const myProfile = req.user?.userId
      ? await (prisma.profile as any).findFirst({ where: { userId: Number(req.user.userId) }, select: { id: true, gender: true } })
      : null;

    const page = Number(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { notIn: ['INACTIVE'] },
      profileVisibility: { not: 'HIDDEN' },
      // Exclude the viewer's own profile if logged in
      ...(myProfile && { id: { not: myProfile.id } }),
    };

    // Gender filter — from explicit query param only
    if (req.query.gender) {
      where.gender = String(req.query.gender);
    }

    // Valid marital status enum values
    const VALID_MARITAL = ['UNMARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED'];

    if (req.query.religionId)         where.religionId         = Number(req.query.religionId);
    // accept both countryLivingId and countryId from the frontend
    const cid = req.query.countryLivingId ?? req.query.countryId;
    if (cid)                          where.countryLivingId    = Number(cid);
    if (req.query.motherTongueId)     where.motherTongueId     = Number(req.query.motherTongueId);
    if (req.query.highestEducationId) where.highestEducationId = Number(req.query.highestEducationId);
    if (req.query.occupationId)       where.occupationId       = Number(req.query.occupationId);
    if (req.query.hasPhoto === 'true') where.photos            = { some: {} };
    if (req.query.nativeCountryId)    where.nativeCountryId    = Number(req.query.nativeCountryId);
    if (req.query.citizenshipId)      where.citizenshipId      = Number(req.query.citizenshipId);
    if (req.query.bodyType)           where.bodyType           = String(req.query.bodyType);
    if (req.query.physicalStatus)     where.physicalStatus     = String(req.query.physicalStatus);
    if (req.query.employmentStatus)   where.employmentStatus   = String(req.query.employmentStatus);
    if (req.query.smokingHabit)       where.smokingHabit       = String(req.query.smokingHabit);
    if (req.query.drinkingHabit)      where.drinkingHabit      = String(req.query.drinkingHabit);

    // Height range (cm)
    const minH = req.query.minHeight ? Number(req.query.minHeight) : undefined;
    const maxH = req.query.maxHeight ? Number(req.query.maxHeight) : undefined;
    if (minH !== undefined || maxH !== undefined) {
      where.height = {};
      if (minH !== undefined) where.height.gte = minH;
      if (maxH !== undefined) where.height.lte = maxH;
    }

    // Eating habits — comma-separated values; match profiles that have ALL of them
    const eh = req.query.eatingHabits ? String(req.query.eatingHabits).split(',').filter(Boolean) : [];
    if (eh.length > 0) {
      where.eatingHabits = { hasEvery: eh };
    }

    // maritalStatus — validate against enum, ignore invalid values
    const ms = String(req.query.maritalStatus ?? '');
    if (ms && VALID_MARITAL.includes(ms)) where.maritalStatus = ms;

    // Age range → dateOfBirth range
    const minAge = req.query.minAge ? Number(req.query.minAge) : undefined;
    const maxAge = req.query.maxAge ? Number(req.query.maxAge) : undefined;
    if (minAge !== undefined || maxAge !== undefined) {
      const now = new Date();
      where.dateOfBirth = {};
      // minAge=18 means DOB must be <= (today - 18 years) — person is at least 18
      if (minAge !== undefined) {
        where.dateOfBirth.lte = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
      }
      // maxAge=40 means DOB must be >= (today - 40 years) — person is at most 40
      if (maxAge !== undefined) {
        where.dateOfBirth.gte = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
      }
    }

    const [profiles, total] = await Promise.all([
      (prisma.profile as any).findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          maritalStatus: true,
          countryLiving: { select: { name: true } },
          religion: { select: { name: true } },
          highestEducation: { select: { name: true } },
          occupation: { select: { name: true } },
          photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
          isVerified: true,
          aboutMe: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      (prisma.profile as any).count({ where }),
    ]);

    return res.json({ profiles, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[browseProfiles]', msg);
    return res.status(500).json({ message: 'Internal server error', detail: msg });
  }
}

// ── GET /api/lookup  (reference data for dropdowns) ──────────────────────────
export async function getLookupData(_req: AuthRequest, res: Response) {
  try {
    const [
      countries, religions, motherTongues, educations, occupationGroups, bodyTypes,
      maritalStatuses, genders, physicalStatuses, smokingHabits, drinkingHabits, eatingHabits, employmentStatuses,
      userRoles, userStatuses, partnerTypes, profileCreatedBy, profileStatuses,
      subscriptionPlans, recordStatuses, matchStatuses, messageTypes, contactRequestStatuses,
      hobbyOptions, musicOptions, sportOptions, foodOptions,
    ] = await Promise.all([
      (prisma.country as any).findMany({ orderBy: { name: 'asc' } }),
      (prisma.religion as any).findMany({ orderBy: { name: 'asc' } }),
      (prisma.motherTongue as any).findMany({ orderBy: { name: 'asc' } }),
      (prisma.education as any).findMany({ orderBy: { id: 'asc' } }),
      (prisma.occupationGroup as any).findMany({ include: { occupations: { orderBy: { name: 'asc' } } }, orderBy: { name: 'asc' } }),
      (prisma.bodyTypeOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.maritalStatusOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.genderOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.physicalStatusOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.smokingHabitOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.drinkingHabitOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.eatingHabitOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.employmentStatusOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.userRoleOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.userStatusOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.partnerTypeOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.profileCreatedByOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.profileStatusOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.subscriptionPlanOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.recordStatusOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.matchStatusOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.messageTypeOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.contactRequestStatusOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.hobbyOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.musicOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.sportOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
      (prisma.foodOption as any).findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);
    return res.json({
      countries, religions, motherTongues, educations, occupationGroups, bodyTypes,
      maritalStatuses, genders, physicalStatuses, smokingHabits, drinkingHabits, eatingHabits, employmentStatuses,
      userRoles, userStatuses, partnerTypes, profileCreatedBy, profileStatuses,
      subscriptionPlans, recordStatuses, matchStatuses, messageTypes, contactRequestStatuses,
      hobbyOptions, musicOptions, sportOptions, foodOptions,
    });
  } catch (err) {
    console.error('[getLookupData]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
