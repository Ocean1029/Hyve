/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {},
  // Image optimization settings
  images: {
    domains: ['picsum.photos'], // Allow images from picsum.photos (used in mock data)
  },
};

module.exports = nextConfig;