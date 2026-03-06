'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from './ThemeProvider'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // Focus confirm button on mount, close on Escape
  useEffect(() => {
    confirmBtnRef.current?.focus()
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const isDanger = variant === 'danger'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl border transition-all animate-in fade-in zoom-in-95 ${
          isDark
            ? 'bg-gray-900 border-white/10'
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Icon */}
        <div
          className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
            isDanger
              ? isDark
                ? 'bg-red-500/20'
                : 'bg-red-50'
              : isDark
              ? 'bg-indigo-500/20'
              : 'bg-indigo-50'
          }`}
        >
          {isDanger ? (
            <svg
              className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ) : (
            <svg
              className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        <h3
          className={`text-center text-lg font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-center text-sm mb-6 ${
            isDark ? 'text-white/60' : 'text-gray-500'
          }`}
        >
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isDark
                ? 'bg-white/10 text-white/70 hover:bg-white/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all text-white ${
              isDanger
                ? isDark
                  ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
                  : 'bg-red-500 hover:bg-red-600 shadow-md shadow-red-300/30'
                : isDark
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-300/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
