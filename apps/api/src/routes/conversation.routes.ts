import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  deleteMessage,
} from '../controllers/conversation.controller'

const router = Router()

// All conversation routes require auth
router.use(authenticate)

// GET  /api/conversations           — list conversations
router.get('/', getConversations)

// POST /api/conversations           — get or create conversation
router.post('/', getOrCreateConversation)

// GET  /api/conversations/:id/messages          — paginated messages
router.get('/:id/messages', getMessages)

// DELETE /api/conversations/:convId/messages/:msgId — soft delete
router.delete('/:convId/messages/:msgId', deleteMessage)

export default router
