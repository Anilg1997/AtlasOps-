# Deploying the AtlasOps Demo Slice

This guide deploys **`docker-compose.demo.yml`** — the minimal AI co-pilot slice
(auth, order, inventory, ai-copilot + PostgreSQL, MongoDB, Ollama, seed-data,
frontend). The full event-driven stack (Kafka, Oracle/SOAP billing, ChromaDB)
stays in `docker-compose.yml` for local review and is intentionally excluded
from the demo to keep deployment simple and cheap.

## Which platform: Railway (recommended)

We evaluated Railway and Render for this exact workload — a multi-service
Docker Compose setup with persistent volumes and health checks.

| | **Railway** ✅ | **Render** |
|---|---|---|
| Docker Compose input | **Native** — import `docker-compose.demo.yml` directly, one service per container | Not native — must translate to `render.yaml` Blueprints by hand |
| Persistent volumes | Supported (Postgres data, Mongo data, Ollama model cache) | **Not available on free web services** — our DB/Ollama containers can't persist |
| Free tier | $5 one-time trial credit, per-second billing (a sleeping demo lasts well within the credit) | 750 service-hours/month per workspace — a 9-container app running 24/7 needs ~6,480 h, so containers get throttled/slept constantly |
| Cold start | Fast restarts; model weights persist in the volume | Free services spin down after 15 min idle with slow cold starts |
| Health checks | Supported | Supported |

**Recommendation: Railway.** It accepts our compose file as-is, supports the
volumes the stack needs, and its per-second billing keeps a low-traffic demo
effectively free during the trial credit. Render is a fine choice for a single
stateless web service, but it is the wrong fit for a 9-container stack with
databases and a local LLM.

---

## Prerequisites

- A [Railway](https://railway.com) account (sign up → $5 trial credit)
- Your repo pushed to GitHub (or drag-and-drop the repo folder)
- Nothing else — Railway builds the Docker images in the cloud

## Deploy to Railway

### Option A — from GitHub (recommended)

1. Go to Railway → **New Project** → **Deploy from GitHub repo** and select
   `Anilg1997/AtlasOps-`.
2. When asked how to deploy, choose **Docker Compose** (Railway auto-detects
   compose files). If it doesn't auto-detect, use **Deploy with Docker Compose**
   and point it at `docker-compose.demo.yml`.
3. Railway creates one service per container: `postgres`, `mongodb`, `ollama`,
   `auth-service`, `order-service`, `inventory-service`, `ai-copilot-service`,
   `seed-data`, `frontend`.
4. **Make the frontend public** — open the `frontend` service → *Networking* →
   *Generate Domain* (`https://atlasops-demo.up.railway.app`).
   Set `ai-copilot-service` networking to *Private* if you don't want its 8083
   port exposed publicly (the frontend talks to it over the private network).
5. Wait for the first deploy to finish. First build pulls Maven dependencies
   and the Ollama model, so give it **10–20 minutes**; every deploy after that
   is fast.

### Option B — drag and drop

1. Railway → **New Project** → **Template** → **Deploy Docker Compose**.
2. Drag your repo folder onto the drop zone, or paste the repo URL.
3. Same steps as 4–5 above.

### Required environment variables

The compose file ships with working defaults — **no env vars are strictly
required**. For reference, the ones that matter:

| Variable | Where | Default in demo | Notes |
|---|---|---|---|
| `INTELLOPS_AI_OLLAMA_MODEL` | ai-copilot-service | `llama3.2:3b` | Small/fast demo model. Full-stack local use keeps `llama3.1`. |
| `INTELLOPS_AI_OLLAMA_BASE_URL` | ai-copilot-service | `http://ollama:11434` | Internal DNS name of the Ollama container. |
| `INTELLOPS_BILLING_BASE_URL` | ai-copilot-service | `http://billing-service:8084` | Billing is **not** deployed in the demo, so the Billing tool gracefully reports "unavailable" instead of failing the whole answer. |
| `SPRING_DATASOURCE_URL` / `SPRING_DATA_MONGODB_URI` | services | internal container names | Change only if you point at managed databases. |
| `JWT_SECRET`-style keys | auth-service | baked into `application.yml` | Rotate before any real production use (out of demo scope). |

### First-boot sequence (what happens on the first deploy)

1. Postgres boots and runs `infra/postgres/init.sql` (creates `intellops_auth`,
   `intellops_order`, pgvector extension).
2. `order-service` applies Flyway migrations V1–V6 (schema + `status_reason`).
3. `ai-copilot-service` applies its V4/V5 migrations (runbooks, FAQs,
   `stock_snapshot`, `document_chunks`), then `DataInitializer` indexes the
   knowledge base into the vector store on first boot.
4. `seed-data` waits for the `orders` table, then loads demo orders
   (ORD-1001…1006), line items, and 3 demo runbook/FAQ docs into the vector
   store. Idempotent — safe on every restart.
5. `ollama` pulls `llama3.2:3b` + `nomic-embed-text` on first boot (cached in
   its volume afterwards).
6. `frontend` (nginx) serves the Angular app and proxies `/api/*` to the
   services. `GET /health` on the frontend always returns `200` so platform
   health checks never kill the container mid-demo.

## Expected cold-start time (honest numbers)

| Scenario | Expected |
|---|---|
| First deploy (build + model pull) | **10–20 min** (Maven deps per service + ~2.3 GB of Ollama models). |
| Restart after first deploy | **~1–2 min** until the frontend answers; Ollama models are persisted in the volume. |
| Per-answer latency with `llama3.2:3b` on free-tier CPU | RAG-only question: **~5–20 s**. Tool-calling question (1–3 tool calls): **~15–45 s**. |

> The "under 10 seconds" cold-start goal applies to **subsequent** starts, not
> the very first boot — a free-tier host has to download ~2.3 GB of model
> weights once. That download is cached forever after, and Railway's serverless
> sleep option puts idle services to sleep to avoid burning trial credits.

## Verify the deployment

```bash
# Health page (frontend container is up)
curl -s https://<your-app>.up.railway.app/health        # -> ok

# Copilot liveness + readiness
curl -s https://<your-app>.up.railway.app/api/v1/copilot/health
# Readiness needs a direct route; from the copilot container:
#   curl -s http://localhost:8083/ready
```

Then open the app, **Register** an account (any email/password), and ask the
co-pilot: *"Why is order ORD-1001 on hold?"* — it should call the Order tool,
report `STOCK_HOLD`, and check the stock snapshot for the held SKU.

## Running the same slice locally

```bash
docker compose -f docker-compose.demo.yml up --build
open http://localhost:8080
```

## Troubleshooting

- **Copilot answers "model unavailable"** — Ollama was still pulling the model
  when the copilot started. The copilot retries initialization lazily on the
  next request, so just ask again after a minute.
- **Orders not showing** — `seed-data` exits before order-service finished its
  migrations. Run `docker compose -f docker-compose.demo.yml up seed-data`
  again; the script waits for the tables and is idempotent.
- **Billing tool says "Billing service is unavailable"** — expected. Billing is
  excluded from the demo; the agent degrades gracefully and says which part of
  the answer is missing.
- **Deploy takes > 20 min** — check the build logs for Maven network timeouts;
  retry the build (layers are cached between attempts).
