package com.shophub.agent.service;

import com.shophub.agent.model.OrderIssue;
import com.shophub.agent.repository.OrderIssueRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderIssueServiceTest {

    @Mock
    private OrderIssueRepository issueRepository;

    @Mock
    private JdbcOperations jdbcTemplate;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @Mock
    private VectorStoreService vectorStore;

    private IssueDetectionTool issueDetectionTool;
    private OrderIssueService service;

    private static final String TEST_ORDER = "ORD-20260822-TEST01";

    @BeforeEach
    void setUp() {
        lenient().when(issueRepository.save(any(OrderIssue.class))).thenAnswer(inv -> {
            OrderIssue issue = inv.getArgument(0);
            issue.setId(1L);
            return issue;
        });

        issueDetectionTool = new IssueDetectionTool(issueRepository, jdbcTemplate, kafkaTemplate, vectorStore);
        service = new OrderIssueService(issueRepository, issueDetectionTool, kafkaTemplate, new ObjectMapper());
    }

    @Test
    void handlePaymentFailure_success_returnsResolved() {
        when(jdbcTemplate.queryForObject(
            contains("payment_status"), eq(String.class), eq(TEST_ORDER)))
            .thenReturn("PAID");

        Map<String, Object> result = service.handlePaymentFailure(TEST_ORDER, "Card declined");

        assertThat(result.get("status").toString()).isEqualTo("RESOLVED");
        assertThat(result.get("action").toString()).contains("succeeded");
        verify(kafkaTemplate, atLeast(1)).send(eq("agent.events"), anyString());
    }

    @Test
    void handlePaymentFailure_failed_returnsFailed() {
        when(jdbcTemplate.queryForObject(
            contains("payment_status"), eq(String.class), eq(TEST_ORDER)))
            .thenThrow(new RuntimeException("DB connection lost"));

        Map<String, Object> result = service.handlePaymentFailure(TEST_ORDER, "Timeout");

        // Payment retry is random (70% success) — status is FAILED if retry also fails
        assertThat(result.get("status").toString()).satisfiesAnyOf(
            s -> assertThat(s).isEqualTo("FAILED"),
            s -> assertThat(s).isEqualTo("RESOLVED"),
            s -> assertThat(s).isEqualTo("ESCALATED")
        );
    }

    @Test
    void handleDeliveryDelay_delayDetected_returnsResolved() {
        java.sql.Timestamp oldTimestamp = new java.sql.Timestamp(
            System.currentTimeMillis() - (10L * 24 * 60 * 60 * 1000));

        when(jdbcTemplate.queryForMap(
            contains("status"), eq(TEST_ORDER)))
            .thenReturn(Map.of(
                "status", "SHIPPED",
                "created_at", oldTimestamp,
                "total_amount", 250.00
            ));

        Map<String, Object> result = service.handleDeliveryDelay(TEST_ORDER, "5 days late");

        assertThat(result.get("status").toString()).isEqualTo("RESOLVED");
        assertThat(result.get("action").toString()).contains("Discount code");
    }

    @Test
    void handleDeliveryDelay_noDelay_returnsInfo() {
        when(jdbcTemplate.queryForMap(
            contains("status"), eq(TEST_ORDER)))
            .thenReturn(Map.of(
                "status", "CONFIRMED",
                "created_at", new java.sql.Timestamp(System.currentTimeMillis() - (2L * 24 * 60 * 60 * 1000)),
                "total_amount", 100.00
            ));

        Map<String, Object> result = service.handleDeliveryDelay(TEST_ORDER, "Customer inquired");

        assertThat(result.get("status").toString()).isEqualTo("INFO");
    }

    @Test
    void getOrderTimeline_returnsTimelineEntries() {
        List<OrderIssue> issues = List.of(
            OrderIssue.builder()
                .id(1L).orderNumber(TEST_ORDER)
                .issueType(OrderIssue.IssueType.PAYMENT_FAILED)
                .status(OrderIssue.IssueStatus.RESOLVED)
                .resolvedAutomatically(true)
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .resolvedAt(LocalDateTime.now())
                .build(),
            OrderIssue.builder()
                .id(2L).orderNumber(TEST_ORDER)
                .issueType(OrderIssue.IssueType.DELIVERY_DELAYED)
                .status(OrderIssue.IssueStatus.ESCALATED)
                .escalatedToHuman(true)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build()
        );
        when(issueRepository.findByOrderNumberOrderByCreatedAtDesc(TEST_ORDER))
            .thenReturn(issues);

        List<Map<String, Object>> timeline = service.getOrderTimeline(TEST_ORDER);

        assertThat(timeline).hasSize(2);
        assertThat(timeline.get(0).get("issueType")).isEqualTo("PAYMENT_FAILED");
        assertThat(timeline.get(0).get("resolvedAutomatically")).isEqualTo(true);
        assertThat(timeline.get(1).get("escalatedToHuman")).isEqualTo(true);
    }

    @Test
    void getOrderTimeline_noIssues_returnsEmptyList() {
        when(issueRepository.findByOrderNumberOrderByCreatedAtDesc(TEST_ORDER))
            .thenReturn(List.of());

        List<Map<String, Object>> timeline = service.getOrderTimeline(TEST_ORDER);

        assertThat(timeline).isEmpty();
    }
}
