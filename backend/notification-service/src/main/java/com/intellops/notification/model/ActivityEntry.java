package com.intellops.notification.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

/**
 * A single entry in the cross-service activity timeline.
 * <p>
 * Populated by the Kafka consumer from events published by the order and
 * billing services (ORDER_CREATED, ORDER_STATUS_CHANGED, INVOICE_CREATED,
 * INVOICE_PAID, PAYMENT_RECEIVED, ...). The AI co-pilot uses this timeline
 * as the source of truth for "what happened to this order and when".
 */
@Document(collection = "activity_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityEntry {

    @Id
    private String id;

    /** e.g. ORDER_CREATED, ORDER_STATUS_CHANGED, INVOICE_PAID */
    @Indexed
    private String eventType;

    /** Origin service, e.g. order-service, billing-service */
    private String source;

    /** Logical entity this event is about, e.g. an order number or invoice number */
    @Indexed
    private String entityId;

    /** e.g. ORDER, INVOICE, PAYMENT, ACCOUNT */
    private String entityType;

    /** Free-form key/value detail captured from the event payload */
    private Map<String, String> details;

    @Indexed
    private Instant timestamp;
}
