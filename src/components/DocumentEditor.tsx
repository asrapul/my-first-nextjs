'use client'

import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useTheme } from './ThemeProvider'
import { CursorOverlay } from './CursorOverlay'
import type { CollaboratorPresence } from '@/hooks/useCollaboration'

interface Props {
  content: string
  onChange: (content: string) => void
  collaborators?: CollaboratorPresence[]
  onCursorMove?: (line: number, col: number) => void
}

export interface DocumentEditorHandle {
  getTextarea: () => HTMLTextAreaElement | null
}

function getCursorPosition(textarea: HTMLTextAreaElement): { line: number; col: number } {
  const value = textarea.value
  const selectionStart = textarea.selectionStart ?? 0
  const textBeforeCursor = value.substring(0, selectionStart)
  const lines = textBeforeCursor.split('\n')
  return {
    line: lines.length,
    col: lines[lines.length - 1].length,
  }
}

const DocumentEditor = forwardRef<DocumentEditorHandle, Props>(function DocumentEditor(
  { content, onChange, collaborators = [], onCursorMove },
  ref
) {
  const { theme } = useTheme()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    getTextarea: () => textareaRef.current,
  }))

  // Calculate line numbers
  const lines = content.split('\n')
  const lineNumbers = lines.map((_, i) => i + 1).join('\n')

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleCursorMove = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (!onCursorMove) return
    const textarea = e.target as HTMLTextAreaElement
    const pos = getCursorPosition(textarea)
    onCursorMove(pos.line, pos.col)
  }, [onCursorMove])

  return (
    <div className={`h-full flex ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}>
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className={`w-12 text-right pr-3 py-4 font-mono text-sm select-none overflow-hidden border-r transition-colors ${
          theme === 'dark'
            ? 'border-white/10 text-white/30'
            : 'border-white/20 text-gray-400 bg-white/30 backdrop-blur-sm'
        }`}
        style={{ lineHeight: '1.75rem', fontFamily: '"JetBrains Mono", monospace' }}
      >
        <pre className="text-right">{lineNumbers}</pre>
      </div>

      {/* Editor with cursor overlay */}
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onMouseUp={handleCursorMove}
          onKeyUp={handleCursorMove}
          onSelect={handleCursorMove}
          className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-transparent transition-colors ${
            theme === 'dark'
              ? 'text-white/90 placeholder-white/30 selection:bg-violet-500/30'
              : 'text-gray-800 placeholder-gray-400 selection:bg-violet-200/50'
          }`}
          style={{ lineHeight: '1.75rem', fontFamily: '"JetBrains Mono", monospace' }}
          placeholder={`# Start your masterpiece here...
         
Ask the AI to help you write, edit, or brainstorm!`}
          spellCheck={false}
        />
        <CursorOverlay
          collaborators={collaborators}
          textareaRef={textareaRef}
          content={content}
        />
      </div>
    </div>
  )
})

export default DocumentEditor
