/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@telegram-apps/sdk'],
  allowedDevOrigins: ['a748857c9051ca.lhr.life', '*.lhr.life', '*.trycloudflare.com', '*.localhost.run'],
  images: {
    domains: ['t.me', 'cdn.cashflow.app'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
