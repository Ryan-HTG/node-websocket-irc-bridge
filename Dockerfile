# Use a lightweight Node.js base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the port your server listens on (optional)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]