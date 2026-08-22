#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# ShopHub — Demo Data Seeder
# Run after `docker compose up` to populate test data
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

CONTAINER="shop-postgres"
DB_USER="shophub"
DB_NAME="shophub"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🌱 ShopHub Demo Data Seeder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "❌ PostgreSQL not ready after 30 seconds. Is the container running?"
        exit 1
    fi
    sleep 1
done

# Wait for Ollama models
echo "⏳ Waiting for Ollama..."
for i in $(seq 1 30); do
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "✅ Ollama is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "⚠️  Ollama not ready — models may need to be pulled manually"
        break
    fi
    sleep 2
done

# Pull Ollama models if not already present
if curl -s http://localhost:11434/api/tags | grep -q "llama3.2"; then
    echo "✅ llama3.2 model already available"
else
    echo "📥 Pulling llama3.2 model (this may take a few minutes)..."
    docker exec shop-ollama ollama pull llama3.2 2>/dev/null || echo "⚠️  Failed to pull llama3.2"
fi

if curl -s http://localhost:11434/api/tags | grep -q "nomic-embed-text"; then
    echo "✅ nomic-embed-text model already available"
else
    echo "📥 Pulling nomic-embed-text model..."
    docker exec shop-ollama ollama pull nomic-embed-text 2>/dev/null || echo "⚠️  Failed to pull nomic-embed-text"
fi

# Seed order issue test data
echo "📦 Seeding order issue test data..."
SEED_FILE="$PROJECT_ROOT/test-data/order-issues/seed-order-issues.sql"
if [ -f "$SEED_FILE" ]; then
    docker cp "$SEED_FILE" "$CONTAINER:/tmp/seed-order-issues.sql"
    if docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/seed-order-issues.sql >/dev/null 2>&1; then
        echo "✅ Order issue test data seeded successfully"
    else
        echo "⚠️  Some seed data may have failed (this is OK if tables don't exist yet)"
    fi
else
    echo "⚠️  Seed file not found at $SEED_FILE"
fi

# Verify services are accessible
echo ""
echo "🏥 Verifying service endpoints..."
ENDPOINTS=("4200:Frontend" "8080:Gateway" "8081:Auth" "8082:Product" "8083:Order" "8084:Agent" "8085:Billing" "8086:Notification")
for endpoint in "${ENDPOINTS[@]}"; do
    port="${endpoint%%:*}"
    name="${endpoint##*:}"
    if curl -s -o /dev/null -w "" "http://localhost:$port" 2>/dev/null; then
        echo "  ✅ $name (port $port)"
    else
        echo "  ⏳ $name (port $port) — may still be starting"
    fi
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "🎉 ShopHub Demo Setup Complete!"
echo ""
echo "  🌐 Frontend:      http://localhost:4200"
echo "  🤖 AI Agent:      http://localhost:4200/agent"
echo "  ⚙️  API Gateway:   http://localhost:8080"
echo "  🔄 n8n Automation: http://localhost:5678 (admin/admin)"
echo ""
echo "  👤 Login: emilys / emilyspass"
echo ""
echo "  Demo order scenarios (use in AI agent):"
echo "  • ORD-20260820-PAYFAIL  — Payment failed (auto-retry demo)"
echo "  • ORD-20260819-OUTSTK   — Out of stock (substitution demo)"
echo "  • ORD-20260810-DELAYD   — Delivery delayed (compensation demo)"
echo "  • ORD-20260822-DUP01    — Duplicate order detection"
echo "  • ORD-20260818-PRCERR   — Price mismatch (escalation demo)"
echo "════════════════════════════════════════════════════════"
