FROM node:20-bullseye AS base

# Dependency stage
FROM base AS deps

WORKDIR /home/node
COPY yarn.lock package.json ./
RUN yarn install --frozen-lockfile

# Builder stage
FROM base as builder

WORKDIR /home/node
COPY --from=deps /home/node/node_modules ./node_modules
COPY ./src/ .
RUN yarn build

# final running stage
FROM base as runner

WORKDIR /home/node

COPY --from=builder /home/node/build ./build
COPY --from=deps /home/node/node_modules ./node_modules
COPY package.json .

USER node

EXPOSE 8080

# entrypoint here needs to match entry point in AWS ECS
ENTRYPOINT ["yarn", "start"]

