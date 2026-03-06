'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getVersionContent, type DocumentVersion } from '@/lib/versions'
import { computeDiff, type DiffLine, type DiffResult } from '@/lib/diff'
import { useTheme } from './ThemeProvider'

interface DiffModalProps {
  versionIdA: string // versi LAMA
  versionIdB: string // versi BARU
  onClose: () => void
}

type ViewMode = 'split' | 'unified'

export function DiffModal({ versionIdA, versionIdB, onClose }: DiffModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [versionA, setVersionA] = useState<DocumentVersion | null>(null)
  const [versionB, setVersionB] = useState<DocumentVersion | null>(null)
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0)

  const changeRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        const [a, b] = await Promise.all([
          getVersionContent(versionIdA),
          getVersionContent(versionIdB),
        ])

        // Pastikan A adalah yang lebih lama (version_number lebih kecil)
        const [older, newer] =
          a.version_number < b.version_number ? [a, b] : [b, a]

        setVersionA(older)
        setVersionB(newer)
        setDiffResult(computeDiff(older.content, newer.content))
      } catch (err) {
        console.error('Failed to load diff:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [versionIdA, versionIdB])

  // Indeks baris yang merupakan perubahan (added atau removed)
  const changeLineIndices =
    diffResult?.lines
      .map((line, i) => (line.type !== 'unchanged' ? i : -1))
      .filter((i) => i !== -1) ?? []

  const scrollToChange = useCallback(
    (index: number) => {
      const lineIndex = changeLineIndices[index]
      if (lineIndex !== undefined) {
        const el = changeRefs.current[lineIndex]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    },
    [changeLineIndices]
  )

  function goToNextChange() {
    const next = Math.min(
      currentChangeIndex + 1,
      changeLineIndices.length - 1
    )
    setCurrentChangeIndex(next)
    scrollToChange(next)
  }

  function goToPrevChange() {
    const prev = Math.max(currentChangeIndex - 1, 0)
    setCurrentChangeIndex(prev)
    scrollToChange(prev)
  }

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Warna latar per tipe baris
  function getLineBg(type: DiffLine['type']) {
    if (isDark) {
      switch (type) {
        case 'added':
          return 'bg-emerald-950/60 border-l-2 border-emerald-500'
        case 'removed':
          return 'bg-red-950/60 border-l-2 border-red-500'
        default:
          return ''
      }
    } else {
      switch (type) {
        case 'added':
          return 'bg-emerald-50 border-l-2 border-emerald-500'
        case 'removed':
          return 'bg-red-50 border-l-2 border-red-500'
        default:
          return ''
      }
    }
  }

  function getLineTextColor(type: DiffLine['type']) {
    if (isDark) {
      switch (type) {
        case 'added':
          return 'text-emerald-300'
        case 'removed':
          return 'text-red-300 line-through opacity-75'
        default:
          return 'text-gray-300'
      }
    } else {
      switch (type) {
        case 'added':
          return 'text-emerald-800'
        case 'removed':
          return 'text-red-700 line-through opacity-75'
        default:
          return 'text-gray-700'
      }
    }
  }

  function getLinePrefix(type: DiffLine['type']) {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      default:
        return ' '
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className={`rounded-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border ${
          isDark
            ? 'bg-gray-900 border-white/10'
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
            isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <h2
              className={`font-bold text-sm ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {versionA && versionB
                ? `v${versionA.version_number} → v${versionB.version_number}`
                : 'Memuat diff...'}
            </h2>

            {diffResult && (
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    isDark
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  +{diffResult.stats.added}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    isDark
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  -{diffResult.stats.removed}
                </span>
                <span
                  className={`${isDark ? 'text-white/40' : 'text-gray-400'}`}
                >
                  {diffResult.stats.unchanged} unchanged
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation perubahan */}
            {changeLineIndices.length > 0 && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  isDark ? 'text-white/50' : 'text-gray-500'
                }`}
              >
                <button
                  onClick={goToPrevChange}
                  disabled={currentChangeIndex === 0}
                  className={`px-2 py-1 rounded transition-all disabled:opacity-30 ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  ↑
                </button>
                <span className="font-medium tabular-nums">
                  {currentChangeIndex + 1} / {changeLineIndices.length}
                </span>
                <button
                  onClick={goToNextChange}
                  disabled={
                    currentChangeIndex === changeLineIndices.length - 1
                  }
                  className={`px-2 py-1 rounded transition-all disabled:opacity-30 ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  ↓
                </button>
              </div>
            )}

            {/* Toggle view mode */}
            <div
              className={`flex rounded-lg overflow-hidden text-xs border ${
                isDark ? 'border-white/10' : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 font-medium transition-all ${
                  viewMode === 'split'
                    ? isDark
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-500 text-white'
                    : isDark
                    ? 'bg-white/5 text-white/60 hover:bg-white/10'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1 font-medium transition-all ${
                  viewMode === 'unified'
                    ? isDark
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-500 text-white'
                    : isDark
                    ? 'bg-white/5 text-white/60 hover:bg-white/10'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Unified
              </button>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-all ${
                isDark
                  ? 'text-white/50 hover:text-white hover:bg-white/10'
                  : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div
              className={`flex flex-col items-center justify-center h-full gap-3 ${
                isDark ? 'text-white/40' : 'text-gray-400'
              }`}
            >
              <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
              <span className="text-sm">Menghitung perbedaan...</span>
            </div>
          ) : !diffResult ? (
            <div className="flex items-center justify-center h-full text-red-400">
              Gagal memuat diff
            </div>
          ) : diffResult.stats.added === 0 &&
            diffResult.stats.removed === 0 ? (
            <div
              className={`flex flex-col items-center justify-center h-full gap-2 ${
                isDark ? 'text-white/40' : 'text-gray-400'
              }`}
            >
              <span className="text-3xl">✅</span>
              <span className="text-sm font-medium">
                Tidak ada perbedaan
              </span>
            </div>
          ) : viewMode === 'unified' ? (
            // ── UNIFIED VIEW ──────────────────────────────────
            <div className="font-mono text-sm">
              {/* Header kolom */}
              <div
                className={`sticky top-0 grid grid-cols-[4rem_4rem_1fr] text-xs px-2 py-1.5 border-b z-10 ${
                  isDark
                    ? 'bg-gray-800 text-white/40 border-white/10'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                <span>Lama</span>
                <span>Baru</span>
                <span>Konten</span>
              </div>

              {diffResult.lines.map((line, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    changeRefs.current[i] = el
                  }}
                  className={`grid grid-cols-[4rem_4rem_1fr] ${getLineBg(
                    line.type
                  )}`}
                >
                  <span
                    className={`text-xs px-2 py-0.5 select-none text-right ${
                      isDark ? 'text-white/20' : 'text-gray-400'
                    }`}
                  >
                    {line.lineNumberOld ?? ''}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 select-none text-right ${
                      isDark ? 'text-white/20' : 'text-gray-400'
                    }`}
                  >
                    {line.lineNumberNew ?? ''}
                  </span>
                  <span
                    className={`px-2 py-0.5 whitespace-pre-wrap break-all ${getLineTextColor(
                      line.type
                    )}`}
                  >
                    <span className="select-none mr-2 opacity-60">
                      {getLinePrefix(line.type)}
                    </span>
                    {line.content}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            // ── SPLIT VIEW ────────────────────────────────────
            <div
              className={`grid grid-cols-2 divide-x h-full font-mono text-sm ${
                isDark ? 'divide-white/10' : 'divide-gray-200'
              }`}
            >
              {/* Panel kiri: versi LAMA */}
              <div className="overflow-auto">
                <div
                  className={`sticky top-0 px-3 py-1.5 text-xs border-b z-10 font-medium ${
                    isDark
                      ? 'bg-gray-800 text-red-400 border-white/10'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}
                >
                  v{versionA?.version_number} —{' '}
                  {versionA?.label ?? 'Versi Lama'}
                  {versionA && (
                    <span
                      className={`ml-2 ${
                        isDark ? 'text-white/30' : 'text-gray-400'
                      }`}
                    >
                      {new Date(versionA.created_at).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
                {diffResult.lines
                  .filter((l) => l.type !== 'added')
                  .map((line, i) => (
                    <div
                      key={i}
                      ref={(el) => {
                        if (line.type === 'removed') {
                          const origIndex = diffResult.lines.indexOf(line)
                          changeRefs.current[origIndex] = el
                        }
                      }}
                      className={`flex ${getLineBg(line.type)}`}
                    >
                      <span
                        className={`text-xs px-2 py-0.5 select-none w-12 text-right shrink-0 ${
                          isDark ? 'text-white/20' : 'text-gray-400'
                        }`}
                      >
                        {line.lineNumberOld}
                      </span>
                      <span
                        className={`px-2 py-0.5 whitespace-pre-wrap break-all flex-1 ${getLineTextColor(
                          line.type
                        )}`}
                      >
                        {line.content}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Panel kanan: versi BARU */}
              <div className="overflow-auto">
                <div
                  className={`sticky top-0 px-3 py-1.5 text-xs border-b z-10 font-medium ${
                    isDark
                      ? 'bg-gray-800 text-emerald-400 border-white/10'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  v{versionB?.version_number} —{' '}
                  {versionB?.label ?? 'Versi Baru'}
                  {versionB && (
                    <span
                      className={`ml-2 ${
                        isDark ? 'text-white/30' : 'text-gray-400'
                      }`}
                    >
                      {new Date(versionB.created_at).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
                {diffResult.lines
                  .filter((l) => l.type !== 'removed')
                  .map((line, i) => (
                    <div
                      key={i}
                      ref={(el) => {
                        if (line.type === 'added') {
                          const origIndex = diffResult.lines.indexOf(line)
                          changeRefs.current[origIndex] = el
                        }
                      }}
                      className={`flex ${getLineBg(line.type)}`}
                    >
                      <span
                        className={`text-xs px-2 py-0.5 select-none w-12 text-right shrink-0 ${
                          isDark ? 'text-white/20' : 'text-gray-400'
                        }`}
                      >
                        {line.lineNumberNew}
                      </span>
                      <span
                        className={`px-2 py-0.5 whitespace-pre-wrap break-all flex-1 ${getLineTextColor(
                          line.type
                        )}`}
                      >
                        {line.content}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
