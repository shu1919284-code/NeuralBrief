# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder — install deps and verify tsx
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app/server

# Install dependencies
COPY server/package*.json ./
RUN npm ci

# Copy source files
COPY server/ ./

# Install tsx globally and verify
RUN npm install -g tsx && tsx --version

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime — lean production image
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy source files from builder
COPY --from=builder /app/server ./server

# Install production dependencies
COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix ./server

# Install tsx for runtime execution
RUN npm install -g tsx

WORKDIR /app/server

# Non-root user for security
RUN addgroup -S neural && adduser -S neural -G neural
RUN chown -R neural:neural /app
USER neural

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-3001}/api/health" || exit 1

CMD ["npx", "tsx", "index.ts"]