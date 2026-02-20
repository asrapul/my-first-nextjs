import type { NextConfig } from "next";

// Build-time validation for environment variables
if (process.env.NODE_ENV === 'production') {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY'
  ];
  
  console.log('--- VERCEL BUILD ENVIRONMENT VALIDATION ---');
  requiredVars.forEach(v => {
    if (!process.env[v]) {
      console.warn(`⚠️  WARNING: ${v} is missing in build environment!`);
    } else {
      console.log(`✅ ${v} is present.`);
    }
  });
  console.log('--- END VALIDATION ---');
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
