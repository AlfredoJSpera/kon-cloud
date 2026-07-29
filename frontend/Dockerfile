# Builder
FROM node:lts-alpine3.24 AS builder

WORKDIR /usr/src/app

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci

COPY interfaces /usr/src/interfaces
COPY frontend .

# Inject build arguments for Vite
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build

# Runner
FROM node:lts-alpine3.24

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /usr/src/app/dist .

EXPOSE 80

CMD ["serve", "-s", ".", "-l", "80"]
