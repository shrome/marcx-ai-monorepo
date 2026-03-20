/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@marcx/db"],
  output: "standalone",
  env: {
    API_URL: process.env.API_URL ?? "http://localhost:4000",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000",
  },
}

export default nextConfig
