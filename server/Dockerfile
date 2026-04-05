# Use Node 22 (LTS) on Alpine for a small, secure image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Use a minimal runner image
FROM node:22-alpine AS runner
WORKDIR /app

# Only copy the production dependencies and the build output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001
CMD ["node", "dist/index.js"]
