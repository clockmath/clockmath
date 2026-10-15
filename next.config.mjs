/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  env: {
    // Make GA_ID available on client-side during build
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    // Build day (YYYY-MM-DD) for pre-mount placeholder dates — see lib/buildDay.ts
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
    // Note: GEOAPIFY_KEY is intentionally NOT exposed to client-side
    // It's only available server-side via /api/places proxy
  },
  // Note: For static export, redirects and canonical enforcement 
  // must be handled at the hosting level (Netlify, Cloudflare, etc.)
}

export default nextConfig
