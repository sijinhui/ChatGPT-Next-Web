FROM sijinhui/node:base AS deps

WORKDIR /app

COPY lib/rt-client-0.4.7.tgz lib/rt-client-0.4.7.tgz
COPY package.json yarn.lock ./


RUN yarn install
