FROM public.ecr.aws/lambda/nodejs:20 as builder
WORKDIR /usr/app

COPY ./package.json ./yarn.lock ./tsconfig.json ./

RUN npm install -g yarn
RUN yarn install --frozen-lockfile 

COPY ./src ./src

RUN yarn build

FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

COPY --from=builder /usr/app/build ./build
COPY --from=builder /usr/app/node_modules ./node_modules

CMD ["build/backend/src/handler.handler"]

