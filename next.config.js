/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization (tetap)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    // Matikan optimasi sementara jika sering error image
    unoptimized: process.env.NODE_ENV === 'production',
  },
  
  // Environment variables (tetap)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // HAPUS: eslint (sudah tidak didukung)
  // HAPUS: swcMinify (sudah default)
  
  // Gunakan Turbopack (wajib untuk Next.js 16+)
  turbopack: {
    // Konfigurasi kosong agar error webpack hilang
    // Atau isi sesuai kebutuhan, misal:
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  
  // Output standalone untuk optimasi Vercel
  output: 'standalone',
  
  // Compiler options (aman)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers untuk CORS (tetap)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;