'use client'

// socket.io-client is installed: socket.io-client@^4.8.3
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Returns a connected Socket.IO singleton.
 * Calling this multiple times with the same token returns the cached socket.
 * Call disconnectSocket() before calling getSocket() with a new token.
 */
export function getSocket(token: string): Socket {
  if (socket && socket.connected) {
    return socket
  }

  // Disconnect any stale socket before creating a new one
  if (socket) {
    socket.disconnect()
    socket = null
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

  socket = io(apiUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  })

  socket.on('connect', () => {
    console.log('[socket] connected:', socket?.id)
  })

  socket.on('connect_error', (err: Error) => {
    console.error('[socket] connection error:', err.message)
  })

  socket.on('disconnect', (reason: string) => {
    console.log('[socket] disconnected:', reason)
  })

  return socket
}

/**
 * Disconnects and clears the singleton.
 * Call this on logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Returns the current socket instance without creating one,
 * or null if not connected.
 */
export function getActiveSocket(): Socket | null {
  return socket
}
