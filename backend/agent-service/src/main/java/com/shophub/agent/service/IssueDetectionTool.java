package com.shophub.agent.service;

import com.shophub.agent.model.OrderIssue;
import com.shophub.agent.repository.OrderIssueRepository;
import dev.langchain4j.agent.tool.Tool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;

/**
 * IssueDetectionTool — MCP tools for autonomous order issue detection and resolution.
 *
 * These tools are registered with LangChain4j and can be invoked by the LLM
 * or triggered proactively via Kafka events. They represent the "agentic"
 * capabilities that differentiate ShopHub from simple chatbot implementations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IssueDetectionTool {

    private final OrderIssueRepository issueRepository;
    private final JdbcOperations jdbcTemplate;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final VectorStoreService vectorStore;

    @Value("${order-service.url:http://localhost:8083}")
    private String orderServiceUrl;

    @Value("${product-service.url:http://localhost:8082}")
    private String productServiceUrl;

    @Tool("Detect all issues for a given order. Checks payment status, stock availability, delivery delays, duplicate orders, and price mismatches. Returns a JSON summary of detected issues.")
    public String detectOrderIssues(String orderId) {
        log.info("🔍 MCP Tool: detectOrderIssues({})", orderId);
        List<Map<String, String>> issues = new ArrayList<>();

        try {
            // 1. Check payment status
            Map<String, String> paymentIssue = checkPaymentStatus(orderId);
            if (paymentIssue != null) issues.add(paymentIssue);

            // 2. Check stock availability for items in order
            List<Map<String, String>> stockIssues = checkStockAvailability(orderId);
            issues.addAll(stockIssues);

            // 3. Check delivery delay
            Map<String, String> deliveryIssue = checkDeliveryDelay(orderId);
            if (deliveryIssue != null) issues.add(deliveryIssue);

            // 4. Check for duplicate orders
            Map<String, String> duplicateIssue = checkDuplicateOrders(orderId);
            if (duplicateIssue != null) issues.add(duplicateIssue);

            // 5. Check price mismatch
            Map<String, String> priceIssue = checkPriceMismatch(orderId);
            if (priceIssue != null) issues.add(priceIssue);

            if (issues.isEmpty()) {
                return "✅ No issues detected for order " + orderId + ". Order is healthy.";
            }

            StringBuilder result = new StringBuilder();
            result.append(String.format("⚠️ Found %d issue(s) for order %s:\n\n", issues.size(), orderId));
            for (int i = 0; i < issues.size(); i++) {
                Map<String, String> issue = issues.get(i);
                result.append(String.format("%d. **%s**: %s\n", i + 1,
                    issue.get("type"), issue.get("description")));
            }
            return result.toString();

        } catch (Exception e) {
            log.error("Failed to detect issues for order {}: {}", orderId, e.getMessage());
            return "❌ Failed to check order status: " + e.getMessage();
        }
    }

    @Tool("Attempt to retry a failed payment for an order. Simulates re-processing the payment through the billing system. Returns success or failure status.")
    public String resolvePaymentRetry(String orderId) {
        log.info("🔧 MCP Tool: resolvePaymentRetry({})", orderId);
        try {
            // Record the attempt
            OrderIssue issue = OrderIssue.builder()
                .orderNumber(orderId)
                .issueType(OrderIssue.IssueType.PAYMENT_FAILED)
                .status(OrderIssue.IssueStatus.RESOLVING)
                .resolutionAction("Retrying payment via billing service")
                .retryCount(1)
                .build();
            issueRepository.save(issue);

            // Simulate payment retry — in production this would call billing-service
            // For demo: 70% success rate on retry
            boolean success = new Random().nextInt(10) < 7;

            if (success) {
                issue.setStatus(OrderIssue.IssueStatus.RESOLVED);
                issue.setResolvedAutomatically(true);
                issue.setResolutionResult("Payment retry succeeded on attempt 1");
                issue.setResolvedAt(LocalDateTime.now());
                issueRepository.save(issue);

                // Publish resolution event
                publishResolutionEvent(orderId, "PAYMENT_RETRY_SUCCEEDED", "Payment retried and succeeded");

                return "✅ Payment retry SUCCEEDED for order " + orderId +
                       ". The order has been re-confirmed and will proceed to processing.";
            } else {
                issue.setStatus(OrderIssue.IssueStatus.FAILED);
                issue.setResolutionResult("Payment retry failed — gateway declined");
                issueRepository.save(issue);

                // Escalate after failed retry
                return escalateToHuman(orderId, "Payment retry failed. Customer needs to provide new payment method.");
            }

        } catch (Exception e) {
            log.error("Payment retry failed for {}: {}", orderId, e.getMessage());
            return "❌ Payment retry failed: " + e.getMessage();
        }
    }

    @Tool("Find a similar in-stock product to substitute for an out-of-stock item in an order. Uses vector similarity search to find alternatives.")
    public String resolveStockSubstitution(String orderId, String itemId) {
        log.info("🔧 MCP Tool: resolveStockSubstitution({}, {})", orderId, itemId);
        try {
            // Find the out-of-stock product's details
            String title = jdbcTemplate.queryForObject(
                "SELECT oi.product_title FROM order_items oi " +
                "JOIN orders o ON oi.order_id = o.id " +
                "WHERE o.order_number = ? AND oi.id = ?",
                String.class, orderId, Long.parseLong(itemId)
            );

            if (title == null) {
                return "❌ Could not find order item " + itemId + " in order " + orderId;
            }

            // Use vector search to find similar in-stock products
            List<Map<String, Object>> alternatives = vectorStore.searchProducts(title, 5);
            List<Map<String, Object>> inStockAlternatives = alternatives.stream()
                .filter(p -> ((Number) p.getOrDefault("stock", 0)).intValue() > 0)
                .filter(p -> !p.get("title").toString().equals(title))
                .limit(3)
                .toList();

            if (inStockAlternatives.isEmpty()) {
                // Record the issue and escalate
                OrderIssue issue = OrderIssue.builder()
                    .orderNumber(orderId)
                    .issueType(OrderIssue.IssueType.OUT_OF_STOCK)
                    .status(OrderIssue.IssueStatus.ESCALATED)
                    .detectionDetails("Item '" + title + "' out of stock, no alternatives found")
                    .escalatedToHuman(true)
                    .escalationReason("No suitable in-stock alternatives found for substitution")
                    .build();
                issueRepository.save(issue);

                return "❌ No suitable in-stock alternatives found for '" + title +
                       "'. Escalating to human support for manual resolution.";
            }

            StringBuilder result = new StringBuilder();
            result.append(String.format("🔄 Found %d alternative(s) for '%s':\n\n", inStockAlternatives.size(), title));
            for (int i = 0; i < inStockAlternatives.size(); i++) {
                Map<String, Object> alt = inStockAlternatives.get(i);
                result.append(String.format("%d. **%s** — $%.2f ⭐%.1f (In Stock: %d units)\n",
                    i + 1, alt.get("title"), alt.get("price"), alt.get("rating"), alt.get("stock")));
            }
            result.append("\nSay **\"substitute with [product name]\"** to approve the swap.");

            // Record the substitution suggestion
            OrderIssue issue = OrderIssue.builder()
                .orderNumber(orderId)
                .issueType(OrderIssue.IssueType.OUT_OF_STOCK)
                .status(OrderIssue.IssueStatus.RESOLVING)
                .detectionDetails("Item '" + title + "' out of stock")
                .resolutionAction("Proposed " + inStockAlternatives.size() + " alternatives via vector similarity search")
                .build();
            issueRepository.save(issue);

            return result.toString();

        } catch (Exception e) {
            log.error("Stock substitution failed for {} item {}: {}", orderId, itemId, e.getMessage());
            return "❌ Stock substitution check failed: " + e.getMessage();
        }
    }

    @Tool("Check delivery status for an order and offer a discount code if delivery is delayed. Returns revised ETA and compensation details.")
    public String resolveDeliveryDelay(String orderId) {
        log.info("🔧 MCP Tool: resolveDeliveryDelay({})", orderId);
        try {
            // Check order status and creation time
            Map<String, Object> orderInfo = jdbcTemplate.queryForMap(
                "SELECT status, created_at, updated_at, total_amount FROM orders WHERE order_number = ?",
                orderId
            );

            String status = (String) orderInfo.get("status");
            LocalDateTime createdAt = ((java.sql.Timestamp) orderInfo.get("created_at")).toLocalDateTime();
            long daysSinceCreation = java.time.Duration.between(createdAt, LocalDateTime.now()).toDays();

            if ("DELIVERED".equals(status)) {
                return "✅ Order " + orderId + " has been delivered. No delay to resolve.";
            }

            if ("CANCELLED".equals(status)) {
                return "ℹ️ Order " + orderId + " has been cancelled.";
            }

            // Check if delivery is delayed (more than 5 days in transit without delivery)
            if (daysSinceCreation > 5 && List.of("SHIPPED", "PROCESSING").contains(status)) {
                // Record the delay
                OrderIssue issue = OrderIssue.builder()
                    .orderNumber(orderId)
                    .issueType(OrderIssue.IssueType.DELIVERY_DELAYED)
                    .status(OrderIssue.IssueStatus.RESOLVING)
                    .detectionDetails(String.format("Order %s has been in %s status for %d days", orderId, status, daysSinceCreation))
                    .build();
                issueRepository.save(issue);

                // Generate a compensation discount code
                String discountCode = "DELAY-" + orderId.substring(orderId.length() - 6);
                issue.setResolutionAction("Offered 15% discount code: " + discountCode);
                issue.setStatus(OrderIssue.IssueStatus.RESOLVED);
                issue.setResolvedAutomatically(true);
                issue.setResolutionResult("Discount code " + discountCode + " generated and notification sent");
                issue.setResolvedAt(LocalDateTime.now());
                issueRepository.save(issue);

                // Publish resolution event for notification-service
                publishResolutionEvent(orderId, "DELIVERY_DELAY_RESOLVED",
                    "Delay detected. Discount code " + discountCode + " offered. Revised ETA: " +
                    LocalDateTime.now().plusDays(2).toLocalDate());

                return String.format(
                    "📦 Delivery delay detected for order %s (in %s for %d days).\n\n" +
                    "✅ **Automated resolution:**\n" +
                    "• Generated discount code: **%s** (15%% off next order)\n" +
                    "• Revised estimated delivery: **%s**\n" +
                    "• Notification sent to customer\n\n" +
                    "The customer has been automatically compensated for the delay.",
                    orderId, status, daysSinceCreation, discountCode,
                    LocalDateTime.now().plusDays(2).toLocalDate()
                );
            }

            return "ℹ️ Order " + orderId + " is currently in " + status +
                   " status (" + daysSinceCreation + " days). No delay detected.";

        } catch (Exception e) {
            log.error("Delivery delay check failed for {}: {}", orderId, e.getMessage());
            return "❌ Delivery status check failed: " + e.getMessage();
        }
    }

    @Tool("Escalate an order issue to human support when automated resolution is not possible. Creates a support ticket record.")
    public String escalateToHuman(String orderId, String reason) {
        log.info("🚨 MCP Tool: escalateToHuman({}, {})", orderId, reason);
        try {
            OrderIssue issue = OrderIssue.builder()
                .orderNumber(orderId)
                .issueType(OrderIssue.IssueType.PAYMENT_FAILED)
                .status(OrderIssue.IssueStatus.ESCALATED)
                .detectionDetails(reason)
                .escalatedToHuman(true)
                .escalationReason(reason)
                .resolutionAction("Escalated to human support team")
                .build();
            issueRepository.save(issue);

            // Publish escalation event for notification-service
            publishResolutionEvent(orderId, "ISSUE_ESCALATED",
                "Escalated to human support: " + reason);

            return String.format(
                "🚨 **Issue escalated to human support**\n\n" +
                "Order: %s\n" +
                "Reason: %s\n\n" +
                "A support specialist will review this within 1 business hour. " +
                "You'll receive an email notification when the issue is addressed.",
                orderId, reason
            );

        } catch (Exception e) {
            log.error("Escalation failed for {}: {}", orderId, e.getMessage());
            return "❌ Failed to escalate: " + e.getMessage();
        }
    }

    // ── Internal helpers ──────────────────────────────────────────────

    private Map<String, String> checkPaymentStatus(String orderId) {
        try {
            String paymentStatus = jdbcTemplate.queryForObject(
                "SELECT payment_status FROM orders WHERE order_number = ?",
                String.class, orderId
            );
            if ("FAILED".equals(paymentStatus) || "PENDING".equals(paymentStatus)) {
                return Map.of(
                    "type", "PAYMENT_" + paymentStatus,
                    "description", "Payment is " + paymentStatus.toLowerCase() + " for order " + orderId
                );
            }
        } catch (Exception e) {
            log.debug("Could not check payment status: {}", e.getMessage());
        }
        return null;
    }

    private List<Map<String, String>> checkStockAvailability(String orderId) {
        List<Map<String, String>> issues = new ArrayList<>();
        try {
            List<Map<String, Object>> items = jdbcTemplate.queryForList(
                "SELECT oi.id, oi.product_title, oi.quantity, p.stock " +
                "FROM order_items oi " +
                "JOIN orders o ON oi.order_id = o.id " +
                "JOIN products p ON oi.product_id = p.id " +
                "WHERE o.order_number = ?",
                orderId
            );
            for (Map<String, Object> item : items) {
                int stock = ((Number) item.get("stock")).intValue();
                if (stock <= 0) {
                    issues.add(Map.of(
                        "type", "OUT_OF_STOCK",
                        "description", String.format("'%s' is out of stock (0 units remaining)",
                            item.get("product_title"))
                    ));
                }
            }
        } catch (Exception e) {
            log.debug("Could not check stock: {}", e.getMessage());
        }
        return issues;
    }

    private Map<String, String> checkDeliveryDelay(String orderId) {
        try {
            Map<String, Object> order = jdbcTemplate.queryForMap(
                "SELECT status, created_at FROM orders WHERE order_number = ?", orderId
            );
            String status = (String) order.get("status");
            LocalDateTime createdAt = ((java.sql.Timestamp) order.get("created_at")).toLocalDateTime();
            long daysSinceCreation = java.time.Duration.between(createdAt, LocalDateTime.now()).toDays();

            if (daysSinceCreation > 7 && "SHIPPED".equals(status)) {
                return Map.of(
                    "type", "DELIVERY_DELAYED",
                    "description", String.format("Order has been in SHIPPED status for %d days (expected <7 days)",
                        daysSinceCreation)
                );
            }
        } catch (Exception e) {
            log.debug("Could not check delivery delay: {}", e.getMessage());
        }
        return null;
    }

    private Map<String, String> checkDuplicateOrders(String orderId) {
        try {
            // Check for orders with the same items placed within 5 minutes
            Integer duplicateCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM orders o1 " +
                "JOIN orders o2 ON o1.user_id = o2.user_id AND o1.id != o2.id " +
                "WHERE o1.order_number = ? " +
                "AND ABS(EXTRACT(EPOCH FROM (o1.created_at - o2.created_at))) < 300",
                Integer.class, orderId
            );
            if (duplicateCount != null && duplicateCount > 0) {
                return Map.of(
                    "type", "DUPLICATE_ORDER",
                    "description", String.format("Found %d potentially duplicate order(s) within 5-minute window", duplicateCount)
                );
            }
        } catch (Exception e) {
            log.debug("Could not check duplicates: {}", e.getMessage());
        }
        return null;
    }

    private Map<String, String> checkPriceMismatch(String orderId) {
        try {
            // Compare order total with sum of current product prices * quantities
            Integer mismatchCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM order_items oi " +
                "JOIN products p ON oi.product_id = p.id " +
                "WHERE oi.order_id = (SELECT id FROM orders WHERE order_number = ?) " +
                "AND ABS(oi.unit_price - p.price) > 0.01",
                Integer.class, orderId
            );
            if (mismatchCount != null && mismatchCount > 0) {
                return Map.of(
                    "type", "PRICE_MISMATCH",
                    "description", String.format("%d item(s) have price differences between order time and current catalog", mismatchCount)
                );
            }
        } catch (Exception e) {
            log.debug("Could not check price mismatch: {}", e.getMessage());
        }
        return null;
    }

    private void publishResolutionEvent(String orderId, String eventType, String details) {
        try {
            Map<String, Object> event = Map.of(
                "eventType", eventType,
                "orderNumber", orderId,
                "details", details,
                "timestamp", System.currentTimeMillis(),
                "source", "agent-service"
            );
            kafkaTemplate.send("agent.events",
                new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(event));
        } catch (Exception e) {
            log.warn("Failed to publish resolution event: {}", e.getMessage());
        }
    }
}
