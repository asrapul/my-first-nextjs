'use client'

import { useState, useEffect } from 'react'
import {
  createShareLink,
  getDocumentShares,
  revokeShareLink,
  type Permission,
  type ShareRecord
} from '@/lib/sharing'
import { useTheme } from './ThemeProvider'

interface ShareDialogProps {
  documentId: string
  ownerId: string
  onClose: () => void
}

export function ShareDialog({ documentId, ownerId, onClose }: ShareDialogProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [shares, setShares] = useState<ShareRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<Permission>('view')
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)

  useEffect(() => {
    loadShares()
  }, [documentId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadShares() {
    try {
      const data = await getDocumentShares(documentId)
      setShares(data)
    } catch (err) {
      console.error('Failed to load shares:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate() {
    setIsCreating(true)
    try {
      const url = await createShareLink(documentId, ownerId, permission, expiresInDays)
      await navigator.clipboard.writeText(url)
      setCreatedUrl(url)
      await loadShares()
      setTimeout(() => setCreatedUrl(null), 5000)
    } catch (err) {
      console.error('Failed to create share link:', err)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCopy(token: string) {
    const appUrl = window.location.origin
    const url = `${appUrl}/shared/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function handleRevoke(shareId: string) {
    if (!confirm('Hapus link ini? Siapapun yang punya link ini tidak bisa akses lagi.')) return
    try {
      await revokeShareLink(shareId)
      setShares(prev => prev.filter(s => s.id !== shareId))
    } catch (err) {
      console.error('Failed to revoke share:', err)
    }
  }

  function formatExpiry(expiresAt: string | null) {
    if (!expiresAt) return 'Tidak kedaluwarsa'
    const date = new Date(expiresAt)
    const now = new Date()
    if (date < now) return 'Kedaluwarsa'
    return `Exp: ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl ${
          isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-cyan-500/20' : 'bg-cyan-50'
            }`}>
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Share Dokumen</h2>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-100 text-gray-400'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create link form */}
        <div className={`space-y-3 p-4 rounded-xl mb-5 ${
          isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'
        }`}>
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Permission</label>
            <select
              value={permission}
              onChange={e => setPermission(e.target.value as Permission)}
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none cursor-pointer ${
                isDark 
                  ? 'bg-white/5 border border-white/10 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              <option value="view">👁 View Only (hanya bisa baca)</option>
              <option value="edit">✏️ Edit (bisa ubah dokumen)</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Kedaluwarsa (opsional)</label>
            <select
              value={expiresInDays ?? ''}
              onChange={e => setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)}
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none cursor-pointer ${
                isDark 
                  ? 'bg-white/5 border border-white/10 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              <option value="">Tidak kedaluwarsa</option>
              <option value="1">1 hari</option>
              <option value="7">7 hari</option>
              <option value="30">30 hari</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 ${
              isDark 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-300/30'
            }`}
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Membuat link...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Buat &amp; Salin Link
              </>
            )}
          </button>

          {/* Success toast */}
          {createdUrl && (
            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
              isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">Link disalin! {createdUrl}</span>
            </div>
          )}
        </div>

        {/* Existing shares */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
            isDark ? 'text-white/40' : 'text-gray-400'
          }`}>Link Aktif</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : shares.length === 0 ? (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
              Belum ada link yang dibuat.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {shares.map(share => (
                <div key={share.id} className={`flex items-center gap-2 p-3 rounded-xl ${
                  isDark ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        share.permission === 'edit'
                          ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                          : isDark ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {share.permission === 'edit' ? '✏️ Edit' : '👁 View'}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                        {formatExpiry(share.expires_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(share.share_token)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      copiedToken === share.share_token
                        ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                        : isDark ? 'hover:bg-white/10 text-cyan-400' : 'hover:bg-gray-100 text-cyan-600'
                    }`}
                  >
                    {copiedToken === share.share_token ? '✓' : 'Salin'}
                  </button>
                  <button
                    onClick={() => handleRevoke(share.id)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                    }`}
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
