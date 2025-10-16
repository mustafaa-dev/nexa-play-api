# Use the official Node.js 20 image as the base image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /home/app

# Install nest cli globally
RUN npm install -g @nestjs/cli

# Copy the package.json and package-lock.json files to the container
COPY package.json ./

# Install the dependencies
RUN npm install --force

# Copy the rest of the application code
COPY . .

COPY .env .env

# Expose the port on which your NestJS app runs
EXPOSE 3000

RUN npm run build

# Start the application
CMD ["node", "dist/main.js"]
