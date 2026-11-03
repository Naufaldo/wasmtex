# Stage 1: Build Application
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files & public assets
COPY . .

# Build static bundle to dist/
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Clean default configuration and html
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy built web application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration with COOP/COEP headers and TeX Live proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
