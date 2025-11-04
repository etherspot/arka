FROM oven/bun:1-alpine AS deps
RUN apk update && apk add --no-cache g++ nodejs npm musl make musl-dev python3 git py3-setuptools && rm -rf /var/cache/apk/*
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder
ARG APP_ENV
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN bun run build

FROM oven/bun:1-alpine AS runner
WORKDIR /usr/app
ARG APP_ENV
COPY --from=builder /app/build ./build
COPY ./migrations ./migrations
COPY ./scripts ./scripts
COPY package.json ./
COPY --from=builder /app/config.json.default /usr/app/config.json
USER root
ENV NODE_ENV="production"
CMD ["bun", "start"]
