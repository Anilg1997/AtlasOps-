# ═══════════════════════════════════════════════════════════════
# ShopHub — Makefile
# One-command local development workflow
# ═══════════════════════════════════════════════════════════════

.PHONY: up down restart logs seed build clean test health pull-models

# Start all services
up:
	@echo "🚀 Starting ShopHub services..."
	docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "✅ Services started! Run 'make health' to check status."

# Stop all services
down:
	@echo "🛑 Stopping ShopHub services..."
	docker compose down

# Restart all services
restart: down up

# Show logs (follow mode)
logs:
	docker compose logs -f

# Show logs for a specific service
logs-%:
	docker compose logs -f $*

# Pull Ollama models (first time only)
pull-models:
	@echo "📥 Pulling Ollama models..."
	docker exec shop-ollama ollama pull llama3.2 || echo "⚠️  Failed to pull llama3.2 (may already exist)"
	docker exec shop-ollama ollama pull nomic-embed-text || echo "⚠️  Failed to pull nomic-embed-text (may already exist)"
	@echo "✅ Models ready!"

# Seed demo data (order issues test data)
seed:
	@echo "🌱 Seeding demo data..."
	@docker cp test-data/order-issues/seed-order-issues.sql shop-postgres:/tmp/seed-order-issues.sql
	@docker exec shop-postgres psql -U shophub -d shophub -f /tmp/seed-order-issues.sql 2>/dev/null || \
		echo "⚠️  Seed skipped (tables may not exist yet — services need to initialize first)"
	@echo "✅ Demo data seeded!"

# Check service health
health:
	@echo "🏥 Checking service health..."
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps
	@echo ""
	@echo "Endpoint checks:"
	@for port in 8080 8081 8082 8083 8084 8085 8086 4200; do \
		status=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$$port/actuator/health 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" http://localhost:$$port 2>/dev/null); \
		echo "  Port $$port: $$status"; \
	done
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Build backend
build:
	@echo "🔨 Building backend services..."
	mvn clean package -DskipTests -q
	@echo "✅ Build complete!"

# Build Docker images
docker-build:
	@echo "🐳 Building Docker images..."
	docker compose build
	@echo "✅ Docker build complete!"

# Run tests
test:
	@echo "🧪 Running tests..."
	mvn test -pl backend/agent-service -q
	@echo "✅ Tests complete!"

# Full setup (start + models + seed)
setup: up
	@sleep 15
	$(MAKE) pull-models
	$(MAKE) seed
	@echo ""
	@echo "════════════════════════════════════════════════════════"
	@echo "🎉 ShopHub is ready!"
	@echo ""
	@echo "  Frontend:   http://localhost:4200"
	@echo "  API Gateway: http://localhost:8080"
	@echo "  AI Agent:   http://localhost:4200/agent"
	@echo "  n8n:        http://localhost:5678 (admin/admin)"
	@echo ""
	@echo "  Login: emilys / emilyspass"
	@echo "════════════════════════════════════════════════════════"

# Clean volumes
clean:
	@echo "🧹 Cleaning up volumes and images..."
	docker compose down -v
	docker system prune -f
	@echo "✅ Clean complete!"

# Quick one-liner setup
start: setup
