# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder — compile TypeScript
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app/server

# Install dependencies first for better layer caching
COPY server/package*.json ./
RUN npm ci

# Copy source and compile
COPY server/ ./
RUN npx tsc --project tsconfig.json

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime — lean production image
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy compiled output from builder
COPY --from=builder /app/server/dist ./server/dist

# Install production dependencies only
COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix ./server

# Non-root user for security
RUN addgroup -S neural && adduser -S neural -G neural
USER neural

# Health check — uses $PORT at runtime (Cloud Run sets this to 8080)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-3001}/api/health" || exit 1

CMD ["node", "server/dist/index.js"]
