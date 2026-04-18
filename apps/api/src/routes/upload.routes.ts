import { Router, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

/* ─────────────────────────────────────────────
   POST /api/upload/profile-photo
───────────────────────────────────────────── */
router.post(
  '/profile-photo',
  authenticate,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const profile = await prisma.profile.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!profile) return res.status(404).json({ message: 'Profile not found' });

      // Upload to Cloudinary via stream
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'twp/profiles', resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
          (error, result) => {
            if (error) { console.error('[Cloudinary error]', error); reject(new Error(error.message)); return; }
            if (!result) { reject(new Error('No result from Cloudinary')); return; }
            resolve(result.secure_url);
          }
        );
        stream.end(req.file!.buffer);
      });

      const existingCount = await prisma.profilePhoto.count({ where: { profileId: profile.id } });
      const isPrimary = existingCount === 0;

      const photo = await prisma.profilePhoto.create({
        data: { profileId: profile.id, imageUrl, isPrimary },
      });

      return res.status(201).json({ message: 'Photo uploaded', photo });
    } catch (err) {
      console.error('[upload/profile-photo]', err);
      const message = err instanceof Error ? err.message : 'Upload failed';
      return res.status(500).json({ message });
    }
  }
);

/* ─────────────────────────────────────────────
   DELETE /api/upload/profile-photo/:photoId
───────────────────────────────────────────── */
router.delete(
  '/profile-photo/:photoId',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const photoId = Number(req.params.photoId);

      const photo = await prisma.profilePhoto.findFirst({
        where: { id: photoId, profile: { userId } },
      });
      if (!photo) return res.status(404).json({ message: 'Photo not found' });

      await prisma.profilePhoto.delete({ where: { id: photoId } });

      if (photo.isPrimary) {
        const next = await prisma.profilePhoto.findFirst({
          where: { profileId: photo.profileId },
          orderBy: { createdAt: 'asc' },
        });
        if (next) await prisma.profilePhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
      }

      return res.json({ message: 'Photo deleted' });
    } catch {
      return res.status(500).json({ message: 'Delete failed' });
    }
  }
);

/* ─────────────────────────────────────────────
   PUT /api/upload/profile-photo/:photoId/primary
───────────────────────────────────────────── */
router.put(
  '/profile-photo/:photoId/primary',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const photoId = Number(req.params.photoId);

      const photo = await prisma.profilePhoto.findFirst({
        where: { id: photoId, profile: { userId } },
        select: { id: true, profileId: true },
      });
      if (!photo) return res.status(404).json({ message: 'Photo not found' });

      await prisma.profilePhoto.updateMany({ where: { profileId: photo.profileId }, data: { isPrimary: false } });
      await prisma.profilePhoto.update({ where: { id: photoId }, data: { isPrimary: true } });

      return res.json({ message: 'Primary photo updated' });
    } catch {
      return res.status(500).json({ message: 'Update failed' });
    }
  }
);

export default router;
