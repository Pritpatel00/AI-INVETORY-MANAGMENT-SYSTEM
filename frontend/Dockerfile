# Production image for the vinext (Next.js-on-Vite) frontend.
# Runs as a plain Node server (frontend/next.config.ts sets output: "standalone"),
# not on Vercel or Cloudflare Workers.
#
# IMPORTANT: build context must be the REPOSITORY ROOT, not frontend/.
# frontend/package.json depends on "inventory-management-workspace": "file:..",
# so the workspace root package.json must be reachable during npm ci.
# On Railway: set this service's "Root Directory" to the repo root, and
# point the Dockerfile path at frontend/Dockerfile.
#
#   docker build -f frontend/Dockerfile .

FROM node:22.13-bookworm-slim AS base
WORKDIR /repo

# --- deps ---
FROM base AS deps
COPY package.json ./package.json
COPY frontend/package.json frontend/package-lock.json ./frontend/
WORKDIR /repo/frontend
RUN npm ci

# --- build ---
FROM base AS build
COPY package.json ./package.json
COPY frontend ./frontend
COPY --from=deps /repo/frontend/node_modules ./frontend/node_modules
WORKDIR /repo/frontend
ENV NODE_ENV=production
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they must be passed as build args, not just runtime env vars.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_KEYCLOAK_URL=${NEXT_PUBLIC_KEYCLOAK_URL}
ENV NEXT_PUBLIC_KEYCLOAK_REALM=${NEXT_PUBLIC_KEYCLOAK_REALM}
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=${NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}
RUN npm run build

# --- runtime: only the standalone output, non-root user ---
FROM node:22.13-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system nirka && useradd --system --gid nirka --home /app nirka

COPY --from=build /repo/frontend/dist/standalone ./
COPY --from=build /repo/frontend/public ./public

USER nirka

# Railway injects PORT; vinext's standalone server reads PORT/HOST.
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "server.js"]
