FROM sijinhui/node:base AS deps

WORKDIR /app

COPY lib/*.tgz ./lib
COPY package.json yarn.lock ./


RUN yarn install
