# Google Cloud Run multi-stage container build
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies needed for build
COPY package.json ./
RUN npm install

# Build static assets (Vite) and bundled backend (esbuild)
COPY . .
RUN npm run build

# Production runtime image
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Cloud Run port (binds to 3000)
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
