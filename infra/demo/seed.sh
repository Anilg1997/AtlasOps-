#!/bin/sh
# AtlasOps demo seed runner (docker-compose.demo.yml).
# Waits until order-service Flyway migrations have created the orders tables,
# then loads the idempotent demo seed (orders, line items, vector-store docs).
set -e

echo "[seed] Waiting for order-service migrations to create the orders table..."
until psql -h postgres -U postgres -d intellops_order -c "SELECT 1 FROM orders LIMIT 1" >/dev/null 2>&1; do
  sleep 2
done

echo "[seed] Tables ready — loading demo data..."
psql -h postgres -U postgres -d intellops_order -v ON_ERROR_STOP=1 -f /seed-demo-data.sql

echo "[seed] Demo data loaded."
