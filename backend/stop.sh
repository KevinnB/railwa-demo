#!/usr/bin/env bash
set -e

echo "Stopping PostgreSQL and Redis..."
docker compose down

echo "Stopped."
