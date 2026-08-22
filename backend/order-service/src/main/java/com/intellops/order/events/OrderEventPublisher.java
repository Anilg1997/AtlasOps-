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

    public void publishPaymentFailed(String orderNumber, String reason) {
        OrderEvent event = OrderEvent.builder()
                .eventType("ORDER_PAYMENT_FAILED")
                .orderNumber(orderNumber)
                .status("PAYMENT_FAILED")
                .metadata(java.util.Map.of("reason", reason))
                .timestamp(java.time.LocalDateTime.now())
                .build();
        CompletableFuture<SendResult<String, OrderEvent>> future =
                kafkaTemplate.send("order.payment-failed", orderNumber, event);
        future.whenComplete((result, ex) -> {
            if (ex != null) log.error("Failed to publish payment-failed event: {}", ex.getMessage());
            else log.info("Published payment-failed event for order: {}", orderNumber);
        });
    }

    public void publishDeliveryDelayed(String orderNumber, String details) {
        OrderEvent event = OrderEvent.builder()
                .eventType("ORDER_DELIVERY_DELAYED")
                .orderNumber(orderNumber)
                .status("DELAYED")
                .metadata(java.util.Map.of("details", details))
                .timestamp(java.time.LocalDateTime.now())
                .build();
        CompletableFuture<SendResult<String, OrderEvent>> future =
                kafkaTemplate.send("order.delivery-delayed", orderNumber, event);
        future.whenComplete((result, ex) -> {
            if (ex != null) log.error("Failed to publish delivery-delayed event: {}", ex.getMessage());
            else log.info("Published delivery-delayed event for order: {}", orderNumber);
        });
    }

    public void publishStockOut(String orderNumber, String productId, String productTitle) {
        OrderEvent event = OrderEvent.builder()
                .eventType("ORDER_STOCK_OUT")
                .orderNumber(orderNumber)
                .status("STOCK_OUT")
                .metadata(java.util.Map.of("productId", productId, "productTitle", productTitle))
                .timestamp(java.time.LocalDateTime.now())
                .build();
        CompletableFuture<SendResult<String, OrderEvent>> future =
                kafkaTemplate.send("order.stock-out", orderNumber, event);
        future.whenComplete((result, ex) -> {
            if (ex != null) log.error("Failed to publish stock-out event: {}", ex.getMessage());
            else log.info("Published stock-out event for order: {}", orderNumber);
        });
    }
}
