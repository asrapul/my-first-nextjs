'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from './ThemeProvider'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

// Storage interface for localStorage
interface StoredMessage {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: string
}

const STORAGE_KEY = 'asrap_bot_messages'

// Theme colors for ChatWidget
const themes = {
  dark: {
    chatBg: 'bg-[#2a1a1e]',
    headerGradient: 'bg-gradient-to-r from-[#3d2629] to-[#452829]',
    headerBorder: 'border-[#6B4C52]',
    headerTitle: 'text-[#E8D4D8]',
    headerSubtitle: 'text-[#D4B8BE]/70',
    messagesBg: 'bg-[#1a1215]',
    userBubble: 'bg-[#E8D4D8] text-[#2a1a1e]',
    userAvatar: 'bg-[#E8D4D8] text-[#2a1a1e]',
    botBubble: 'bg-[#3d2629] text-[#E8D4D8] border border-[#6B4C52]',
    botAvatarRing: 'ring-[#6B4C52]',
    timestamp: 'text-[#D4B8BE]/50',
    inputBg: 'bg-[#1a1215]',
    inputBorder: 'border-[#6B4C52]',
    inputText: 'text-white placeholder-[#D4B8BE]/50',
    inputFocus: 'focus:ring-[#E8D4D8]/50',
    inputAreaBg: 'bg-[#2a1a1e]',
    sendBtn: 'bg-[#E8D4D8] text-[#2a1a1e] hover:bg-[#D4B8BE]',
    floatBtn: 'bg-[#E8D4D8] text-[#2a1a1e]',
    headerBtn: 'hover:bg-[#6B4C52]/50 text-[#E8D4D8]/70 hover:text-[#E8D4D8]',
    closeBtn: 'hover:bg-[#6B4C52]/50 text-[#E8D4D8]',
    typingDots: 'bg-[#E8D4D8]',
    borderColor: 'border-[#6B4C52]',
  },
  light: {
    chatBg: 'bg-white',
    headerGradient: 'bg-gradient-to-r from-[#667eea] to-[#764ba2]',
    headerBorder: 'border-[#e0e0e0]',
    headerTitle: 'text-white',
    headerSubtitle: 'text-white/80',
    messagesBg: 'bg-gray-50',
    userBubble: 'bg-[#667eea] text-white',
    userAvatar: 'bg-[#667eea] text-white',
    botBubble: 'bg-white text-gray-800 border border-gray-200 shadow-sm',
    botAvatarRing: 'ring-gray-200',
    timestamp: 'text-gray-400',
    inputBg: 'bg-white',
    inputBorder: 'border-gray-300',
    inputText: 'text-gray-800 placeholder-gray-400',
    inputFocus: 'focus:ring-[#667eea]/50',
    inputAreaBg: 'bg-white',
    sendBtn: 'bg-[#667eea] text-white hover:bg-[#5a6fd6]',
    floatBtn: 'bg-[#667eea] text-white',
    headerBtn: 'hover:bg-white/20 text-white/70 hover:text-white',
    closeBtn: 'hover:bg-white/20 text-white',
    typingDots: 'bg-[#667eea]',
    borderColor: 'border-gray-200',
  }
}

// Default welcome message
const welcomeMessage: Message = {
  id: 1,
  text: 'Halo! Saya Asrap Bot 🤖 Ada yang bisa saya bantu tentang Andi Asyraful? Tanyakan saja tentang skill, pengalaman, atau proyek-proyek saya!',
  sender: 'bot',
  timestamp: new Date()
}

// Bot responses array for random replies
const botResponses = [
  "Terima kasih sudah bertanya! Andi Asyraful adalah seorang developer RPL dengan keahlian di web development, software engineering, dan cyber security. 🚀",
  "Andi memiliki pengalaman mengikuti berbagai lomba IT dan aktif di komunitas teknologi di Indonesia. 💻",
  "Skill utama Andi meliputi JavaScript, TypeScript, React, Next.js, dan berbagai teknologi web modern lainnya! 🔥",
  "Andi adalah siswa kelas 12 SMK Telkom Makassar dengan passion besar di bidang teknologi informasi. 📚",
  "Visi Andi adalah mencapai kebebasan finansial di usia muda dan memberikan dampak positif bagi masyarakat Indonesia. ✨",
  "Andi tertarik dengan sistem kuliah sambil bekerja, dan sedang mempertimbangkan melanjutkan studi di Indonesia atau Jerman. 🌍",
  "Untuk menghubungi Andi, silakan gunakan link di bagian footer website ini - GitHub, LinkedIn, atau Email! 📧",
  "Andi mendapatkan bimbingan dari software engineer berpengalaman dan terus mengembangkan skill-nya setiap hari. 📈",
]

// Function to get random bot response
const getRandomResponse = (): string => {
  const randomIndex = Math.floor(Math.random() * botResponses.length)
  return botResponses[randomIndex]
}

// Helper functions for localStorage
const saveMessagesToStorage = (messages: Message[]) => {
  try {
    const storedMessages: StoredMessage[] = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString()
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedMessages))
  } catch {
    console.warn('Failed to save messages to localStorage')
  }
}

const loadMessagesFromStorage = (): Message[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const storedMessages: StoredMessage[] = JSON.parse(stored)
      return storedMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }
  } catch {
    console.warn('Failed to load messages from localStorage')
  }
  return null
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([welcomeMessage])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Use global theme from ThemeProvider
  const { theme } = useTheme()

  // Get current theme colors
  const t = themes[theme]

  // Initialize audio on client side
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3')
    audioRef.current.volume = 0.5
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Autoplay might be blocked, ignore error
      })
    }
  }, [])

  // Load messages from localStorage on mount (client-side only)
  useEffect(() => {
    const savedMessages = loadMessagesFromStorage()
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages)
    }
    setIsHydrated(true)
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      saveMessagesToStorage(messages)
    }
  }, [messages, isHydrated])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Simulate bot reply with typing indicator
  const addBotReply = useCallback(() => {
    setIsTyping(true)
    
    // Random delay between 1-2 seconds
    const delay = 1000 + Math.random() * 1000
    
    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now(),
        text: getRandomResponse(),
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
      
      // Play notification sound when bot replies
      playNotificationSound()
    }, delay)
  }, [playNotificationSound])

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isTyping) return
    
    const userMessage: Message = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    
    // Trigger bot reply
    addBotReply()
  }, [inputValue, isTyping, addBotReply])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend()
    }
  }

  // Clear chat history
  const handleClearChat = () => {
    setMessages([welcomeMessage])
  }

  // Don't render until client-side hydration is complete to avoid mismatch
  if (!isHydrated) {
    return null
  }

  return (
    <>
      {/* Chat Window */}
      <div
        className={`fixed z-50 ${t.chatBg} rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out
          /* Large screens: floating window */
          bottom-24 right-6 w-[380px] h-[520px]
          /* Mobile: full screen */
          max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:top-0 max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:border-0
          ${
            isOpen
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
      >
        {/* Header */}
        <div className={`${t.headerGradient} text-white p-4 flex justify-between items-center border-b ${t.headerBorder}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full overflow-hidden ring-2 ${theme === 'dark' ? 'ring-[#E8D4D8]/30' : 'ring-white/30'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Image/bot-avatar.jpg"
                alt="Asrap Bot"
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h3 className={`font-semibold ${t.headerTitle}`}>Asrap Bot</h3>
              <p className={`text-xs ${t.headerSubtitle}`}>
                {isTyping ? 'Sedang mengetik...' : 'Online • Siap membantu'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              className={`${t.headerBtn} rounded-full p-2 transition-colors cursor-pointer text-sm`}
              aria-label="Clear chat"
              title="Hapus riwayat chat"
            >
              🗑️
            </button>
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className={`${t.closeBtn} rounded-full p-2 transition-colors cursor-pointer`}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto p-4 ${t.messagesBg} space-y-4`}>
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {/* Avatar and Message */}
                <div className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {msg.sender === 'user' ? (
                    <div className={`w-7 h-7 rounded-full ${t.userAvatar} flex items-center justify-center text-sm flex-shrink-0`}>
                      👤
                    </div>
                  ) : (
                    <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ${t.botAvatarRing}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/Image/bot-avatar.jpg"
                        alt="Bot"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? `${t.userBubble} rounded-br-md`
                        : `${t.botBubble} rounded-bl-md`
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
                
                {/* Timestamp */}
                <span className={`text-[10px] ${t.timestamp} mt-1 ${msg.sender === 'user' ? 'mr-9' : 'ml-9'}`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ${t.botAvatarRing}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/Image/bot-avatar.jpg"
                    alt="Bot typing"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className={`${t.botBubble} rounded-2xl rounded-bl-md px-4 py-3`}>
                  <div className="flex gap-1">
                    <span className={`w-2 h-2 ${t.typingDots} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                    <span className={`w-2 h-2 ${t.typingDots} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                    <span className={`w-2 h-2 ${t.typingDots} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${t.borderColor} ${t.inputAreaBg}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan..."
              disabled={isTyping}
              className={`flex-1 px-4 py-3 ${t.inputBg} border ${t.inputBorder} rounded-full ${t.inputText} focus:outline-none focus:ring-2 ${t.inputFocus} focus:border-transparent transition disabled:opacity-50`}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`${t.sendBtn} px-4 py-3 rounded-full transition-colors font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button - hidden on mobile when chat is open */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 ${t.floatBtn} rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 flex items-center justify-center text-2xl z-50 cursor-pointer
          ${isOpen ? 'max-sm:hidden' : 'animate-pulse hover:animate-none'}
        `}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  )
}
