'use client'

import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
        theme === 'dark'
          ? 'bg-[#6B4C52]/50 hover:bg-[#6B4C52] text-[#E8D4D8]'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      }`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    >
      <span className="text-lg">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  )
}
