import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Banking app is session-driven; cache components don't fit a per-user app */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
