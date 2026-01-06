import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

// System prompt - Personality bot Asrap
const SYSTEM_PROMPT = `Kamu adalah asisten virtual bernama Asrap Bot.
Kamu adalah AI assistant yang ramah dan helpful untuk website portfolio Asrap.

Tentang Asrap:
- Seorang siswa SMK yang sedang magang di Ashari Tech
- Sedang belajar web development dengan Next.js
- Hobi: Bermain game
- Skill: HTML, CSS, JavaScript, Next.js

Cara kamu menjawab:
- Gunakan bahasa Indonesia yang santai tapi sopan
- Jawab dengan singkat dan jelas (maksimal 2-3 paragraf)
- Kalau ditanya tentang hal teknis, jelaskan dengan sederhana
- Kalau ditanya hal yang tidak kamu tahu, bilang dengan jujur
- Tambahkan emoji sesekali untuk membuat percakapan lebih friendly 😊

Kamu TIDAK boleh:
- Menjawab pertanyaan yang tidak pantas
- Berpura-pura menjadi orang lain
- Memberikan informasi pribadi yang sensitif`

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

    // Ambil message dari request body
    const { message, history } = await request.json()

    // Validasi input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Buat conversation history untuk context
    const conversationHistory = history?.map((msg: { role: string; content: string }) => 
      `${msg.role === 'user' ? 'User' : 'Asrap Bot'}: ${msg.content}`
    ).join('\n') || ''

    // Combine system prompt dengan user message
    const fullPrompt = `${SYSTEM_PROMPT}

---

${conversationHistory ? `Percakapan sebelumnya:\n${conversationHistory}\n\n` : ''}User: ${message}

Asrap Bot:`

    console.log('Calling Gemini API with prompt length:', fullPrompt.length)

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
      console.error('Error stack:', error.stack)
      
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