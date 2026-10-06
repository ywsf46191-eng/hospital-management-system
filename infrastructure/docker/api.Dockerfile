# syntax=docker/dockerfile:1
# NestJS API image (build context: repository root)

FROM node:22.20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
  && apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build:packages \
  && pnpm --filter @hospital/api build \
  && pnpm --filter @hospital/api deploy --prod /out \
  && cp -r prisma /out/prisma \
  && cd /out && node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
