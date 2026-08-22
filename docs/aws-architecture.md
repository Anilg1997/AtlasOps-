# ShopHub — AWS Architecture

## Production Target Architecture

```
                    ┌──────────────────┐
                    │   Route 53       │
                    │   (DNS + SSL)    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   CloudFront     │
                    │   (CDN + WAF)    │
                    └──┬──────────┬────┘
                       │          │
              ┌────────▼──┐  ┌───▼──────────┐
              │ S3 Bucket  │  │ ALB          │
              │ (Angular)  │  │ (TLS Terminate│
              │ Static     │  │  + Routing)  │
              │ Frontend   │  └───┬──────────┘
              └────────────┘      │
                                  │
                    ┌─────────────▼──────────────┐
                    │    ECS Fargate Cluster      │
                    │                             │
                    │  ┌────────┐  ┌────────────┐ │
                    │  │ Gateway│  │ Auth       │ │
                    │  │ (2)    │  │ Service (2)│ │
                    │  └────────┘  └────────────┘ │
                    │  ┌────────┐  ┌────────────┐ │
                    │  │Product │  │ Order      │ │
                    │  │ Svc (2)│  │ Service (2)│ │
                    │  └────────┘  └────────────┘ │
                    │  ┌────────┐  ┌────────────┐ │
                    │  │ Agent  │  │ Billing    │ │
                    │  │ Svc (2)│  │ Service (2)│ │
                    │  └────────┘  └────────────┘ │
                    │  ┌────────────────────────┐  │
                    │  │ Notification Svc (1)   │  │
                    │  └────────────────────────┘  │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │    Data Layer                  │
                    │  ┌──────────┐  ┌───────────┐  │
                    │  │ RDS Postgres│ │ MSK Kafka │  │
                    │  │ (Multi-AZ) │ │ (3 brokers)│  │
                    │  │ + pgvector │ │            │  │
                    │  └──────────┘  └───────────┘  │
                    │  ┌──────────┐  ┌───────────┐  │
                    │  │ElastiCache│  │ S3 (images)│  │
                    │  │ (Redis)   │  │            │  │
                    │  └──────────┘  └───────────┘  │
                    └──────────────────────────────┘

Monitoring: CloudWatch + X-Ray tracing
Logging: CloudWatch Logs (awslogs driver)
Secrets: Secrets Manager (DB passwords, JWT secret)
```

### Production Services

| Service | Compute | Instances | Notes |
|---------|---------|-----------|-------|
| API Gateway | ECS Fargate | 2 (min) | Auto-scaling to 10 |
| Auth Service | ECS Fargate | 2 | Stateless, horizontally scalable |
| Product Service | ECS Fargate | 2 | Read-heavy, cache with Redis |
| Order Service | ECS Fargate | 2 | Transactional, needs careful scaling |
| Agent Service | ECS Fargate | 2 (CPU) + GPU instances | Ollama needs GPU for < 1s inference |
| Billing Service | ECS Fargate | 2 | Low traffic, cost-optimized |
| Notification Service | ECS Fargate | 1 | Event-driven, scales with Kafka |
| PostgreSQL | RDS Multi-AZ | Primary + standby | pgvector extension |
| Kafka | MSK or self-managed | 3 brokers | MSK is expensive; self-managed on EC2 for demo |
| Redis | ElastiCache | 1 primary + 1 replica | Caching + rate limiting |
| Frontend | S3 + CloudFront | Static hosting | CDN for global low latency |

### Estimated Monthly Cost (Production)
- ECS Fargate (7 services × 0.5 vCPU, 1GB): ~$250/month
- RDS PostgreSQL (db.t3.medium): ~$130/month
- MSK Kafka (3 × kafka.m5.large): ~$550/month (or $0 if self-managed on EC2)
- ElastiCache Redis: ~$50/month
- S3 + CloudFront: ~$20/month
- **Total: ~$1,000-1,500/month** (lower with self-managed Kafka)

---

## Demo Deployment (Actually Deployed)

For a portfolio demo, deploy the **AI-relevant slice** only:

```
┌──────────────────────────────────────────────┐
│         t3.micro EC2 (Docker Compose)         │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Agent   │  │ Product  │  │  Order   │   │
│  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │ Gateway  │  │ Frontend │   │
│  │ Service  │  │          │  │ (nginx)  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐                  │
│  │ Postgres │  │  Kafka   │                  │
│  │+pgvector │  │ (single) │                  │
│  └──────────┘  └──────────┘                  │
│  ┌──────────┐  ┌──────────┐                  │
│  │  Ollama  │  │   n8n    │                  │
│  └──────────┘  └──────────┘                  │
└──────────────────────────────────────────────┘
```

**Why t3.micro?** Free tier eligible (750 hrs/month). Fits within the AWS free tier for demo purposes.

**docker-compose.aws.yml** provides AWS-specific configuration:
- CloudWatch log driver for centralized logging
- RDS endpoint for PostgreSQL (instead of local Postgres)
- S3 bucket for frontend images
- Environment-specific variables

### What's NOT in the demo
- Billing service (not critical for AI demo)
- Notification service (simplified with console logs)
- No auto-scaling (single instance)
- No load balancer (single container)
- No GPU (Ollama runs on CPU — slower but works)

---

## Centralized Logging (Demo)

**Docker awslogs driver** — the simplest AWS-native option:

```yaml
# docker-compose.aws.yml
services:
  agent-service:
    logging:
      driver: awslogs
      options:
        awslogs-group: /ecs/shophub
        awslogs-region: us-east-1
        awslogs-stream-prefix: agent
```

**Production alternative**: CloudWatch Logs Insights (query logs across all services) or OpenSearch (ELK stack) for full-text search across logs.

---

## Deployment Steps (Demo)

```bash
# 1. Provision EC2 instance (t3.micro, Amazon Linux 2)
# 2. Install Docker + Docker Compose on EC2
# 3. Clone repo
git clone https://github.com/Anilg1997/AtlasOps-.git
cd AtlasOps-

# 4. Configure environment
export RDS_ENDPOINT=your-rds-endpoint
export S3_BUCKET=your-s3-bucket

# 5. Deploy
docker compose -f docker-compose.aws.yml up -d

# 6. Seed data
./scripts/seed-demo-data.sh
```

**Interview answer**: "For the demo, I deployed the AI-relevant slice on a single EC2 instance to keep costs at zero. In production, I'd use ECS Fargate for the services, RDS Multi-AZ for the database, and MSK or self-managed Kafka for the event bus — here's the architecture diagram showing exactly how."
