/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir setting - it's enabled by default in Next.js 13+
  
  // TypeScript configuration
  // Next.js will respect tsconfig.json exclude patterns during build
  // Unused UI components are excluded in tsconfig.json to avoid missing dependency errors
  typescript: {
    // Keep type checking enabled - unused components are excluded via tsconfig.json
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
