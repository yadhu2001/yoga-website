import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The database migration is read at runtime to set up an empty Turso database,
  // so ship it with every server function.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*.sql"],
  },
};

export default nextConfig;
