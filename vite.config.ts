import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const developmentCacheReset = {
  name: "nirka-development-cache-reset",
  configureServer(server: {
    middlewares: {
      use: (
        handler: (
          request: { url?: string },
          response: {
            statusCode: number;
            setHeader: (name: string, value: string) => void;
            end: (body: string) => void;
          },
          next: () => void,
        ) => void,
      ) => void;
    };
  }) {
    server.middlewares.use((request, response, next) => {
      if (!request.url?.startsWith("/__clear-development-cache")) {
        next();
        return;
      }

      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.setHeader("Cache-Control", "no-store");
      response.end(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Refreshing Nirka Inventory</title></head>
  <body>
    <p>Refreshing the development application...</p>
    <script>
      (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((item) => item.unregister()));
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("nirka-inventory-shell-"))
            .map((key) => caches.delete(key)),
        );
        location.replace("/?development-cache-cleared=" + Date.now());
      })();
    </script>
  </body>
</html>`);
    });
  },
};

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      // The app must run on port 3002: the Keycloak realm, the NestJS API
      // CORS origin and the project docs all expect http://localhost:3002.
      port: 3002,
      strictPort: true,
      // Vite's dev client auto-forwards console errors to the dev server over
      // its HMR WebSocket. If an error fires before the socket is connected,
      // the relay crashes with `Cannot read properties of undefined (reading
      // "send")`. The app handles its own errors, so disable the relay.
      forwardConsole: false,
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      developmentCacheReset,
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
