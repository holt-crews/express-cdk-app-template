FROM node:20-alpine

WORKDIR /usr/app

# Install dependencies
COPY ./package.json ./yarn.lock ./

RUN yarn install --frozen-lockfile

# Copy the program source to the container
COPY ./src ./

# Compile the program
RUN npx tsc index.ts

