# Dockerfile for Next.js Application

# ---- Base Stage ----
# Base image with pnpm installed globally
FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# ---- Dependencies Stage ----
# Install dependencies in a separate layer to leverage Docker's caching.
FROM base AS deps
# Disable git hooks during container builds
ENV HUSKY=0
COPY package.json pnpm-lock.yaml ./
# prisma generate is often executed on install; ensure schema is available
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod --ignore-scripts
RUN pnpm prisma generate

# ---- Builder Stage ----
# Build the Next.js application.
FROM base AS builder
ENV HUSKY=0
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm prisma generate
COPY . .
RUN pnpm build

# ---- Runner Stage ----
# Create the final, lightweight production image.
FROM base AS runner
ENV NODE_ENV=production

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy production node_modules from the dependencies stage
COPY --from=deps /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

# Use an existing non-root user from the base image
USER node

# The command to run the application
CMD ["pnpm", "start"]
