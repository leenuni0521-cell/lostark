/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.lostark.game.onstove.com" },
      { protocol: "https", hostname: "**.onstove.com" },
    ],
  },
};

export default nextConfig;
