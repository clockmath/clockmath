/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
    // Note: GEOAPIFY_KEY is intentionally NOT exposed to client-side
    // It's only available server-side via /api/places proxy
  },
  // Note: For static export, redirects and canonical enforcement 
  // must be handled at the hosting level (Netlify, Cloudflare, etc.)
}

export default nextConfig
