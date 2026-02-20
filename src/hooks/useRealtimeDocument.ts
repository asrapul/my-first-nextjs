'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

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
        (payload: any) => {
          // Verify payload structure just to be safe
          if (payload.new && typeof payload.new.content === 'string') {
            onUpdate(payload.new.content)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [documentId, onUpdate])
}
