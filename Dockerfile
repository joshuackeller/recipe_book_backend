# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the directory /app in the container
COPY package*.json ./

# Install the app dependencies inside the container
RUN npm i &&\
    npm i pm2  -g

# If you are building your code for production
# RUN npm ci --only=production

# Bundle the app source inside the container
COPY . .

# Make port 8080 available to the world outside this container
EXPOSE 4500

# Run the app when the container launches
# CMD [ "npm", "start" ]
CMD ["pm2-runtime", "start", "src/index.ts"]