FROM sijinhui/node:base AS deps

WORKDIR /app

COPY lib/*.tgz .
COPY package.json yarn.lock ./

RUN yes | corepack enable
RUN yarn set version berry
RUN yarn install
