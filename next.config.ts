import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship the SQLite migration with the server code; the local .data/ database is created from it.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*.sql"],
  },
};

export default nextConfig;
