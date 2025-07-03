# Use the official Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create data directory
RUN mkdir -p data

# Expose the port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Install nodemon for development
RUN npm install -g nodemon

# Command to run the application
CMD ["npm", "start"]
