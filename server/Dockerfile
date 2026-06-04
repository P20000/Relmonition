# Use Node 22 (LTS) on Debian Slim for a small, secure, glibc-compatible image
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY server/package*.json ./
RUN npm install

# Copy the server source code
COPY server/ ./
RUN npm run build

# Use a runner image that includes devops tools
FROM node:22-slim AS runner
WORKDIR /app

# Install required DevOps tools: curl, unzip, ca-certificates, git
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/v1.30.0/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Install Helm
RUN curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 && \
    chmod 700 get_helm.sh && \
    ./get_helm.sh && \
    rm get_helm.sh

# Copy production dependencies and build output from server
COPY --from=builder /app/node_modules ./server/node_modules
COPY --from=builder /app/dist ./server/dist
COPY --from=builder /app/package.json ./server/package.json

# Copy deployment scripts and Helm charts from context
COPY deploy.sh ./deploy.sh
COPY charts/ ./charts/

# Ensure deploy.sh is executable
RUN chmod +x ./deploy.sh

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
