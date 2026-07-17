# ─────────────────────────────────────────────────────────
# Stage 1: Build — compile client (Vite) + server (esbuild)
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────
# Stage 2: Runtime — minimal image, no devDeps, no source
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output (server bundle + client assets + OG fonts)
COPY --from=builder /app/dist ./dist

# Railway injects PORT at runtime; 5000 is the local fallback
EXPOSE 5000
ENV NODE_ENV=production

# Table creation/migrations run automatically inside the app on startup
# (server/index.ts → ensureTablesExist). No separate db:push step needed.
CMD ["node", "dist/index.cjs"]
