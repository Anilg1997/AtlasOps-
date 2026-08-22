package com.shophub.agent.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shophub.agent.service.OrderIssueService;
import com.shophub.agent.service.VectorStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Listens to Kafka events and triggers agent actions.
 *
 * Subscribed topics:
 * - order.created → Update RAG context with order data
 * - order-events → Order status changes (for issue detection)
 * - order.payment-failed → Trigger payment retry resolution
 * - order.delivery-delayed → Trigger delivery delay resolution
 * - order.stock-out → Trigger stock substitution resolution
 * - product.sync → Sync products for vector search
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AgentKafkaConsumer {

    private final VectorStoreService vectorStore;
    private final OrderIssueService orderIssueService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "order.created", groupId = "agent-service")
    public void onOrderCreated(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            log.info("📦 Order created event received: order={}",
                event.has("orderNumber") ? event.get("orderNumber").asText() : "unknown");

            // Store order context in knowledge base for RAG
            String content = String.format("Order %s placed by user %s for $%.2f. Status: %s",
                event.path("orderNumber").asText("unknown"),
                event.path("userId").asText("unknown"),
                event.path("totalAmount").asDouble(0),
                event.path("status").asText("PENDING"));

            vectorStore.storeKnowledgeEmbedding(
                "order", event.path("orderNumber").asText("unknown"),
                content, new float[768] // Will be re-embedded when Ollama is available
            );
            log.info("✅ Stored order context for RAG");
        } catch (Exception e) {
            log.error("Failed to process order event: {}", e.getMessage());
        }
    }

    /**
     * Listen to general order-events topic for status changes
     */
    @KafkaListener(topics = "order-events", groupId = "agent-service")
    public void onOrderEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("eventType").asText("");
            String orderNumber = event.path("orderNumber").asText("");

            log.info("📋 Order event received: {} for order {}", eventType, orderNumber);

            // Check for concerning status changes that need agent intervention
            if ("ORDER_STATUS_CHANGED".equals(eventType)) {
                String newStatus = event.path("status").asText("");
                String oldStatus = event.has("oldStatus") ? event.get("oldStatus").asText("") : "";

                // If order moved to ON_HOLD or CANCELLED, investigate
                if ("ON_HOLD".equals(newStatus) || "CANCELLED".equals(newStatus)) {
                    log.info("🔍 Order {} changed to {} — agent investigating", orderNumber, newStatus);
                    // The agent will proactively check this order when queried
                }
            }
        } catch (Exception e) {
            log.error("Failed to process order event: {}", e.getMessage());
        }
    }

    /**
     * Listen for payment failure events and trigger autonomous resolution
     */
    @KafkaListener(topics = "order.payment-failed", groupId = "agent-service")
    public void onPaymentFailed(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String orderNumber = event.path("orderNumber").asText("unknown");
            String reason = event.path("reason").asText("Payment declined");

            log.info("🚨 Payment failed for order {}: {} — agent attempting resolution", orderNumber, reason);

            // Trigger autonomous resolution
            var result = orderIssueService.handlePaymentFailure(orderNumber, reason);
            log.info("Resolution result for {}: {}", orderNumber, result.get("status"));

        } catch (Exception e) {
            log.error("Failed to process payment failure event: {}", e.getMessage());
        }
    }

    /**
     * Listen for delivery delay events and trigger compensation
     */
    @KafkaListener(topics = "order.delivery-delayed", groupId = "agent-service")
    public void onDeliveryDelayed(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String orderNumber = event.path("orderNumber").asText("unknown");
            String details = event.path("details").asText("Delivery delayed beyond estimate");

            log.info("📦 Delivery delay for order {}: {} — agent generating compensation", orderNumber, details);

            var result = orderIssueService.handleDeliveryDelay(orderNumber, details);
            log.info("Resolution result for {}: {}", orderNumber, result.get("status"));

        } catch (Exception e) {
            log.error("Failed to process delivery delay event: {}", e.getMessage());
        }
    }

    /**
     * Listen for stock-out events and trigger substitution
     */
    @KafkaListener(topics = "order.stock-out", groupId = "agent-service")
    public void onStockOut(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String orderNumber = event.path("orderNumber").asText("unknown");
            String productId = event.path("productId").asText("0");
            String productTitle = event.path("productTitle").asText("Unknown product");

            log.info("📦 Stock-out for order {} product {}: {} — agent finding alternatives",
                orderNumber, productId, productTitle);

            var result = orderIssueService.handleStockOut(orderNumber, productId, productTitle);
            log.info("Resolution result for {}: {}", orderNumber, result.get("status"));

        } catch (Exception e) {
            log.error("Failed to process stock-out event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "product.sync", groupId = "agent-service")
    public void onProductSync(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            log.info("📦 Product sync event received");

            // Sync product data for RAG vector search
            vectorStore.syncProductForRag(
                event.path("id").asLong(),
                event.path("title").asText(),
                event.path("description").asText(""),
                event.path("category").asText(""),
                event.path("brand").asText(""),
                event.path("price").asDouble(0),
                event.path("rating").asDouble(0),
                event.path("stock").asInt(0),
                event.path("thumbnail").asText("")
            );
        } catch (Exception e) {
            log.error("Failed to process product sync event: {}", e.getMessage());
        }
    }
}
