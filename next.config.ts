import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fail if variables are missing
  images: {
    unoptimized: true
  }
};

// Build-time validation for environment variables
if (process.env.NODE_ENV === 'production') {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY'
  ];
  
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    const errorMsg = `\n\n❌ DEPLOYMENT FAILED: Missing environment variables: ${missing.join(', ')}\n` +
                     `👉 Fix this in Vercel Dashboard > Settings > Environment Variables.\n` +
                     `👉 Make sure to check "Production", "Preview", AND "Development" environments.\n\n`;
    console.error(errorMsg);
    // Hard fail the build by throwing an error
    throw new Error(errorMsg);
  }
}

export default nextConfig;
