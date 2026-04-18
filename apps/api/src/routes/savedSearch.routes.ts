import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getSavedSearches,
  getSavedSearchById,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
} from '../controllers/savedSearch.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/',       getSavedSearches);
router.get('/:id',    getSavedSearchById);
router.post('/',      createSavedSearch);
router.put('/:id',    updateSavedSearch);
router.delete('/:id', deleteSavedSearch);

export default router;
