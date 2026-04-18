import { Router } from 'express'

const router = Router()

// Deprecated — use /api/conversations for all messaging.
// Keeping this stub so the existing mount in app.ts doesn't break.
router.get('/health', (_req, res) => {
  res.json({ message: 'Message routes: use /api/conversations instead' })
})

export default router
