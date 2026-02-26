'use client'

import { useState, useEffect } from 'react'
import { getDocumentByToken, type SharedDocumentResult } from '@/lib/sharing'
import { SharedDocumentView } from './SharedDocumentView'
import Link from 'next/link'

interface SharedDocumentPageProps {
  params: Promise<{ token: string }>
}

export default function SharedDocumentPage({ params }: SharedDocumentPageProps) {
  const [result, setResult] = useState<SharedDocumentResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params
        setToken(resolvedParams.token)
        const data = await getDocumentByToken(resolvedParams.token)
        setResult(data)
      } catch (err) {
        console.error('Error loading shared document:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mx-auto mb-4" />
          <p className="text-white/50 text-sm">Memuat dokumen...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Link Tidak Valid</h1>
          <p className="text-white/40 text-sm leading-relaxed">
            Link ini sudah kedaluwarsa, dokumen sudah dihapus, atau link tidak valid.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke halaman utama
          </Link>
        </div>
      </div>
    )
  }

  return (
    <SharedDocumentView
      document={result.document}
      permission={result.permission}
      token={token}
    />
  )
}
