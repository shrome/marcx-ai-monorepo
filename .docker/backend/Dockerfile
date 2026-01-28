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
# Build Packages
# -----------------------------------------------------
FROM deps AS build-packages
WORKDIR /repo
RUN pnpm --filter ./packages/** build

# -----------------------------------------------------
# Build NestJS
# -----------------------------------------------------
FROM deps AS build-backend
WORKDIR /app/apps/backend
RUN pnpm build


# -----------------------------------------------------
# Runtime: NestJS
# -----------------------------------------------------
FROM node:20-alpine AS backend
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build-backend /app/apps/backend/dist ./dist
COPY --from=deps /app/apps/backend/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend/package.json ./

EXPOSE 4000
CMD ["node", "dist/main.js"]
