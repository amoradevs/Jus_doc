import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/geracao': ['./templates/**/*'],
    '/api/contagem-prazo': ['./templates/**/*'],
  },
  serverExternalPackages: ['docxtemplater-image-module-free'],
};

export default nextConfig;
