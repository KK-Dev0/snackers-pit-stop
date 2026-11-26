import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // The public landing page is a self-contained static file. It needs no
    // client runtime, which keeps the mobile Lighthouse path fast and simple.
    return {
      beforeFiles: [{ source: "/", destination: "/landing.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
