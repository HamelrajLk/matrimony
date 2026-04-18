import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMyProfile,
  updateMyProfile,
  getProfileById,
  getSuggestions,
  getViewedByMe,
  getMyVisitors,
  uploadPhotos,
  deletePhoto,
  setPhotoAsPrimary,
  upsertPreferences,
  browseProfiles,
  getLookupData,
} from '../controllers/profile.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 10 } });

// Public lookup data (religions, countries, etc.)
router.get('/lookup', getLookupData as any);

// Suggestions
router.get('/suggestions', authenticate, getSuggestions as any);

// Profile views
router.get('/views/mine', authenticate, getViewedByMe as any);
router.get('/views/visitors', authenticate, getMyVisitors as any);

// Own profile
router.get('/me', authenticate, getMyProfile as any);
router.put('/me', authenticate, updateMyProfile as any);

// Preferences
router.post('/me/preferences', authenticate, upsertPreferences as any);
router.put('/me/preferences', authenticate, upsertPreferences as any);

// Photos
router.post('/me/photos', authenticate, upload.array('photos', 10), uploadPhotos as any);
router.delete('/me/photos/:photoId', authenticate, deletePhoto as any);
router.put('/me/photos/:photoId/primary', authenticate, setPhotoAsPrimary as any);

// Browse all profiles (public)
router.get('/', browseProfiles as any);

// View a specific profile (public — keep last)
router.get('/:id', getProfileById as any);

export default router;
