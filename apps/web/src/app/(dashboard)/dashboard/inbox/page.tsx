'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { apiGet } from '@/lib/auth'
import { getSocket, disconnectSocket } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

// ─────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────
interface OtherProfile {
  id: number
  firstName: string
  lastName: string
  photo: string | null
  isOnline: boolean
}

interface LastMessage {
  id?: number
  content: string
  senderId: number
  createdAt: string
}

interface Conversation {
  id: number
  matchId: number | null
  updatedAt: string
  unreadCount: number
  lastReadAt: string | null
  lastMessage: LastMessage | null
  otherProfile: OtherProfile | null
}

interface MessageSender {
  id: number
  firstName: string
  lastName: string
  photos: { imageUrl: string }[]
}

interface Message {
  id: number
  conversationId: number
  senderId: number
  content: string
  messageType: 'TEXT' | 'IMAGE' | 'EMOJI'
  isDeleted: boolean
  readAt: string | null
  createdAt: string
  editedAt: string | null
  sender: MessageSender
}

interface TypingState {
  profileId: number
  name: string
}

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateDivider(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toDateString()
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

// ─────────────────────────────────────────────────────────────────
//  AVATAR
// ─────────────────────────────────────────────────────────────────
function Avatar({
  photo,
  name,
  size = 40,
  isOnline = false,
}: {
  photo: string | null
  name: string
  size?: number
  isOnline?: boolean
}) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          className="rounded-full object-cover w-full h-full"
          style={{ border: '2px solid #F0E4D0' }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white font-bold w-full h-full"
          style={{
            background: 'linear-gradient(135deg,#F4A435,#E8735A)',
            fontSize: size * 0.35,
          }}
        >
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      {isOnline && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-green-400 border-2 border-white"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  TYPING DOTS
// ─────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="rounded-full bg-[#9A8A7A]"
          style={{
            width: 6,
            height: 6,
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────────
export default function InboxPage() {
  const { token } = useAuthStore()

  // ── Conversations list ─────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convsLoading, setConvsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // ── Active chat ────────────────────────────────────────────────
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)

  // ── Typing ────────────────────────────────────────────────────
  const [typing, setTyping] = useState<TypingState | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const myTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  // ── Input ─────────────────────────────────────────────────────
  const [inputText, setInputText] = useState('')

  // ── Socket ────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null)

  // ── Online users (userId set) ──────────────────────────────────
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())

  // ── My profile id ─────────────────────────────────────────────
  const myProfileIdRef = useRef<number | null>(null)

  // ── Scroll ref ────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesAreaRef = useRef<HTMLDivElement>(null)

  // ─────────────────────────────────────────────────────────────
  //  Load my profile id
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    apiGet<{ profile: { id: number } }>('/api/profiles/me', token)
      .then((r) => { myProfileIdRef.current = r.profile.id })
      .catch(() => {})
  }, [token])

  // ─────────────────────────────────────────────────────────────
  //  Load conversations
  // ─────────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token) return
    try {
      setConvsLoading(true)
      const res = await apiGet<{ data: Conversation[] }>('/api/conversations', token)
      setConversations(res.data ?? [])
    } catch {
      /* silent */
    } finally {
      setConvsLoading(false)
    }
  }, [token])

  useEffect(() => { loadConversations() }, [loadConversations])

  // ─────────────────────────────────────────────────────────────
  //  Load messages for active conversation
  // ─────────────────────────────────────────────────────────────
  const loadMessages = useCallback(
    async (convId: number, cursor?: number) => {
      if (!token) return
      try {
        if (!cursor) setMsgsLoading(true)
        else setLoadingOlder(true)

        const url = `/api/conversations/${convId}/messages${cursor ? `?cursor=${cursor}` : ''}`
        const res = await apiGet<{ data: { messages: Message[]; nextCursor: number | null; hasMore: boolean } }>(url, token)
        const d = res.data

        if (cursor) {
          setMessages((prev) => [...d.messages, ...prev])
        } else {
          setMessages(d.messages)
        }
        setHasMore(d.hasMore)
        setNextCursor(d.nextCursor)
      } catch {
        /* silent */
      } finally {
        setMsgsLoading(false)
        setLoadingOlder(false)
      }
    },
    [token],
  )

  // ─────────────────────────────────────────────────────────────
  //  Socket setup
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return

    const sock = getSocket(token)
    socketRef.current = sock

    // Presence events
    sock.on('user_online', ({ userId }: { userId: number }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId))
      setConversations((prev) =>
        prev.map((c) =>
          c.otherProfile?.id != null && c.otherProfile.id === userId
            ? { ...c, otherProfile: { ...c.otherProfile!, isOnline: true } }
            : c,
        ),
      )
    })

    sock.on('user_offline', ({ userId }: { userId: number }) => {
      setOnlineUsers((prev) => {
        const s = new Set(prev)
        s.delete(userId)
        return s
      })
      setConversations((prev) =>
        prev.map((c) =>
          c.otherProfile?.id != null && c.otherProfile.id === userId
            ? { ...c, otherProfile: { ...c.otherProfile!, isOnline: false } }
            : c,
        ),
      )
    })

    // New message event
    sock.on('new_message', (msg: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      // Mark unread in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: {
                  id: msg.id,
                  content: msg.content,
                  senderId: msg.senderId,
                  createdAt: msg.createdAt,
                },
                unreadCount:
                  myProfileIdRef.current !== null && msg.senderId !== myProfileIdRef.current
                    ? c.unreadCount + 1
                    : c.unreadCount,
              }
            : c,
        ),
      )
    })

    // Conversation updated from other participants
    sock.on(
      'conversation_updated',
      (payload: { conversationId: number; lastMessage: LastMessage }) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === payload.conversationId
              ? { ...c, lastMessage: payload.lastMessage, updatedAt: payload.lastMessage.createdAt }
              : c,
          ),
        )
      },
    )

    // Typing indicators
    sock.on(
      'user_typing',
      ({ conversationId, profileId, name }: { conversationId: number; profileId: number; name: string }) => {
        if (activeConv?.id === conversationId) {
          setTyping({ profileId, name })
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
          typingTimerRef.current = setTimeout(() => setTyping(null), 3000)
        }
      },
    )

    sock.on(
      'user_stop_typing',
      ({ conversationId }: { conversationId: number }) => {
        if (activeConv?.id === conversationId) {
          setTyping(null)
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        }
      },
    )

    // Messages read
    sock.on(
      'messages_read',
      ({ conversationId }: { conversationId: number; profileId: number; readAt: string }) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c,
          ),
        )
      },
    )

    return () => {
      sock.off('user_online')
      sock.off('user_offline')
      sock.off('new_message')
      sock.off('conversation_updated')
      sock.off('user_typing')
      sock.off('user_stop_typing')
      sock.off('messages_read')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // ─────────────────────────────────────────────────────────────
  //  Open a conversation
  // ─────────────────────────────────────────────────────────────
  const openConversation = useCallback(
    async (conv: Conversation) => {
      // Leave previous room
      if (activeConv && socketRef.current) {
        socketRef.current.emit('leave_conversation', activeConv.id)
      }

      setActiveConv(conv)
      setMessages([])
      setTyping(null)
      setInputText('')

      // Join socket room
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', conv.id)
      }

      // Load messages
      await loadMessages(conv.id)

      // Mark as read
      if (socketRef.current) {
        socketRef.current.emit('mark_read', { conversationId: conv.id })
      }

      // Reset unread in local state
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      )
    },
    [activeConv, loadMessages],
  )

  // ─────────────────────────────────────────────────────────────
  //  Auto-scroll to bottom on new messages
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadingOlder) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loadingOlder])

  // ─────────────────────────────────────────────────────────────
  //  Handle input typing events
  // ─────────────────────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputText(e.target.value)

    if (!activeConv || !socketRef.current) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      socketRef.current.emit('typing_start', { conversationId: activeConv.id })
    }

    // Debounce stop-typing
    if (myTypingTimer.current) clearTimeout(myTypingTimer.current)
    myTypingTimer.current = setTimeout(() => {
      isTypingRef.current = false
      socketRef.current?.emit('typing_stop', { conversationId: activeConv.id })
    }, 2000)
  }

  // ─────────────────────────────────────────────────────────────
  //  Send message
  // ─────────────────────────────────────────────────────────────
  function sendMessage() {
    const content = inputText.trim()
    if (!content || !activeConv || !socketRef.current) return

    socketRef.current.emit('send_message', {
      conversationId: activeConv.id,
      content,
      messageType: 'TEXT',
    })

    // Stop typing indicator
    isTypingRef.current = false
    if (myTypingTimer.current) clearTimeout(myTypingTimer.current)
    socketRef.current.emit('typing_stop', { conversationId: activeConv.id })

    setInputText('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  Load older messages
  // ─────────────────────────────────────────────────────────────
  async function loadOlderMessages() {
    if (!activeConv || !hasMore || !nextCursor || loadingOlder) return
    await loadMessages(activeConv.id, nextCursor)
  }

  // ─────────────────────────────────────────────────────────────
  //  Cleanup on unmount
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (activeConv && socketRef.current) {
        socketRef.current.emit('leave_conversation', activeConv.id)
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      if (myTypingTimer.current) clearTimeout(myTypingTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─────────────────────────────────────────────────────────────
  //  Filtered conversations
  // ─────────────────────────────────────────────────────────────
  const filteredConvs = conversations.filter((c) => {
    if (!search.trim()) return true
    const name = `${c.otherProfile?.firstName ?? ''} ${c.otherProfile?.lastName ?? ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  // ─────────────────────────────────────────────────────────────
  //  Group messages by date
  // ─────────────────────────────────────────────────────────────
  const groupedMessages: { dateKey: string; dateLabel: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const key = getDateKey(msg.createdAt)
    const existing = groupedMessages.find((g) => g.dateKey === key)
    if (existing) {
      existing.messages.push(msg)
    } else {
      groupedMessages.push({ dateKey: key, dateLabel: formatDateDivider(msg.createdAt), messages: [msg] })
    }
  }

  const myProfileId = myProfileIdRef.current

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Typing animation keyframes */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

      <div
        className="flex rounded-2xl overflow-hidden border border-[#F0E4D0] bg-white"
        style={{
          height: 'calc(100vh - 100px)',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {/* ══════════════════════════════════════════
            LEFT PANEL — conversations list
        ══════════════════════════════════════════ */}
        <div
          className="flex flex-col flex-shrink-0 border-r border-[#F0E4D0]"
          style={{ width: 320 }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-[#F0E4D0]">
            <h2
              className="font-bold text-[#2A1A1A] text-lg mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Inbox
            </h2>
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A8A7A]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#F0E4D0] text-sm text-[#2A1A1A] placeholder:text-[#9A8A7A] focus:outline-none focus:border-[#F4A435] bg-[#FFFBF7] transition-colors"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div
                  className="w-6 h-6 rounded-full border-2 border-[#F4A435] border-t-transparent animate-spin"
                />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm text-[#7A6A5A] font-medium">No conversations yet</p>
                <p className="text-xs text-[#9A8A7A] mt-1">
                  Accept a match request to start chatting
                </p>
                <Link
                  href="/dashboard/matches"
                  className="mt-4 text-xs text-[#E8735A] font-semibold no-underline hover:underline"
                >
                  View Matches →
                </Link>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const isActive = activeConv?.id === conv.id
                const other = conv.otherProfile
                const name = other
                  ? `${other.firstName} ${other.lastName}`
                  : 'Unknown'
                const preview = conv.lastMessage
                  ? conv.lastMessage.content
                  : 'No messages yet'

                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-none bg-transparent"
                    style={{
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(244,164,53,0.08), rgba(232,115,90,0.05))'
                        : undefined,
                      borderLeft: isActive ? '3px solid #F4A435' : '3px solid transparent',
                    }}
                  >
                    <Avatar
                      photo={other?.photo ?? null}
                      name={other ? initials(other.firstName, other.lastName) : '??'}
                      size={44}
                      isOnline={other?.isOnline ?? false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`text-sm truncate ${
                            conv.unreadCount > 0
                              ? 'font-bold text-[#2A1A1A]'
                              : 'font-medium text-[#2A1A1A]'
                          }`}
                        >
                          {name}
                        </span>
                        <span className="text-[10px] text-[#9A8A7A] flex-shrink-0 ml-1">
                          {conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs truncate max-w-[170px] ${
                            conv.unreadCount > 0
                              ? 'text-[#2A1A1A] font-medium'
                              : 'text-[#9A8A7A]'
                          }`}
                        >
                          {truncate(preview, 50)}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 ml-1 min-w-[18px] h-[18px] rounded-full bg-[#F4A435] text-white text-[9px] font-bold flex items-center justify-center px-1">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — chat area
        ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConv ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
                style={{ background: 'linear-gradient(135deg, #FFF3E0, #FFE8CC)' }}
              >
                💬
              </div>
              <h3
                className="font-bold text-[#2A1A1A] text-xl mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Select a conversation
              </h3>
              <p className="text-sm text-[#7A6A5A] max-w-xs leading-relaxed">
                Choose a conversation from the left to start chatting with your matches.
              </p>
            </div>
          ) : (
            <>
              {/* ── Top bar ── */}
              <div
                className="flex items-center gap-3 px-5 py-3 border-b border-[#F0E4D0] bg-white flex-shrink-0"
                style={{ minHeight: 64 }}
              >
                <Avatar
                  photo={activeConv.otherProfile?.photo ?? null}
                  name={
                    activeConv.otherProfile
                      ? initials(activeConv.otherProfile.firstName, activeConv.otherProfile.lastName)
                      : '??'
                  }
                  size={40}
                  isOnline={activeConv.otherProfile?.isOnline ?? false}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#2A1A1A] text-sm">
                    {activeConv.otherProfile
                      ? `${activeConv.otherProfile.firstName} ${activeConv.otherProfile.lastName}`
                      : 'Unknown'}
                  </div>
                  <div className="text-xs text-[#9A8A7A] flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: activeConv.otherProfile?.isOnline ? '#4ade80' : '#D1C4B8',
                      }}
                    />
                    {activeConv.otherProfile?.isOnline ? 'Online now' : 'Offline'}
                  </div>
                </div>
                {activeConv.otherProfile && (
                  <Link
                    href={`/dashboard/profile/${activeConv.otherProfile.id}`}
                    className="text-xs font-semibold text-[#E8735A] no-underline hover:underline flex-shrink-0"
                  >
                    View Profile →
                  </Link>
                )}
              </div>

              {/* ── Messages area ── */}
              <div
                ref={messagesAreaRef}
                className="flex-1 overflow-y-auto px-4 py-4"
                style={{ background: '#FFF8F2' }}
              >
                {/* Load older button */}
                {hasMore && (
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={loadOlderMessages}
                      disabled={loadingOlder}
                      className="text-xs text-[#E8735A] font-semibold px-4 py-1.5 rounded-full border border-[#E8735A]/30 bg-white hover:bg-[#FFF3E0] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {loadingOlder ? 'Loading…' : 'Load older messages'}
                    </button>
                  </div>
                )}

                {msgsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 rounded-full border-2 border-[#F4A435] border-t-transparent animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="text-4xl mb-3">👋</div>
                    <p className="text-sm text-[#7A6A5A] font-medium">
                      Say hello to{' '}
                      {activeConv.otherProfile
                        ? activeConv.otherProfile.firstName
                        : 'your match'}
                      !
                    </p>
                    <p className="text-xs text-[#9A8A7A] mt-1">
                      This is the beginning of your conversation.
                    </p>
                  </div>
                ) : (
                  groupedMessages.map((group) => (
                    <div key={group.dateKey}>
                      {/* Date divider */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[#F0E4D0]" />
                        <span className="text-[10px] text-[#9A8A7A] font-medium px-2 py-0.5 rounded-full bg-[#F0E4D0]">
                          {group.dateLabel}
                        </span>
                        <div className="flex-1 h-px bg-[#F0E4D0]" />
                      </div>

                      {/* Messages */}
                      {group.messages.map((msg) => {
                        const isMine = myProfileId !== null && msg.senderId === myProfileId

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 mb-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {/* Avatar for received messages */}
                            {!isMine && (
                              <Avatar
                                photo={msg.sender.photos[0]?.imageUrl ?? null}
                                name={initials(msg.sender.firstName, msg.sender.lastName)}
                                size={28}
                              />
                            )}

                            <div
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}
                            >
                              {msg.isDeleted ? (
                                <div
                                  className="px-3 py-2 rounded-2xl text-xs italic"
                                  style={{
                                    background: '#F5F0EB',
                                    color: '#9A8A7A',
                                    border: '1px solid #F0E4D0',
                                  }}
                                >
                                  This message was deleted
                                </div>
                              ) : (
                                <div
                                  className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                                  style={
                                    isMine
                                      ? {
                                          background: 'linear-gradient(135deg, #F4A435, #E8735A)',
                                          color: '#fff',
                                          borderBottomRightRadius: 4,
                                        }
                                      : {
                                          background: '#fff',
                                          color: '#2A1A1A',
                                          border: '1px solid #F0E4D0',
                                          borderBottomLeftRadius: 4,
                                        }
                                  }
                                >
                                  {msg.content}
                                </div>
                              )}
                              <span className="text-[10px] text-[#9A8A7A] mt-0.5 px-1">
                                {formatMessageTime(msg.createdAt)}
                                {isMine && msg.readAt && (
                                  <span className="ml-1 text-[#4ade80]">✓✓</span>
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex items-end gap-2 mb-2">
                    <Avatar
                      photo={activeConv.otherProfile?.photo ?? null}
                      name={
                        activeConv.otherProfile
                          ? initials(activeConv.otherProfile.firstName, activeConv.otherProfile.lastName)
                          : '??'
                      }
                      size={28}
                    />
                    <div
                      className="rounded-2xl rounded-bl-sm"
                      style={{
                        background: '#fff',
                        border: '1px solid #F0E4D0',
                      }}
                    >
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Input bar ── */}
              <div
                className="flex items-end gap-3 px-4 py-3 border-t border-[#F0E4D0] bg-white flex-shrink-0"
              >
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    className="w-full px-4 py-2.5 pr-12 rounded-2xl border border-[#F0E4D0] text-sm text-[#2A1A1A] placeholder:text-[#9A8A7A] focus:outline-none focus:border-[#F4A435] resize-none transition-colors leading-relaxed"
                    style={{
                      minHeight: 44,
                      maxHeight: 120,
                      background: '#FFFBF7',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  />
                  {inputText.length > 200 && (
                    <span
                      className="absolute bottom-2 right-3 text-[10px]"
                      style={{
                        color: inputText.length > 1900 ? '#E8735A' : '#9A8A7A',
                      }}
                    >
                      {inputText.length}/2000
                    </span>
                  )}
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border-none"
                  style={{
                    background: inputText.trim()
                      ? 'linear-gradient(135deg, #F4A435, #E8735A)'
                      : '#F0E4D0',
                  }}
                  aria-label="Send message"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={inputText.trim() ? '#fff' : '#9A8A7A'}
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
