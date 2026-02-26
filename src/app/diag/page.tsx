'use client'

import { useState, useEffect } from 'react'

export default function DiagPage() {
  const [vars, setVars] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present (Hidden for security)' : 'Missing',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Present (Should not be public!)' : 'Missing (Expected on client)'
    })
  }, [])

  return (
    <div className="p-8 font-mono bg-black text-green-500 min-h-screen">
      <h1 className="text-2xl mb-4 border-b border-green-900 pb-2">🔍 System Diagnostics</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-blue-400">Environment Variables (Client Side)</h2>
          <pre className="bg-gray-900 p-4 rounded mt-2 overflow-auto">
            {JSON.stringify(vars, null, 2)}
          </pre>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Note: NEXT_PUBLIC_ variables must be available in the browser.</p>
          <p>If these are &apos;undefined&apos;, they were not correctly inlined during build-time.</p>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-600 text-black px-4 py-2 rounded hover:bg-green-500 font-bold"
        >
          Refresh Diagnostic
        </button>
      </div>
    </div>
  )
}
