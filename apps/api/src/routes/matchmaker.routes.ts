import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMyProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  getContacts,
  updateContact,
  getPublicProfile,
  submitContactRequest,
  getDashboardStats,
  getLatestFeed,
  getProfileRequests,
  getProfileMatches,
  sendRequestFromProfile,
  respondToProfileRequest,
  getRequestStatus,
  getMatchScore,
  uploadProfilePhotos,
  deleteProfilePhoto,
  setProfilePhotoPrimary,
  getDeletedProfiles,
  getHiddenProfiles,
  getSuccessfulMatchProfiles,
  restoreProfile,
  getSuccessStories,
  getPublicSuccessStories,
  createSuccessStory,
  updateSuccessStory,
  deleteSuccessStory,
} from '../controllers/matchmaker.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 10 } });
const uploadSingle = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

// Public routes (no auth required)
router.get('/public/:referenceCode', getPublicProfile);
router.post('/public/:referenceCode/contact', submitContactRequest);
router.get('/success-stories/public/:partnerId', getPublicSuccessStories);

// Protected routes
router.use(authenticate);
router.get('/stats', getDashboardStats);
router.get('/feed', getLatestFeed);
router.get('/profiles', getMyProfiles);
router.get('/deleted-profiles', getDeletedProfiles);
router.get('/hidden-profiles', getHiddenProfiles);
router.get('/successful-matches', getSuccessfulMatchProfiles);
router.post('/profiles/:id/restore', restoreProfile);
router.post('/profiles', createProfile);
router.put('/profiles/:id', updateProfile);
router.delete('/profiles/:id', deleteProfile);
router.post('/profiles/:id/send-request', sendRequestFromProfile);
router.get('/profiles/:id/requests', getProfileRequests);
router.put('/profiles/:id/requests/:matchId', respondToProfileRequest);
router.get('/profiles/:id/matches', getProfileMatches);
router.get('/profiles/:id/request-status/:targetId', getRequestStatus);
router.get('/profiles/:id/match-score/:targetId', getMatchScore);
router.get('/contacts', getContacts);
router.put('/contacts/:id', updateContact);

// Success stories
router.get('/success-stories', getSuccessStories);
router.post('/success-stories', uploadSingle.single('photo'), createSuccessStory as any);
router.put('/success-stories/:id', uploadSingle.single('photo'), updateSuccessStory as any);
router.delete('/success-stories/:id', deleteSuccessStory);

// Profile photos (matchmaker-owned profiles)
router.post('/profiles/:id/photos', upload.array('photos', 10), uploadProfilePhotos as any);
router.delete('/profiles/:id/photos/:photoId', deleteProfilePhoto as any);
router.put('/profiles/:id/photos/:photoId/primary', setProfilePhotoPrimary as any);

export default router;
