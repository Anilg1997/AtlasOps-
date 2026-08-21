package com.shophub.agent.controller;

import com.shophub.agent.service.AgentService;
import com.shophub.agent.service.VectorStoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/agent")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;
    private final VectorStoreService vectorStore;

    /**
     * Send a message to the AI agent
     */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> request) {
        Long userId = request.get("userId") != null ? ((Number) request.get("userId")).longValue() : 1L;
        Long conversationId = request.get("conversationId") != null
            ? ((Number) request.get("conversationId")).longValue() : null;
        String message = (String) request.get("message");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }

        Map<String, Object> response = agentService.processMessage(conversationId, userId, message);
        return ResponseEntity.ok(response);
    }

    /**
     * Get agent capabilities (MCP tools)
     */
    @GetMapping("/tools")
    public ResponseEntity<Map<String, Object>> getTools() {
        return ResponseEntity.ok(Map.of(
            "tools", new Object[]{
                Map.of("name", "search_products", "description", "Search product catalog by keywords"),
                Map.of("name", "get_product_details", "description", "Get detailed product information"),
                Map.of("name", "add_to_cart", "description", "Add product to shopping cart"),
                Map.of("name", "get_cart_summary", "description", "View cart contents and total"),
                Map.of("name", "process_checkout", "description", "Complete the purchase"),
                Map.of("name", "get_product_reviews", "description", "View product reviews"),
                Map.of("name", "compare_products", "description", "Compare multiple products side by side")
            },
            "protocol", "MCP (Model Context Protocol)",
            "version", "1.0.0"
        ));
    }

    /**
     * Get product store statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(vectorStore.getProductStats());
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "agent-service",
            "llm", "Ollama (llama3.2)",
            "rag", "pgvector",
            "tools", "MCP Protocol",
            "messaging", "Kafka"
        ));
    }
}
