# clinicq_frontend/Dockerfile

# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app/frontend

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Copy built static files from the builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Optional: Copy a custom Nginx configuration if needed for the frontend server
COPY nginx.conf /etc/nginx/conf.d/default.conf
# If you have a specific nginx config for serving the SPA (e.g., handling client-side routing)
# For now, default Nginx behavior for static files will be used.
# A common addition would be: try_files $uri $uri/ /index.html; in the Nginx config.

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
