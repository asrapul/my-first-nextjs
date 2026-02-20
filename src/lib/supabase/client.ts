'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Defer initialization to avoid build-time crashes and use runtime env vars
let clientInstance: SupabaseClient | null = null

const getClient = () => {
  if (clientInstance) return clientInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // In browser: must have both
  if (typeof window !== 'undefined') {
    if (!url || !key) {
      const msg = `Supabase config missing! URL: ${url ? 'OK' : 'MISSING'}, KEY: ${key ? 'OK' : 'MISSING'}. Check Vercel Environment Variables and REDEPLOY.`
      console.error(msg)
      throw new Error(msg)
    }
  } else {
    // During build: return empty if missing (don't fail build)
    if (!url || !key) {
      return {} as SupabaseClient
    }
  }

  clientInstance = createClient(url!, key!, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  })
  
  console.log('--- SUPABASE CLIENT INITIALIZED ---')
  return clientInstance
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getClient()
    return (client as any)[prop]
  },
})

