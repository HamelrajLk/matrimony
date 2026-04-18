import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIO } from '../config/socket';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getMatchmakerPartner(userId: number) {
  return (prisma.partner as any).findUnique({
    where: { userId },
    include: {
      types: true,
      addresses: { where: { status: 'ACTIVE' } },
      phones: { where: { status: 'ACTIVE' } },
    },
  });
}

function calcAgeRange(dob: Date): string {
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
  const low = Math.floor(age / 5) * 5;
  return `${low}-${low + 5}`;
}

async function upsertProfilePreferences(profileId: number, pref: any) {
  if (!pref) return;
  const toIntArr = (v: any): number[] => Array.isArray(v) ? v.map(Number).filter(Boolean) : [];
  // Field names must exactly match ProfilePreference Prisma model columns
  const data: any = {
    ...(pref.minAge !== undefined && { minAge: pref.minAge ? Number(pref.minAge) : null }),
    ...(pref.maxAge !== undefined && { maxAge: pref.maxAge ? Number(pref.maxAge) : null }),
    ...(pref.minHeight !== undefined && { minHeight: pref.minHeight ? parseFloat(pref.minHeight) : null }),
    ...(pref.maxHeight !== undefined && { maxHeight: pref.maxHeight ? parseFloat(pref.maxHeight) : null }),
    ...(pref.religionIds !== undefined && { religionIds: toIntArr(pref.religionIds) }),
    ...(pref.motherTongueIds !== undefined && { motherTongueIds: toIntArr(pref.motherTongueIds) }),
    ...(pref.citizenshipIds !== undefined && { citizenshipIds: toIntArr(pref.citizenshipIds) }),
    ...(pref.countryLivingIds !== undefined && { countryLivingIds: toIntArr(pref.countryLivingIds) }),
    ...(pref.grewUpInCountryIds !== undefined && { grewUpInCountryIds: toIntArr(pref.grewUpInCountryIds) }),
    // Schema column is maritalStatus (String[] array), not maritalStatuses
    ...(pref.maritalStatuses !== undefined && { maritalStatus: pref.maritalStatuses }),
    // Schema column is physicalStatus (String[] array), not physicalStatuses
    ...(pref.physicalStatuses !== undefined && { physicalStatus: pref.physicalStatuses }),
    ...(pref.eatingHabits !== undefined && { eatingHabits: pref.eatingHabits }),
    ...(pref.smokingHabit !== undefined && { smokingHabit: pref.smokingHabit || null }),
    ...(pref.drinkingHabit !== undefined && { drinkingHabit: pref.drinkingHabit || null }),
    ...(pref.educationId !== undefined && { educationId: pref.educationId ? Number(pref.educationId) : null }),
    // occupation is a free text field in schema (no occupationId / employmentStatus columns)
    ...(pref.occupation !== undefined && { occupation: pref.occupation || null }),
    // Schema uses annualIncomeMin / annualIncomeMax, not minIncome / maxIncome
    ...(pref.minIncome !== undefined && { annualIncomeMin: pref.minIncome ? parseFloat(pref.minIncome) : null }),
    ...(pref.maxIncome !== undefined && { annualIncomeMax: pref.maxIncome ? parseFloat(pref.maxIncome) : null }),
    ...(pref.aboutPartner !== undefined && { aboutPartner: pref.aboutPartner }),
  };
  await (prisma.profilePreference as any).upsert({
    where: { profileId },
    create: { profileId, ...data },
    update: data,
  });
}

async function generateReferenceCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await (prisma.profile as any).count({
    where: { referenceCode: { startsWith: `TWP-M-${year}` } },
  });
  return `TWP-M-${year}-${String(count + 1).padStart(3, '0')}`;
}

// ── GET /api/matchmaker/profiles ───────────────────────────────────────────────
export async function getMyProfiles(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const partner = await getMatchmakerPartner(userId);
    if (!partner) return res.status(403).json({ message: 'Partner account not found' });

    const profiles = await (prisma.profile as any).findMany({
      where: { matchMakerUserId: userId, status: { not: 'DELETED' } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        maritalStatus: true,
        referenceCode: true,
        showPhoto: true,
        showFullAge: true,
        showFirstName: true,
        contactMethods: true,
        contactWhatsapp: true,
        contactPhone: true,
        contactEmail: true,
        horoscopeAvailable: true,
        profileVisibility: true,
        status: true,
        isVerified: true,
        religion: { select: { id: true, name: true } },
        motherTongue: { select: { id: true, name: true } },
        highestEducation: { select: { id: true, name: true } },
        countryLiving: { select: { id: true, name: true } },
        occupation: { select: { id: true, name: true } },
        photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
        _count: { select: { contactRequests: true } },
        profilePriority: true,
        createdAt: true,
      },
      orderBy: [{ profilePriority: 'desc' }, { createdAt: 'desc' }],
    });

    // Attach per-profile match stats
    const profileIds = profiles.map((p: any) => p.id);
    const allMatches = profileIds.length > 0
      ? await (prisma.match as any).findMany({
          where: {
            OR: [
              { senderId: { in: profileIds } },
              { receiverId: { in: profileIds } },
            ],
          },
          select: { id: true, senderId: true, receiverId: true, status: true },
        })
      : [];

    const statsMap: Record<number, { interests: number; sent: number; pending: number; accepted: number }> = {};
    for (const p of profiles) {
      const received = allMatches.filter((m: any) => m.receiverId === p.id);
      const sent     = allMatches.filter((m: any) => m.senderId   === p.id);
      statsMap[p.id] = {
        interests: received.length,
        sent:      sent.length,
        pending:   received.filter((m: any) => m.status === 'PENDING').length,
        accepted:  [...received, ...sent].filter((m: any) => m.status === 'ACCEPTED').length,
      };
    }

    const enriched = profiles.map((p: any) => ({ ...p, matchStats: statsMap[p.id] ?? { interests: 0, sent: 0, pending: 0, accepted: 0 } }));
    return res.json({ profiles: enriched });
  } catch (err) {
    console.error('[getMyProfiles]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/feed ──────────────────────────────────────────────────
// Returns the 20 most recent incoming match requests across all profiles owned by this matchmaker
export async function getLatestFeed(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);

    // Get all profile IDs owned by this matchmaker
    const myProfiles = await (prisma.profile as any).findMany({
      where: { matchMakerUserId: userId },
      select: {
        id: true, firstName: true, lastName: true, gender: true,
        dateOfBirth: true, referenceCode: true,
        photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
      },
    });
    const myProfileIds = myProfiles.map((p: any) => p.id);
    if (myProfileIds.length === 0) return res.json({ feed: [] });

    const profileMap: Record<number, any> = {};
    for (const p of myProfiles) profileMap[p.id] = p;

    // Get recent incoming match requests to these profiles
    const matches = await (prisma.match as any).findMany({
      where: { receiverId: { in: myProfileIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, status: true, message: true, createdAt: true,
        receiverId: true,
        sender: {
          select: {
            id: true, firstName: true, lastName: true, gender: true,
            dateOfBirth: true, maritalStatus: true, isVerified: true,
            referenceCode: true,
            religion: { select: { name: true } },
            highestEducation: { select: { name: true } },
            motherTongue: { select: { name: true } },
            countryLiving: { select: { name: true } },
            occupation: { select: { name: true } },
            height: true, aboutMe: true,
            photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
            matchMakerUserId: true,
          },
        },
      },
    });

    const feed = matches.map((m: any) => ({
      ...m,
      receiver: profileMap[m.receiverId] ?? null,
    }));

    return res.json({ feed });
  } catch (err) {
    console.error('[getLatestFeed]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/matchmaker/profiles ─────────────────────────────────────────────
export async function createProfile(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const partner = await getMatchmakerPartner(userId);
    if (!partner) return res.status(403).json({ message: 'Partner account not found' });

    const isMatchmaker = partner.types.some((t: any) => t.type === 'MATCHMAKER');
    if (!isMatchmaker) return res.status(403).json({ message: 'Not a matchmaker partner' });

    const {
      firstName, lastName, gender, dateOfBirth, maritalStatus,
      height, weight, bodyType, physicalStatus, bloodGroup,
      religionId, denomination, motherTongueId,
      eatingHabits, smokingHabit, drinkingHabit, aboutMe,
      highestEducationId, employmentStatus, occupationId, annualIncome, currency,
      fatherName, fatherOccupationId, motherName, motherOccupationId,
      noOfBrothers, brothersMarried, noOfSisters, sistersMarried, aboutFamily,
      nativeCountryId, nativeCountryState, nativeCountryCity,
      countryLivingId, countryLivingState, countryLivingCity,
      citizenshipId, grewUpInCountryIds,
      hobbies, favMusic, favMusicOther, favSports, favSportsOther, favFood,
      showPhoto, showFullAge, showFirstName,
      contactMethods, contactWhatsapp, contactPhone, contactEmail,
      horoscopeAvailable, profileVisibility,
      createdByType,
      preferences,
    } = req.body;

    if (!firstName || !lastName || !gender || !dateOfBirth || !maritalStatus) {
      return res.status(400).json({ message: 'firstName, lastName, gender, dateOfBirth, maritalStatus are required' });
    }

    const referenceCode = await generateReferenceCode();

    const profile = await (prisma.profile as any).create({
      data: {
        matchMakerUserId: userId,
        createdByType: createdByType ?? 'MATCHMAKER',
        status: 'ACTIVE',
        firstName,
        lastName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        maritalStatus,
        ...(height !== undefined && { height: height ? parseFloat(height) : null }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(bodyType !== undefined && { bodyType }),
        ...(physicalStatus !== undefined && { physicalStatus }),
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
        ...(grewUpInCountryIds !== undefined && { grewUpInCountryIds: Array.isArray(grewUpInCountryIds) ? grewUpInCountryIds.map(Number) : [] }),
        ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
        ...(hobbies !== undefined && { hobbies }),
        ...(favMusic !== undefined && { favMusic }),
        ...(favMusicOther !== undefined && { favMusicOther }),
        ...(favSports !== undefined && { favSports }),
        ...(favSportsOther !== undefined && { favSportsOther }),
        ...(favFood !== undefined && { favFood }),
        referenceCode,
        showPhoto: showPhoto ?? false,
        showFullAge: showFullAge ?? false,
        showFirstName: showFirstName ?? false,
        contactMethods: contactMethods ?? [],
        ...(contactWhatsapp !== undefined && { contactWhatsapp }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        horoscopeAvailable: horoscopeAvailable ?? false,
        profileVisibility: profileVisibility ?? 'ACTIVE',
      },
    });

    if (preferences && profile?.id) {
      await upsertProfilePreferences(profile.id, preferences);
    }

    return res.status(201).json({ message: 'Profile created', profile });
  } catch (err) {
    console.error('[createProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/matchmaker/profiles/:id ──────────────────────────────────────────
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    const existing = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
    });
    if (!existing) return res.status(404).json({ message: 'Profile not found or access denied' });

    const {
      firstName, lastName, gender, dateOfBirth, maritalStatus,
      height, weight, bodyType, physicalStatus, bloodGroup,
      religionId, denomination, motherTongueId,
      eatingHabits, smokingHabit, drinkingHabit, aboutMe,
      highestEducationId, employmentStatus, occupationId, annualIncome, currency,
      fatherName, fatherOccupationId, motherName, motherOccupationId,
      noOfBrothers, brothersMarried, noOfSisters, sistersMarried, aboutFamily,
      nativeCountryId, nativeCountryState, nativeCountryCity,
      countryLivingId, countryLivingState, countryLivingCity,
      citizenshipId, grewUpInCountryIds,
      hobbies, favMusic, favMusicOther, favSports, favSportsOther, favFood,
      showPhoto, showFullAge, showFirstName,
      contactMethods, contactWhatsapp, contactPhone, contactEmail,
      horoscopeAvailable, profileVisibility,
      createdByType, preferences,
    } = req.body;

    const VALID_VISIBILITY = ['ACTIVE', 'HIDDEN', 'MATCHED'];

    const updated = await (prisma.profile as any).update({
      where: { id: profileId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(gender !== undefined && { gender }),
        ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
        ...(maritalStatus !== undefined && { maritalStatus }),
        ...(height !== undefined && { height: height ? parseFloat(height) : null }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(bodyType !== undefined && { bodyType }),
        ...(physicalStatus !== undefined && { physicalStatus }),
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
        ...(grewUpInCountryIds !== undefined && { grewUpInCountryIds: Array.isArray(grewUpInCountryIds) ? grewUpInCountryIds.map(Number) : [] }),
        ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
        ...(hobbies !== undefined && { hobbies }),
        ...(favMusic !== undefined && { favMusic }),
        ...(favMusicOther !== undefined && { favMusicOther }),
        ...(favSports !== undefined && { favSports }),
        ...(favSportsOther !== undefined && { favSportsOther }),
        ...(favFood !== undefined && { favFood }),
        ...(showPhoto !== undefined && { showPhoto }),
        ...(showFullAge !== undefined && { showFullAge }),
        ...(showFirstName !== undefined && { showFirstName }),
        ...(contactMethods !== undefined && { contactMethods }),
        ...(contactWhatsapp !== undefined && { contactWhatsapp }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(horoscopeAvailable !== undefined && { horoscopeAvailable }),
        ...(profileVisibility !== undefined && VALID_VISIBILITY.includes(profileVisibility) && { profileVisibility }),
        ...(createdByType !== undefined && { createdByType }),
      },
    });

    if (preferences) {
      await upsertProfilePreferences(profileId, preferences);
    }

    return res.json({ message: 'Profile updated', profile: updated });
  } catch (err) {
    console.error('[updateProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── DELETE /api/matchmaker/profiles/:id ───────────────────────────────────────
export async function deleteProfile(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    const existing = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
    });
    if (!existing) return res.status(404).json({ message: 'Profile not found or access denied' });

    await (prisma.profile as any).update({ where: { id: profileId }, data: { status: 'DELETED' } });
    return res.json({ message: 'Profile deleted' });
  } catch (err) {
    console.error('[deleteProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/contacts ──────────────────────────────────────────────
export async function getContacts(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);

    const where: any = {
      profile: { matchMakerUserId: userId },
    };
    if (req.query.status) where.status = String(req.query.status);

    const contacts = await (prisma.matchmakerContactRequest as any).findMany({
      where,
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            referenceCode: true,
            gender: true,
            dateOfBirth: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ contacts });
  } catch (err) {
    console.error('[getContacts]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/matchmaker/contacts/:id ──────────────────────────────────────────
export async function updateContact(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const contactId = Number(req.params.id);

    // Verify ownership — contact must belong to a profile managed by this matchmaker
    const contact = await (prisma.matchmakerContactRequest as any).findFirst({
      where: {
        id: contactId,
        profile: { matchMakerUserId: userId },
      },
    });
    if (!contact) return res.status(404).json({ message: 'Contact request not found or access denied' });

    const VALID_STATUSES = ['NEW', 'IN_PROGRESS', 'REPLIED', 'CLOSED'];
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const updated = await (prisma.matchmakerContactRequest as any).update({
      where: { id: contactId },
      data: { status },
    });

    return res.json({ message: 'Contact updated', contact: updated });
  } catch (err) {
    console.error('[updateContact]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/public/:referenceCode ─────────────────────────────────
export async function getPublicProfile(req: AuthRequest, res: Response) {
  try {
    const { referenceCode } = req.params;

    const profile = await (prisma.profile as any).findUnique({
      where: { referenceCode },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        maritalStatus: true,
        height: true,
        weight: true,
        bodyType: true,
        physicalStatus: true,
        religion: { select: { id: true, name: true } },
        denomination: true,
        motherTongue: { select: { id: true, name: true } },
        eatingHabits: true,
        smokingHabit: true,
        drinkingHabit: true,
        aboutMe: true,
        highestEducation: { select: { id: true, name: true } },
        employmentStatus: true,
        occupation: { select: { id: true, name: true } },
        countryLiving: { select: { id: true, name: true } },
        countryLivingCity: true,
        nativeCountry: { select: { id: true, name: true } },
        citizenship: { select: { id: true, name: true } },
        referenceCode: true,
        showPhoto: true,
        showFullAge: true,
        showFirstName: true,
        contactMethods: true,
        contactWhatsapp: true,
        contactPhone: true,
        contactEmail: true,
        horoscopeAvailable: true,
        profileVisibility: true,
        isVerified: true,
        photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
        matchMaker: {
          select: {
            id: true,
            partnerProfile: {
              select: {
                id: true,
                businessName: true,
                bio: true,
                yearsOfExperience: true,
                createdAt: true,
                phones: { where: { status: 'ACTIVE' }, select: { label: true, number: true } },
                addresses: { where: { status: 'ACTIVE' }, select: { city: true, countryCode: true } },
              },
            },
          },
        },
      },
    });

    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Apply privacy settings
    const result: any = { ...profile };

    if (!profile.showPhoto) {
      result.photos = [];
    }

    if (!profile.showFirstName) {
      result.firstName = 'Anonymous';
    }

    if (!profile.showFullAge) {
      result.dateOfBirth = null;
      result.ageRange = calcAgeRange(new Date(profile.dateOfBirth));
    }

    return res.json({ profile: result });
  } catch (err) {
    console.error('[getPublicProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/matchmaker/public/:referenceCode/contact ────────────────────────
export async function submitContactRequest(req: AuthRequest, res: Response) {
  try {
    const { referenceCode } = req.params;
    const { requesterName, message, requesterEmail, requesterPhone } = req.body;

    if (!requesterName || !message) {
      return res.status(400).json({ message: 'requesterName and message are required' });
    }

    const profile = await (prisma.profile as any).findUnique({
      where: { referenceCode },
      select: { id: true, profileVisibility: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const contact = await (prisma.matchmakerContactRequest as any).create({
      data: {
        profileId: profile.id,
        requesterName,
        message,
        ...(requesterEmail && { requesterEmail }),
        ...(requesterPhone && { requesterPhone }),
      },
    });

    return res.status(201).json({ message: 'Enquiry submitted successfully', contact });
  } catch (err) {
    console.error('[submitContactRequest]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/stats ─────────────────────────────────────────────────
export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);

    const [totalProfiles, activeProfiles, successfulMatches, deletedProfiles, hiddenProfiles] = await Promise.all([
      (prisma.profile as any).count({ where: { matchMakerUserId: userId, status: { not: 'DELETED' } } }),
      (prisma.profile as any).count({ where: { matchMakerUserId: userId, profileVisibility: 'ACTIVE', status: { not: 'DELETED' } } }),
      (prisma.profile as any).count({ where: { matchMakerUserId: userId, profileVisibility: 'MATCHED', status: { not: 'DELETED' } } }),
      (prisma.profile as any).count({ where: { matchMakerUserId: userId, status: 'DELETED' } }),
      (prisma.profile as any).count({ where: { matchMakerUserId: userId, profileVisibility: 'HIDDEN', status: { not: 'DELETED' } } }),
    ]);

    return res.json({ totalProfiles, activeProfiles, successfulMatches, deletedProfiles, hiddenProfiles });
  } catch (err) {
    console.error('[getDashboardStats]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/matchmaker/profiles/:id/send-request ───────────────────────────
// Send a match request FROM the matchmaker's profile TO another profile
export async function sendRequestFromProfile(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const senderProfileId = Number(req.params.id);
    const receiverId = Number(req.body.receiverId);

    // Verify this matchmaker owns the sender profile
    const senderProfile = await (prisma.profile as any).findFirst({
      where: { id: senderProfileId, matchMakerUserId: userId },
      select: { id: true, gender: true },
    });
    if (!senderProfile) return res.status(404).json({ message: 'Profile not found or access denied' });

    if (!receiverId || receiverId === senderProfileId) {
      return res.status(400).json({ message: 'Invalid receiver' });
    }

    // Check receiver exists
    const receiver = await (prisma.profile as any).findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver) return res.status(404).json({ message: 'Receiver profile not found' });

    // Check no existing match in either direction
    const existing = await (prisma.match as any).findFirst({
      where: {
        OR: [
          { senderId: senderProfileId, receiverId },
          { senderId: receiverId, receiverId: senderProfileId },
        ],
      },
    });
    if (existing) {
      return res.status(409).json({ message: 'A request already exists for this pair', status: existing.status });
    }

    const match = await (prisma.match as any).create({
      data: {
        senderId: senderProfileId,
        receiverId,
        message: req.body.message?.trim() || null,
      },
    });

    // Notify the receiver profile's owner via socket
    try {
      const receiverProfile = await (prisma.profile as any).findUnique({
        where: { id: receiverId },
        select: { userId: true, matchMakerUserId: true, firstName: true, lastName: true },
      });
      const senderProfile = await (prisma.profile as any).findUnique({
        where: { id: senderProfileId },
        select: { firstName: true, lastName: true },
      });
      const notifyUserId = receiverProfile?.matchMakerUserId ?? receiverProfile?.userId;
      if (notifyUserId) {
        getIO().to(`user_${notifyUserId}`).emit('new_match_request', {
          matchId: match.id,
          senderName: senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : 'Someone',
          receiverName: receiverProfile ? `${receiverProfile.firstName} ${receiverProfile.lastName}` : '',
          createdAt: match.createdAt,
        });
      }
    } catch { /* non-critical */ }

    return res.status(201).json({ message: 'Match request sent', match });
  } catch (err) {
    console.error('[sendRequestFromProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/profiles/:id/requests ─────────────────────────────────
// Returns all match requests received by a specific profile owned by this matchmaker
export async function getProfileRequests(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    // Verify this profile belongs to the matchmaker
    const profile = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found or access denied' });

    const requests = await (prisma.match as any).findMany({
      where: { receiverId: profileId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, status: true, message: true, createdAt: true,
        sender: {
          select: {
            id: true, firstName: true, lastName: true, gender: true,
            dateOfBirth: true, maritalStatus: true, isVerified: true,
            countryLiving: { select: { name: true } },
            religion: { select: { name: true } },
            occupation: { select: { name: true } },
            highestEducation: { select: { name: true } },
            aboutMe: true,
            photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
          },
        },
      },
    });

    return res.json({ requests });
  } catch (err) {
    console.error('[getProfileRequests]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/profiles/:id/request-status/:targetId ────────────────
// Returns whether a match record exists between profile :id and :targetId, and its direction
export async function getRequestStatus(req: AuthRequest, res: Response) {
  try {
    const userId    = Number(req.user?.userId);
    const profileId = Number(req.params.id);
    const targetId  = Number(req.params.targetId);

    // Verify ownership
    const profile = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found or access denied' });

    // Check both directions
    const sent = await (prisma.match as any).findFirst({
      where: { senderId: profileId, receiverId: targetId },
      select: { id: true, status: true },
    });
    if (sent) return res.json({ direction: 'SENT', status: sent.status, matchId: sent.id });

    const received = await (prisma.match as any).findFirst({
      where: { senderId: targetId, receiverId: profileId },
      select: { id: true, status: true },
    });
    if (received) return res.json({ direction: 'RECEIVED', status: received.status, matchId: received.id });

    return res.json({ direction: null, status: null, matchId: null });
  } catch (err) {
    console.error('[getRequestStatus]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/matchmaker/profiles/:id/requests/:matchId ───────────────────────
// Accept or decline an incoming match request for a matchmaker-owned profile
export async function respondToProfileRequest(req: AuthRequest, res: Response) {
  try {
    const userId   = Number(req.user?.userId);
    const profileId = Number(req.params.id);
    const matchId  = Number(req.params.matchId);
    const action   = req.body.action as string; // 'ACCEPTED' | 'DECLINED'

    if (!['ACCEPTED', 'DECLINED'].includes(action)) {
      return res.status(400).json({ message: 'action must be ACCEPTED or DECLINED' });
    }

    // Verify matchmaker owns this profile
    const profile = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found or access denied' });

    // Verify the match is an incoming request to this profile
    const match = await (prisma.match as any).findFirst({
      where: { id: matchId, receiverId: profileId },
    });
    if (!match) return res.status(404).json({ message: 'Request not found' });
    if (match.status !== 'PENDING') {
      return res.status(400).json({ message: `Request already ${match.status.toLowerCase()}` });
    }

    const updated = await (prisma.match as any).update({
      where: { id: matchId },
      data: { status: action },
    });

    // Notify the sender profile's owner about the decision
    try {
      const senderProfile = await (prisma.profile as any).findUnique({
        where: { id: match.senderId },
        select: { userId: true, matchMakerUserId: true, firstName: true, lastName: true },
      });
      const receiverProfile = await (prisma.profile as any).findUnique({
        where: { id: profileId },
        select: { firstName: true, lastName: true },
      });
      const notifyUserId = senderProfile?.matchMakerUserId ?? senderProfile?.userId;
      if (notifyUserId) {
        getIO().to(`user_${notifyUserId}`).emit('match_request_response', {
          matchId,
          action,
          senderName: senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : '',
          receiverName: receiverProfile ? `${receiverProfile.firstName} ${receiverProfile.lastName}` : '',
        });
      }
    } catch { /* non-critical */ }

    return res.json({ message: `Request ${action.toLowerCase()}`, match: updated });
  } catch (err) {
    console.error('[respondToProfileRequest]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/profiles/:id/match-score/:targetId ───────────────────
// Returns a compatibility % between profile :id (matchmaker's) and :targetId
export async function getMatchScore(req: AuthRequest, res: Response) {
  try {
    const userId    = Number(req.user?.userId);
    const profileId = Number(req.params.id);
    const targetId  = Number(req.params.targetId);

    // Verify ownership
    const myProfile = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
      select: {
        id: true, gender: true, dateOfBirth: true, height: true,
        religionId: true, motherTongueId: true, countryLivingId: true,
        maritalStatus: true, highestEducationId: true, employmentStatus: true,
        smokingHabit: true, drinkingHabit: true, eatingHabits: true,
        physicalStatus: true, bodyType: true,
        preference: true,
      },
    });
    if (!myProfile) return res.status(404).json({ message: 'Profile not found or access denied' });

    const target = await (prisma.profile as any).findUnique({
      where: { id: targetId },
      select: {
        id: true, gender: true, dateOfBirth: true, height: true,
        religionId: true, motherTongueId: true, countryLivingId: true,
        maritalStatus: true, highestEducationId: true, employmentStatus: true,
        smokingHabit: true, drinkingHabit: true, eatingHabits: true,
        physicalStatus: true, bodyType: true,
        preference: true,
      },
    });
    if (!target) return res.status(404).json({ message: 'Target profile not found' });

    const pref = myProfile.preference;

    let score = 0;
    let total = 0;

    function calcAge(dob: Date) {
      return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    }

    // Gender compatibility (binary, required)
    const genderMatch = myProfile.gender !== target.gender;
    if (genderMatch) score += 15;
    total += 15;

    // Age range preference (10 pts)
    total += 10;
    if (pref?.minAge || pref?.maxAge) {
      const tAge = calcAge(new Date(target.dateOfBirth));
      const ok = (!pref.minAge || tAge >= pref.minAge) && (!pref.maxAge || tAge <= pref.maxAge);
      if (ok) score += 10;
    } else { score += 10; } // no preference = full score

    // Height range preference (8 pts)
    total += 8;
    if (pref?.minHeight || pref?.maxHeight) {
      if (target.height) {
        const ok = (!pref.minHeight || target.height >= pref.minHeight) && (!pref.maxHeight || target.height <= pref.maxHeight);
        if (ok) score += 8;
      }
    } else { score += 8; }

    // Religion (12 pts)
    total += 12;
    if (pref?.religionIds?.length) {
      if (target.religionId && pref.religionIds.includes(target.religionId)) score += 12;
    } else { score += 12; }

    // Mother tongue (8 pts)
    total += 8;
    if (pref?.motherTongueIds?.length) {
      if (target.motherTongueId && pref.motherTongueIds.includes(target.motherTongueId)) score += 8;
    } else { score += 8; }

    // Country living (10 pts)
    total += 10;
    if (pref?.countryLivingIds?.length) {
      if (target.countryLivingId && pref.countryLivingIds.includes(target.countryLivingId)) score += 10;
    } else { score += 10; }

    // Marital status (8 pts)
    total += 8;
    if (pref?.maritalStatus?.length) {
      if (target.maritalStatus && pref.maritalStatus.includes(target.maritalStatus)) score += 8;
    } else { score += 8; }

    // Education (8 pts)
    total += 8;
    if (pref?.educationId) {
      if (target.highestEducationId === pref.educationId) score += 8;
    } else { score += 8; }

    // Smoking habit (5 pts)
    total += 5;
    if (pref?.smokingHabit) {
      if (target.smokingHabit === pref.smokingHabit) score += 5;
    } else { score += 5; }

    // Drinking habit (5 pts)
    total += 5;
    if (pref?.drinkingHabit) {
      if (target.drinkingHabit === pref.drinkingHabit) score += 5;
    } else { score += 5; }

    // Eating habits (5 pts)
    total += 5;
    if (pref?.eatingHabits?.length) {
      const overlap = (pref.eatingHabits as string[]).filter((h: string) => (target.eatingHabits as string[] ?? []).includes(h));
      score += Math.round((overlap.length / pref.eatingHabits.length) * 5);
    } else { score += 5; }

    // Physical status (6 pts)
    total += 6;
    if (pref?.physicalStatus?.length) {
      if (target.physicalStatus && pref.physicalStatus.includes(target.physicalStatus)) score += 6;
    } else { score += 6; }

    const percentage = Math.round((score / total) * 100);

    return res.json({ score: percentage });
  } catch (err) {
    console.error('[getMatchScore]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/profiles/:id/matches ──────────────────────────────────
// Returns browseable opposite-gender profiles filtered by this profile's preferences
export async function getProfileMatches(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    // Verify ownership and get profile + preferences
    const profile = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
      select: {
        id: true, gender: true,
        preference: true,
      },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found or access denied' });

    const pref = profile.preference;
    const oppositeGender = profile.gender === 'MALE' ? 'FEMALE' : 'MALE';

    const page = Number(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    // Build where clause from filters (query params override preferences)
    const where: any = {
      id: { not: profileId },
      gender: oppositeGender,
      // Allow null status (incomplete profiles) but exclude explicitly INACTIVE
      NOT: [
        { status: 'INACTIVE' },
        { profileVisibility: 'HIDDEN' },
      ],
    };

    // Age filter
    const minAge = Number(req.query.minAge) || (pref?.minAge ?? null);
    const maxAge = Number(req.query.maxAge) || (pref?.maxAge ?? null);
    if (minAge) {
      const maxDob = new Date();
      maxDob.setFullYear(maxDob.getFullYear() - minAge);
      where.dateOfBirth = { ...where.dateOfBirth, lte: maxDob };
    }
    if (maxAge) {
      const minDob = new Date();
      minDob.setFullYear(minDob.getFullYear() - maxAge - 1);
      where.dateOfBirth = { ...where.dateOfBirth, gte: minDob };
    }

    // Height filter
    const minH = Number(req.query.minHeight) || (pref?.minHeight ?? null);
    const maxH = Number(req.query.maxHeight) || (pref?.maxHeight ?? null);
    if (minH) where.height = { ...where.height, gte: minH };
    if (maxH) where.height = { ...where.height, lte: maxH };

    // Religion
    const religionId = req.query.religionId ? Number(req.query.religionId) : null;
    if (religionId) {
      where.religionId = religionId;
    } else if (pref?.religionIds?.length) {
      where.religionId = { in: pref.religionIds };
    }

    // Country living
    const countryId = req.query.countryLivingId ? Number(req.query.countryLivingId) : null;
    if (countryId) {
      where.countryLivingId = countryId;
    } else if (pref?.countryLivingIds?.length) {
      where.countryLivingId = { in: pref.countryLivingIds };
    }

    // Marital status
    const maritalStatus = req.query.maritalStatus as string | undefined;
    if (maritalStatus) {
      where.maritalStatus = maritalStatus;
    } else if (pref?.maritalStatus?.length) {
      where.maritalStatus = { in: pref.maritalStatus };
    }

    // Education
    const educationId = req.query.educationId ? Number(req.query.educationId) : null;
    if (educationId) where.highestEducationId = educationId;
    else if (pref?.educationId) where.highestEducationId = pref.educationId;

    const [profiles, total] = await Promise.all([
      (prisma.profile as any).findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, gender: true,
          dateOfBirth: true, maritalStatus: true, isVerified: true,
          countryLiving: { select: { name: true } },
          religion: { select: { name: true } },
          occupation: { select: { name: true } },
          highestEducation: { select: { name: true } },
          motherTongue: { select: { name: true } },
          height: true, aboutMe: true,
          matchMakerUserId: true,
          createdByType: true,
          photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
        },
      }),
      (prisma.profile as any).count({ where }),
    ]);

    // Resolve matchmaker business names for profiles created by other matchmakers
    const otherMakerUserIds = [...new Set(
      profiles
        .map((p: any) => p.matchMakerUserId)
        .filter((mid: any) => mid && mid !== userId)
    )] as number[];

    const partnerNames: Record<number, string> = {};
    if (otherMakerUserIds.length > 0) {
      const partners = await (prisma.partner as any).findMany({
        where: { userId: { in: otherMakerUserIds } },
        select: { userId: true, businessName: true },
      });
      for (const p of partners) partnerNames[p.userId] = p.businessName;
    }

    const profilesWithCreator = profiles.map((p: any) => ({
      ...p,
      createdByMe: p.matchMakerUserId === userId,
      createdByBusinessName: p.matchMakerUserId && p.matchMakerUserId !== userId
        ? (partnerNames[p.matchMakerUserId] ?? 'Another Matchmaker')
        : null,
    }));

    // Fetch existing requests sent FROM this profile to any of the returned profiles
    const profileIds = profilesWithCreator.map((p: any) => p.id);
    const [sentMatches, receivedMatches] = profileIds.length > 0
      ? await Promise.all([
          (prisma.match as any).findMany({
            where: { senderId: profileId, receiverId: { in: profileIds } },
            select: { id: true, receiverId: true, status: true },
          }),
          (prisma.match as any).findMany({
            where: { receiverId: profileId, senderId: { in: profileIds } },
            select: { id: true, senderId: true, status: true },
          }),
        ])
      : [[], []];

    // Build a map: otherProfileId -> { status, direction, matchId }
    const requestStatusMap: Record<number, { status: string; direction: string; matchId: number }> = {};
    for (const m of sentMatches) {
      requestStatusMap[m.receiverId] = { status: m.status, direction: 'SENT', matchId: m.id };
    }
    for (const m of receivedMatches) {
      requestStatusMap[m.senderId] = { status: m.status, direction: 'RECEIVED', matchId: m.id };
    }

    return res.json({ profiles: profilesWithCreator, total, page, totalPages: Math.ceil(total / limit), requestStatusMap });
  } catch (err) {
    console.error('[getProfileMatches]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/matchmaker/profiles/:id/photos ─────────────────────────────────
export async function uploadProfilePhotos(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    const profile = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
      include: { photos: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found or access denied' });

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
    console.error('[uploadProfilePhotos]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── DELETE /api/matchmaker/profiles/:id/photos/:photoId ──────────────────────
export async function deleteProfilePhoto(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    const profile = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found or access denied' });

    const photo = await (prisma.profilePhoto as any).findFirst({
      where: { id: Number(req.params.photoId), profileId: profile.id },
    });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    const parts = photo.imageUrl.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    await cloudinary.uploader.destroy(`${folder}/${filename}`).catch(() => {});

    await (prisma.profilePhoto as any).delete({ where: { id: photo.id } });

    if (photo.isPrimary) {
      const next = await (prisma.profilePhoto as any).findFirst({ where: { profileId: profile.id }, orderBy: { createdAt: 'asc' } });
      if (next) await (prisma.profilePhoto as any).update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    return res.json({ message: 'Photo deleted' });
  } catch (err) {
    console.error('[deleteProfilePhoto]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── PUT /api/matchmaker/profiles/:id/photos/:photoId/primary ─────────────────
export async function setProfilePhotoPrimary(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profileId = Number(req.params.id);

    const profile = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found or access denied' });

    const photo = await (prisma.profilePhoto as any).findFirst({
      where: { id: Number(req.params.photoId), profileId: profile.id },
    });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    await (prisma.profilePhoto as any).updateMany({ where: { profileId: profile.id }, data: { isPrimary: false } });
    await (prisma.profilePhoto as any).update({ where: { id: photo.id }, data: { isPrimary: true } });

    return res.json({ message: 'Profile picture updated' });
  } catch (err) {
    console.error('[setProfilePhotoPrimary]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/deleted-profiles ─────────────────────────────────────
export async function getDeletedProfiles(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profiles = await (prisma.profile as any).findMany({
      where: { matchMakerUserId: userId, status: 'DELETED' },
      select: {
        id: true, firstName: true, lastName: true, gender: true,
        dateOfBirth: true, referenceCode: true, profileVisibility: true,
        religion: { select: { id: true, name: true } },
        countryLiving: { select: { id: true, name: true } },
        photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ profiles });
  } catch (err) {
    console.error('[getDeletedProfiles]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/hidden-profiles ──────────────────────────────────────
export async function getHiddenProfiles(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profiles = await (prisma.profile as any).findMany({
      where: { matchMakerUserId: userId, profileVisibility: 'HIDDEN', status: { not: 'DELETED' } },
      select: {
        id: true, firstName: true, lastName: true, gender: true,
        dateOfBirth: true, referenceCode: true, profileVisibility: true,
        religion: { select: { id: true, name: true } },
        countryLiving: { select: { id: true, name: true } },
        photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ profiles });
  } catch (err) {
    console.error('[getHiddenProfiles]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── GET /api/matchmaker/successful-matches ───────────────────────────────────
export async function getSuccessfulMatchProfiles(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profiles = await (prisma.profile as any).findMany({
      where: { matchMakerUserId: userId, profileVisibility: 'MATCHED', status: { not: 'DELETED' } },
      select: {
        id: true, firstName: true, lastName: true, gender: true,
        dateOfBirth: true, referenceCode: true, profileVisibility: true,
        religion: { select: { id: true, name: true } },
        countryLiving: { select: { id: true, name: true } },
        photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ profiles });
  } catch (err) {
    console.error('[getSuccessfulMatchProfiles]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── POST /api/matchmaker/profiles/:id/restore ────────────────────────────────
export async function restoreProfile(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const profileId = Number(req.params.id);
    const existing = await (prisma.profile as any).findFirst({
      where: { id: profileId, matchMakerUserId: userId },
    });
    if (!existing) return res.status(404).json({ message: 'Profile not found or access denied' });
    await (prisma.profile as any).update({ where: { id: profileId }, data: { status: 'ACTIVE', profileVisibility: 'ACTIVE' } });
    return res.json({ message: 'Profile restored' });
  } catch (err) {
    console.error('[restoreProfile]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ── Success Stories ───────────────────────────────────────────────────────────

async function getPartnerForUser(userId: number) {
  return (prisma.partner as any).findUnique({ where: { userId } });
}

// GET /api/matchmaker/success-stories
export async function getSuccessStories(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const partner = await getPartnerForUser(userId);
    if (!partner) return res.status(403).json({ message: 'Partner account not found' });

    const stories = await (prisma.matchmakerSuccessStory as any).findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ stories });
  } catch (err) {
    console.error('[getSuccessStories]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/matchmaker/success-stories/public/:partnerId
export async function getPublicSuccessStories(req: AuthRequest, res: Response) {
  try {
    const partnerId = Number(req.params.partnerId);
    const stories = await (prisma.matchmakerSuccessStory as any).findMany({
      where: { partnerId, isPublic: true },
      orderBy: { createdAt: 'desc' },
    });
    const partner = await (prisma.partner as any).findUnique({
      where: { id: partnerId },
      select: { businessName: true, bio: true, logoImage: true },
    });
    return res.json({ stories, partner });
  } catch (err) {
    console.error('[getPublicSuccessStories]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/matchmaker/success-stories
export async function createSuccessStory(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const partner = await getPartnerForUser(userId);
    if (!partner) return res.status(403).json({ message: 'Partner account not found' });

    const { coupleName, story, videoUrl, isPublic } = req.body;
    if (!coupleName) return res.status(400).json({ message: 'coupleName is required' });

    let photoUrl: string | null = null;
    if ((req as any).file) {
      const file = (req as any).file;
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'success_stories', transformation: [{ width: 800, crop: 'limit' }] },
          (err: any, result: any) => err ? reject(err) : resolve(result)
        );
        Readable.from(file.buffer).pipe(stream);
      });
      photoUrl = result.secure_url;
    }

    const storyRecord = await (prisma.matchmakerSuccessStory as any).create({
      data: {
        partnerId: partner.id,
        coupleName,
        story: story || null,
        photoUrl,
        videoUrl: videoUrl || null,
        isPublic: isPublic !== false,
      },
    });
    return res.status(201).json({ message: 'Success story created', story: storyRecord });
  } catch (err) {
    console.error('[createSuccessStory]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/matchmaker/success-stories/:id
export async function updateSuccessStory(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const partner = await getPartnerForUser(userId);
    if (!partner) return res.status(403).json({ message: 'Partner account not found' });

    const storyId = Number(req.params.id);
    const existing = await (prisma.matchmakerSuccessStory as any).findFirst({
      where: { id: storyId, partnerId: partner.id },
    });
    if (!existing) return res.status(404).json({ message: 'Story not found' });

    const { coupleName, story, videoUrl, isPublic } = req.body;
    const data: any = {};
    if (coupleName !== undefined) data.coupleName = coupleName;
    if (story !== undefined) data.story = story || null;
    if (videoUrl !== undefined) data.videoUrl = videoUrl || null;
    if (isPublic !== undefined) data.isPublic = isPublic !== false && isPublic !== 'false';

    if ((req as any).file) {
      const file = (req as any).file;
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'success_stories', transformation: [{ width: 800, crop: 'limit' }] },
          (err: any, result: any) => err ? reject(err) : resolve(result)
        );
        Readable.from(file.buffer).pipe(stream);
      });
      data.photoUrl = result.secure_url;
    }

    const updated = await (prisma.matchmakerSuccessStory as any).update({
      where: { id: storyId },
      data,
    });
    return res.json({ message: 'Story updated', story: updated });
  } catch (err) {
    console.error('[updateSuccessStory]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /api/matchmaker/success-stories/:id
export async function deleteSuccessStory(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.user?.userId);
    const partner = await getPartnerForUser(userId);
    if (!partner) return res.status(403).json({ message: 'Partner account not found' });

    const storyId = Number(req.params.id);
    const existing = await (prisma.matchmakerSuccessStory as any).findFirst({
      where: { id: storyId, partnerId: partner.id },
    });
    if (!existing) return res.status(404).json({ message: 'Story not found' });

    await (prisma.matchmakerSuccessStory as any).delete({ where: { id: storyId } });
    return res.json({ message: 'Story deleted' });
  } catch (err) {
    console.error('[deleteSuccessStory]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
