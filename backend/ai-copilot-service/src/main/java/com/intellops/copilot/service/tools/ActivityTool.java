package com.intellops.copilot.service.tools;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.copilot.model.EvidenceItem;
import com.intellops.copilot.service.EvidenceCollector;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * MCP Tool — Notification/Activity Service integration.
 * <p>
 * Allows the AI agent to query the cross-service activity timeline (audit
 * trail) persisted by the notification-service from Kafka events. This is the
 * source of truth for "what happened to this order/invoice and when".
 * <p>
 * Calls the notification-service REST API ({@code GET /api/v1/activity}) over
 * HTTP — the same pattern as the Billing tool. The raw events it fetches are
 * also recorded into the {@link EvidenceCollector} so the chat UI can render
 * the feed as evidence under the assistant's answer.
 */
@Component
@Slf4j
public class ActivityTool {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(5);

    private final ObjectMapper objectMapper;
    private final EvidenceCollector evidenceCollector;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .build();

    public ActivityTool(ObjectMapper objectMapper, EvidenceCollector evidenceCollector) {
        this.objectMapper = objectMapper;
        this.evidenceCollector = evidenceCollector;
    }

    @Value("${intellops.notification.base-url:http://localhost:8085}")
    private String notificationBaseUrl;

    @Tool("Get the activity timeline (audit trail) for an entity such as an order number or invoice number. Returns a chronological list of events with timestamps, sources, and status details.")
    public String getActivityTimeline(String entityId, String entityType) {
        log.info("🔧 MCP Tool: getActivityTimeline({}, {})", entityId, entityType);
        try {
            StringBuilder url = new StringBuilder(notificationBaseUrl + "/api/v1/activity")
                    .append("?entityId=").append(enc(entityId))
                    .append("&limit=20");
            if (entityType != null && !entityType.isBlank()) {
                url.append("&entityType=").append(enc(entityType));
            }

            String json = httpGet(url.toString());
            if (json == null) {
                return "❌ Notification/Activity service is unavailable. Please ensure notification-service is running on port 8085.";
            }

            JsonNode root = objectMapper.readTree(json);
            if (!root.isArray() || root.size() == 0) {
                return "ℹ️ No activity found for entity: " + entityId;
            }

            recordEvidence("getActivityTimeline", entityType, entityId, root);

            StringBuilder sb = new StringBuilder();
            sb.append("📜 Activity Timeline for ").append(entityId).append(" (").append(root.size()).append(" events):\n");
            for (JsonNode entry : root) {
                sb.append("  • ").append(getText(entry, "eventType"))
                        .append(" — ").append(getText(entry, "source"))
                        .append(" @ ").append(entry.hasNonNull("timestamp") ? entry.get("timestamp").asText() : "n/a")
                        .append("\n");
                JsonNode details = entry.get("details");
                if (details != null && details.isObject()) {
                    details.fields().forEachRemaining(field -> {
                        if (!"timestamp".equals(field.getKey())) {
                            sb.append("      ").append(field.getKey())
                                    .append(": ").append(field.getValue().asText())
                                    .append("\n");
                        }
                    });
                }
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error fetching activity timeline for {}: {}", entityId, e.getMessage());
            return "❌ Error fetching activity timeline: " + e.getMessage();
        }
    }

    @Tool("Get recent system activity across all entities. Returns the latest events from the activity log (order changes, invoice events, payments).")
    public String getRecentActivity(int limit) {
        log.info("🔧 MCP Tool: getRecentActivity({})", limit);
        try {
            int safeLimit = Math.min(Math.max(limit, 1), 50);
            String url = notificationBaseUrl + "/api/v1/activity?limit=" + safeLimit;

            String json = httpGet(url);
            if (json == null) {
                return "❌ Notification/Activity service is unavailable. Please ensure notification-service is running on port 8085.";
            }

            JsonNode root = objectMapper.readTree(json);
            if (!root.isArray() || root.size() == 0) {
                return "ℹ️ No recent activity recorded yet.";
            }

            recordEvidence("getRecentActivity", null, null, root);

            StringBuilder sb = new StringBuilder();
            sb.append("📜 Recent System Activity (").append(root.size()).append(" events):\n");
            for (JsonNode entry : root) {
                sb.append("  • ").append(getText(entry, "eventType"))
                        .append(" | ").append(getText(entry, "entityType"))
                        .append(" ").append(getText(entry, "entityId"))
                        .append(" | ").append(getText(entry, "source"))
                        .append(" @ ").append(entry.hasNonNull("timestamp") ? entry.get("timestamp").asText() : "n/a")
                        .append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error fetching recent activity: {}", e.getMessage());
            return "❌ Error fetching recent activity: " + e.getMessage();
        }
    }

    // ─── Evidence & HTTP Helpers ──────────────────────────────────────────

    /**
     * Stores the raw feed entries the tool returned so the controller can send
     * them to the chat UI as structured evidence.
     */
    private void recordEvidence(String method, String entityType, String entityId, JsonNode root) {
        if (root == null || !root.isArray() || root.size() == 0) {
            return;
        }
        List<Map<String, Object>> events = new ArrayList<>();
        for (JsonNode node : root) {
            events.add(objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {}));
        }
        evidenceCollector.add(new EvidenceItem("ActivityTool", method, entityType, entityId, events));
    }

    /**
     * Fetches a URL over HTTP. Overridable so tests can stub responses without
     * mocking {@link HttpClient}.
     */
    protected String httpGet(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return response.body();
            }
            log.warn("HTTP {} from notification-service: {}", response.statusCode(), url);
            return null;
        } catch (Exception e) {
            log.warn("Failed to call notification-service at {}: {}", url, e.getMessage());
            return null;
        }
    }

    private String enc(String value) {
        return value == null ? "" : URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String getText(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value != null && !value.isNull() ? value.asText() : "";
    }
}
