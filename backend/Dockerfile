FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Generate Prisma client
FROM deps AS prisma
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Production
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/prisma ./prisma
COPY --from=prisma /app/src/generated ./src/generated
COPY prisma.config.ts ./
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
