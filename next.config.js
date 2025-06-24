/** @type {import('next').NextConfig} */
module.exports = {
  /* config options here */
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Improve build performance and bundle size
  webpack: (config, { isServer }) => {
    // Reduce bundle size by splitting chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            priority: 10,
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  
  // Enable compression and performance optimizations
  compress: true,
  poweredByHeader: false,
  
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow local uploads from /uploads path
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
        pathname: '/uploads/**',
      },
    ],
    domains: [
      'via.placeholder.com',
      'placehold.co',
      'placekitten.com',
      'picsum.photos',
      'images.unsplash.com',
      'localhost',
      'encrypted-tbn0.gstatic.com',
      'encrypted-tbn1.gstatic.com',
      'static.ticimax.cloud',
      // Google domains
      'lh3.googleusercontent.com',
      'storage.googleapis.com',
      // Common image hosts
      'i.imgur.com',
      'imgur.com',
      'res.cloudinary.com',
      'media.istockphoto.com',
      'images.pexels.com',
      'img.freepik.com',
      'raw.githubusercontent.com',
      'drive.google.com',
      // Turkish e-commerce sites
      'cdn.dsmcdn.com',              // Trendyol
      'productimages.hepsiburada.net', // Hepsiburada
      'images.hepsiburada.net',      // Hepsiburada alternative
      'n11scdn.akamaized.net',       // N11
      'n11scdn4.akamaized.net',      // N11 alternative
      'img-ozdilek.mncdn.com',       // Özdilek
      'cdn.vatanbilgisayar.com',     // Vatan Computer
      'mcdn01.gittigidiyor.net',     // GittiGidiyor
      'st1.myideasoft.com',          // Many Turkish stores
      'st2.myideasoft.com',          // Many Turkish stores
      'st3.myideasoft.com',          // Many Turkish stores
      'cdn03.ciceksepeti.com',       // Çiçeksepeti
      'images.migros.com.tr',        // Migros
      // E-commerce platforms
      'cdn.shopify.com'              // Shopify
    ],
  }
} 