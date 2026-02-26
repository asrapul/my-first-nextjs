'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface DocumentRow {
  id: string
  content: string
  title: string
  user_id: string
  updated_at: string
}

export function useRealtimeDocument(
  documentId: string,
  onUpdate: (content: string) => void
) {
  useEffect(() => {
    // Only subscribe if we have a valid document ID
    if (!documentId) return

    const channel = supabase
      .channel(`document:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${documentId}`
        },
        (payload: RealtimePostgresChangesPayload<DocumentRow>) => {
          const newRecord = payload.new as DocumentRow
          if (newRecord && typeof newRecord.content === 'string') {
            onUpdate(newRecord.content)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [documentId, onUpdate])
}
