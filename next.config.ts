import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/geracao': ['./templates/**/*'],
    '/api/contagem-prazo': ['./templates/**/*'],
  },
};

export default nextConfig;
