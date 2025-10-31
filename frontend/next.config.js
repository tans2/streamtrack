/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir setting - it's enabled by default in Next.js 13+
  
  // TypeScript configuration
  // Unused UI components with missing dependencies are excluded in tsconfig.json
  // These components are Shadcn UI components that require additional packages:
  // - form.tsx → react-hook-form
  // - calendar.tsx → react-day-picker  
  // - carousel.tsx → embla-carousel-react
  // - chart.tsx → recharts
  // - command.tsx → cmdk
  // - drawer.tsx → vaul
  // - input-otp.tsx → input-otp
  // - resizable.tsx → react-resizable-panels
  typescript: {
    // Keep type checking enabled - unused components are excluded via tsconfig.json
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
