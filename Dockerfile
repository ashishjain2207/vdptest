# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Build arg for npm authentication token (GitHub Packages)
ARG NPM_TOKEN
# Create .npmrc for GitHub Packages authentication
RUN if [ -n "$NPM_TOKEN" ]; then \
      echo "@imriva:registry=https://npm.pkg.github.com" > .npmrc && \
      echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" >> .npmrc; \
    fi

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for dev environment (can use --mode development for dev builds)
ARG BUILD_MODE=production
# Vite environment variables (must be available at build time)
ARG VITE_OIDC_ISSUER
ARG VITE_OIDC_CLIENT_ID
ARG VITE_OIDC_REDIRECT_URI
ARG VITE_OIDC_SCOPE
ARG VITE_API_BASE_URL
ARG VITE_APPINSIGHTS_CONNECTION_STRING
ARG VITE_APPINSIGHTS_CLOUD_ROLE

# Set as environment variables for Vite build
ENV VITE_OIDC_ISSUER=${VITE_OIDC_ISSUER}
ENV VITE_OIDC_CLIENT_ID=${VITE_OIDC_CLIENT_ID}
ENV VITE_OIDC_REDIRECT_URI=${VITE_OIDC_REDIRECT_URI}
ENV VITE_OIDC_SCOPE=${VITE_OIDC_SCOPE}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APPINSIGHTS_CONNECTION_STRING=${VITE_APPINSIGHTS_CONNECTION_STRING}
ENV VITE_APPINSIGHTS_CLOUD_ROLE=${VITE_APPINSIGHTS_CLOUD_ROLE}

RUN npm run build -- --mode ${BUILD_MODE}

# Stage 2: Production
FROM nginx:alpine

# Copy built files from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
