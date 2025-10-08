# Multi-stage Dockerfile for GramCare Server

# =============================================================================
# Base Stage - Common dependencies
# =============================================================================
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gramcare -u 1001

# =============================================================================
# Dependencies Stage - Install and cache dependencies
# =============================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Install development dependencies (for building)
RUN npm ci && npm cache clean --force

# =============================================================================
# Development Stage - For local development
# =============================================================================
FROM base AS development

# Copy dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Change ownership to nodejs user
RUN chown -R gramcare:nodejs /app
USER gramcare

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# =============================================================================
# Build Stage - Build the application
# =============================================================================
FROM dependencies AS build

# Copy source code
COPY . .

# Build application (if you have a build step)
# RUN npm run build

# Remove development dependencies
RUN npm prune --production

# =============================================================================
# Production Stage - Final production image
# =============================================================================
FROM node:18-alpine AS production

# Install production system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gramcare -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=build --chown=gramcare:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=gramcare:nodejs . .

# Create necessary directories
RUN mkdir -p logs uploads temp && \
    chown -R gramcare:nodejs logs uploads temp

# Switch to non-root user
USER gramcare

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD ["npm", "start"]

# =============================================================================
# Metadata
# =============================================================================
LABEL maintainer="GramCare Team <team@gramcare.health>"
LABEL version="1.0.0"
LABEL description="GramCare Multilingual AI Health Chatbot - Server"
LABEL org.opencontainers.image.source="https://github.com/your-username/gramcare"
LABEL org.opencontainers.image.documentation="https://github.com/your-username/gramcare/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"