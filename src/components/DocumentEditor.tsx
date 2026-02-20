'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from './ThemeProvider'

interface Props {
  content: string
  onChange: (content: string) => void
}

export default function DocumentEditor({ content, onChange }: Props) {
  const { theme } = useTheme()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  
  // Calculate line numbers
  const lines = content.split('\n')
  const lineNumbers = lines.map((_, i) => i + 1).join('\n')
  
  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

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
      
      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none bg-transparent transition-colors ${
          theme === 'dark' 
            ? 'text-white/90 placeholder-white/30 selection:bg-violet-500/30' 
            : 'text-gray-800 placeholder-gray-400 selection:bg-violet-200/50'
        }`}
        style={{ lineHeight: '1.75rem', fontFamily: '"JetBrains Mono", monospace' }}
        placeholder="# Start your masterpiece here...
        
Ask the AI to help you write, edit, or brainstorm!"
        spellCheck={false}
      />
    </div>
  )
}
