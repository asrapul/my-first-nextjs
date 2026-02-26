'use client'

import { useTheme } from './ThemeProvider'
import type { CollaboratorPresence } from '@/hooks/useCollaboration'

interface PresenceIndicatorProps {
  collaborators: CollaboratorPresence[]
  isConnected: boolean
  typingUsers?: string[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function PresenceIndicator({ collaborators, isConnected, typingUsers = [] }: PresenceIndicatorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!isConnected) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className={isDark ? 'text-white/40' : 'text-gray-400'}>Connecting...</span>
      </div>
    )
  }

  // Find typing display names
  const typingNames = typingUsers
    .map((uid) => collaborators.find((c) => c.userId === uid)?.displayName)
    .filter(Boolean)

  return (
    <div className="flex items-center gap-2.5">
      {/* Collaborator avatars */}
      {collaborators.length > 0 && (
        <div className="flex -space-x-2">
          {collaborators.map((user) => (
            <div
              key={user.userId}
              title={user.displayName}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 cursor-default transition-transform hover:scale-110 hover:z-10"
              style={{
                backgroundColor: user.color,
                borderColor: isDark ? '#0a0a0f' : '#fff',
              }}
            >
              {getInitials(user.displayName)}
            </div>
          ))}
        </div>
      )}

      {/* Online count */}
      {collaborators.length > 0 && (
        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          {collaborators.length === 1 ? '1 orang lagi di sini' : `${collaborators.length} orang lagi di sini`}
        </span>
      )}

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <span className={`text-xs italic ${isDark ? 'text-violet-300/60' : 'text-violet-500/80'}`}>
          {typingNames.join(', ')} mengetik
          <span className="inline-flex ml-0.5">
            <span className="animate-[bounce_1s_infinite_0ms] inline-block">.</span>
            <span className="animate-[bounce_1s_infinite_200ms] inline-block">.</span>
            <span className="animate-[bounce_1s_infinite_400ms] inline-block">.</span>
          </span>
        </span>
      )}

      {/* Live badge */}
      <div className="flex items-center gap-1 ml-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className={`text-xs font-medium ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/80'}`}>Live</span>
      </div>
    </div>
  )
}
