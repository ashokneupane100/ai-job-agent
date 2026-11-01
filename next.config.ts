import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    serverActions: {
      // Resume PDFs are uploaded through a Server Action.
      bodySizeLimit: "12mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Without an explicit root, Turbopack walks up and finds the stray
    // package-lock.json in the home directory, which logs a warning.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
