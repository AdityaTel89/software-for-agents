# Use Node 20 LTS as base
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo configuration and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/mcp-server-notion/package.json ./packages/mcp-server-notion/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/core ./packages/core
COPY packages/mcp-server-notion ./packages/mcp-server-notion

# Build packages
RUN pnpm --filter @agentapi/core build
RUN pnpm --filter mcp-server-notion build

# Prune dev dependencies for the runner stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/mcp-server-notion/package.json ./packages/mcp-server-notion/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built outputs from builder
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/mcp-server-notion/dist ./packages/mcp-server-notion/dist

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "packages/mcp-server-notion/dist/index.js"]
