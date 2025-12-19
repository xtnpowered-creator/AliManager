# Use official Node.js 18 image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port (Cloud Run sets PORT env var, defaults to 8080)
EXPOSE 8080

# Start command
CMD [ "node", "index.js" ]
