/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    // 如果使用云存储服务，在这里添加图片域名
  },
  // 配置OpenAI API代理，避免CORS问题
  async rewrites() {
    return [
      {
        source: '/api/openai/:path*',
        destination: 'https://api.openai.com/:path*',
      },
    ];
  },
};

export default nextConfig;
