FROM sijinhui/node:base AS deps

WORKDIR /app

COPY lib/*.tgz .
COPY package.json yarn.lock ./


RUN yarn install
