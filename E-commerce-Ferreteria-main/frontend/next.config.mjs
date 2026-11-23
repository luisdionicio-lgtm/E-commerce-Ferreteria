/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { cpus: 2 },
  async rewrites() {
    const origin = (process.env.API_ORIGIN || 'http://127.0.0.1:3001').replace(/\/$/, '');
    return [{ source: '/api/:path*', destination: `${origin}/api/:path*` }];
  },
};
export default config;
