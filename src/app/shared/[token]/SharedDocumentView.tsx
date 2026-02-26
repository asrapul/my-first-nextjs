'use client'

import { useState } from 'react'
import { type Document } from '@/lib/documents'
import { type Permission } from '@/lib/sharing'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import DocumentEditor from '@/components/DocumentEditor'
import AIChat from '@/components/AIChat'
import { useAutoSave } from '@/hooks/useAutoSave'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'

interface SharedDocumentViewProps {
  document: Document
  permission: Permission
  token: string
}

export function SharedDocumentView({ document, permission, token }: SharedDocumentViewProps) {
  const { user, loading } = useAuth()
  const isViewOnly = permission === 'view'
  const [content, setContent] = useState(document.content)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Only auto-save if editing and logged in
  const saveStatus = useAutoSave(
    (!isViewOnly && user) ? document.id : '',
    content
  )

  // If edit mode but not logged in, show login prompt
  if (!isViewOnly && !loading && !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Login Diperlukan</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-6">
            Dokumen ini memerlukan login untuk bisa diedit. Silakan login terlebih dahulu.
          </p>
          <button
            onClick={() => {
              setShowLoginPrompt(true)
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin + `/shared/${token}`
                }
              })
            }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"/>
            </svg>
            {showLoginPrompt ? 'Redirecting...' : 'Login dengan Google'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white">
      {/* Banner */}
      <div className={`px-4 py-2.5 text-sm flex items-center justify-center gap-2 ${
        isViewOnly
          ? 'bg-gray-800/80 text-gray-300 border-b border-white/5'
          : 'bg-blue-900/80 text-blue-200 border-b border-blue-500/20'
      }`}>
        {isViewOnly ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Kamu sedang melihat dokumen &ldquo;<strong>{document.title}</strong>&rdquo; (hanya baca)</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Kamu sedang mengedit dokumen &ldquo;<strong>{document.title}</strong>&rdquo; yang dibagikan</span>
            {user && (
              <span className="flex items-center gap-1 ml-2 text-xs opacity-60">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === 'saved' ? 'bg-emerald-500' :
                  saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                }`} />
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'unsaved' && 'Unsaved'}
              </span>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isViewOnly ? (
          // View-only: render content as styled read-only document
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8">
              <h1 className="text-3xl font-bold text-white mb-6 pb-4 border-b border-white/10">{document.title}</h1>
              <pre className="whitespace-pre-wrap font-mono text-sm text-white/80 leading-relaxed">{content}</pre>
            </div>
          </div>
        ) : (
          // Edit mode: full editor with AI chat
          <div className="h-full p-3">
            <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl">
              <PanelGroup orientation="horizontal">
                <Panel defaultSize={60} minSize={30} className="flex flex-col">
                  <DocumentEditor
                    content={content}
                    onChange={setContent}
                  />
                </Panel>
                
                <PanelResizeHandle className="w-1 transition-colors cursor-col-resize hover:bg-violet-500/50 active:bg-violet-500 bg-white/5" />
                
                <Panel defaultSize={40} minSize={30}>
                  <AIChat
                    documentContent={content}
                    onDocumentUpdate={setContent}
                  />
                </Panel>
              </PanelGroup>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
