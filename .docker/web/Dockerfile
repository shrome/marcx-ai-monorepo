# -----------------------------------------------------
# Base
# -----------------------------------------------------
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# -----------------------------------------------------
# Dependencies (cached)
# -----------------------------------------------------
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# -----------------------------------------------------
# Build Next.js
# -----------------------------------------------------
FROM deps AS build-web
WORKDIR /app/apps/web
RUN pnpm build

# -----------------------------------------------------
# Runtime: Next.js
# -----------------------------------------------------
FROM node:20-alpine AS web
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build-web /app/apps/web/.next/standalone ./
COPY --from=build-web /app/apps/web/.next/static ./.next/static
COPY --from=build-web /app/apps/web/public ./public

EXPOSE 3000
CMD ["node", "server.js"]

