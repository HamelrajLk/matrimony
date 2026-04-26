import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  uploadMiddleware,
  listPackages, createPackage, updatePackage, deletePackage,
  listPhotos, uploadPhoto, toggleFeatured, deletePhoto, updatePhotoCaption,
  listEvents, createEvent, updateEvent, deleteEvent, uploadEventPhoto, deleteEventPhoto,
  getPublicProfile, getAllAlbumPhotos,
} from '../controllers/photographer.controller'

const router = Router()

// ── Public ────────────────────────────────────────────────────
router.get('/:partnerId/public',       getPublicProfile)
router.get('/:partnerId/album',        getAllAlbumPhotos)

// ── Authenticated ─────────────────────────────────────────────
router.get('/packages',                authenticate, listPackages)
router.post('/packages',               authenticate, createPackage)
router.put('/packages/:id',            authenticate, updatePackage)
router.delete('/packages/:id',         authenticate, deletePackage)

router.get('/photos',                  authenticate, listPhotos)
router.post('/photos',                 authenticate, uploadMiddleware, uploadPhoto)
router.put('/photos/:id/featured',     authenticate, toggleFeatured)
router.put('/photos/:id/caption',      authenticate, updatePhotoCaption)
router.delete('/photos/:id',           authenticate, deletePhoto)

router.get('/events',                  authenticate, listEvents)
router.post('/events',                 authenticate, createEvent)
router.put('/events/:id',              authenticate, updateEvent)
router.delete('/events/:id',           authenticate, deleteEvent)
router.post('/events/:id/photos',      authenticate, uploadMiddleware, uploadEventPhoto)
router.delete('/events/:id/photos/:photoId', authenticate, deleteEventPhoto)

export default router
