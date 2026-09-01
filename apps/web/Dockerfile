FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY packages ./packages

RUN pnpm --filter frontend build

CMD ["pnpm", "--filter", "frontend", "dev"]
