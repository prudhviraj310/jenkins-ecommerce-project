# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to speed up build (caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code (src, server, public, etc.)
COPY . .

# Expose the port your app runs on (usually 3000 or 5000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]