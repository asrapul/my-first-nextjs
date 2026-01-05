'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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
  } catch (error) {
    console.error('Error saving messages to localStorage:', error)
  }
}

const loadMessagesFromStorage = (): Message[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const storedMessages: StoredMessage[] = JSON.parse(stored)
    return storedMessages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
  } catch (error) {
    console.error('Error loading messages from localStorage:', error)
    return null
  }
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([welcomeMessage])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio on client side
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3')
    audioRef.current.volume = 0.5
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(err => {
        console.log('Audio play failed:', err)
      })
    }
  }, [])

  // Load messages from localStorage on mount
  useEffect(() => {
    const storedMessages = loadMessagesFromStorage()
    if (storedMessages && storedMessages.length > 0) {
      setMessages(storedMessages)
    }
    setIsHydrated(true)
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      saveMessagesToStorage(messages)
    }
  }, [messages, isHydrated])

  // Auto-scroll to bottom when new message arrives
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
  const simulateBotReply = useCallback(() => {
    setIsTyping(true)

    // Random delay between 1-3 seconds
    const delay = Math.random() * 2000 + 1000

    setTimeout(() => {
      setIsTyping(false)
      
      const botMessage: Message = {
        id: Date.now(),
        text: getRandomResponse(),
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      
      // Play notification sound when bot replies
      playNotificationSound()
    }, delay)
  }, [playNotificationSound])

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Trigger bot reply
    simulateBotReply()
  }, [inputValue, simulateBotReply])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  // Clear chat history
  const handleClearChat = () => {
    setMessages([welcomeMessage])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <>
      {/* Chat Window */}
      <div
        className={`fixed z-50 bg-[#2a1a1e] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#6B4C52] transition-all duration-300 ease-out
          /* Desktop: positioned above floating button */
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
        <div className="bg-gradient-to-r from-[#3d2629] to-[#452829] text-white p-4 flex justify-between items-center border-b border-[#6B4C52]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#E8D4D8]/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Image/bot-avatar.jpg"
                alt="Asrap Bot"
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h3 className="font-semibold text-[#E8D4D8]">Asrap Bot</h3>
              <p className="text-xs text-[#D4B8BE]/70">
                {isTyping ? 'Sedang mengetik...' : 'Online • Siap membantu'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              className="hover:bg-[#6B4C52]/50 rounded-full p-2 transition-colors text-[#E8D4D8]/70 hover:text-[#E8D4D8] cursor-pointer text-sm"
              aria-label="Clear chat"
              title="Hapus riwayat chat"
            >
              🗑️
            </button>
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-[#6B4C52]/50 rounded-full p-2 transition-colors text-[#E8D4D8] cursor-pointer"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#1a1215] space-y-4">
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
                    <div className="w-7 h-7 rounded-full bg-[#E8D4D8] text-[#2a1a1e] flex items-center justify-center text-sm flex-shrink-0">
                      👤
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[#6B4C52]">
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
                        ? 'bg-[#E8D4D8] text-[#2a1a1e] rounded-br-md'
                        : 'bg-[#3d2629] text-[#E8D4D8] rounded-bl-md border border-[#6B4C52]'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
                
                {/* Timestamp */}
                <span className={`text-[10px] text-[#D4B8BE]/50 mt-1 ${msg.sender === 'user' ? 'mr-9' : 'ml-9'}`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[#6B4C52]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/Image/bot-avatar.jpg"
                    alt="Bot typing"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="bg-[#3d2629] border border-[#6B4C52] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#E8D4D8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-[#E8D4D8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-[#E8D4D8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#6B4C52] bg-[#2a1a1e]">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan..."
              disabled={isTyping}
              className="flex-1 px-4 py-3 bg-[#1a1215] border border-[#6B4C52] rounded-full text-white placeholder-[#D4B8BE]/50 focus:outline-none focus:ring-2 focus:ring-[#E8D4D8]/50 focus:border-transparent transition disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="bg-[#E8D4D8] text-[#2a1a1e] px-4 py-3 rounded-full hover:bg-[#D4B8BE] transition-colors font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button - hidden on mobile when chat is open */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-[#E8D4D8] text-[#2a1a1e] rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 flex items-center justify-center text-2xl z-50 cursor-pointer
          ${isOpen ? 'max-sm:hidden' : 'animate-pulse hover:animate-none'}
        `}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  )
}
