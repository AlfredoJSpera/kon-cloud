FROM node:lts-alpine3.24

WORKDIR /usr/src/app

COPY backend/package.json backend/package-lock.json ./

RUN npm ci

COPY interfaces /usr/src/interfaces
COPY backend .

CMD ["sh", "-c", "npm run db:deploy && npm run start"]