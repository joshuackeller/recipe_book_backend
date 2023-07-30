# Use an official Node runtime as the base image
FROM node:18

# ENV variables
ENV NODE_ENV=production
ENV PORT=80

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the directory /app in the container
COPY package*.json ./

# Install the app dependencies inside the container
RUN npm install && npm install pm2 -g

# Copy the rest of the application code into the container
COPY . .

RUN  npx prisma generate

# Transpile TypeScript to JavaScript
RUN npm run tsc

# Make port 8080 available to the world outside this container
EXPOSE 80

# Run the app when the container launches using PM2
CMD ["pm2-runtime", "start", "build/index.js"]