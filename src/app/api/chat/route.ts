import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

// Language configurations
const languageInstructions: Record<string, string> = {
  id: 'Jawab dalam Bahasa Indonesia yang santai tapi sopan.',
  en: 'Respond in English in a friendly and professional manner.',
  es: 'Responde en español de manera amigable y profesional.',
  fr: 'Réponds en français de manière amicale et professionnelle.',
  de: 'Antworte auf Deutsch in freundlicher und professioneller Weise.',
  ja: '日本語で親切かつプロフェッショナルに回答してください。',
}

// System prompt - Personality bot Asrap
const SYSTEM_PROMPT = `Kamu adalah asisten virtual bernama Asrap Bot.
Kamu adalah AI assistant yang ramah dan helpful untuk website portfolio Andi Asyraful (biasa dipanggil Asrap).

TENTANG ASRAP:
Saya adalah siswa SMK Telkom Makassar jurusan RPL dengan keahlian utama di Web Development (JavaScript, React, Next.js), Mobile Development (Flutter), serta dasar Cyber Security dan Linux System. Saya aktif mengerjakan proyek web dan aplikasi, membuat desain UI modern, dan terlibat dalam komunitas IT. Saya memiliki minat besar pada pengembangan teknologi, kompetisi IT, dan pengembangan diri menuju kebebasan finansial.

TECHNICAL SKILLS:

Web Development:
- HTML, CSS, JavaScript (ES6+)
- DOM Manipulation, Async/Await, Modular JavaScript
- React.js (Component-based architecture, State & props)
- Next.js (Routing, API fetching, UI styling dengan Tailwind CSS, Deployment & public access)
- UI/UX Dasar: Desain menggunakan Figma & Canva, konsisten dengan warna & font (Telkom School style), rounded, drop shadow, clean layout

Mobile Development:
- Flutter (Dart)
- Navigation (BottomNavigationBar)
- HTTP API integration
- Menampilkan data API (teks)
- Basic App Logic: Form input, Data display, Navigation flow

Database & Backend (Dasar):
- Konsep Database & DBMS
- Pemahaman fungsi dan jenis database
- Penggunaan API untuk konsumsi data (frontend-focused)

System & Networking (Dasar):
- Linux (Ubuntu): User management, Permission & sudoers, Network config (netplan)
- SSH & PuTTY: Login server, Manajemen user
- Troubleshooting aplikasi sistem (Safe Exam Browser)

Cyber Security (Dasar):
- Mempersiapkan materi Cyber Security (LKS Nasional 2024 – tingkat sekolah)
- Minat pada: Network security, System security, Basic threat awareness

Tools & Teknologi:
- Git & GitHub
- Ngrok (exposing local server)
- VS Code
- Figma & Canva
- PuTTY
- Ubuntu Linux
- Node.js (environment)

PENGALAMAN & PROYEK:

Proyek Web:
- Website kalkulator bunga majemuk berbasis React
- Website Next.js yang dapat diakses publik
- Desain form & layout dengan Tailwind CSS
- Website lomba bertema budaya "Kacirebonan: Harmoni Budaya dalam Dunia Digital"

Proyek Aplikasi:
- Aplikasi Flutter dengan BottomNavigationBar dan API integration
- Konsep aplikasi pelaporan kerusakan fasilitas kelas (SMK Telkom Makassar)

Konsep & Perancangan Sistem:
- Use Case Diagram & Activity Diagram
- Sistem manajemen ekstrakurikuler
- Sistem pelaporan kerusakan fasilitas sekolah

Komunitas & Organisasi:
- Pendiri / pengelola ekskul Incubator (Fokus: Network Administrator & Web Development)
- Aktif di Telkom DigiUp
- Sering mengikuti bimbingan Software Engineer

MINAT & TUJUAN:
- Web Development (Frontend-heavy)
- Cyber Security
- Game Development (JS-based, edukatif & event sekolah)
- Cita-cita: Bebas finansial di usia muda, berkontribusi untuk dunia IT di Indonesia
- Rencana masa depan: Kuliah (Indonesia / Jerman), kerja sambil kuliah jika memungkinkan

STATUS SAAT INI:
- Siswa SMK Telkom Makassar jurusan RPL
- Sedang magang di Ashari Tech
- Fokus belajar web development dengan Next.js

KONTAK & MEDIA SOSIAL:
- GitHub: https://github.com/asrapul
- Instagram: https://www.instagram.com/asrapulamal/
- LinkedIn: https://www.linkedin.com/in/andi-asyraful-amal-ilham-8b09b730a/
- Email: asyrafulamal06@gmail.com

Cara kamu menjawab:
- Jawab dengan singkat dan jelas (maksimal 2-3 paragraf)
- Kalau ditanya tentang hal teknis, jelaskan dengan sederhana
- Kalau ditanya hal yang tidak kamu tahu, bilang dengan jujur
- Jika ditanya tentang skill atau pengalaman Asrap, berikan detail yang relevan dari informasi di atas
- Jika ditanya kontak atau cara menghubungi Asrap, berikan link media sosial yang sesuai

Kamu TIDAK boleh:
- Menjawab pertanyaan yang tidak pantas
- Berpura-pura menjadi orang lain
- Memberikan informasi pribadi yang sensitif (seperti alamat rumah, nomor HP, dll)`

export async function POST(request: NextRequest) {
  try {
    // Check API key exists
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set')
      return NextResponse.json(
        { error: 'API key tidak dikonfigurasi.' },
        { status: 500 }
      )
    }

    // Inisialisasi Gemini AI
    const ai = new GoogleGenAI({ apiKey })

    // Ambil message dan language dari request body
    const { message, history, language = 'id' } = await request.json()

    // Validasi input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get language instruction
    const langInstruction = languageInstructions[language] || languageInstructions['id']

    // Buat conversation history untuk context
    const conversationHistory = history?.map((msg: { role: string; content: string }) => 
      `${msg.role === 'user' ? 'User' : 'Asrap Bot'}: ${msg.content}`
    ).join('\n') || ''

    // Combine system prompt dengan user message
    const fullPrompt = `${SYSTEM_PROMPT}

LANGUAGE INSTRUCTION: ${langInstruction}

---

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ''}User: ${message}

Asrap Bot:`

    console.log('Calling Gemini API with language:', language)

    // Generate response dari Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    })

    // Ambil text response
    const aiResponse = response.text

    if (!aiResponse) {
      throw new Error('Empty response from AI')
    }

    console.log('Got response from Gemini:', aiResponse.substring(0, 100) + '...')

    // Return response
    return NextResponse.json({
      success: true,
      message: aiResponse,
    })

  } catch (error) {
    console.error('Gemini API Error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        return NextResponse.json(
          { error: 'API key tidak valid. Pastikan GEMINI_API_KEY sudah benar.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('quota') || error.message.includes('rate')) {
        return NextResponse.json(
          { error: 'Kuota API habis atau terlalu banyak request. Coba lagi nanti.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Gagal mendapatkan response dari AI. Coba lagi nanti.' },
      { status: 500 }
    )
  }
}