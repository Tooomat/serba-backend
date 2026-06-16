# =========================
# Base
# =========================
FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# =========================
# Development
# =========================
FROM base AS dev
ENV NODE_ENV=development
COPY .env.development.docker .env.development.docker
RUN npx prisma generate
CMD ["npm", "run", "dev"]

# =========================
# Test (CI / Local)
# =========================
FROM base AS test
ENV NODE_ENV=test
COPY .env.test.docker .env.test.docker
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed:test && npm run test"]
# CMD ["sh", "-c", "npx prisma migrate deploy && npm run test"]

# =========================
# Build
# =========================
FROM base AS build
RUN npx prisma generate
RUN npm run build

# =========================
# Production
# =========================
FROM node:22-alpine AS prod
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public 
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY package*.json ./
COPY prisma ./prisma

RUN npm install --omit=dev
RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
