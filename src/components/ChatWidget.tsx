'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from './ThemeProvider'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  reaction?: 'like' | 'dislike' | null
  isPinned?: boolean
  image?: string  // For AI generated images
  imagePrompt?: string  // Original prompt used for image generation
  userImage?: string  // For user uploaded images
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
  id: 'Halo! Saya Asrap Bot. Saya bisa menjawab pertanyaan dan **generate gambar AI** 🎨. Ada yang bisa saya bantu? 👋',
  en: 'Hello! I\'m Asrap Bot. I can answer questions and **generate AI images** 🎨. How can I help you? 👋',
  es: '¡Hola! Soy Asrap Bot. Puedo responder preguntas y **generar imágenes AI** 🎨. ¿En qué puedo ayudarte? 👋',
  fr: 'Bonjour! Je suis Asrap Bot. Je peux répondre aux questions et **générer des images AI** 🎨. Comment puis-je vous aider? 👋',
  de: 'Hallo! Ich bin Asrap Bot. Ich kann Fragen beantworten und **AI-Bilder generieren** 🎨. Wie kann ich Ihnen helfen? 👋',
  ja: 'こんにちは！Asrap Botです。質問に答えたり、**AI画像を生成**できます 🎨。何かお手伝いできますか？ 👋',
}

// Quick reply suggestions
const quickReplies: Record<Language, string[]> = {
  id: ['Siapa Asrap?', 'Skill apa saja?', '🎨 Generate Gambar', 'Kontak'],
  en: ['Who is Asrap?', 'What skills?', '🎨 Generate Image', 'Contact'],
  es: ['¿Quién es Asrap?', '¿Qué habilidades?', '🎨 Generar Imagen', 'Contacto'],
  fr: ['Qui est Asrap?', 'Quelles compétences?', '🎨 Générer Image', 'Contact'],
  de: ['Wer ist Asrap?', 'Welche Skills?', '🎨 Bild Generieren', 'Kontakt'],
  ja: ['Asrapは誰?', 'スキルは?', '🎨 画像生成', '連絡先'],
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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxPrompt, setLightboxPrompt] = useState<string | null>(null)
  const [imageCopied, setImageCopied] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  // New states for TTS and Image Upload
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Get all generated images for gallery
  const galleryImages = messages.filter(msg => msg.image).map(msg => ({
    image: msg.image!,
    prompt: msg.imagePrompt || 'No prompt',
    timestamp: msg.timestamp,
  }))

  // Open lightbox with image and prompt
  const openLightbox = (image: string, prompt?: string) => {
    setLightboxImage(image)
    setLightboxPrompt(prompt || null)
  }

  // Text-to-Speech function
  const speakText = useCallback((text: string, messageId: number) => {
    // Stop any current speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    // Clean text from markdown
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`{3}[\s\S]*?`{3}/g, 'code block')
      .replace(/`/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    // Set language based on current language setting
    const langMap: Record<Language, string> = {
      id: 'id-ID',
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ja: 'ja-JP',
    }
    utterance.lang = langMap[language]
    utterance.rate = 1
    utterance.pitch = 1

    utterance.onstart = () => setSpeakingId(messageId)
    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)

    speechSynthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [language])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }, [])

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert('Image too large. Max 4MB allowed.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Copy code to clipboard
  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // Custom Code Block component for syntax highlighting
  const CodeBlock = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : 'text'
    const code = String(children).replace(/\n$/, '')
    
    return (
      <div className="relative group my-2">
        {/* Language label */}
        <div className={`absolute top-0 left-0 px-2 py-0.5 text-[10px] font-mono rounded-tl-lg rounded-br-lg ${
          isDark ? 'bg-white/20 text-white/60' : 'bg-gray-200 text-gray-600'
        }`}>
          {language}
        </div>
        
        {/* Copy button */}
        <button
          onClick={() => copyCode(code)}
          className={`absolute top-1 right-1 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark 
              ? 'bg-white/20 hover:bg-white/30 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          {codeCopied ? '✓ Copied' : '📋 Copy'}
        </button>
        
        <SyntaxHighlighter
          style={isDark ? oneDark : oneLight}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            paddingTop: '1.5rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    )
  }

  // Send message to API
  const sendMessageToAI = async (userMessage: string, userImage?: string): Promise<{ message: string; image?: string; imagePrompt?: string }> => {
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
          image: userImage, // Send uploaded image
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to get response')
      
      // Return object with message, optional image and prompt
      return {
        message: data.message,
        image: data.image || undefined,
        imagePrompt: data.imagePrompt || undefined,
      }
    } catch (error) {
      console.error('Error calling AI:', error)
      throw error
    }
  }

  // Handle send message
  const handleSend = async (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if ((!text && !selectedImage) || isLoading) return

    const currentImage = selectedImage
    setInputValue('')
    removeSelectedImage()

    const userMsg: Message = {
      id: Date.now(),
      text: text || (currentImage ? '📷 [Image uploaded]' : ''),
      sender: 'user',
      timestamp: new Date(),
      userImage: currentImage || undefined,
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    // Handle /test command for UI verification without API
    if (text === '/test') {
      setIsLoading(true)
      setTimeout(() => {
        const mockBotMsg: Message = {
          id: Date.now() + 1,
          text: `Ini adalah pesan tes untuk memverifikasi fitur UI.
          
Berikut adalah contoh kode Python:
\`\`\`python
def hello_world():
    print("Hello, World!")
    return True
\`\`\`

Dan contoh gambar (placeholder):`,
          sender: 'bot',
          timestamp: new Date(),
          // Use a placeholder image for testing
          image: 'https://placehold.co/600x400/png',
          imagePrompt: 'A placeholder image for testing purposes',
        }
        setMessages((prev) => [...prev, mockBotMsg])
        playNotificationSound()
        setIsLoading(false)
      }, 1000)
      return
    }

    try {
      const aiResponse = await sendMessageToAI(text || 'Please analyze this image', currentImage || undefined)
      const botMsg: Message = {
        id: Date.now() + 1,
        text: aiResponse.message,
        sender: 'bot',
        timestamp: new Date(),
        image: aiResponse.image,
        imagePrompt: aiResponse.imagePrompt,
      }
      setMessages((prev) => [...prev, botMsg])
      playNotificationSound()
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: error.message || 'Maaf, terjadi kesalahan. Coba lagi ya! 😅',
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
        <div className={`fixed z-50 backdrop-blur-xl flex flex-col overflow-hidden shadow-2xl transition-all duration-300
          inset-0 sm:inset-auto
          sm:bottom-24 sm:right-4 md:right-6
          sm:w-[calc(100vw-2rem)] sm:max-w-[400px] md:max-w-[420px] lg:max-w-[440px]
          sm:h-[calc(100vh-8rem)] sm:max-h-[600px] md:max-h-[650px] lg:max-h-[700px]
          rounded-none sm:rounded-2xl md:rounded-3xl
          ${
          isDark 
            ? 'bg-[#0a0a0f]/95 sm:border sm:border-white/10' 
            : 'bg-white/95 sm:border sm:border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-4 flex justify-between items-center ${
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

              {/* Gallery Button - Always visible */}
              <button
                onClick={() => setShowGallery(true)}
                className={`p-2 rounded-lg transition-colors relative ${
                  isDark 
                    ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title={galleryImages.length > 0 ? `View Gallery (${galleryImages.length} images)` : 'Gallery (No images yet)'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {/* Badge showing image count - only when there are images */}
                {galleryImages.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {galleryImages.length}
                  </span>
                )}
              </button>

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
                        <ReactMarkdown
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '')
                              const isBlock = node?.position?.start.line !== node?.position?.end.line || match
                              
                              if (isBlock) {
                                return <CodeBlock className={className}>{children}</CodeBlock>
                              }
                              return <code className={className} {...props}>{children}</code>
                            },
                            pre({ children }) {
                              return <>{children}</>
                            }
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <>
                        {/* User uploaded image */}
                        {msg.userImage && (
                          <div className="mb-2">
                            <img 
                              src={msg.userImage} 
                              alt="Uploaded"
                              className="max-w-full rounded-lg border border-white/20 max-h-40 object-cover"
                            />
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </>
                    )}
                    
                    {/* AI Generated Image with Enhanced Features */}
                    {msg.image && (
                      <div className="mt-3 space-y-2">
                        {/* Image with Click to Zoom */}
                        <div className="relative group/img">
                          <img
                            src={msg.image}
                            alt="AI Generated"
                            className="rounded-lg max-w-full cursor-zoom-in hover:opacity-95 transition-all border border-white/10 hover:shadow-lg"
                            onClick={() => openLightbox(msg.image!, msg.imagePrompt)}
                          />
                          {/* Zoom indicator */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <span className={`text-xs px-2 py-1 rounded-lg backdrop-blur-sm ${
                              isDark ? 'bg-black/50 text-white' : 'bg-white/80 text-gray-700'
                            }`}>
                              🔍 Click to zoom
                            </span>
                          </div>
                        </div>
                        
                        {/* Image Info & Prompt */}
                        {msg.imagePrompt && (
                          <p className={`text-xs italic ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                            &quot;{msg.imagePrompt}&quot;
                          </p>
                        )}
                        
                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Download PNG */}
                          <button
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = msg.image!
                              link.download = `asrap-ai-image-${Date.now()}.png`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                            className={`text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                              isDark 
                                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                            }`}
                            title="Download as PNG"
                          >
                            📥 PNG
                          </button>
                          
                          {/* Copy to Clipboard */}
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(msg.image!)
                                const blob = await response.blob()
                                await navigator.clipboard.write([
                                  new ClipboardItem({ [blob.type]: blob })
                                ])
                                setImageCopied(true)
                                setTimeout(() => setImageCopied(false), 2000)
                              } catch {
                                // Fallback: copy data URL
                                await navigator.clipboard.writeText(msg.image!)
                                setImageCopied(true)
                                setTimeout(() => setImageCopied(false), 2000)
                              }
                            }}
                            className={`text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                              isDark 
                                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                            }`}
                            title="Copy to clipboard"
                          >
                            {imageCopied ? '✅ Copied!' : '📋 Copy'}
                          </button>
                          
                          {/* Regenerate */}
                          {msg.imagePrompt && (
                            <button
                              onClick={() => handleSend(`Generate image: ${msg.imagePrompt}`)}
                              disabled={isLoading}
                              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                                isLoading 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : isDark 
                                    ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 hover:text-violet-200' 
                                    : 'bg-violet-100 hover:bg-violet-200 text-violet-600 hover:text-violet-700'
                              }`}
                              title="Generate similar image"
                            >
                              🔄 Regenerate
                            </button>
                          )}
                          
                          {/* Share */}
                          <button
                            onClick={async () => {
                              if (navigator.share) {
                                try {
                                  const response = await fetch(msg.image!)
                                  const blob = await response.blob()
                                  const file = new File([blob], `asrap-ai-image.png`, { type: 'image/png' })
                                  await navigator.share({
                                    title: 'AI Generated Image by Asrap Bot',
                                    text: msg.imagePrompt || 'Check out this AI generated image!',
                                    files: [file],
                                  })
                                } catch {
                                  // Fallback
                                  window.open(msg.image, '_blank')
                                }
                              } else {
                                window.open(msg.image, '_blank')
                              }
                            }}
                            className={`text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                              isDark 
                                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                            }`}
                            title="Share image"
                          >
                            📤 Share
                          </button>
                          
                          {/* Edit Image */}
                          {msg.imagePrompt && (
                            <button
                              onClick={() => {
                                const editPrompt = prompt('Edit gambar ini. Tambahkan instruksi:', msg.imagePrompt)
                                if (editPrompt && editPrompt.trim()) {
                                  handleSend(`Edit gambar: ${editPrompt}`)
                                }
                              }}
                              disabled={isLoading}
                              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                                isLoading 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : isDark 
                                    ? 'bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 hover:text-fuchsia-200' 
                                    : 'bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-600 hover:text-fuchsia-700'
                              }`}
                              title="Edit this image"
                            >
                              ✏️ Edit
                            </button>
                          )}
                          
                          {/* Fullscreen/Zoom */}
                          <button
                            onClick={() => openLightbox(msg.image!, msg.imagePrompt)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                              isDark 
                                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                            }`}
                            title="View fullscreen"
                          >
                            🔍 Zoom
                          </button>
                          
                          {/* Gallery */}
                          {galleryImages.length > 1 && (
                            <button
                              onClick={() => setShowGallery(true)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                                isDark 
                                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200' 
                                  : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-600 hover:text-cyan-700'
                              }`}
                              title={`View all ${galleryImages.length} generated images`}
                            >
                              🖼️ Gallery ({galleryImages.length})
                            </button>
                          )}
                        </div>
                        
                        {/* Credit */}
                        <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                          🎨 Powered by Pollinations AI
                        </p>
                      </div>
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
                      {/* TTS Speaker */}
                      <button
                        onClick={() => speakingId === msg.id ? stopSpeaking() : speakText(msg.text, msg.id)}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          speakingId === msg.id ? 'text-violet-400' : ''
                        }`}
                        title={speakingId === msg.id ? 'Stop speaking' : 'Read aloud'}
                      >
                        {speakingId === msg.id ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 6h4v12H6zM14 6h4v12h-4z"/>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
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
            {!isLoading && messages.length === 1 && messages[0].sender === 'bot' && (
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
          <div className={`p-3 sm:p-4 border-t pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 ${
            isDark 
              ? 'border-white/10 bg-[#0a0a0f]/50' 
              : 'border-gray-200 bg-white/80'
          }`}>
            {/* Image Preview */}
            {selectedImage && (
              <div className="mb-2 relative inline-block">
                <img 
                  src={selectedImage} 
                  alt="Selected" 
                  className="h-20 rounded-lg border border-violet-500/50"
                />
                <button
                  onClick={removeSelectedImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              {/* Image Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 ${
                  isDark 
                    ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-violet-400' 
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                } disabled:opacity-50`}
                title="Upload image for analysis"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* Voice Input Button */}
              {recognitionRef.current && (
                <button
                  onClick={toggleVoiceRecording}
                  className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 ${
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
                placeholder={isRecording ? 'Listening...' : selectedImage ? 'Describe or ask about this image...' : placeholders[language]}
                disabled={isLoading}
                className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed transition-all ${
                  isDark 
                    ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500/50 disabled:bg-white/5' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400 disabled:bg-gray-100'
                }`}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-2.5 sm:p-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 flex-shrink-0"
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
        className={`fixed z-50 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:scale-110 hover:shadow-xl hover:shadow-violet-500/40 transition-all flex items-center justify-center
          bottom-4 right-4 w-12 h-12 rounded-xl
          sm:bottom-6 sm:right-4 sm:w-14 sm:h-14 sm:rounded-2xl
          md:right-6
          ${isOpen ? 'sm:opacity-100 opacity-0 pointer-events-none sm:pointer-events-auto' : 'opacity-100 pointer-events-auto'}
        `}
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
      
      {/* Lightbox Modal for Fullscreen Image */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setLightboxImage(null); setLightboxPrompt(null); }}
        >
          {/* Close Button */}
          <button
            onClick={() => { setLightboxImage(null); setLightboxPrompt(null); }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Image Container */}
          <div 
            className="relative max-w-4xl max-h-[90vh] flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prompt Display */}
            {lightboxPrompt && (
              <div className="text-center mb-3">
                <p className="text-white/60 text-sm italic">&quot;{lightboxPrompt}&quot;</p>
              </div>
            )}
            
            <img
              src={lightboxImage}
              alt="AI Generated - Fullscreen"
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl cursor-default"
            />
            
            {/* Bottom Actions */}
            <div className="mt-4 p-4 bg-black/50 rounded-lg backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Download */}
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = lightboxImage
                    link.download = `asrap-ai-image-${Date.now()}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center gap-2 cursor-pointer"
                >
                  📥 Download PNG
                </button>
                
                {/* Copy */}
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(lightboxImage)
                      const blob = await response.blob()
                      await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                      ])
                      setImageCopied(true)
                      setTimeout(() => setImageCopied(false), 2000)
                    } catch {
                      await navigator.clipboard.writeText(lightboxImage)
                      setImageCopied(true)
                      setTimeout(() => setImageCopied(false), 2000)
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {imageCopied ? '✅ Copied!' : '📋 Copy Image'}
                </button>
                
                {/* Edit */}
                {lightboxPrompt && (
                  <button
                    onClick={() => {
                      const editPrompt = prompt('Edit gambar ini. Tambahkan instruksi:', lightboxPrompt)
                      if (editPrompt && editPrompt.trim()) {
                        setLightboxImage(null)
                        setLightboxPrompt(null)
                        handleSend(`Edit gambar: ${editPrompt}`)
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-fuchsia-500/30 hover:bg-fuchsia-500/40 text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    ✏️ Edit Image
                  </button>
                )}
                
                {/* Gallery */}
                {galleryImages.length > 1 && (
                  <button
                    onClick={() => {
                      setLightboxImage(null)
                      setLightboxPrompt(null)
                      setShowGallery(true)
                    }}
                    className="px-4 py-2 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/40 text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    🖼️ Gallery ({galleryImages.length})
                  </button>
                )}
                
                {/* Close */}
                <button
                  onClick={() => { setLightboxImage(null); setLightboxPrompt(null); }}
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Gallery Modal */}
      {showGallery && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto"
          style={{ cursor: 'auto' }}
          onClick={() => setShowGallery(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Gallery Container */}
          <div 
            className="max-w-5xl w-full max-h-[90vh] overflow-auto"
            style={{ cursor: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white text-xl font-bold text-center mb-6">
              🖼️ Image Gallery ({galleryImages.length} images)
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
              {galleryImages.map((item, index) => (
                <div 
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() => {
                    setShowGallery(false)
                    openLightbox(item.image, item.prompt)
                  }}
                >
                  <img
                    src={item.image}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-white/10 hover:border-violet-500/50 transition-all hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🔍 View</span>
                  </div>
                  <p className="text-white/50 text-xs mt-1 truncate px-1">
                    {item.prompt}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Close */}
            <div className="text-center mt-4">
              <button
                onClick={() => setShowGallery(false)}
                className="px-6 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                ✕ Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}
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