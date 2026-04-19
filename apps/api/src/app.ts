import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { authRoutes } from './routes/auth.routes'
import profileRoutes from './routes/profile.routes'
import partnerRoutes from './routes/partner.routes'
import matchRoutes from './routes/match.routes'
import bookingRoutes from './routes/booking.routes'
import uploadRoutes from './routes/upload.routes'
import brokerRoutes from './routes/broker.routes'
import messageRoutes from './routes/message.routes'
import conversationRoutes from './routes/conversation.routes'
import savedSearchRoutes from './routes/savedSearch.routes'
import matchmakerRoutes from './routes/matchmaker.routes'
import notificationRoutes from './routes/notification.routes'
import subscriptionRoutes from './routes/subscription.routes'
import paymentRoutes from './routes/payment.routes'

const app = express()

// Security
app.use(helmet())
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 5000,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth',     authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/partners', partnerRoutes)
app.use('/api/matches',  matchRoutes)
app.use('/api/bookings',  bookingRoutes)
app.use('/api/upload',    uploadRoutes)
app.use('/api/brokers',   brokerRoutes)
app.use('/api/messages',       messageRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/searches',     savedSearchRoutes)
app.use('/api/matchmaker',      matchmakerRoutes)
app.use('/api/notifications',   notificationRoutes)
app.use('/api/subscriptions',  subscriptionRoutes)
app.use('/api/payments',       paymentRoutes)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

export default app