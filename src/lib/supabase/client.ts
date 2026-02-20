import { createClient, SupabaseClient } from '@supabase/supabase-js'

// We wrap the Supabase client in a Proxy to allow for lazy initialization.
// This prevents build errors on Vercel where env vars might be missing during prerendering,
// while ensuring the client is correctly initialized at runtime.
let clientInstance: SupabaseClient | null = null

const getClient = () => {
  if (clientInstance) return clientInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, if vars are missing, we return a dummy client or throw a late error
    // but we don't crash the build process itself.
    if (typeof window === 'undefined') {
        // Return a dummy client shape to satisfy types during build
        return {} as SupabaseClient
    }
    throw new Error('Supabase environment variables are missing. Please check your Vercel settings.')
  }

  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
  return clientInstance
}

// Export a Proxy that intercepts all property access and delegates to the lazy-initialized client
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getClient()
    return (client as any)[prop]
  },
})

