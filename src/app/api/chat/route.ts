import { GoogleGenAI, Type } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/image-generator'

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

RIWAYAT PENDIDIKAN:
- SMK Telkom Makassar - Jurusan Rekayasa Perangkat Lunak (RPL) [Saat ini]
- SMPIT Ar-Rahmah Makassar
- SD Plus Al-Ashri Makassar

PENGALAMAN:
- Berpartisipasi dalam IIT Competition 2024 x Rumahweb Indonesia pada bidang Web Design
- Mengikuti Telkom DigiUp Program bidang Golang - Backend Developer
- Membuat proyek Website Buku Tamu sebagai tugas pengembangan di SMK Telkom Makassar
- Berpartisipasi dalam Invofest IT Competition 2024 dalam bidang Web Design
- Mengikuti seleksi Lomba Kompetensi Siswa (LKS) tingkat sekolah tahun 2025 pada bidang Cyber Security
- Mengikuti berbagai kompetisi E-Sport Mobile Legends tingkat pelajar
- Sedang magang di Ashari Tech
- Pendiri / pengelola ekskul Incubator (Fokus: Network Administrator & Web Development)
- Aktif di Telkom DigiUp
- Sering mengikuti bimbingan Software Engineer

PENDIDIKAN NONFORMAL:
- Program pelatihan Telkom DigiUp - Golang & Backend Developer
- Kursus Web Development Bootcamp di platform Udemy

PENGHARGAAN & SERTIFIKAT:
- Juara 1 - E-Sport Mobile Legend, Athirah Sportacular Competition Vol. 3 tingkat pelajar
- Juara 1 - E-Sport Mobile Legend, Stellar Showdown 2024 tingkat pelajar
- Juara 2 - E-Sport Mobile Legend, Nobel Indonesia Institute tingkat pelajar
- Juara 3 - E-Sport Mobile Legend, Battle of Legend tingkat nasional
- Juara 3 - E-Sport Mobile Legend, Kalla Youth Fest 2024 tingkat kota
- Juara 3 - Seleksi LKS bidang Cyber Security tingkat sekolah
- Mendapatkan Sertifikat Web Development Level BNSP

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
- Golang untuk Backend Development (dari Telkom DigiUp)

System & Networking (Dasar):
- Linux (Ubuntu): User management, Permission & sudoers, Network config (netplan)
- SSH & PuTTY: Login server, Manajemen user
- Troubleshooting aplikasi sistem (Safe Exam Browser)

Cyber Security (Dasar):
- Mempersiapkan materi Cyber Security (LKS Nasional 2024 – tingkat sekolah)
- Minat pada: Network security, System security, Basic threat awareness
- Juara 3 Seleksi LKS Cyber Security tingkat sekolah

Tools & Teknologi:
- Git & GitHub
- Ngrok (exposing local server)
- VS Code
- Figma & Canva
- PuTTY
- Ubuntu Linux
- Node.js (environment)

PROYEK:

Proyek Web:
- Website kalkulator bunga majemuk berbasis React
- Website Next.js yang dapat diakses publik
- Desain form & layout dengan Tailwind CSS
- Website lomba bertema budaya "Kacirebonan: Harmoni Budaya dalam Dunia Digital"
- Website Buku Tamu untuk SMK Telkom Makassar

Proyek Aplikasi:
- Aplikasi Flutter dengan BottomNavigationBar dan API integration
- Konsep aplikasi pelaporan kerusakan fasilitas kelas (SMK Telkom Makassar)

Konsep & Perancangan Sistem:
- Use Case Diagram & Activity Diagram
- Sistem manajemen ekstrakurikuler
- Sistem pelaporan kerusakan fasilitas sekolah

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

PENTING - KEMAMPUAN GENERATE GAMBAR:
Kamu memiliki kemampuan untuk MEMBUAT GAMBAR menggunakan AI!
- Jika user meminta kamu membuat/generate/buat/gambarkan sesuatu, gunakan tool generate_image
- Jelaskan dulu apa yang akan kamu buat, lalu gunakan tool
- Contoh respons: "Baik, saya akan membuatkan gambar [deskripsi] untuk kamu! 🎨"

Cara kamu menjawab:
- Jawab dengan singkat dan jelas (maksimal 2-3 paragraf)
- Kalau ditanya tentang hal teknis, jelaskan dengan sederhana
- Kalau ditanya hal yang tidak kamu tahu, bilang dengan jujur
- Jika ditanya tentang skill, pengalaman, pendidikan, atau penghargaan Asrap, berikan detail yang relevan dari informasi di atas
- Jika ditanya kontak atau cara menghubungi Asrap, berikan link media sosial yang sesuai
- Banggakan pencapaian Asrap dengan cara yang humble tapi tetap impressive

Kamu TIDAK boleh:
- Menjawab pertanyaan yang tidak pantas
- Berpura-pura menjadi orang lain
- Memberikan informasi pribadi yang sensitif (seperti alamat rumah, nomor HP, dll)`

// Definisi Tool untuk generate gambar
const imageGenerationTool = {
  functionDeclarations: [
    {
      name: 'generate_image',
      description: 'Generate gambar berdasarkan deskripsi dari user. Gunakan tool ini ketika user meminta untuk membuat, generate, buat, atau menggambar sesuatu.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          prompt: {
            type: Type.STRING,
            description: 'Deskripsi detail gambar yang ingin dibuat dalam bahasa Inggris. Contoh: "a cute orange cat wearing a small blue hat, digital art style"',
          },
        },
        required: ['prompt'],
      },
    },
  ],
}

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

    // Ambil message, language, dan image dari request body
    const { message, history, language = 'id', image } = await request.json()

    // Validasi input - allow image-only requests
    if ((!message || typeof message !== 'string') && !image) {
      return NextResponse.json(
        { error: 'Message or image is required' },
        { status: 400 }
      )
    }

    // Get language instruction
    const langInstruction = languageInstructions[language] || languageInstructions['id']

    // Build conversation history untuk format baru
    const conversationHistory = history?.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })) || []

    console.log('Calling Gemini API with language:', language, 'Has image:', !!image)

    // Build user message parts
    const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []
    
    // Add text message
    if (message) {
      userParts.push({ text: message })
    }
    
    // Add image if provided (for vision analysis)
    if (image) {
      // Extract base64 data from data URL
      const matches = image.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        const mimeType = matches[1]
        const data = matches[2]
        userParts.push({
          inlineData: {
            mimeType,
            data,
          }
        })
      }
    }

    // Generate response dengan tools
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nLANGUAGE INSTRUCTION: ${langInstruction}` }] },
        { role: 'model', parts: [{ text: 'Baik, saya mengerti! Saya Asrap Bot, siap membantu. 😊' }] },
        ...conversationHistory,
        { role: 'user', parts: userParts },
      ],
      config: {
        tools: [imageGenerationTool],
      },
    })

    // Cek apakah AI mau pakai tool
    const functionCalls = response.functionCalls

    if (functionCalls && functionCalls.length > 0) {
      const functionCall = functionCalls[0]

      if (functionCall.name === 'generate_image') {
        const imagePrompt = functionCall.args?.prompt as string

        console.log('AI wants to generate image with prompt:', imagePrompt)

        try {
          // Generate gambar
          const imageData = await generateImage(imagePrompt)

          if (imageData) {
            return NextResponse.json({
              success: true,
              message: `Ini dia gambar yang kamu minta! 🎨`,
              image: imageData,
              imagePrompt: imagePrompt,
            })
          } else {
            return NextResponse.json({
              success: true,
              message: 'Maaf, saya tidak bisa membuat gambar saat ini. Coba lagi ya! 😅',
            })
          }
        } catch (error) {
          console.error('Image generation failed:', error)
          return NextResponse.json({
            success: true,
            message: 'Maaf, terjadi kesalahan saat membuat gambar. Coba lagi nanti ya! 🙏',
          })
        }
      }
    }

    // Response text biasa (tanpa tool call)
    const textResponse = response.text

    if (!textResponse) {
      throw new Error('Empty response from AI')
    }

    console.log('Got response from Gemini:', textResponse.substring(0, 100) + '...')

    // Return response
    return NextResponse.json({
      success: true,
      message: textResponse,
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