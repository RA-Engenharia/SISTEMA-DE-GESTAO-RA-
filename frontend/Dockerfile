# Frontend Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user nginx-user && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
