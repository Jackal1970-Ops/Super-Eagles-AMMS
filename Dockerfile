# ========================================================
# Super Eagles Athletics & Membership Management System
# Production Docker Container Specification
# Multi-stage optimized build for Cloud Hosting (AWS, GCP, Railway, Render)
# ========================================================

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Dependencies Stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --prefer-offline --no-audit

# Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production containers target the managed PostgreSQL schema documented below.
# For a local SQLite-only image, build with:
# docker build --build-arg PRISMA_SCHEMA=prisma/schema.prisma .
ARG PRISMA_SCHEMA=prisma/schema.postgresql.prisma
ENV NODE_ENV=production
RUN npx prisma generate --schema=${PRISMA_SCHEMA}
RUN npm run build
# The Prisma CLI and other build-only dependencies are not shipped in the
# runtime image, reducing both image size and attack surface.
RUN npm prune --omit=dev

# Production Runner Stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential runtime files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Set correct user permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Start production server
CMD ["node", "./node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
