#!/bin/sh
set -e

echo "Running database migrations..."
export DATABASE_URL="$FM_DATABASE_URL"
./node_modules/.bin/prisma migrate deploy

echo "Seeding database..."
./node_modules/.bin/tsx prisma/seed.ts

echo "Starting application..."
exec node server.js
