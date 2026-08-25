# Production image for the NestJS inventory API.
#
# IMPORTANT: build context must be the REPOSITORY ROOT, not backend/api/.
# backend/api/package.json depends on "inventory-management-workspace":
# "file:../..", so the workspace root package.json must be reachable
# during npm ci. On Railway: set this service's "Root Directory" to the
# repo root, and point the Dockerfile path at backend/api/Dockerfile.
#
#   docker build -f backend/api/Dockerfile .

FROM node:22.13-bookworm-slim AS base
WORKDIR /repo
# Prisma's query engine needs openssl at runtime on Debian.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# --- deps ---
FROM base AS deps
COPY package.json ./package.json
COPY backend/api/package.json backend/api/package-lock.json ./backend/api/
WORKDIR /repo/backend/api
RUN npm ci

# --- build ---
FROM base AS build
COPY package.json ./package.json
COPY backend/api ./backend/api
COPY --from=deps /repo/backend/api/node_modules ./backend/api/node_modules
WORKDIR /repo/backend/api
RUN npm run db:generate
RUN npm run build

# --- prod deps only (smaller runtime image) ---
FROM base AS prod-deps
COPY package.json ./package.json
COPY backend/api/package.json backend/api/package-lock.json ./backend/api/
WORKDIR /repo/backend/api
RUN npm ci --omit=dev
# The Prisma client generated against devDependencies' prisma CLI must be
# regenerated here too, since generate writes into node_modules/@prisma/client.
COPY backend/api/prisma ./prisma
RUN npx prisma generate

# --- runtime ---
FROM node:22.13-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
RUN groupadd --system nirka && useradd --system --gid nirka --home /app nirka

COPY --from=prod-deps /repo/backend/api/node_modules ./node_modules
COPY --from=build /repo/backend/api/dist ./dist
COPY --from=build /repo/backend/api/prisma ./prisma
COPY --from=build /repo/backend/api/package.json ./package.json

# Evidence storage volume mount point (see EVIDENCE_STORAGE_PATH).
RUN mkdir -p /app/evidence && chown -R nirka:nirka /app

USER nirka

# Railway injects PORT; main.ts reads it (defaults to 4000).
EXPOSE 4000

# Run pending migrations, then start. Uses `migrate deploy`, never
# `migrate dev`, and never seeds or resets data automatically.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
