FROM sijinhui/node:base AS deps

# 安装必要的构建工具和 Python
RUN apk add --no-cache python3 make g++

# 设置 Python 环境变量
ENV PYTHON=python3

WORKDIR /app

COPY package.json yarn.lock ./


RUN yarn install
