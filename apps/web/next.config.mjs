/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  logging:{
    incomingRequests: true,
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    }
  },
  transpilePackages: ["@marcx/db"],
  output: "standalone",
}

export default nextConfig
