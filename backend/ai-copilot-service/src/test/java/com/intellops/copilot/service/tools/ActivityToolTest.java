package com.intellops.copilot.service.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.copilot.model.EvidenceItem;
import com.intellops.copilot.service.EvidenceCollector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ActivityToolTest {

    private static final String TIMELINE_JSON = """
            [
              {"id":"1","eventType":"ORDER_CREATED","source":"order-service",
               "entityId":"ORD-1001","entityType":"ORDER",
               "details":{"status":"PENDING"},"timestamp":"2026-08-16T10:00:00Z"},
              {"id":"2","eventType":"ORDER_STATUS_CHANGED","source":"order-service",
               "entityId":"ORD-1001","entityType":"ORDER",
               "details":{"status":"ON_HOLD","reason":"Awaiting payment"},"timestamp":"2026-08-16T11:00:00Z"}
            ]
            """;

    private static final String RECENT_JSON = """
            [
              {"id":"1","eventType":"PAYMENT_RECEIVED","source":"billing-service",
               "entityId":"INV-5001","entityType":"INVOICE",
               "details":{},"timestamp":"2026-08-16T10:00:00Z"}
            ]
            """;

    private EvidenceCollector evidenceCollector;
    private StringBuilder requestedUrls;

    @BeforeEach
    void setUp() {
        evidenceCollector = new EvidenceCollector();
        requestedUrls = new StringBuilder();
    }

    private ActivityTool toolReturning(String json) {
        return new ActivityTool(new ObjectMapper(), evidenceCollector) {
            @Override
            protected String httpGet(String url) {
                requestedUrls.append(url).append('\n');
                return json;
            }
        };
    }

    @Test
    void getActivityTimeline_shouldRecordEventsAsEvidence() {
        ActivityTool tool = toolReturning(TIMELINE_JSON);

        String result = tool.getActivityTimeline("ORD-1001", "ORDER");

        assertThat(result).contains("ORDER_CREATED").contains("ORD-1001");
        assertThat(requestedUrls.toString()).contains("entityId=ORD-1001").contains("entityType=ORDER").contains("limit=20");

        assertThat(evidenceCollector.getItems()).hasSize(1);
        EvidenceItem item = evidenceCollector.getItems().get(0);
        assertThat(item.tool()).isEqualTo("ActivityTool");
        assertThat(item.method()).isEqualTo("getActivityTimeline");
        assertThat(item.entityType()).isEqualTo("ORDER");
        assertThat(item.entityId()).isEqualTo("ORD-1001");
        assertThat(item.events()).hasSize(2);
        assertThat(item.events().get(0).get("eventType")).isEqualTo("ORDER_CREATED");
        assertThat(item.events().get(1).get("details"))
                .isEqualTo(Map.of("status", "ON_HOLD", "reason", "Awaiting payment"));
    }

    @Test
    void getRecentActivity_shouldRecordEventsAsEvidence() {
        ActivityTool tool = toolReturning(RECENT_JSON);

        String result = tool.getRecentActivity(10);

        assertThat(result).contains("PAYMENT_RECEIVED");
        assertThat(requestedUrls.toString()).contains("limit=10");

        assertThat(evidenceCollector.getItems()).hasSize(1);
        EvidenceItem item = evidenceCollector.getItems().get(0);
        assertThat(item.method()).isEqualTo("getRecentActivity");
        assertThat(item.entityId()).isNull();
        assertThat(item.events()).hasSize(1);
    }

    @Test
    void getActivityTimeline_withNoEvents_shouldNotRecordEvidence() {
        ActivityTool tool = toolReturning("[]");

        String result = tool.getActivityTimeline("ORD-1001", "ORDER");

        assertThat(result).contains("No activity found");
        assertThat(evidenceCollector.isEmpty()).isTrue();
    }

    @Test
    void getActivityTimeline_whenServiceDown_shouldReturnUnavailableAndNoEvidence() {
        ActivityTool tool = toolReturning(null);

        String result = tool.getActivityTimeline("ORD-1001", "ORDER");

        assertThat(result).contains("unavailable");
        assertThat(evidenceCollector.isEmpty()).isTrue();
    }
}
