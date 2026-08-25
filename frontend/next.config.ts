import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway hosts this app as a plain Node server rather than on Vercel or
  // Cloudflare Workers (vinext's native target). "standalone" makes
  // `vinext build` emit a self-hosting bundle at dist/standalone/server.js,
  // started with `node dist/standalone/server.js` and reading PORT/HOST.
  output: "standalone",
};

export default nextConfig;
