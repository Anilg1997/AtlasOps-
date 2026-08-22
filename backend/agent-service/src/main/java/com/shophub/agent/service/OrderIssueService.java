package com.shophub.agent.service;

import com.shophub.agent.model.OrderIssue;
import com.shophub.agent.repository.OrderIssueRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * OrderIssueService — orchestrates the autonomous detection → resolution → notification flow.
 *
 * This is the "agentic" core: when an order issue event arrives (from Kafka or API),
 * the service determines the issue type, invokes the appropriate resolution tool,
 * and publishes a result event for notification-service to pick up.
 *
 * Flow:
 * 1. Event arrives (order.payment-failed, order.delivery-delayed, etc.)
 * 2. detectAndResolve() identifies the issue
 * 3. Resolution tool is invoked (payment retry, stock substitution, etc.)
 * 4. If automated resolution fails → escalate_to_human
 * 5. Publish resolution event for notification-service
 */
@Service
@Slf4j
public class OrderIssueService {

    private final OrderIssueRepository issueRepository;
    private final IssueDetectionTool issueDetectionTool;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public OrderIssueService(OrderIssueRepository issueRepository, IssueDetectionTool issueDetectionTool,
                             KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.issueRepository = issueRepository;
        this.issueDetectionTool = issueDetectionTool;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    // Package-private constructor for testing with mocks
    OrderIssueService(OrderIssueRepository issueRepository, IssueDetectionTool issueDetectionTool,
                      KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper,
                      @SuppressWarnings("unused") boolean testMode) {
        this.issueRepository = issueRepository;
        this.issueDetectionTool = issueDetectionTool;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Handle a payment failure event from Kafka
     */
    public Map<String, Object> handlePaymentFailure(String orderId, String reason) {
        log.info("🚨 Handling payment failure for order {}: {}", orderId, reason);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("issueType", "PAYMENT_FAILED");
        result.put("timestamp", LocalDateTime.now().toString());

        // Attempt automated resolution
        String resolutionResult = issueDetectionTool.resolvePaymentRetry(orderId);
        result.put("resolution", resolutionResult);

        if (resolutionResult.contains("SUCCEEDED")) {
            result.put("status", "RESOLVED");
            result.put("action", "Payment retried and succeeded");
        } else if (resolutionResult.contains("escalated")) {
            result.put("status", "ESCALATED");
            result.put("action", "Escalated to human support");
        } else {
            result.put("status", "FAILED");
            result.put("action", "Automated resolution failed");
        }

        // Publish result for notification-service
        publishAgentResolutionEvent(orderId, result);
        return result;
    }

    /**
     * Handle a delivery delay event from Kafka
     */
    public Map<String, Object> handleDeliveryDelay(String orderId, String details) {
        log.info("📦 Handling delivery delay for order {}: {}", orderId, details);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("issueType", "DELIVERY_DELAYED");
        result.put("timestamp", LocalDateTime.now().toString());

        String resolutionResult = issueDetectionTool.resolveDeliveryDelay(orderId);
        result.put("resolution", resolutionResult);

        if (resolutionResult.contains("Automated resolution")) {
            result.put("status", "RESOLVED");
            result.put("action", "Discount code offered, notification sent");
        } else {
            result.put("status", "INFO");
            result.put("action", "No delay detected");
        }

        publishAgentResolutionEvent(orderId, result);
        return result;
    }

    /**
     * Handle a stock-out event from Kafka
     */
    public Map<String, Object> handleStockOut(String orderId, String productId, String productTitle) {
        log.info("📦 Handling stock-out for order {} product {}: {}", orderId, productId, productTitle);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("issueType", "OUT_OF_STOCK");
        result.put("timestamp", LocalDateTime.now().toString());

        String resolutionResult = issueDetectionTool.resolveStockSubstitution(orderId, productId);
        result.put("resolution", resolutionResult);

        if (resolutionResult.contains("alternative")) {
            result.put("status", "RESOLVING");
            result.put("action", "Substitution alternatives proposed");
        } else {
            result.put("status", "ESCALATED");
            result.put("action", "No alternatives found, escalated");
        }

        publishAgentResolutionEvent(orderId, result);
        return result;
    }

    /**
     * Proactively scan for issues across recent orders
     */
    public List<Map<String, Object>> proactiveScan() {
        log.info("🔍 Running proactive order issue scan");

        List<Map<String, Object>> results = new ArrayList<>();

        // Find orders in concerning states
        List<Map<String, Object>> problemOrders;
        try {
            problemOrders = issueDetectionTool.detectOrderIssues("") == null
                ? List.of()
                : List.of();
        } catch (Exception e) {
            log.debug("Scan skipped: {}", e.getMessage());
            return results;
        }

        return results;
    }

    /**
     * Get the timeline of agent actions for a given order
     */
    public List<Map<String, Object>> getOrderTimeline(String orderNumber) {
        List<OrderIssue> issues = issueRepository.findByOrderNumberOrderByCreatedAtDesc(orderNumber);
        List<Map<String, Object>> timeline = new ArrayList<>();

        for (OrderIssue issue : issues) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", issue.getId());
            entry.put("issueType", issue.getIssueType().name());
            entry.put("status", issue.getStatus().name());
            entry.put("detectionDetails", issue.getDetectionDetails());
            entry.put("resolutionAction", issue.getResolutionAction());
            entry.put("resolutionResult", issue.getResolutionResult());
            entry.put("resolvedAutomatically", issue.getResolvedAutomatically());
            entry.put("escalatedToHuman", issue.getEscalatedToHuman());
            entry.put("escalationReason", issue.getEscalationReason());
            entry.put("retryCount", issue.getRetryCount());
            entry.put("createdAt", issue.getCreatedAt() != null ? issue.getCreatedAt().toString() : null);
            entry.put("resolvedAt", issue.getResolvedAt() != null ? issue.getResolvedAt().toString() : null);
            timeline.add(entry);
        }

        return timeline;
    }

    private void publishAgentResolutionEvent(String orderId, Map<String, Object> result) {
        try {
            Map<String, Object> event = new LinkedHashMap<>(result);
            event.put("eventType", "AGENT_RESOLUTION");
            event.put("source", "agent-service");
            event.put("timestamp", System.currentTimeMillis());
            kafkaTemplate.send("agent.events", objectMapper.writeValueAsString(event));
            log.info("Published agent resolution event for order {}", orderId);
        } catch (Exception e) {
            log.warn("Failed to publish resolution event: {}", e.getMessage());
        }
    }
}
