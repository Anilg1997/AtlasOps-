package com.intellops.copilot.service;

import com.intellops.copilot.model.EvidenceItem;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EvidenceCollectorTest {

    private final EvidenceCollector collector = new EvidenceCollector();

    @Test
    void add_shouldStoreItem() {
        EvidenceItem item = new EvidenceItem(
                "ActivityTool", "getActivityTimeline", "ORDER", "ORD-1001",
                List.of(Map.of("eventType", "ORDER_CREATED")));

        collector.add(item);

        assertThat(collector.isEmpty()).isFalse();
        assertThat(collector.getItems()).hasSize(1);
        assertThat(collector.getItems().get(0).entityId()).isEqualTo("ORD-1001");
    }

    @Test
    void add_shouldIgnoreNullAndEmptyEvents() {
        collector.add(new EvidenceItem("ActivityTool", "getActivityTimeline", "ORDER", "ORD-1", List.of()));
        collector.add(null);
        collector.add(new EvidenceItem("ActivityTool", "getRecentActivity", null, null, null));

        assertThat(collector.isEmpty()).isTrue();
        assertThat(collector.getItems()).isEmpty();
    }

    @Test
    void getItems_shouldReturnImmutableCopy() {
        collector.add(new EvidenceItem("ActivityTool", "getRecentActivity", null, null,
                List.of(Map.of("eventType", "PAYMENT_RECEIVED"))));

        List<EvidenceItem> first = collector.getItems();
        assertThat(first).hasSize(1);

        collector.add(new EvidenceItem("ActivityTool", "getRecentActivity", null, null,
                List.of(Map.of("eventType", "INVOICE_PAID"))));

        assertThat(first).hasSize(1);
        assertThat(collector.getItems()).hasSize(2);
    }
}
