# Stage 1: Build the frontend (Dashboard)
FROM node:20 AS frontend-builder
WORKDIR /app/dashboard

# Copy package files
COPY dashboard/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY dashboard/ .

# Fix for hardcoded localhost URL - ensures portability by using relative paths
# We replace http://localhost:8000 with empty string, so http://localhost:8000/api becomes /api
# We use 'find' and 'sed' which are available in node image
RUN find src -type f -exec sed -i 's|http://localhost:8000||g' {} +

# Build the application
RUN npm run build

# Stage 2: Setup the complete application
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Setup backend
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application code
COPY backend/ ./backend/
# Use conf.d for Nginx config and remove default site to avoid conflicts
RUN rm -f /etc/nginx/sites-enabled/default
COPY docker/nginx.conf /etc/nginx/conf.d/app.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Setup frontend (Copy built artifacts from Stage 1)
COPY --from=frontend-builder /app/dashboard/dist /usr/share/nginx/html

# Environment variables
ENV PYTHONUNBUFFERED=1

# Expose ports
EXPOSE 80

# Start Supervisor (which starts Nginx and Backend)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
