# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the directory /app in the container
COPY package*.json ./

# Install the app dependencies inside the container
RUN npm install

# Install PM2 globally in the container
RUN npm install pm2 -g

# Copy the rest of the application code into the container
COPY . .

# Transpile TypeScript to JavaScript
RUN npm run build

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run the app when the container launches using PM2
CMD ["pm2-runtime", "start", "build/index.js"]