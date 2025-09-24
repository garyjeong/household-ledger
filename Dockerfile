# Dockerfile for Next.js Application

# ---- Base Stage ----
# Base image with pnpm installed globally
FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# ensure lifecycle scripts (e.g., husky) never run during container installs
ENV PNPM_IGNORE_SCRIPTS=true \
    HUSKY=0 \
    HUSKY_SKIP_INSTALL=1 \
    ESLINT_NO_DEV_ERRORS=true \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=true
RUN corepack enable

WORKDIR /app

# ---- Dependencies Stage ----
# Install dependencies in a separate layer to leverage Docker's caching.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# prisma schema available but we don't run generate here
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod --ignore-scripts

# ---- Builder Stage ----
# Build the Next.js application.
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
# strip prepare/postinstall to avoid invoking husky in CI
RUN node -e "const fs=require('fs');const p=require('./package.json');if(p.scripts){delete p.scripts.prepare;delete p.scripts.postinstall;}fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm prisma generate
COPY . .
# Use explicit build command without turbopack and disable ESLint
RUN pnpm prisma generate && ESLINT_NO_DEV_ERRORS=true npx next build --no-lint

# ---- Runner Stage ----
# Create the final, lightweight production image.
FROM base AS runner
ENV NODE_ENV=production

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy node_modules from builder so generated Prisma client (node_modules/.prisma) is included
COPY --from=builder /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

# Use an existing non-root user from the base image
USER node

# The command to run the application
CMD ["pnpm", "start"]
