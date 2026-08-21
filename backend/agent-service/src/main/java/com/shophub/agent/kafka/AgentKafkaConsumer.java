package com.shophub.agent.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shophub.agent.service.VectorStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Listens to Kafka events and triggers agent actions.
 * - order.created → Update RAG context with order data
 * - product.sync → Sync products for vector search
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AgentKafkaConsumer {

    private final VectorStoreService vectorStore;
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
