'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getVersionList,
  restoreVersion,
  type DocumentVersionSummary,
} from '@/lib/versions'
import { useTheme } from './ThemeProvider'
import { ConfirmDialog } from './ConfirmDialog'

interface VersionTimelineProps {
  documentId: string
  userId: string
  onCompare: (versionIdA: string, versionIdB: string) => void
  onContentRestore: (newContent: string) => void
  onClose: () => void
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  return `${days} hari lalu`
}

export function VersionTimeline({
  documentId,
  userId,
  onCompare,
  onContentRestore,
  onClose,
}: VersionTimelineProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [versions, setVersions] = useState<DocumentVersionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  // State untuk pilih 2 versi arbitrary
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isRestoring, setIsRestoring] = useState<string | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<DocumentVersionSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadVersions = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setIsLoading(true)
        const result = await getVersionList(documentId, pageNum)
        setVersions((prev) =>
          append ? [...prev, ...result.versions] : result.versions
        )
        setHasMore(result.hasMore)
      } catch (err) {
        console.error('Failed to load versions:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [documentId]
  )

  useEffect(() => {
    loadVersions(0)
  }, [loadVersions])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id] // geser: buang yang pertama
      return [...prev, id]
    })
  }

  async function executeRestore(version: DocumentVersionSummary) {
    try {
      setIsRestoring(version.id)
      setErrorMessage(null)
      const restoredContent = await restoreVersion(
        documentId,
        version.id,
        userId
      )
      await loadVersions(0)
      onContentRestore(restoredContent)
    } catch (err) {
      console.error('Restore failed:', err)
      setErrorMessage('Gagal restore versi. Silakan coba lagi.')
    } finally {
      setIsRestoring(null)
      setRestoreTarget(null)
    }
  }

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    loadVersions(nextPage, true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={`p-3 border-b flex items-center justify-between ${
          isDark ? 'border-white/10' : 'border-violet-100'
        }`}
      >
        <h2
          className={`font-semibold text-sm ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}
        >
          📜 Histori Versi
        </h2>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-all ${
            isDark
              ? 'text-white/50 hover:text-white hover:bg-white/10'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Compare Buttons */}
      <div
        className={`px-3 py-2 border-b ${
          isDark ? 'border-white/10' : 'border-violet-100'
        }`}
      >
        {/* Quick compare: last vs second-to-last */}
        {versions.length >= 2 && (
          <button
            onClick={() => onCompare(versions[1].id, versions[0].id)}
            className={`w-full text-xs font-medium py-1.5 rounded-lg mb-2 transition-all ${
              isDark
                ? 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            ⚡ Compare: v{versions[1].version_number} vs v
            {versions[0].version_number}
          </button>
        )}

        {/* Arbitrary compare: pilih 2 versi */}
        {selectedIds.length === 2 && (
          <button
            onClick={() => onCompare(selectedIds[0], selectedIds[1])}
            className={`w-full text-xs font-medium py-1.5 rounded-lg transition-all ${
              isDark
                ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            🔍 Compare 2 versi dipilih
          </button>
        )}
        {selectedIds.length === 1 && (
          <p
            className={`text-xs text-center ${
              isDark ? 'text-white/40' : 'text-gray-400'
            }`}
          >
            Pilih 1 versi lagi untuk dibandingkan
          </p>
        )}
        {selectedIds.length === 0 && versions.length >= 2 && (
          <p
            className={`text-xs text-center ${
              isDark ? 'text-white/30' : 'text-gray-400'
            }`}
          >
            Centang 2 versi untuk compare bebas
          </p>
        )}
      </div>

      {/* Daftar versi */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && versions.length === 0 ? (
          <div
            className={`p-4 text-center text-sm ${
              isDark ? 'text-white/40' : 'text-gray-400'
            }`}
          >
            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" />
            Memuat histori...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-center">
            <div
              className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-white/5' : 'bg-violet-50'
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  isDark ? 'text-white/30' : 'text-violet-300'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p
              className={`text-xs ${
                isDark ? 'text-white/30' : 'text-gray-400'
              }`}
            >
              Belum ada histori versi. Edit dokumen dan tunggu auto-save, atau
              klik &quot;Save Version&quot;.
            </p>
          </div>
        ) : (
          <>
            {versions.map((version, index) => {
              const isSelected = selectedIds.includes(version.id)
              const isLatest = index === 0

              return (
                <div
                  key={version.id}
                  className={`group px-3 py-2.5 border-b transition-colors ${
                    isDark
                      ? `border-white/5 ${
                          isSelected
                            ? 'bg-indigo-900/20'
                            : 'hover:bg-white/5'
                        }`
                      : `border-gray-100 ${
                          isSelected
                            ? 'bg-indigo-50'
                            : 'hover:bg-gray-50'
                        }`
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Checkbox untuk arbitrary compare */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(version.id)}
                      className="mt-0.5 accent-indigo-500 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Nomor versi + label */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-bold ${
                            isDark ? 'text-indigo-400' : 'text-indigo-600'
                          }`}
                        >
                          v{version.version_number}
                        </span>
                        {isLatest && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              isDark
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            Latest
                          </span>
                        )}
                        {version.label && (
                          <span
                            className={`text-xs truncate ${
                              isDark ? 'text-white/50' : 'text-gray-500'
                            }`}
                          >
                            — {version.label}
                          </span>
                        )}
                      </div>

                      {/* Timestamp + author */}
                      <p
                        className={`text-[10px] mt-0.5 ${
                          isDark ? 'text-white/30' : 'text-gray-400'
                        }`}
                      >
                        {formatRelativeTime(version.created_at)}
                        {' · '}
                        {new Date(version.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {version.created_by && (
                          <>
                            {' · '}
                            <span title={version.created_by}>
                              👤 {version.created_by.slice(0, 8)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Tombol restore */}
                    {!isLatest && (
                      <button
                        onClick={() => setRestoreTarget(version)}
                        disabled={isRestoring === version.id}
                        className={`hidden group-hover:inline-flex items-center text-[10px] font-medium px-2 py-1 rounded-md transition-all shrink-0 ${
                          isDark
                            ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
                            : 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100'
                        } disabled:opacity-50`}
                      >
                        {isRestoring === version.id
                          ? 'Restoring...'
                          : '↩ Restore'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className={`w-full py-2.5 text-xs transition-colors ${
                  isDark
                    ? 'text-white/40 hover:text-white/70'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isLoading ? 'Memuat...' : 'Muat lebih banyak ↓'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          className={`px-3 py-2 text-xs border-t ${
            isDark
              ? 'bg-red-950/50 text-red-300 border-red-500/20'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-2 opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Confirm restore dialog */}
      {restoreTarget && (
        <ConfirmDialog
          title={`Restore ke v${restoreTarget.version_number}?`}
          message="Versi saat ini akan tersimpan otomatis sebelum dokumen dikembalikan ke versi yang dipilih."
          confirmLabel="Restore"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={() => executeRestore(restoreTarget)}
          onCancel={() => setRestoreTarget(null)}
        />
      )}
    </div>
  )
}
