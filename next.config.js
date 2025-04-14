/** @type {import('next').NextConfig} */
module.exports = {
  /* config options here */
  webpack: (config) => {
    return config;
  },
  images: {
    domains: [
      'via.placeholder.com',
      'placehold.co',
      'placekitten.com',
      'picsum.photos',
      'images.unsplash.com',
      'localhost',
      'encrypted-tbn1.gstatic.com',
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