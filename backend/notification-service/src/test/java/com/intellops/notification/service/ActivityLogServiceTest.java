package com.intellops.notification.service;

import com.intellops.notification.model.ActivityEntry;
import com.intellops.notification.repository.ActivityLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityLogServiceTest {

    @Mock
    private ActivityLogRepository repository;

    private ActivityLogService service;

    @BeforeEach
    void setUp() {
        service = new ActivityLogService(repository);
    }

    @Test
    void recordEvent_orderCreated_shouldMapToOrderEntity() {
        Map<String, Object> payload = Map.of(
                "eventType", "ORDER_CREATED",
                "orderNumber", "ORD-1001",
                "customerId", "CUST-1",
                "status", "PENDING",
                "timestamp", "2026-08-16T10:00:00Z"
        );

        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.recordEvent("kafka", payload);

        ArgumentCaptor<ActivityEntry> captor = ArgumentCaptor.forClass(ActivityEntry.class);
        verify(repository).save(captor.capture());

        ActivityEntry entry = captor.getValue();
        assertThat(entry.getEventType()).isEqualTo("ORDER_CREATED");
        assertThat(entry.getEntityId()).isEqualTo("ORD-1001");
        assertThat(entry.getEntityType()).isEqualTo("ORDER");
        assertThat(entry.getSource()).isEqualTo("kafka");
        assertThat(entry.getDetails()).containsEntry("status", "PENDING");
        assertThat(entry.getTimestamp()).isNotNull();
    }

    @Test
    void recordEvent_invoiceCreated_shouldMapToInvoiceEntity() {
        Map<String, Object> payload = Map.of(
                "eventType", "INVOICE_CREATED",
                "invoiceNumber", "INV-2026-001",
                "orderNumber", "ORD-1002",
                "amount", "1500.00",
                "status", "ISSUED"
        );

        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.recordEvent("kafka", payload);

        ArgumentCaptor<ActivityEntry> captor = ArgumentCaptor.forClass(ActivityEntry.class);
        verify(repository).save(captor.capture());

        ActivityEntry entry = captor.getValue();
        assertThat(entry.getEventType()).isEqualTo("INVOICE_CREATED");
        assertThat(entry.getEntityId()).isEqualTo("INV-2026-001");
        assertThat(entry.getEntityType()).isEqualTo("INVOICE");
    }

    @Test
    void recordEvent_paymentReceived_shouldMapToPaymentEntity() {
        Map<String, Object> payload = Map.of(
                "eventType", "PAYMENT_RECEIVED",
                "paymentRef", "PAY-001",
                "invoiceNumber", "INV-2026-001",
                "transactionId", "TXN-123"
        );

        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.recordEvent("kafka", payload);

        ArgumentCaptor<ActivityEntry> captor = ArgumentCaptor.forClass(ActivityEntry.class);
        verify(repository).save(captor.capture());

        ActivityEntry entry = captor.getValue();
        assertThat(entry.getEntityType()).isEqualTo("PAYMENT");
        assertThat(entry.getEntityId()).isEqualTo("PAY-001");
    }

    @Test
    void recordEvent_withoutEventType_shouldBeSkipped() {
        Map<String, Object> payload = Map.of("orderNumber", "ORD-1001");

        ActivityEntry result = service.recordEvent("kafka", payload);

        assertThat(result).isNull();
    }

    @Test
    void getActivity_withEntityId_shouldQueryRepository() {
        ActivityEntry entry = ActivityEntry.builder().id("1").eventType("ORDER_CREATED").build();
        when(repository.findByEntityIdOrderByTimestampDesc(any(), any()))
                .thenReturn(List.of(entry));

        var result = service.getActivity("ORD-1001", null, null, 10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEventType()).isEqualTo("ORDER_CREATED");
    }

    @Test
    void getActivity_withEntityIdAndType_shouldQueryRepository() {
        ActivityEntry entry = ActivityEntry.builder().id("1").eventType("ORDER_STATUS_CHANGED").build();
        when(repository.findByEntityIdAndEntityTypeOrderByTimestampDesc(any(), any(), any()))
                .thenReturn(List.of(entry));

        var result = service.getActivity("ORD-1001", "ORDER", null, 10);

        assertThat(result).hasSize(1);
    }

    @Test
    void getActivity_limit_shouldBeClampedTo200() {
        ActivityEntry entry = ActivityEntry.builder().id("1").build();
        when(repository.findAllByOrderByTimestampDesc(any()))
                .thenReturn(List.of(entry));

        var result = service.getActivity(null, null, null, 9999);

        assertThat(result).hasSize(1);
    }

    @Test
    void getStats_shouldReturnCounts() {
        when(repository.count()).thenReturn(100L);
        when(repository.countByEntityType("ORDER")).thenReturn(60L);
        when(repository.countByEntityType("INVOICE")).thenReturn(30L);
        when(repository.countByEntityType("PAYMENT")).thenReturn(10L);

        var stats = service.getStats();

        assertThat(stats.get("totalEntries")).isEqualTo(100L);
        assertThat(stats.get("totalOrders")).isEqualTo(60L);
        assertThat(stats.get("totalInvoices")).isEqualTo(30L);
        assertThat(stats.get("totalPayments")).isEqualTo(10L);
    }
}
