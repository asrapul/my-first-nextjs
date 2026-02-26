'use client'

import { useState, useEffect } from 'react'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { useTheme } from '@/components/ThemeProvider'
import DocumentEditor from '@/components/DocumentEditor'
import AIChat from '@/components/AIChat'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useRealtimeDocument } from '@/hooks/useRealtimeDocument'
import { useRouter } from 'next/navigation'
import { DocsSidebar } from '@/components/DocsSidebar'
import { ShareDialog } from '@/components/ShareDialog'
import { getDocument, type DocumentSummary } from '@/lib/documents'

export default function EditorPage() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()
  const isDarkTheme = theme === 'dark'
  const router = useRouter()
  
  const [activeDocument, setActiveDocument] = useState<DocumentSummary | null>(null)
  const [content, setContent] = useState('')
  const [docTitle, setDocTitle] = useState('Untitled Document')
  const [isInitializing, setIsInitializing] = useState(true)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const documentId = activeDocument?.id || ''

  // Auto-save hook
  const saveStatus = useAutoSave(documentId, content)

  // Real-time hook
  useRealtimeDocument(documentId, (newContent) => {
    if (newContent !== content) {
      setContent(newContent)
    }
  })

  // Load document content when active document changes
  useEffect(() => {
    if (!activeDocument) {
      setContent('')
      setDocTitle('Untitled Document')
      return
    }

    const loadDocContent = async () => {
      try {
        const doc = await getDocument(activeDocument.id)
        setContent(doc.content)
        setDocTitle(doc.title)
      } catch (err) {
        console.error('Error loading document:', err)
        setContent('')
      }
    }

    loadDocContent()
  }, [activeDocument?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle initial load — mark as ready once auth is resolved
  useEffect(() => {
    if (loading) return
    setIsInitializing(false)
  }, [loading])

  // Handle document selection from sidebar
  function handleDocumentSelect(doc: DocumentSummary) {
    setActiveDocument(doc)
    setDocTitle(doc.title)
  }

  // Handle document deletion
  function handleDocumentDelete(deletedId: string) {
    if (activeDocument?.id === deletedId) {
      setActiveDocument(null)
      setContent('')
      setDocTitle('Untitled Document')
    }
  }

  // Download functionality
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docTitle.replace(/\s+/g, '_')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading || isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-500">Loading editor...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`min-h-screen font-sans overflow-hidden relative transition-colors duration-500 ${
        isDarkTheme 
          ? 'bg-[#0a0a0f] text-white' 
          : 'bg-gradient-to-br from-slate-50 via-white to-violet-50 text-gray-900'
      }`}>
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {isDarkTheme ? (
            <>
              <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/25 via-violet-500/15 to-transparent rounded-full blur-3xl animate-[float1_20s_ease-in-out_infinite]" />
              <div className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-[float2_25s_ease-in-out_infinite]" />
            </>
          ) : (
             <>
              <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-300/40 via-violet-200/25 to-transparent rounded-full blur-3xl animate-[float1_20s_ease-in-out_infinite]" />
              <div className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-300/35 via-blue-200/20 to-transparent rounded-full blur-3xl animate-[float2_25s_ease-in-out_infinite]" />
             </>
          )}
          <div className={`absolute inset-0 ${
            isDarkTheme 
              ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]' 
              : 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]'
          } bg-[size:100px_100px]`} />
        </div>

        {/* Login Card */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className={`w-full max-w-md p-8 rounded-3xl backdrop-blur-xl shadow-2xl transition-all duration-500 ${
            isDarkTheme 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-white/70 border border-gray-200/50 shadow-violet-200/20'
          }`}>
            
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                isDarkTheme ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
              } shadow-lg`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h1 className={`text-3xl font-bold bg-clip-text text-transparent ${
                isDarkTheme 
                  ? 'bg-gradient-to-r from-white via-violet-200 to-cyan-200' 
                  : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600'
              }`}>
                AI Editor
              </h1>
              <p className={`mt-2 text-sm ${isDarkTheme ? 'text-white/60' : 'text-gray-500'}`}>
                Sign in to continue your creation
              </p>
            </div>
            
            <button 
               onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/ai-editor' } })}
               className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all transform hover:scale-[1.02] ${
                 isDarkTheme 
                   ? 'bg-white text-gray-900 hover:bg-gray-100' 
                   : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
               }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"/>
              </svg>
              Sign In with Google
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkTheme ? 'border-white/10' : 'border-gray-200'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 ${isDarkTheme ? 'bg-[#0F0F16] text-white/40' : 'bg-white text-gray-400'}`}>
                    Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const email = (form.elements.namedItem('email') as HTMLInputElement).value
              
              const showToast = (message: string, isError = false) => {
                 const toast = document.createElement('div');
                 toast.className = `fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 text-sm font-medium animate-[slideUp_0.5s_ease-out] ${
                    isError 
                        ? 'bg-red-500/90 text-white backdrop-blur-md' 
                        : (isDarkTheme ? 'bg-emerald-500/90 text-white backdrop-blur-md' : 'bg-emerald-600 text-white shadow-emerald-200/50')
                 }`;
                 toast.innerHTML = isError 
                    ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>${message}</span>`
                    : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span>${message}</span>`;
                 
                 document.body.appendChild(toast);
                 setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translate(-50%, 20px)';
                    toast.style.transition = 'all 0.5s ease';
                    setTimeout(() => toast.remove(), 500);
                 }, 4000);
              }

              const { error } = await supabase.auth.signInWithOtp({ 
                  email,
                  options: {
                      emailRedirectTo: window.location.origin + '/ai-editor'
                  } 
              })
              
              if (error) {
                  showToast(error.message, true)
              } else {
                  showToast('Magic link sent! Check your email inbox.')
              }
            }} className="space-y-4">
              <div>
                <label htmlFor="email" className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${isDarkTheme ? 'text-white/60' : 'text-gray-500'}`}>Email address</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className={`w-5 h-5 ${isDarkTheme ? 'text-white/30' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                    </div>
                    <input 
                        type="email" 
                        name="email" 
                        id="email"
                        required
                        className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all ${
                        isDarkTheme 
                            ? 'bg-white/5 border border-white/10 text-white placeholder-white/20 focus:bg-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50' 
                            : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
                        }`}
                        placeholder="name@example.com"
                    />
                </div>
              </div>
              <button 
                type="submit"
                className={`w-full px-6 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] ${
                    isDarkTheme
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-500/25 hover:shadow-violet-500/40'
                    : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-violet-500/20 hover:shadow-violet-500/30'
                }`}
              >
                Send Magic Link
              </button>
            </form>
            
            <p className={`mt-6 text-center text-xs ${isDarkTheme ? 'text-white/30' : 'text-gray-400'}`}>
              Secure access via Supabase Auth
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden relative transition-colors duration-500 ${
      isDarkTheme 
        ? 'bg-[#0a0a0f] text-white' 
        : 'bg-gradient-to-br from-slate-50 via-white to-violet-50 text-gray-900'
    }`}>
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isDarkTheme ? (
          <>
            <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/25 via-violet-500/15 to-transparent rounded-full blur-3xl animate-[float1_20s_ease-in-out_infinite]" />
            <div className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-[float2_25s_ease-in-out_infinite]" />
          </>
        ) : (
            <>
            <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-300/40 via-violet-200/25 to-transparent rounded-full blur-3xl animate-[float1_20s_ease-in-out_infinite]" />
            <div className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-300/35 via-blue-200/20 to-transparent rounded-full blur-3xl animate-[float2_25s_ease-in-out_infinite]" />
            </>
        )}
        <div className={`absolute inset-0 ${
          isDarkTheme 
            ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]' 
            : 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]'
        } bg-[size:100px_100px]`} />
      </div>

      {/* Header */}
      <header className={`h-14 border-b flex items-center px-4 shrink-0 z-20 backdrop-blur-md transition-colors ${
        isDarkTheme 
          ? 'bg-black/20 border-white/10' 
          : 'bg-white/40 border-violet-100'
      } justify-between`}>
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg transition-all ${
              isDarkTheme 
                ? 'text-white/50 hover:text-white hover:bg-white/10' 
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          
          <button 
            onClick={() => router.push('/')}
            className={`p-1.5 rounded-lg transition-all ${
              isDarkTheme 
                ? 'text-white/50 hover:text-white hover:bg-white/10' 
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Back to Home"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg ${
             isDarkTheme ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
          }`}>
            AI
          </div>
          <div>
            <h1 className={`font-bold text-sm ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{docTitle}</h1>
            <p className={`text-[10px] flex items-center gap-1.5 ${isDarkTheme ? 'text-white/50' : 'text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'saved' ? 'bg-emerald-500' : 
                saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
              }`} />
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'unsaved' && 'Unsaved changes...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Share button */}
          {activeDocument && (
            <button 
              onClick={() => setShowShareDialog(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:scale-105 ${
                isDarkTheme 
                  ? 'bg-cyan-600/80 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/20' 
                  : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-md shadow-cyan-300/30'
              }`}
              title="Share document"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}

          <button 
            onClick={handleDownload}
            disabled={!activeDocument}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 ${
              isDarkTheme 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-white/60 text-gray-700 hover:bg-white/80 shadow-sm'
            }`}
            title="Download as Markdown"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          
          <div className={`w-px h-6 mx-1 ${isDarkTheme ? 'bg-white/10' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm ${
            isDarkTheme 
              ? 'bg-white/5 border-white/10 text-white/80' 
              : 'bg-white/50 border-white/40 text-gray-600 shadow-sm'
          }`}>
             <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-[9px] text-white font-bold uppercase">
                {user.email?.[0]}
             </div>
             <span className="text-xs font-medium hidden sm:inline">{user.email}</span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex z-10">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className={`w-64 flex-shrink-0 border-r backdrop-blur-xl transition-all ${
            isDarkTheme ? 'border-white/10' : 'border-violet-100'
          }`}>
            <DocsSidebar
              userId={user.id}
              activeDocumentId={activeDocument?.id ?? null}
              onDocumentSelect={handleDocumentSelect}
              onDocumentDelete={handleDocumentDelete}
            />
          </div>
        )}

        {/* Editor + Chat */}
        <div className="flex-1 overflow-hidden p-3 md:p-4">
          <div className={`h-full rounded-2xl overflow-hidden border backdrop-blur-xl shadow-2xl transition-all ${
             isDarkTheme 
               ? 'bg-black/40 border-white/10' 
               : 'bg-white/40 border-white/60 shadow-violet-100'
          }`}>
            {activeDocument ? (
              <PanelGroup orientation="horizontal">
                <Panel defaultSize={60} minSize={30} className="flex flex-col">
                  <DocumentEditor 
                    key={activeDocument.id}
                    content={content}
                    onChange={setContent}
                  />
                </Panel>
                
                <PanelResizeHandle className={`w-1 transition-colors cursor-col-resize hover:bg-violet-500/50 active:bg-violet-500 ${
                  isDarkTheme ? 'bg-white/5' : 'bg-gray-200/50'
                }`} />
                
                <Panel defaultSize={40} minSize={30}>
                  <AIChat 
                    documentContent={content}
                    onDocumentUpdate={setContent}
                  />
                </Panel>
              </PanelGroup>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                    isDarkTheme ? 'bg-white/5' : 'bg-violet-50'
                  }`}>
                    <svg className={`w-10 h-10 ${isDarkTheme ? 'text-violet-400/50' : 'text-violet-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className={`text-lg font-bold mb-2 ${isDarkTheme ? 'text-white/70' : 'text-gray-600'}`}>
                    Pilih atau Buat Dokumen
                  </h2>
                  <p className={`text-sm ${isDarkTheme ? 'text-white/30' : 'text-gray-400'}`}>
                    Pilih dokumen dari sidebar atau buat dokumen baru untuk mulai menulis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && activeDocument && user && (
        <ShareDialog
          documentId={activeDocument.id}
          ownerId={user.id}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  )
}
