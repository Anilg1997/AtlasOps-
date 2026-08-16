package com.intellops.notification.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.notification.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Consumes the Kafka event topics published by the order and billing services
 * and persists each event as an {@link com.intellops.notification.model.ActivityEntry}
 * in MongoDB — the cross-service activity timeline the AI co-pilot queries.
 * <p>
 * Events are deserialized as raw JSON strings (not typed) so this service is
 * decoupled from the producer-side type headers and trusted-package config.
 */
@Component
@EnableKafka
@RequiredArgsConstructor
@Slf4j
public class KafkaEventConsumer {

    public static final String ORDER_EVENTS_TOPIC = "order-events";
    public static final String ACTIVITY_LOG_TOPIC = "activity-log";
    public static final String INVOICE_CREATED_TOPIC = "invoice.created";
    public static final String INVOICE_PAID_TOPIC = "invoice.paid";
    public static final String PAYMENT_RECEIVED_TOPIC = "payment.received";
    public static final String BILLING_ACCOUNT_CHANGED_TOPIC = "billing.account.changed";

    private final ActivityLogService activityLogService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = {
            ORDER_EVENTS_TOPIC,
            ACTIVITY_LOG_TOPIC,
            INVOICE_CREATED_TOPIC,
            INVOICE_PAID_TOPIC,
            PAYMENT_RECEIVED_TOPIC,
            BILLING_ACCOUNT_CHANGED_TOPIC
    })
    public void onEvent(String payload) {
        if (payload == null || payload.isBlank()) {
            log.debug("Ignoring empty Kafka message");
            return;
        }
        try {
            Map<String, Object> event = objectMapper.readValue(payload, new TypeReference<>() {});
            activityLogService.recordEvent("kafka", event);
        } catch (Exception e) {
            log.error("Failed to parse Kafka event payload: {}", e.getMessage());
        }
    }
}
