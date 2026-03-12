#!/usr/bin/env bash
set -e

echo "Starting PostgreSQL and Redis..."
docker compose up -d

echo "Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U user -d railwa_demo > /dev/null 2>&1; do
  sleep 1
done

echo "Waiting for Redis to be ready..."
until docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do
  sleep 1
done

echo "Running Prisma migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate dev

echo "Services ready."
