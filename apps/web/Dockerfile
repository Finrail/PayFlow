FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY apps/web ./apps/web

RUN npm run build

CMD ["npm", "run", "start"]
