const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicit webpack path alias configuration
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },

  experimental: {
    serverComponentsExternalPackages: [],
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
