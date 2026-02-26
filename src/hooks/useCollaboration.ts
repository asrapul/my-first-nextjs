'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Type for each online collaborator
export interface CollaboratorPresence {
  userId: string
  displayName: string
  color: string
  cursor: {
    line: number
    col: number
  } | null
  lastSeen: string
}

const COLLABORATOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
]

function getColorForIndex(index: number): string {
  return COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length]
}

interface UseCollaborationOptions {
  documentId: string
  userId: string
  displayName: string
  onContentChange?: (newContent: string, fromUserId: string) => void
}

export function useCollaboration({
  documentId,
  userId,
  displayName,
  onContentChange,
}: UseCollaborationOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const myColor = useRef<string>(COLLABORATOR_COLORS[0])
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const onContentChangeRef = useRef(onContentChange)
  onContentChangeRef.current = onContentChange

  const broadcastContentChange = useCallback((newContent: string) => {
    if (!channelRef.current || !isConnected) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'content_change',
      payload: { content: newContent, userId, timestamp: Date.now() },
    })
  }, [userId, isConnected])

  const updateCursor = useCallback((line: number, col: number) => {
    if (!channelRef.current || !isConnected) return
    channelRef.current.track({
      userId,
      displayName,
      color: myColor.current,
      cursor: { line, col },
      lastSeen: new Date().toISOString(),
    })
  }, [userId, displayName, isConnected])

  useEffect(() => {
    if (!documentId || !userId) return

    const channel = supabase.channel(`document:${documentId}`, {
      config: {
        presence: { key: userId },
        broadcast: { self: false },
      },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<CollaboratorPresence>()
      const allUsers = Object.values(state).map((entries) => entries[0])
      const others = allUsers.filter((u) => u.userId !== userId)

      // Assign colors based on join order
      const allSorted = [...allUsers].sort(
        (a, b) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
      )
      const myIndex = allSorted.findIndex((u) => u.userId === userId)
      if (myIndex >= 0) myColor.current = getColorForIndex(myIndex)

      setCollaborators(others)
    })

    channel.on('broadcast', { event: 'content_change' }, ({ payload }) => {
      if (payload.userId === userId) return

      // Typing indicator
      setTypingUsers((prev) =>
        prev.includes(payload.userId) ? prev : [...prev, payload.userId]
      )
      clearTimeout(typingTimersRef.current[payload.userId])
      typingTimersRef.current[payload.userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== payload.userId))
      }, 2000)

      if (onContentChangeRef.current) {
        onContentChangeRef.current(payload.content, payload.userId)
      }
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        await channel.track({
          userId,
          displayName,
          color: myColor.current,
          cursor: null,
          lastSeen: new Date().toISOString(),
        })
      }
    })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      setIsConnected(false)
      setCollaborators([])
      setTypingUsers([])
      // Clear typing timers
      Object.values(typingTimersRef.current).forEach(clearTimeout)
      typingTimersRef.current = {}
    }
  }, [documentId, userId, displayName]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    collaborators,
    typingUsers,
    isConnected,
    myColor: myColor.current,
    broadcastContentChange,
    updateCursor,
  }
}
