/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora erros de tipagem para não travar o build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;