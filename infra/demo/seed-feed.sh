#!/bin/sh
# AtlasOps demo feed seed (docker-compose.demo.yml).
#
# Populates the cross-service activity timeline WITHOUT Kafka by POSTing
# realistic events to the notification-service REST endpoint
# (POST /api/v1/activity/events — see ActivityLogController). The events
# mirror the demo orders loaded by seed-demo-data.sql (ORD-1001…1006), so the
# feed page tells the same story as the co-pilot demo scenario.
#
# Idempotent: skips when the activity log already has entries, so restarting
# the demo with a persisted mongo volume does not double-seed.
set -e

BASE_URL="${FEED_BASE_URL:-http://notification-service:8085}"
API_URL="$BASE_URL/api/v1/activity"

echo "[seed-feed] Waiting for notification-service to come up..."
ready=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -fsS -o /dev/null "$BASE_URL/actuator/health" 2>/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" -ne 1 ]; then
  echo "[seed-feed] notification-service not reachable — skipping feed seed." >&2
  exit 1
fi

# Already seeded (persisted demo volume)? Skip to avoid duplicates.
total=$(curl -fsS "$API_URL/stats" | sed -n 's/.*"totalEntries":\([0-9][0-9]*\).*/\1/p')
if [ -n "$total" ] && [ "$total" -gt 0 ]; then
  echo "[seed-feed] Activity log already has $total entries — skipping."
  exit 0
fi

# ISO timestamps relative to now so relative times in the UI look right.
ago() { date -u -d "$1 ago" +%Y-%m-%dT%H:%M:%SZ; }
t10d=$(ago '10 days')
t9d=$(ago '9 days')
t8d=$(ago '8 days')
t7d=$(ago '7 days')
t6d=$(ago '6 days')
t5d=$(ago '5 days')
t4d=$(ago '4 days')
t3d=$(ago '3 days')
t2d=$(ago '2 days')
t1d=$(ago '1 day')

post() {
  echo "[seed-feed] -> $1"
  curl -fsS -o /dev/null -X POST "$API_URL/events" \
    -H 'Content-Type: application/json' \
    -d "$2" || { echo "[seed-feed] failed to publish $1" >&2; exit 1; }
  sleep 0.2
}

# ─── ORD-1001 — created, then put on hold (STOCK_HOLD) ─────────────────────
post "ORDER_CREATED ORD-1001"      "{\"eventType\":\"ORDER_CREATED\",\"orderNumber\":\"ORD-1001\",\"customerEmail\":\"acme@example.com\",\"totalAmount\":\"6803.97\",\"status\":\"PENDING\",\"timestamp\":\"$t3d\"}"
post "ORDER_STATUS_CHANGED ORD-1001" "{\"eventType\":\"ORDER_STATUS_CHANGED\",\"orderNumber\":\"ORD-1001\",\"fromStatus\":\"PENDING\",\"toStatus\":\"ON_HOLD\",\"reason\":\"STOCK_HOLD\",\"timestamp\":\"$t2d\"}"
post "INVOICE_CREATED INV-1001"    "{\"eventType\":\"INVOICE_CREATED\",\"invoiceNumber\":\"INV-1001\",\"orderNumber\":\"ORD-1001\",\"amount\":\"6803.97\",\"timestamp\":\"$t2d\"}"

# ─── ORD-1002 — created, processed, shipped, paid ─────────────────────────
post "ORDER_CREATED ORD-1002"      "{\"eventType\":\"ORDER_CREATED\",\"orderNumber\":\"ORD-1002\",\"customerEmail\":\"globex@example.com\",\"totalAmount\":\"7235.87\",\"status\":\"PENDING\",\"timestamp\":\"$t5d\"}"
post "ORDER_STATUS_CHANGED ORD-1002" "{\"eventType\":\"ORDER_STATUS_CHANGED\",\"orderNumber\":\"ORD-1002\",\"fromStatus\":\"PENDING\",\"toStatus\":\"PROCESSING\",\"timestamp\":\"$t4d\"}"
post "INVOICE_CREATED INV-1002"    "{\"eventType\":\"INVOICE_CREATED\",\"invoiceNumber\":\"INV-1002\",\"orderNumber\":\"ORD-1002\",\"amount\":\"7235.87\",\"timestamp\":\"$t4d\"}"
post "INVOICE_PAID INV-1002"       "{\"eventType\":\"INVOICE_PAID\",\"invoiceNumber\":\"INV-1002\",\"amount\":\"7235.87\",\"timestamp\":\"$t3d\"}"
post "PAYMENT_RECEIVED PAY-2002"   "{\"eventType\":\"PAYMENT_RECEIVED\",\"paymentRef\":\"PAY-2002\",\"invoiceNumber\":\"INV-1002\",\"amount\":\"7235.87\",\"timestamp\":\"$t3d\"}"
post "ORDER_STATUS_CHANGED ORD-1002" "{\"eventType\":\"ORDER_STATUS_CHANGED\",\"orderNumber\":\"ORD-1002\",\"fromStatus\":\"PROCESSING\",\"toStatus\":\"SHIPPED\",\"carrier\":\"Express\",\"timestamp\":\"$t3d\"}"

# ─── ORD-1003 — created, shipped, delivered, paid ─────────────────────────
post "ORDER_CREATED ORD-1003"      "{\"eventType\":\"ORDER_CREATED\",\"orderNumber\":\"ORD-1003\",\"customerEmail\":\"initech@example.com\",\"totalAmount\":\"1619.46\",\"status\":\"PENDING\",\"timestamp\":\"$t10d\"}"
post "ORDER_STATUS_CHANGED ORD-1003" "{\"eventType\":\"ORDER_STATUS_CHANGED\",\"orderNumber\":\"ORD-1003\",\"fromStatus\":\"PENDING\",\"toStatus\":\"SHIPPED\",\"timestamp\":\"$t9d\"}"
post "INVOICE_CREATED INV-1003"    "{\"eventType\":\"INVOICE_CREATED\",\"invoiceNumber\":\"INV-1003\",\"orderNumber\":\"ORD-1003\",\"amount\":\"1619.46\",\"timestamp\":\"$t9d\"}"
post "INVOICE_PAID INV-1003"       "{\"eventType\":\"INVOICE_PAID\",\"invoiceNumber\":\"INV-1003\",\"amount\":\"1619.46\",\"timestamp\":\"$t8d\"}"
post "PAYMENT_RECEIVED PAY-2003"   "{\"eventType\":\"PAYMENT_RECEIVED\",\"paymentRef\":\"PAY-2003\",\"invoiceNumber\":\"INV-1003\",\"amount\":\"1619.46\",\"timestamp\":\"$t8d\"}"
post "ORDER_STATUS_CHANGED ORD-1003" "{\"eventType\":\"ORDER_STATUS_CHANGED\",\"orderNumber\":\"ORD-1003\",\"fromStatus\":\"SHIPPED\",\"toStatus\":\"DELIVERED\",\"timestamp\":\"$t8d\"}"

# ─── ORD-1004 — created, now processing ────────────────────────────────────
post "ORDER_CREATED ORD-1004"      "{\"eventType\":\"ORDER_CREATED\",\"orderNumber\":\"ORD-1004\",\"customerEmail\":\"acme@example.com\",\"totalAmount\":\"9611.98\",\"status\":\"PENDING\",\"timestamp\":\"$t2d\"}"
post "ORDER_STATUS_CHANGED ORD-1004" "{\"eventType\":\"ORDER_STATUS_CHANGED\",\"orderNumber\":\"ORD-1004\",\"fromStatus\":\"PENDING\",\"toStatus\":\"PROCESSING\",\"warehouse\":\"WH-NORTH-A12\",\"timestamp\":\"$t1d\"}"

# ─── ORD-1005 — created, awaiting payment confirmation ────────────────────
post "ORDER_CREATED ORD-1005"      "{\"eventType\":\"ORDER_CREATED\",\"orderNumber\":\"ORD-1005\",\"customerEmail\":\"globex@example.com\",\"totalAmount\":\"9720.00\",\"status\":\"PENDING\",\"statusReason\":\"PAYMENT_PENDING\",\"timestamp\":\"$t1d\"}"
post "INVOICE_CREATED INV-1005"    "{\"eventType\":\"INVOICE_CREATED\",\"invoiceNumber\":\"INV-1005\",\"orderNumber\":\"ORD-1005\",\"amount\":\"9720.00\",\"timestamp\":\"$t1d\"}"

# ─── ORD-1006 — created, payment failed, cancelled ────────────────────────
post "ORDER_CREATED ORD-1006"      "{\"eventType\":\"ORDER_CREATED\",\"orderNumber\":\"ORD-1006\",\"customerEmail\":\"initech@example.com\",\"totalAmount\":\"377.99\",\"status\":\"PENDING\",\"timestamp\":\"$t7d\"}"
post "INVOICE_CREATED INV-1006"    "{\"eventType\":\"INVOICE_CREATED\",\"invoiceNumber\":\"INV-1006\",\"orderNumber\":\"ORD-1006\",\"amount\":\"377.99\",\"timestamp\":\"$t6d\"}"
post "PAYMENT_FAILED PAY-2006"     "{\"eventType\":\"PAYMENT_FAILED\",\"paymentRef\":\"PAY-2006\",\"invoiceNumber\":\"INV-1006\",\"reason\":\"card_declined\",\"timestamp\":\"$t6d\"}"
post "ORDER_STATUS_CHANGED ORD-1006" "{\"eventType\":\"ORDER_STATUS_CHANGED\",\"orderNumber\":\"ORD-1006\",\"fromStatus\":\"PENDING\",\"toStatus\":\"CANCELLED\",\"reason\":\"PAYMENT_FAILED\",\"timestamp\":\"$t6d\"}"

# ─── Billing account updates ───────────────────────────────────────────────
post "BILLING_ACCOUNT_CHANGED ACC-0001" "{\"eventType\":\"BILLING_ACCOUNT_CHANGED\",\"accountNumber\":\"ACC-0001\",\"customerEmail\":\"acme@example.com\",\"change\":\"payment method updated\",\"timestamp\":\"$t2d\"}"
post "BILLING_ACCOUNT_CHANGED ACC-0002" "{\"eventType\":\"BILLING_ACCOUNT_CHANGED\",\"accountNumber\":\"ACC-0002\",\"customerEmail\":\"globex@example.com\",\"change\":\"shipping address updated\",\"timestamp\":\"$t1d\"}"

echo "[seed-feed] Demo activity feed seeded."
