'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAutoSave(documentId: string, content: string) {
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const savedContentRef = useRef(content)
  const timeoutRef = useRef<NodeJS.Timeout>(undefined) // Using undefined for initial timeout cleanup

  useEffect(() => {
    // Skip if content matches last saved version
    if (content === savedContentRef.current) {
        setStatus('saved')
        return
    }

    setStatus('unsaved') // Visually indicate waiting to save

    // Cleanup previous timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce save (2 seconds)
    timeoutRef.current = setTimeout(async () => {
      setStatus('saving')
      try {
        const { error } = await supabase
          .from('documents')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', documentId)
        
        if (error) throw error

        savedContentRef.current = content
        setStatus('saved')
      } catch (error) {
        console.error('Error auto-saving:', error)
        setStatus('unsaved')
      }
    }, 2000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [documentId, content])

  return status
}
