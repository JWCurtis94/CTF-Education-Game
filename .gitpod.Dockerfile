# Use the official Gitpod workspace image which has all the tools we need
FROM gitpod/workspace-node:latest

# Install any additional global packages we might need
RUN npm install -g nodemon

# Expose the port
EXPOSE 3000
