# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.13.1

# --- Build Stage ---
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source & build
COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Install serve globally as root
RUN npm install -g serve

# Create non-root user and switch
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Copy built assets and required files
COPY --from=builder /app/build ./build

# Expose port and set ENV
ENV NODE_ENV=production
EXPOSE 3000

# Serve the build
CMD ["serve", "-s", "build", "-l", "3000"]
