# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.13.1
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

# Install dependencies in a separate stage for caching
FROM base AS deps
COPY --link package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --production

# Copy app source code (excluding .env and node_modules)
FROM base AS app
COPY --from=deps /app/node_modules ./node_modules
COPY --link app.js snowflakeQuery.js data.json ./
COPY --link package.json package-lock.json ./

# Create a non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

EXPOSE 5000
CMD ["node", "app.js"]

# .env is NOT copied; pass secrets via environment variables at runtime.
# Ensure .env is in .dockerignore to prevent accidental inclusion.