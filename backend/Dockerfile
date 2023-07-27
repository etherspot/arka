FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
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
COPY ./migrations ./build/migrations
COPY package.json ./
COPY --from=builder /app/config.json.default /usr/app/config.json
RUN bun install --production
USER root
ENV NODE_ENV="production"
CMD ["bun", "start"]
