#FROM sijinhui/chatgpt-next-web:installcache AS deps
#
#WORKDIR /app
#
#COPY package.json yarn.lock ./
#
#RUN yarn install
#
#FROM sijinhui/node:base AS builder
#
#RUN apk add --no-cache git libc6-compat
#
#ENV OPENAI_API_KEY=""
#ENV GOOGLE_API_KEY=""
#ENV CODE=""
#
#WORKDIR /app
#COPY . .
#COPY --from=deps /app/node_modules ./node_modules
## 避免下面那个报错
## RUN mkdir -p "/app/node_modules/tiktoken" && mkdir -p "/app/node_modules/sharp"
## RUN yarn add sharp
## ENV NEXT_SHARP_PATH /app/node_modules/sharp
#RUN yarn build

FROM sijinhui/chatgpt-next-web:buildcache AS base

FROM sijinhui/node:base AS builder
WORKDIR /app
COPY . .
COPY --from=base /app/.next ./next
COPY --from=base /app/node_modules ./node_modules

RUN yarn install && yarn build

FROM sijinhui/node:base AS runner
WORKDIR /app

RUN apk add proxychains-ng

ENV PROXY_URL=""
ENV OPENAI_API_KEY=""
ENV GOOGLE_API_KEY=""
ENV CODE=""
ENV ENABLE_MCP=""

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server

# COPY --from=builder /app/node_modules/tiktoken ./node_modules/tiktoken
# COPY --from=builder /app/node_modules/sharp ./node_modules/sharp

RUN rm -f .env

RUN mkdir -p /app/app/mcp && chmod 777 /app/app/mcp
COPY --from=builder /app/app/mcp/mcp_config.json /app/app/mcp/

EXPOSE 23000

ENV HOSTNAME="" \
    PORT=23000 \
    KEEP_ALIVE_TIMEOUT=30
EXPOSE 23000

# ENV NEXT_SHARP_PATH /app/node_modules/sharp

CMD wget -qO- api.si.icu/me ; if [ -n "$PROXY_URL" ]; then \
    export HOSTNAME="0.0.0.0"; \
    protocol=$(echo $PROXY_URL | cut -d: -f1); \
    host=$(echo $PROXY_URL | cut -d/ -f3 | cut -d: -f1); \
    port=$(echo $PROXY_URL | cut -d: -f3); \
    conf=/etc/proxychains.conf; \
    echo "strict_chain" > $conf; \
    echo "proxy_dns" >> $conf; \
    echo "remote_dns_subnet 224" >> $conf; \
    echo "tcp_read_time_out 15000" >> $conf; \
    echo "tcp_connect_time_out 8000" >> $conf; \
    echo "localnet 127.0.0.0/255.0.0.0" >> $conf; \
    echo "localnet ::1/128" >> $conf; \
    echo "[ProxyList]" >> $conf; \
    echo "$protocol $host $port" >> $conf; \
    cat /etc/proxychains.conf; \
    proxychains -f $conf node server.js; \
    else \
    node server.js; \
    fi
