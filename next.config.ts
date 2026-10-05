import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (local dev database) ships WebAssembly and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
