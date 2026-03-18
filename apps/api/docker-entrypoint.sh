#!/bin/sh
set -e

echo "Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy

echo "Seeding database..."
npx ts-node prisma/seed.ts

echo "Starting API server..."
cd /app
node apps/api/dist/src/main.js
