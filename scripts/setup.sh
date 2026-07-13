#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies..."
npm install

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Done. Start the app with: npm run dev"
