'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from './ThemeProvider'

interface Message {
  role: 'user' | 'assistant'
  content: string
  functionCall?: { name: string; args: Record<string, unknown> }
}

interface Props {
  documentContent: string
  onDocumentUpdate: (newContent: string) => void
}

export default function AIChat({ documentContent, onDocumentUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ data: string; type: string; name: string } | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file size (max 10MB for all files)
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFile({
        data: reader.result as string,
        type: file.type,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  }

  async function sendMessage() {
    if ((!input.trim() && !selectedFile) || isLoading) return
    
    setIsLoading(true)
    const userMessage: Message = { 
        role: 'user', 
        content: input || (selectedFile ? `[Attached file: ${selectedFile.name}]` : '') 
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          documentContent,
          file: selectedFile
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle Rate Limiting (429) specifically
        if (response.status === 429) {
             throw new Error('✨ You reached the free usage limit. Please wait a minute and try again.')
        }

        // Handle nested error objects from Google API
        const errorMessage = errorData.error?.message || errorData.details || 'Chat API failed'
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      // If AI updated the document, apply the change
      if (data.newDocumentContent) {
        onDocumentUpdate(data.newDocumentContent)
      }
      
      setMessages(prev => [...prev, data.message])
      setSelectedFile(null) // Clear file after send
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-xl backdrop-blur-sm shadow-sm border ${
              msg.role === 'user' 
                ? (isDark 
                    ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-white/10' 
                    : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-violet-200')
                : (isDark
                    ? 'bg-white/10 text-white/90 border-white/5'
                    : 'bg-white/60 text-gray-800 border-white/50')
            }`}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.functionCall && (
                <div className={`mt-2 text-xs font-mono py-1 px-2 rounded ${
                   isDark ? 'bg-black/30 text-emerald-400' : 'bg-gray-100 text-emerald-600'
                }`}>
                  🔧 Executed: {msg.functionCall.name}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/50'}`}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>AI is thinking...</span>
             </div>
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <div className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center ${
               isDark ? 'bg-white/5' : 'bg-white/50'
            }`}>
              <svg className={`w-8 h-8 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>How can I help you today?</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              Try &quot;Change line 1 to Hello World&quot;
            </p>
          </div>
        )}
      </div>
      
      {/* File Preview */}
      {selectedFile && (
        <div className={`px-4 py-2 border-t text-sm flex justify-between items-center ${
           isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-blue-50/50 border-blue-100 text-gray-700'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                <span className="text-lg">📎</span>
            </div>
            <div className="flex flex-col">
                <span className="font-medium text-xs line-clamp-1 max-w-[200px]">{selectedFile.name}</span>
                <span className="opacity-60 text-[10px] uppercase">{selectedFile.type.split('/')[1] || 'FILE'}</span>
            </div>
          </div>
          <button 
            onClick={() => setSelectedFile(null)}
            className="text-white/50 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Input */}
      <div className={`p-4 border-t backdrop-blur-md ${
         isDark ? 'bg-black/20 border-white/10' : 'bg-white/30 border-white/40'
      }`}>
        <div className="flex gap-2 mb-2">
          <label className={`px-3 py-1.5 rounded-lg cursor-pointer text-xs font-medium flex items-center gap-2 transition-all hover:scale-105 ${
             isDark 
               ? 'bg-white/10 text-white/70 hover:bg-white/20' 
               : 'bg-white/70 text-gray-600 hover:bg-white border border-white/50'
          }`}>
            <span>📎</span> Attach File
            <input 
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.txt,.md,.doc,.docx"
            />
          </label>
        </div>
        
        <div className="relative">
          <textarea 
            className={`w-full p-4 pr-12 rounded-2xl resize-none focus:outline-none focus:ring-2 transition-all ${
               isDark 
                 ? 'bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-violet-500/50 focus:bg-white/10' 
                 : 'bg-white/60 border border-white/60 text-gray-800 placeholder-gray-400 focus:ring-violet-500/30 focus:bg-white/80 shadow-sm'
            }`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask AI to edit the document..."
            rows={2}
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || (!input.trim() && !selectedFile)}
            className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all ${
               input.trim() || selectedFile
                 ? (isDark 
                     ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:scale-110 shadow-lg' 
                     : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:scale-110 shadow-lg')
                 : (isDark 
                     ? 'bg-white/10 text-white/20 cursor-not-allowed' 
                     : 'bg-gray-200 text-gray-400 cursor-not-allowed')
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
