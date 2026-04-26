import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  uploadMiddleware,
  listPackages, createPackage, updatePackage, deletePackage,
  listProducts, createProduct, updateProduct, deleteProduct,
  listPhotos, uploadPhoto, toggleFeatured, deletePhoto,
  listEvents, createEvent, updateEvent, deleteEvent, uploadEventPhoto, deleteEventPhoto,
  getPublicContent, getAllAlbumPhotos,
} from '../controllers/partnerContent.controller'

const router = Router()

// Public
router.get('/:partnerId/public', getPublicContent)
router.get('/:partnerId/album',  getAllAlbumPhotos)

// Packages (authenticated)
router.get('/packages',                 authenticate, listPackages)
router.post('/packages',                authenticate, createPackage)
router.put('/packages/:id',             authenticate, updatePackage)
router.delete('/packages/:id',          authenticate, deletePackage)

// Products (authenticated)
router.get('/products',                 authenticate, listProducts)
router.post('/products',                authenticate, uploadMiddleware, createProduct)
router.put('/products/:id',             authenticate, uploadMiddleware, updateProduct)
router.delete('/products/:id',          authenticate, deleteProduct)

// Album photos (authenticated)
router.get('/photos',                   authenticate, listPhotos)
router.post('/photos',                  authenticate, uploadMiddleware, uploadPhoto)
router.put('/photos/:id/featured',      authenticate, toggleFeatured)
router.delete('/photos/:id',            authenticate, deletePhoto)

// Events (authenticated)
router.get('/events',                   authenticate, listEvents)
router.post('/events',                  authenticate, createEvent)
router.put('/events/:id',               authenticate, updateEvent)
router.delete('/events/:id',            authenticate, deleteEvent)
router.post('/events/:id/photos',       authenticate, uploadMiddleware, uploadEventPhoto)
router.delete('/events/:id/photos/:photoId', authenticate, deleteEventPhoto)

export default router
