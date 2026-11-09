import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components hangs page renders on the Cloudflare Workers runtime
  // (opennextjs/opennextjs-cloudflare#1450). Every page is per-user and dynamic
  // anyway, so leave it off until OpenNext supports it.
  cacheComponents: false,
  turbopack: {
    // A package-lock.json in the home folder otherwise makes Next guess the wrong root.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
