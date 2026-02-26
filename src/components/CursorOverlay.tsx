'use client'

import { useEffect, useState } from 'react'
import type { CollaboratorPresence } from '@/hooks/useCollaboration'

interface CursorOverlayProps {
  collaborators: CollaboratorPresence[]
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  content: string
}

interface CursorPixelPosition {
  x: number
  y: number
  collaborator: CollaboratorPresence
}

export function CursorOverlay({ collaborators, textareaRef, content }: CursorOverlayProps) {
  const [cursorPositions, setCursorPositions] = useState<CursorPixelPosition[]>([])
  const [scrollTop, setScrollTop] = useState(0)

  // Listen to textarea scroll to reposition cursors
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleScroll = () => setScrollTop(textarea.scrollTop)
    textarea.addEventListener('scroll', handleScroll)
    return () => textarea.removeEventListener('scroll', handleScroll)
  }, [textareaRef])

  // Recompute pixel positions when collaborators, content, or scroll change
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const style = window.getComputedStyle(textarea)
    const fontSize = parseFloat(style.fontSize)
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5
    const paddingTop = parseFloat(style.paddingTop)
    const paddingLeft = parseFloat(style.paddingLeft)

    // Measure character width using a canvas (monospace font)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.font = `${fontSize}px ${style.fontFamily}`
    const charWidth = ctx.measureText('M').width

    const lines = content.split('\n')
    const positions: CursorPixelPosition[] = []

    for (const collaborator of collaborators) {
      if (!collaborator.cursor) continue
      const { line, col } = collaborator.cursor
      if (line < 1 || line > lines.length + 1) continue

      positions.push({
        x: paddingLeft + col * charWidth,
        y: paddingTop + (line - 1) * lineHeight - scrollTop,
        collaborator,
      })
    }

    setCursorPositions(positions)
  }, [collaborators, content, textareaRef, scrollTop])

  if (!textareaRef.current) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 10 }}
    >
      {cursorPositions.map(({ x, y, collaborator }) => {
        // Don't render if scrolled out of view
        if (y < -30 || y > (textareaRef.current?.clientHeight ?? 9999)) return null

        return (
          <div
            key={collaborator.userId}
            className="absolute flex flex-col items-start transition-all duration-100"
            style={{ left: x, top: y }}
          >
            {/* Cursor line */}
            <div
              className="w-0.5 rounded-full animate-pulse"
              style={{
                height: '1.4em',
                backgroundColor: collaborator.color,
              }}
            />
            {/* Name label */}
            <div
              className="text-white px-1.5 py-0.5 rounded-sm whitespace-nowrap -mt-6 ml-1.5 shadow-lg"
              style={{
                backgroundColor: collaborator.color,
                fontSize: '10px',
                fontFamily: 'system-ui, sans-serif',
                lineHeight: '1.2',
              }}
            >
              {collaborator.displayName}
            </div>
          </div>
        )
      })}
    </div>
  )
}
