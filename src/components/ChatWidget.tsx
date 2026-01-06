'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from './ThemeProvider'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  reaction?: 'like' | 'dislike' | null
  isPinned?: boolean
}

type Language = 'id' | 'en' | 'es' | 'fr' | 'de' | 'ja'

const STORAGE_KEY = 'asrap_bot_chat_history'
const STORAGE_LANG_KEY = 'asrap_bot_language'

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: 'ID' },
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'ja', name: '日本語', flag: 'JP' },
]

const placeholders: Record<Language, string> = {
  id: 'Ketik pesan...',
  en: 'Type a message...',
  es: 'Escribe un mensaje...',
  fr: 'Tapez un message...',
  de: 'Nachricht eingeben...',
  ja: 'メッセージを入力...',
}

const welcomeMessages: Record<Language, string> = {
  id: 'Halo! Saya Asrap Bot. Ada yang bisa saya bantu? 👋',
  en: 'Hello! I\'m Asrap Bot. How can I help you? 👋',
  es: '¡Hola! Soy Asrap Bot. ¿En qué puedo ayudarte? 👋',
  fr: 'Bonjour! Je suis Asrap Bot. Comment puis-je vous aider? 👋',
  de: 'Hallo! Ich bin Asrap Bot. Wie kann ich Ihnen helfen? 👋',
  ja: 'こんにちは！Asrap Botです。何かお手伝いできますか？ 👋',
}

// Quick reply suggestions
const quickReplies: Record<Language, string[]> = {
  id: ['Siapa Asrap?', 'Skill apa saja?', 'Portfolio', 'Kontak'],
  en: ['Who is Asrap?', 'What skills?', 'Portfolio', 'Contact'],
  es: ['¿Quién es Asrap?', '¿Qué habilidades?', 'Portfolio', 'Contacto'],
  fr: ['Qui est Asrap?', 'Quelles compétences?', 'Portfolio', 'Contact'],
  de: ['Wer ist Asrap?', 'Welche Skills?', 'Portfolio', 'Kontakt'],
  ja: ['Asrapは誰?', 'スキルは?', 'ポートフォリオ', '連絡先'],
}

export default function ChatWidget() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState<Language>('id')
  const [showMenu, setShowMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('/sounds/notification.mp3')
    notificationSoundRef.current.volume = 0.5
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognitionClass) {
        recognitionRef.current = new SpeechRecognitionClass()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = language === 'id' ? 'id-ID' : language === 'ja' ? 'ja-JP' : 'en-US'
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setInputValue(transcript)
          setIsRecording(false)
        }
        
        recognitionRef.current.onerror = () => {
          setIsRecording(false)
        }
        
        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }
      }
    }
  }, [language])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY)
      const savedLang = localStorage.getItem(STORAGE_LANG_KEY)
      
      if (savedLang && ['id', 'en', 'es', 'fr', 'de', 'ja'].includes(savedLang)) {
        setLanguage(savedLang as Language)
      }
      
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages)
        const restored = parsed.map((msg: Message & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(restored)
        setShowQuickReplies(false)
      } else {
        setMessages([{
          id: 1,
          text: welcomeMessages[savedLang as Language || 'id'],
          sender: 'bot',
          timestamp: new Date(),
        }])
      }
    } catch {
      setMessages([{
        id: 1,
        text: welcomeMessages['id'],
        sender: 'bot',
        timestamp: new Date(),
      }])
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when messages change
  useEffect(() => {
    if (isHydrated && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      } catch {
        console.warn('Failed to save chat history')
      }
    }
  }, [messages, isHydrated])

  // Save language preference
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_LANG_KEY, language)
      } catch {
        console.warn('Failed to save language preference')
      }
    }
  }, [language, isHydrated])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0
      notificationSoundRef.current.play().catch(() => {})
    }
  }, [])

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setShowMenu(false)
      setShowLangMenu(false)
    }
    if (showMenu || showLangMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showMenu, showLangMenu])

  // Copy message to clipboard
  const copyToClipboard = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  // Toggle voice recording
  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return
    
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  // React to message
  const reactToMessage = (messageId: number, reaction: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, reaction: msg.reaction === reaction ? null : reaction }
      }
      return msg
    }))
  }

  // Toggle pin message
  const togglePinMessage = (messageId: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, isPinned: !msg.isPinned }
      }
      return msg
    }))
  }

  // Share chat
  const shareChat = async () => {
    const chatContent = messages
      .map((msg) => {
        const sender = msg.sender === 'user' ? 'You' : 'Asrap Bot'
        return `${sender}: ${msg.text}`
      })
      .join('\n\n')

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chat with Asrap Bot',
          text: chatContent,
        })
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(chatContent)
      }
    } else {
      await navigator.clipboard.writeText(chatContent)
    }
    setShowMenu(false)
  }

  // Filter messages by search
  const filteredMessages = searchQuery
    ? messages.filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  // Get pinned messages
  const pinnedMessages = messages.filter(msg => msg.isPinned)

  // Send message to API
  const sendMessageToAI = async (userMessage: string) => {
    try {
      const history = messages.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: history,
          language: language,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to get response')
      return data.message
    } catch (error) {
      console.error('Error calling AI:', error)
      throw error
    }
  }

  // Handle send message
  const handleSend = async (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if (!text || isLoading) return

    setInputValue('')
    setShowQuickReplies(false)

    const userMsg: Message = {
      id: Date.now(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const aiResponse = await sendMessageToAI(text)
      const botMsg: Message = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
      playNotificationSound()
    } catch {
      const errorMessages: Record<Language, string> = {
        id: 'Maaf, terjadi kesalahan. Coba lagi ya! 😅',
        en: 'Sorry, an error occurred. Please try again! 😅',
        es: 'Lo siento, ocurrió un error. ¡Inténtalo de nuevo! 😅',
        fr: 'Désolé, une erreur s\'est produite. Réessayez! 😅',
        de: 'Entschuldigung, ein Fehler ist aufgetreten. Versuchen Sie es erneut! 😅',
        ja: '申し訳ありません、エラーが発生しました。もう一度お試しください！ 😅',
      }
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: errorMessages[language],
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
      playNotificationSound()
    } finally {
      setIsLoading(false)
    }
  }

  // Download chat history
  const downloadChat = () => {
    const chatContent = messages
      .map((msg) => {
        const time = msg.timestamp.toLocaleString()
        const sender = msg.sender === 'user' ? 'You' : 'Asrap Bot'
        return `[${time}] ${sender}: ${msg.text}`
      })
      .join('\n\n')

    const blob = new Blob([chatContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asrap-bot-chat-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowMenu(false)
  }

  // Clear chat
  const clearChat = () => {
    const newMessages = [{
      id: Date.now(),
      text: welcomeMessages[language],
      sender: 'bot' as const,
      timestamp: new Date(),
    }]
    setMessages(newMessages)
    setShowQuickReplies(true)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      console.warn('Failed to clear storage')
    }
    setShowMenu(false)
  }

  // Change language and update welcome message
  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang)
    if (messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([{
        id: Date.now(),
        text: welcomeMessages[newLang],
        sender: 'bot',
        timestamp: new Date(),
      }])
    }
    setShowLangMenu(false)
  }

  if (!isHydrated) return null

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 w-[400px] h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 backdrop-blur-xl transition-all duration-300 ${
          isDark 
            ? 'bg-[#0a0a0f]/95 border border-white/10' 
            : 'bg-white/95 border border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-4 flex justify-between items-center ${
            isDark 
              ? 'bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-cyan-600/20 border-b border-white/10' 
              : 'bg-gradient-to-r from-violet-100 via-fuchsia-100 to-cyan-100 border-b border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              {/* Profile Photo */}
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-lg ring-2 ring-violet-500/30">
                <Image
                  src="/Image/switch.jpg"
                  alt="Asrap Bot"
                  fill
                  className="object-cover"
                />
                {/* Online indicator */}
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                  isDark ? 'border-[#0a0a0f]' : 'border-white'
                } ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
              </div>
              <div>
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Asrap Bot</div>
                <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      Typing...
                    </span>
                  ) : (
                    <span>Online • AI Powered</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                } ${showSearch ? (isDark ? 'bg-white/10' : 'bg-gray-100') : ''}`}
                title="Search messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowLangMenu(!showLangMenu); setShowMenu(false); }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                  title="Change Language"
                >
                  <span className="text-xs font-bold">{languages.find(l => l.code === language)?.flag}</span>
                </button>
                {showLangMenu && (
                  <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl overflow-hidden z-50 ${
                    isDark 
                      ? 'bg-[#1a1a2e] border border-white/10' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          language === lang.code 
                            ? isDark ? 'text-violet-400 bg-violet-500/10' : 'text-violet-600 bg-violet-50'
                            : isDark ? 'text-white/70 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-bold text-xs w-6">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Button */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowLangMenu(false); }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMenu && (
                  <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl overflow-hidden z-50 ${
                    isDark 
                      ? 'bg-[#1a1a2e] border border-white/10' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <button
                      onClick={shareChat}
                      className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
                        isDark 
                          ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share Chat
                    </button>
                    <button
                      onClick={downloadChat}
                      className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
                        isDark 
                          ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Chat
                    </button>
                    <button
                      onClick={clearChat}
                      className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
                        isDark 
                          ? 'text-red-400 hover:bg-red-500/10' 
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Chat
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className={`p-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                    isDark 
                      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Pinned Messages */}
          {pinnedMessages.length > 0 && !showSearch && (
            <div className={`p-2 border-b ${isDark ? 'border-white/10 bg-violet-500/5' : 'border-gray-200 bg-violet-50'}`}>
              <div className="flex items-center gap-2 text-xs">
                <svg className={`w-3.5 h-3.5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17 9l-6.293 6.293a1 1 0 01-1.414 0L3 9m0 0l4-4m-4 4l4 4" clipRule="evenodd" />
                </svg>
                <span className={isDark ? 'text-violet-400' : 'text-violet-600'}>
                  {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
            isDark 
              ? 'bg-gradient-to-b from-transparent to-violet-950/10' 
              : 'bg-gradient-to-b from-gray-50/50 to-violet-50/30'
          }`}>
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`relative max-w-[85%] ${msg.isPinned ? 'ring-2 ring-violet-500/30 rounded-2xl' : ''}`}>
                  {msg.isPinned && (
                    <div className={`absolute -top-2 -right-2 p-1 rounded-full ${isDark ? 'bg-violet-500' : 'bg-violet-600'}`}>
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 00-1 1v6.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 9.586V3a1 1 0 00-1-1z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-sm'
                        : isDark 
                          ? 'bg-white/10 text-white/90 rounded-bl-sm border border-white/5' 
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-sm'
                    }`}
                  >
                    {/* Markdown Rendering for Bot Messages */}
                    {msg.sender === 'bot' ? (
                      <div className={`text-sm prose prose-sm max-w-none ${
                        isDark 
                          ? 'prose-invert prose-p:text-white/90 prose-strong:text-white prose-code:text-violet-300 prose-code:bg-white/10' 
                          : 'prose-p:text-gray-800 prose-strong:text-gray-900 prose-code:text-violet-600 prose-code:bg-violet-50'
                      }`}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    )}
                    <p
                      className={`text-xs mt-1.5 ${
                        msg.sender === 'user' 
                          ? 'text-white/60' 
                          : isDark ? 'text-white/40' : 'text-gray-400'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  
                  {/* Message Actions for Bot Messages */}
                  {msg.sender === 'bot' && (
                    <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDark ? 'text-white/50' : 'text-gray-400'
                    }`}>
                      {/* Like */}
                      <button
                        onClick={() => reactToMessage(msg.id, 'like')}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          msg.reaction === 'like' ? 'text-emerald-400' : ''
                        }`}
                        title="Like"
                      >
                        <svg className="w-3.5 h-3.5" fill={msg.reaction === 'like' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                      {/* Dislike */}
                      <button
                        onClick={() => reactToMessage(msg.id, 'dislike')}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          msg.reaction === 'dislike' ? 'text-red-400' : ''
                        }`}
                        title="Dislike"
                      >
                        <svg className="w-3.5 h-3.5" fill={msg.reaction === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </button>
                      {/* Copy */}
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          copiedId === msg.id ? 'text-emerald-400' : ''
                        }`}
                        title="Copy"
                      >
                        {copiedId === msg.id ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      {/* Pin */}
                      <button
                        onClick={() => togglePinMessage(msg.id)}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          msg.isPinned ? 'text-violet-400' : ''
                        }`}
                        title="Pin"
                      >
                        <svg className="w-3.5 h-3.5" fill={msg.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator with avatar */}
            {isLoading && (
              <div className="flex justify-start gap-2">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src="/Image/switch.jpg"
                    alt="Asrap Bot"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${
                  isDark 
                    ? 'bg-white/10 border border-white/5' 
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Reply Suggestions */}
            {showQuickReplies && !isLoading && messages.length <= 2 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {quickReplies[language].map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSend(reply)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all hover:scale-105 ${
                      isDark 
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30' 
                        : 'bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100'
                    }`}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t ${
            isDark 
              ? 'border-white/10 bg-[#0a0a0f]/50' 
              : 'border-gray-200 bg-white/80'
          }`}>
            <div className="flex gap-2">
              {/* Voice Input Button */}
              {recognitionRef.current && (
                <button
                  onClick={toggleVoiceRecording}
                  className={`p-3 rounded-xl transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isDark 
                        ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10' 
                        : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isRecording ? 'Listening...' : placeholders[language]}
                disabled={isLoading}
                className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed transition-all ${
                  isDark 
                    ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 disabled:bg-white/5' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400 disabled:bg-gray-100'
                }`}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-violet-500/30 hover:scale-110 hover:shadow-xl hover:shadow-violet-500/40 transition-all flex items-center justify-center z-50"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </>
  )
}

// Add type declaration for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  readonly isFinal: boolean
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}