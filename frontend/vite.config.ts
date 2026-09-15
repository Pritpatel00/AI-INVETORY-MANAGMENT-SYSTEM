import vinext from "vinext";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

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
  <head>
    <meta charset="utf-8">
    <title>Refreshing Nirka Inventory</title>
  </head>
  <body>
    <p>Refreshing the development application...</p>
    <script>
      (async () => {
        const registrations =
          await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map((item) => item.unregister())
        );

        const keys = await caches.keys();

        await Promise.all(
          keys
            .filter((key) =>
              key.startsWith("nirka-inventory-shell-")
            )
            .map((key) => caches.delete(key))
        );

        location.replace(
          "/?development-cache-cleared=" + Date.now()
        );
      })();
    </script>
  </body>
</html>`);
    });
  },
};

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      strictPort: true,
      forwardConsole: false,

      ...(isCodexSeatbeltSandbox
        ? {
            watch: {
              useFsEvents: false,
              usePolling: true,
            },
          }
        : {}),
    },

    plugins: [
      developmentCacheReset,
      vinext(),
      sites(),
      nitro(),
    ],
  };
});