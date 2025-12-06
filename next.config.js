/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  // Optimize production builds
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features (optional - uncomment if needed)
  // experimental: {
  //   optimizePackageImports: ['phaser', '@tensorflow/tfjs'],
  // },
};

module.exports = nextConfig;
