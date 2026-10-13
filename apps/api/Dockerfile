# Multi-stage Dockerfile for Fazah Auto Garage API
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm install

# Copy source files
COPY tsconfig*.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package and api
RUN npm run build -w apps/api

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy root package.json and api distribution
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY seed.js ./

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
