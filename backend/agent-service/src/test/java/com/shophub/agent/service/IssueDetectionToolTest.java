package com.shophub.agent.service;

import com.shophub.agent.model.OrderIssue;
import com.shophub.agent.repository.OrderIssueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IssueDetectionToolTest {

    @Mock
    private OrderIssueRepository issueRepository;

    @Mock
    private JdbcOperations jdbcTemplate;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @Mock
    private VectorStoreService vectorStore;

    @InjectMocks
    private IssueDetectionTool tool;

    private static final String TEST_ORDER = "ORD-20260822-TEST01";

    @BeforeEach
    void setUp() {
        lenient().when(issueRepository.save(any(OrderIssue.class))).thenAnswer(inv -> {
            OrderIssue issue = inv.getArgument(0);
            issue.setId(1L);
            return issue;
        });
    }

    @Test
    void detectOrderIssues_noIssues_returnsHealthyMessage() {
        when(jdbcTemplate.queryForObject(
            contains("payment_status"), eq(String.class), eq(TEST_ORDER)))
            .thenReturn("PAID");

        String result = tool.detectOrderIssues(TEST_ORDER);

        assertThat(result).contains("No issues detected");
        assertThat(result).contains("healthy");
    }

    @Test
    void detectOrderIssues_paymentFailed_returnsIssue() {
        when(jdbcTemplate.queryForObject(
            contains("payment_status"), eq(String.class), eq(TEST_ORDER)))
            .thenReturn("FAILED");

        when(jdbcTemplate.queryForList(
            contains("order_items"), (Object[]) any()))
            .thenReturn(List.of());

        String result = tool.detectOrderIssues(TEST_ORDER);

        assertThat(result).contains("issue");
    }

    @Test
    void detectOrderIssues_outOfStock_returnsIssue() {
        when(jdbcTemplate.queryForObject(
            contains("payment_status"), eq(String.class), eq(TEST_ORDER)))
            .thenReturn("PAID");

        when(jdbcTemplate.queryForList(
            contains("order_items"), (Object[]) any()))
            .thenReturn(List.of(
                Map.of("id", 1L, "product_title", "iPhone 15", "quantity", 1, "stock", 0)
            ));

        String result = tool.detectOrderIssues(TEST_ORDER);

        assertThat(result).contains("issue");
    }

    @Test
    void resolvePaymentRetry_createsIssueRecord() {
        tool.resolvePaymentRetry(TEST_ORDER);

        verify(issueRepository, atLeast(1)).save(argThat(issue ->
            issue.getOrderNumber().equals(TEST_ORDER) &&
            issue.getIssueType() == OrderIssue.IssueType.PAYMENT_FAILED
        ));
    }

    @Test
    void resolveDeliveryDelay_orderDelivered_returnsNoDelay() {
        when(jdbcTemplate.queryForMap(
            contains("status"), eq(TEST_ORDER)))
            .thenReturn(Map.of(
                "status", "DELIVERED",
                "created_at", new java.sql.Timestamp(System.currentTimeMillis()),
                "total_amount", 100.00
            ));

        String result = tool.resolveDeliveryDelay(TEST_ORDER);

        assertThat(result).contains("has been delivered");
    }

    @Test
    void resolveDeliveryDelay_delayedOrder_offersCompensation() {
        java.sql.Timestamp oldTimestamp = new java.sql.Timestamp(
            System.currentTimeMillis() - (10L * 24 * 60 * 60 * 1000));

        when(jdbcTemplate.queryForMap(
            contains("status"), eq(TEST_ORDER)))
            .thenReturn(Map.of(
                "status", "SHIPPED",
                "created_at", oldTimestamp,
                "total_amount", 250.00
            ));

        String result = tool.resolveDeliveryDelay(TEST_ORDER);

        assertThat(result).contains("Delivery delay detected");
        assertThat(result).contains("discount code");
    }

    @Test
    void escalateToHuman_createsEscalationRecord() {
        String result = tool.escalateToHuman(TEST_ORDER, "Payment retry failed twice");

        assertThat(result).contains("escalated to human support");

        verify(issueRepository).save(argThat(issue ->
            issue.getEscalatedToHuman() == true &&
            issue.getEscalationReason().equals("Payment retry failed twice")
        ));
    }

    @Test
    void escalateToHuman_publishesResolutionEvent() {
        tool.escalateToHuman(TEST_ORDER, "Cannot resolve automatically");

        verify(kafkaTemplate).send(eq("agent.events"), anyString());
    }
}
