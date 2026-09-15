[1mdiff --git a/frontend/app/globals.css b/frontend/app/globals.css[m
[1mindex 8efe732..e5d6595 100644[m
[1m--- a/frontend/app/globals.css[m
[1m+++ b/frontend/app/globals.css[m
[36m@@ -1,4 +1,4 @@[m
[31m-@import "tailwindcss";[m
[32m+[m[32m@import "tailwindcss/index.css";[m
 [m
 :root {[m
   --background: #eef3f9;[m
[1mdiff --git a/frontend/vite.config.ts b/frontend/vite.config.ts[m
[1mindex c2d303f..dc5241b 100644[m
[1m--- a/frontend/vite.config.ts[m
[1m+++ b/frontend/vite.config.ts[m
[36m@@ -1,4 +1,5 @@[m
 import vinext from "vinext";[m
[32m+[m[32mimport { nitro } from "nitro/vite";[m
 import { defineConfig } from "vite";[m
 import { sites } from "./build/sites-vite-plugin";[m
 [m
[36m@@ -92,6 +93,7 @@[m [mexport default defineConfig(() => {[m
       developmentCacheReset,[m
       vinext(),[m
       sites(),[m
[32m+[m[32m      nitro(),[m
     ],[m
   };[m
 });[m
\ No newline at end of file[m
