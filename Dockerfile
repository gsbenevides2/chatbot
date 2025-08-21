# Use the official Bun image
FROM oven/bun

# Set working directory
WORKDIR /app

# Install curl
RUN apt-get update && apt-get install -y curl git

# Copy package files
COPY package*.json bun.lock ./

# Copy project files
COPY . .

# Install dependencies
RUN bun install

# Custom Swagger
RUN bun run swagger:build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["bun", "start"] 