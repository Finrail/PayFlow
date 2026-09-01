FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/stellar/package.json ./packages/stellar/
COPY packages/types/package.json ./packages/types/

RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages

RUN pnpm --filter @payflow/api build

CMD ["pnpm", "--filter", "@payflow/api", "dev"]
