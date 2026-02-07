/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    qualities: [75, 100],
  },
  // Transpile workspace packages (works with both webpack and turbopack)
  transpilePackages: [
    '@hyve/types',
    '@hyve/utils',
    '@hyve/ui',
  ],
  // Webpack configuration (used when --webpack flag is specified)
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules',
        '**/.git',
        '**/OrbStack/**',
        '/Users/huan_hsuan/OrbStack'
      ]
    };
    
    // Support for workspace packages
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },
  // Turbopack configuration (for future migration)
  turbopack: {},
};

module.exports = nextConfig;