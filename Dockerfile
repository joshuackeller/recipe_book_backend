# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# COPY ./build /build
COPY ./package.json /package.json
COPY ./package-lock.json /package-lock.json

RUN npm install && npm install -g pm2 && npm run tsc

# Make port 8080 available to the world outside this container
EXPOSE 4500

# Run the app when the container launches
# CMD [ "node", "build/index.js" ]
CMD ["pm2-runtime", "build/index.js"]
