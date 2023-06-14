# Use an official Node runtime as the parent image
FROM node:14

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies in the package.json
RUN npm install

# Bundle the app source inside the Docker image 
# (excluding node_modules from the local directory, due to .dockerignore)
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "start"]
