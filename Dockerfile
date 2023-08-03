# Use an official Node runtime as the base image
FROM node:18

ARG DATABASE_URL
ARG JWT_SECRET
ARG TWILIO_AUTH_TOKEN
ARG TWILIO_PHONE
ARG TWILIO_SID

# ENV variables
ENV NODE_ENV=production
ENV PORT=80
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
ENV TWILIO_PHONE=$TWILIO_PHONE
ENV TWILIO_SID=$TWILIO_SID

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