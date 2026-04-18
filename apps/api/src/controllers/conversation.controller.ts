import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { isUserOnline } from '../config/socket'

// ─────────────────────────────────────────────────────────────────
//  HELPER — resolve the Profile for the authenticated user
// ─────────────────────────────────────────────────────────────────
async function getProfileForUser(
  userId: number,
): Promise<{ id: number } | null> {
  return prisma.profile.findFirst({
    where: { userId },
    select: { id: true },
  })
}

// ─────────────────────────────────────────────────────────────────
//  GET /api/conversations
//  List all conversations for current user — with last message,
//  unread count, and other participant's profile info
// ─────────────────────────────────────────────────────────────────
export async function getConversations(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const profile = await getProfileForUser(userId)
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }

    const participations = await prisma.conversationParticipant.findMany({
      where: { profileId: profile.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                profile: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    userId: true,
                    photos: {
                      where: { isPrimary: true },
                      take: 1,
                      select: { imageUrl: true },
                    },
                  },
                },
              },
            },
            messages: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                content: true,
                messageType: true,
                senderId: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    })

    const conversations = await Promise.all(
      participations.map(async (p: any) => {
        const conv = p.conversation
        const otherParticipants = conv.participants.filter(
          (cp: any) => cp.profileId !== profile.id,
        )
        const other = otherParticipants[0]

        // Unread count
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: profile.id },
            isDeleted: false,
            createdAt: {
              gt: p.lastReadAt ?? new Date(0),
            },
          },
        })

        // Is the other user online?
        const otherUserId = other?.profile.userId
        const isOnline = otherUserId ? isUserOnline(otherUserId) : false

        return {
          id: conv.id,
          matchId: conv.matchId,
          updatedAt: conv.updatedAt,
          lastReadAt: p.lastReadAt,
          unreadCount,
          lastMessage: conv.messages[0] ?? null,
          otherProfile: other
            ? {
                id: other.profile.id,
                firstName: other.profile.firstName,
                lastName: other.profile.lastName,
                photo: other.profile.photos[0]?.imageUrl ?? null,
                isOnline,
              }
            : null,
        }
      }),
    )

    res.json({ message: 'Conversations fetched', data: conversations })
  } catch (err) {
    console.error('[conversation] getConversations:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ─────────────────────────────────────────────────────────────────
//  POST /api/conversations
//  Get or create conversation — requires an ACCEPTED match
// ─────────────────────────────────────────────────────────────────
export async function getOrCreateConversation(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const { profileId: targetProfileId } = req.body as { profileId: number }

    if (!targetProfileId || typeof targetProfileId !== 'number') {
      res.status(400).json({ message: 'profileId (number) is required' })
      return
    }

    const myProfile = await getProfileForUser(userId)
    if (!myProfile) {
      res.status(404).json({ message: 'Your profile not found' })
      return
    }

    if (myProfile.id === targetProfileId) {
      res.status(400).json({ message: 'Cannot start conversation with yourself' })
      return
    }

    // Verify an ACCEPTED match exists between the two profiles
    const match = await prisma.match.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: myProfile.id, receiverId: targetProfileId },
          { senderId: targetProfileId, receiverId: myProfile.id },
        ],
      },
    })

    if (!match) {
      res.status(403).json({
        message: 'You must have an accepted match to start a conversation',
      })
      return
    }

    // Check if a conversation already exists for this match
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { matchId: match.id },
          {
            participants: {
              every: {
                profileId: { in: [myProfile.id, targetProfileId] },
              },
            },
            AND: {
              participants: {
                some: { profileId: myProfile.id },
              },
            },
          },
        ],
        participants: {
          some: { profileId: targetProfileId },
        },
      },
      include: {
        participants: {
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userId: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
      },
    })

    if (!conversation) {
      // Create conversation
      conversation = await prisma.conversation.create({
        data: {
          matchId: match.id,
          participants: {
            create: [
              { profileId: myProfile.id },
              { profileId: targetProfileId },
            ],
          },
        },
        include: {
          participants: {
            include: {
              profile: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  userId: true,
                  photos: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { imageUrl: true },
                  },
                },
              },
            },
          },
        },
      })
    }

    res.json({ message: 'Conversation ready', data: conversation })
  } catch (err) {
    console.error('[conversation] getOrCreateConversation:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ─────────────────────────────────────────────────────────────────
//  GET /api/conversations/:id/messages
//  Paginated messages — cursor-based, 30 per page
// ─────────────────────────────────────────────────────────────────
export async function getMessages(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const conversationId = parseInt(String(req.params.id), 10)
    const cursor = req.query.cursor ? parseInt(String(req.query.cursor), 10) : undefined
    const limit = 30

    if (isNaN(conversationId)) {
      res.status(400).json({ message: 'Invalid conversation ID' })
      return
    }

    const myProfile = await getProfileForUser(userId)
    if (!myProfile) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }

    // Verify participant
    const participation = await prisma.conversationParticipant.findFirst({
      where: { conversationId, profileId: myProfile.id },
    })
    if (!participation) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor ? { id: { lt: cursor } } : {}),
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
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    // Reverse so oldest first
    messages.reverse()

    const nextCursor = hasMore && messages.length > 0
      ? messages[0].id
      : null

    res.json({
      message: 'Messages fetched',
      data: {
        messages,
        nextCursor,
        hasMore,
      },
    })
  } catch (err) {
    console.error('[conversation] getMessages:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ─────────────────────────────────────────────────────────────────
//  DELETE /api/conversations/:convId/messages/:msgId
//  Soft delete (isDeleted = true) — only sender can delete
// ─────────────────────────────────────────────────────────────────
export async function deleteMessage(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const conversationId = parseInt(String(req.params.convId), 10)
    const messageId = parseInt(String(req.params.msgId), 10)

    if (isNaN(conversationId) || isNaN(messageId)) {
      res.status(400).json({ message: 'Invalid IDs' })
      return
    }

    const myProfile = await getProfileForUser(userId)
    if (!myProfile) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }

    const message = await prisma.message.findFirst({
      where: { id: messageId, conversationId },
    })

    if (!message) {
      res.status(404).json({ message: 'Message not found' })
      return
    }

    if (message.senderId !== myProfile.id) {
      res.status(403).json({ message: 'You can only delete your own messages' })
      return
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    })

    res.json({ message: 'Message deleted' })
  } catch (err) {
    console.error('[conversation] deleteMessage:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}
