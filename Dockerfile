FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY worker ./worker
COPY web ./web
COPY db ./db
COPY scripts ./scripts
COPY README.md ./README.md

RUN npm run build && npm prune --omit=dev

ENV PORT=8080
ENV SQLITE_PATH=/var/data/app.db
ENV PERSISTENT_STORAGE_ROOT=/var/data
ENV REQUIRE_PERSISTENT_SQLITE=false

EXPOSE 8080

CMD ["node", "dist/server.js"]
