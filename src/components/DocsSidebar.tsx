'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  createDocument,
  renameDocument,
  deleteDocument,
  searchDocuments,
  getDocumentsPaginated,
  type DocumentSummary,
  type SortOption,
} from '@/lib/documents'
import { useDebounce } from '@/hooks/useDebounce'
import { useTheme } from './ThemeProvider'

interface DocsSidebarProps {
  userId: string
  activeDocumentId: string | null
  onDocumentSelect: (doc: DocumentSummary) => void
  onDocumentDelete: (deletedId: string) => void
}

export function DocsSidebar({
  userId,
  activeDocumentId,
  onDocumentSelect,
  onDocumentDelete
}: DocsSidebarProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Sort state
  const [sortOption, setSortOption] = useState<SortOption>('updated_desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)

  // Sidebar collapsed state (mobile)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // ── Load documents ────────────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (debouncedQuery.trim()) {
        // Search mode
        const results = await searchDocuments(userId, debouncedQuery)
        setDocuments(results)
        setTotalPages(1)
        setTotalDocs(results.length)
      } else {
        // Paginated mode with sort
        const result = await getDocumentsPaginated(userId, sortOption, currentPage, 10)
        setDocuments(result.documents)
        setTotalPages(result.totalPages)
        setTotalDocs(result.total)
      }
    } catch (err) {
      setError('Gagal memuat dokumen. Coba refresh halaman.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [userId, debouncedQuery, sortOption, currentPage])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Reset page when search/sort changes
  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedQuery, sortOption])

  // ── Create document ─────────────────────────────────────────────────────
  async function handleCreate() {
    try {
      const newDoc = await createDocument(userId, 'Untitled')
      setDocuments(prev => [newDoc, ...prev])
      onDocumentSelect(newDoc)
      setRenamingId(newDoc.id)
      setRenameValue('Untitled')
    } catch (err) {
      console.error('Failed to create document:', err)
      setError('Gagal membuat dokumen baru')
    }
  }

  // ── Rename ──────────────────────────────────────────────────────────────
  function startRename(doc: DocumentSummary) {
    setRenamingId(doc.id)
    setRenameValue(doc.title)
  }

  async function submitRename(documentId: string) {
    try {
      await renameDocument(documentId, renameValue)
      setDocuments(prev =>
        prev.map(d => d.id === documentId ? { ...d, title: renameValue.trim() } : d)
      )
    } catch (err) {
      console.error('Failed to rename:', err)
    } finally {
      setRenamingId(null)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  async function handleDelete(documentId: string) {
    try {
      await deleteDocument(documentId)
      setDocuments(prev => prev.filter(d => d.id !== documentId))
      setDeletingId(null)
      if (documentId === activeDocumentId) {
        onDocumentDelete(documentId)
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // ── Format date ─────────────────────────────────────────────────────────
  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return 'Baru saja'
    if (diffMin < 60) return `${diffMin} menit lalu`
    if (diffHr < 24) return `${diffHr} jam lalu`
    if (diffDay < 7) return `${diffDay} hari lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className={`flex flex-col h-full transition-colors ${
        isDark ? 'bg-black/30 text-white' : 'bg-white/50 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-3 border-b ${
          isDark ? 'border-white/10' : 'border-gray-200/50'
        }`}>
          <h2 className={`font-bold text-sm tracking-wide ${
            isDark ? 'text-white/90' : 'text-gray-700'
          }`}>Dokumen Saya</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCreate}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${
                isDark
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-violet-500 hover:bg-violet-600 text-white shadow-md shadow-violet-300/30'
              }`}
            >
              + Baru
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 rounded-lg transition-colors md:hidden ${
                isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-100 text-gray-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={`px-3 pt-3 pb-2 space-y-2 ${isCollapsed ? 'hidden md:block' : ''}`}>
          <div className="relative">
            <svg className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
              isDark ? 'text-white/30' : 'text-gray-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none transition-colors ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/10 focus:border-violet-500/50'
                  : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-violet-400'
              }`}
            />
          </div>

          {/* Sort */}
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as SortOption)}
            className={`w-full px-2 py-1 text-xs rounded-lg outline-none cursor-pointer transition-colors ${
              isDark
                ? 'bg-white/5 border border-white/10 text-white/70'
                : 'bg-gray-50 border border-gray-200 text-gray-600'
            }`}
          >
            <option value="updated_desc" className={isDark ? "bg-gray-900 text-white" : ""}>Terbaru diubah</option>
            <option value="updated_asc" className={isDark ? "bg-gray-900 text-white" : ""}>Terlama diubah</option>
            <option value="title_asc" className={isDark ? "bg-gray-900 text-white" : ""}>Judul A–Z</option>
            <option value="title_desc" className={isDark ? "bg-gray-900 text-white" : ""}>Judul Z–A</option>
          </select>
        </div>

        {/* Document List */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'hidden md:block' : ''}`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-500 border-t-transparent" />
              <span className={`ml-2 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Memuat...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
              <button onClick={loadDocuments} className="mt-2 text-xs text-violet-400 hover:text-violet-300 underline">
                Coba lagi
              </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-white/5' : 'bg-gray-100'
              }`}>
                <svg className={`w-6 h-6 ${isDark ? 'text-white/20' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {searchQuery ? (
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Tidak ada dokumen dengan kata &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <>
                  <p className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Belum ada dokumen</p>
                  <button onClick={handleCreate} className="mt-2 text-xs text-violet-400 hover:text-violet-300 underline">
                    Buat dokumen pertama
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="py-1">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`group flex items-center px-3 py-2.5 cursor-pointer transition-all ${
                    doc.id === activeDocumentId
                      ? isDark
                        ? 'bg-violet-600/20 border-l-2 border-violet-500'
                        : 'bg-violet-50 border-l-2 border-violet-500'
                      : isDark
                        ? 'hover:bg-white/5 border-l-2 border-transparent'
                        : 'hover:bg-gray-50 border-l-2 border-transparent'
                  }`}
                  onClick={() => renamingId !== doc.id && onDocumentSelect(doc)}
                >
                  {renamingId === doc.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      autoFocus
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => submitRename(doc.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitRename(doc.id)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className={`flex-1 text-sm px-2 py-0.5 rounded outline-none ${
                        isDark
                          ? 'bg-white/10 text-white border border-violet-500/50'
                          : 'bg-white text-gray-800 border border-violet-400'
                      }`}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isDark ? 'text-white/90' : 'text-gray-800'
                        }`}>{doc.title}</p>
                        <p className={`text-[10px] mt-0.5 ${
                          isDark ? 'text-white/30' : 'text-gray-400'
                        }`}>{formatDate(doc.updated_at)}</p>
                      </div>
                      <div className={`flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <button
                          onClick={e => { e.stopPropagation(); startRename(doc) }}
                          className={`p-1 rounded transition-colors ${
                            isDark ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-700'
                          }`}
                          title="Ganti nama"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeletingId(doc.id) }}
                          className={`p-1 rounded transition-colors ${
                            isDark ? 'hover:bg-red-500/20 text-white/40 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                          }`}
                          title="Hapus"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!searchQuery && totalPages > 1 && !isCollapsed && (
          <div className={`flex items-center justify-between px-3 py-2 border-t text-xs ${
            isDark ? 'border-white/10 text-white/50' : 'border-gray-200/50 text-gray-500'
          }`}>
            <span>{totalDocs} dokumen</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className={`px-2 py-0.5 rounded transition-colors disabled:opacity-30 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                ←
              </button>
              <span>{currentPage + 1}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className={`px-2 py-0.5 rounded transition-colors disabled:opacity-30 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 max-w-sm mx-4 shadow-2xl ${
            isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
          }`}>
            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-red-500/20' : 'bg-red-50'
            }`}>
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`font-bold text-center text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Hapus Dokumen?
            </h3>
            <p className={`text-sm text-center mb-6 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Dokumen ini akan dihapus permanen dan tidak bisa dipulihkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
