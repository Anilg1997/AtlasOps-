package com.intellops.order.events;

import com.intellops.order.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void publishOrderEvent(OrderEvent event) {
        CompletableFuture<SendResult<String, OrderEvent>> future =
                kafkaTemplate.send(KafkaConfig.ORDER_EVENTS_TOPIC, event.getOrderNumber(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish order event: {}", ex.getMessage());
            } else {
                log.info("Published order event: {} for order: {}",
                        event.getEventType(), event.getOrderNumber());
            }
        });
    }

    public void publishOrderCreated(String orderNumber, String customerId) {
        publishOrderEvent(OrderEvent.builder()
                .eventType("ORDER_CREATED")
                .orderNumber(orderNumber)
                .customerId(customerId)
                .status("PENDING")
                .timestamp(java.time.LocalDateTime.now())
                .build());
    }

    public void publishOrderStatusChanged(String orderNumber, String oldStatus, String newStatus) {
        publishOrderEvent(OrderEvent.builder()
                .eventType("ORDER_STATUS_CHANGED")
                .orderNumber(orderNumber)
                .status(newStatus)
                .timestamp(java.time.LocalDateTime.now())
                .build());
    }
}
