import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import http from 'http'
import { prisma } from '../lib/prisma'

// ── In-memory presence map: userId → socketId ────────────────────
const onlineUsers = new Map<number, string>()

// ── Module-level io instance (set once on init) ───────────────────
let _io: Server | null = null

export function getIO(): Server {
  if (!_io) throw new Error('Socket.IO not initialised yet')
  return _io
}

// ── JWT payload shape ─────────────────────────────────────────────
interface JwtPayload {
  userId: number
  role: string
}

// ── Augment socket.data ───────────────────────────────────────────
declare module 'socket.io' {
  interface SocketData {
    user: JwtPayload
  }
}

// ─────────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────────
export function initSocket(server: http.Server): Server {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  _io = io

  // ── Auth middleware ──────────────────────────────────────────────
  io.use((socket: Socket, next) => {
    const token =
      (socket.handshake.auth as Record<string, unknown>).token as string | undefined
      ?? (socket.handshake.headers.authorization as string | undefined)?.split(' ')[1]

    if (!token) {
      return next(new Error('Authentication error: no token'))
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Authentication error: invalid token'))
    }
  })

  // ── Connection handler ───────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.userId

    // Track presence
    onlineUsers.set(userId, socket.id)
    console.log(`[socket] connected userId=${userId} socketId=${socket.id}`)

    // Join personal room so server can push to this user
    socket.join(`user_${userId}`)

    // Broadcast online status to all
    io.emit('user_online', { userId })

    // ── join_conversation ────────────────────────────────────────
    socket.on('join_conversation', async (conversationId: number) => {
      try {
        // Verify this user is a participant
        const profile = await prisma.profile.findFirst({
          where: { userId },
          select: { id: true },
        })
        if (!profile) return

        const participant = await prisma.conversationParticipant.findFirst({
          where: { conversationId, profileId: profile.id },
        })
        if (!participant) {
          socket.emit('error', { message: 'Not a participant in this conversation' })
          return
        }

        socket.join(`conv_${conversationId}`)
        socket.to(`conv_${conversationId}`).emit('user_joined', {
          conversationId,
          userId,
        })
      } catch (err) {
        console.error('[socket] join_conversation error:', err)
        socket.emit('error', { message: 'Failed to join conversation' })
      }
    })

    // ── leave_conversation ───────────────────────────────────────
    socket.on('leave_conversation', (conversationId: number) => {
      socket.leave(`conv_${conversationId}`)
    })

    // ── send_message ─────────────────────────────────────────────
    socket.on(
      'send_message',
      async (data: { conversationId: number; content: string; messageType?: string }) => {
        try {
          const profile = await prisma.profile.findFirst({
            where: { userId },
            select: { id: true },
          })
          if (!profile) {
            socket.emit('error', { message: 'Profile not found' })
            return
          }

          // Verify participant
          const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId: data.conversationId, profileId: profile.id },
          })
          if (!participant) {
            socket.emit('error', { message: 'Not a participant' })
            return
          }

          // Validate content
          const content = data.content?.trim()
          if (!content || content.length === 0) {
            socket.emit('error', { message: 'Message content is required' })
            return
          }
          if (content.length > 2000) {
            socket.emit('error', { message: 'Message too long (max 2000 chars)' })
            return
          }

          // Save message to DB
          const message = await prisma.message.create({
            data: {
              conversationId: data.conversationId,
              senderId: profile.id,
              content,
              messageType: data.messageType ?? 'TEXT',
            },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photos: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { imageUrl: true },
                  },
                },
              },
            },
          })

          // Update conversation updatedAt
          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: { updatedAt: new Date() },
          })

          // Emit new_message to everyone in the room
          io.to(`conv_${data.conversationId}`).emit('new_message', message)

          // Notify all participants' personal rooms about conversation update
          const participants = await prisma.conversationParticipant.findMany({
            where: { conversationId: data.conversationId },
            select: { profile: { select: { userId: true } } },
          })

          const payload = {
            conversationId: data.conversationId,
            lastMessage: {
              content,
              createdAt: message.createdAt,
              senderId: profile.id,
            },
          }

          for (const p of participants) {
            if (p.profile.userId) {
              io.to(`user_${p.profile.userId}`).emit('conversation_updated', payload)
            }
          }
        } catch (err) {
          console.error('[socket] send_message error:', err)
          socket.emit('error', { message: 'Failed to send message' })
        }
      },
    )

    // ── typing_start ─────────────────────────────────────────────
    socket.on('typing_start', async (data: { conversationId: number }) => {
      try {
        const profile = await prisma.profile.findFirst({
          where: { userId },
          select: { id: true, firstName: true, lastName: true },
        })
        if (!profile) return

        socket.to(`conv_${data.conversationId}`).emit('user_typing', {
          conversationId: data.conversationId,
          profileId: profile.id,
          name: `${profile.firstName} ${profile.lastName}`,
        })
      } catch (err) {
        console.error('[socket] typing_start error:', err)
      }
    })

    // ── typing_stop ──────────────────────────────────────────────
    socket.on('typing_stop', async (data: { conversationId: number }) => {
      try {
        const profile = await prisma.profile.findFirst({
          where: { userId },
          select: { id: true },
        })
        if (!profile) return

        socket.to(`conv_${data.conversationId}`).emit('user_stop_typing', {
          conversationId: data.conversationId,
          profileId: profile.id,
        })
      } catch (err) {
        console.error('[socket] typing_stop error:', err)
      }
    })

    // ── mark_read ────────────────────────────────────────────────
    socket.on('mark_read', async (data: { conversationId: number }) => {
      try {
        const profile = await prisma.profile.findFirst({
          where: { userId },
          select: { id: true },
        })
        if (!profile) return

        const now = new Date()

        await prisma.conversationParticipant.updateMany({
          where: { conversationId: data.conversationId, profileId: profile.id },
          data: { lastReadAt: now },
        })

        // Mark all messages in this conversation as read
        await prisma.message.updateMany({
          where: {
            conversationId: data.conversationId,
            senderId: { not: profile.id },
            readAt: null,
          },
          data: { readAt: now },
        })

        io.to(`conv_${data.conversationId}`).emit('messages_read', {
          conversationId: data.conversationId,
          profileId: profile.id,
          readAt: now,
        })
      } catch (err) {
        console.error('[socket] mark_read error:', err)
      }
    })

    // ── disconnect ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId)
      console.log(`[socket] disconnected userId=${userId}`)
      io.emit('user_offline', { userId })
    })
  })

  return io
}

// ── Helper: check if a user is online ────────────────────────────
export function isUserOnline(userId: number): boolean {
  return onlineUsers.has(userId)
}

// ── Helper: get all online user IDs ──────────────────────────────
export function getOnlineUserIds(): number[] {
  return Array.from(onlineUsers.keys())
}
