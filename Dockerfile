# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runtime

WORKDIR /app

COPY package*.json ./
COPY drizzle.config.ts ./
COPY shared ./shared

# Install all dependencies (need drizzle-kit for migrations)
RUN npm ci

COPY --from=builder /app/dist ./dist

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

# Run migrations (non-interactive, forced) then start the app
CMD ["sh", "-c", "npm run db:push -- --force && node dist/index.cjs"]
