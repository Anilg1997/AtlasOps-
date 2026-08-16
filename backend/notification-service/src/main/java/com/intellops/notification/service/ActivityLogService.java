package com.intellops.notification.service;

import com.intellops.notification.model.ActivityEntry;
import com.intellops.notification.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ActivityLogRepository repository;

    public ActivityEntry record(ActivityEntry entry) {
        if (entry.getTimestamp() == null) {
            entry.setTimestamp(Instant.now());
        }
        return repository.save(entry);
    }

    /** Records an event from a parsed Kafka payload (Map of String -> Object). */
    public ActivityEntry recordEvent(String source, Map<String, Object> payload) {
        String eventType = asString(payload.get("eventType"));
        if (eventType == null || eventType.isBlank()) {
            eventType = asString(payload.get("event_type"));
        }
        if (eventType == null || eventType.isBlank()) {
            log.warn("Skipping event with no eventType from {}", source);
            return null;
        }

        ActivityEntry.ActivityEntryBuilder builder = ActivityEntry.builder()
                .eventType(eventType)
                .source(source)
                .timestamp(parseTimestamp(payload.get("timestamp")));

        // Pick the entity id/type from the event shape
        String orderNumber = firstNonBlank(
                asString(payload.get("orderNumber")), asString(payload.get("order_number")));
        String invoiceNumber = firstNonBlank(
                asString(payload.get("invoiceNumber")), asString(payload.get("invoice_number")));
        String paymentRef = firstNonBlank(
                asString(payload.get("paymentRef")), asString(payload.get("payment_ref")));
        String accountNumber = firstNonBlank(
                asString(payload.get("accountNumber")), asString(payload.get("account_number")));
        String customerEmail = firstNonBlank(
                asString(payload.get("customerEmail")), asString(payload.get("customer_email")));

        if (eventType.startsWith("ORDER_")) {
            builder.entityId(orderNumber).entityType("ORDER");
        } else if (eventType.startsWith("INVOICE_")) {
            builder.entityId(invoiceNumber).entityType("INVOICE");
        } else if (eventType.startsWith("PAYMENT_")) {
            builder.entityId(paymentRef != null ? paymentRef : invoiceNumber).entityType("PAYMENT");
        } else if (eventType.startsWith("BILLING_") || accountNumber != null) {
            builder.entityId(accountNumber).entityType("ACCOUNT");
        } else {
            builder.entityId(firstNonBlank(orderNumber, invoiceNumber, paymentRef, accountNumber))
                    .entityType("UNKNOWN");
        }

        // Details = the rest of the payload as strings
        Map<String, String> details = new LinkedHashMap<>();
        payload.forEach((key, value) -> {
            if (value != null && !(value instanceof Map) && !(value instanceof List)) {
                details.put(key, String.valueOf(value));
            }
        });
        builder.details(details);

        ActivityEntry entry = builder.build();
        log.debug("Recording activity event: {} entity={} {} from {}", eventType,
                entry.getEntityType(), entry.getEntityId(), source);
        return record(entry);
    }

    public List<ActivityEntry> getActivity(String entityId, String entityType,
                                           String eventType, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        PageRequest page = PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "timestamp"));

        if (entityId != null && !entityId.isBlank() && entityType != null && !entityType.isBlank()) {
            return repository.findByEntityIdAndEntityTypeOrderByTimestampDesc(entityId, entityType, page);
        }
        if (entityId != null && !entityId.isBlank()) {
            return repository.findByEntityIdOrderByTimestampDesc(entityId, page);
        }
        if (eventType != null && !eventType.isBlank()) {
            return repository.findByEventTypeOrderByTimestampDesc(eventType, page);
        }
        if (entityType != null && !entityType.isBlank()) {
            return repository.findByEntityTypeOrderByTimestampDesc(entityType, page);
        }
        return repository.findAllByOrderByTimestampDesc(page);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalEntries", repository.count());
        stats.put("totalOrders", repository.countByEntityType("ORDER"));
        stats.put("totalInvoices", repository.countByEntityType("INVOICE"));
        stats.put("totalPayments", repository.countByEntityType("PAYMENT"));
        return stats;
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private String asString(Object value) {
        if (value == null) return null;
        String s = String.valueOf(value);
        return s.isBlank() ? null : s;
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    private Instant parseTimestamp(Object value) {
        if (value == null) return Instant.now();
        String s = String.valueOf(value);
        try {
            return Instant.parse(s);
        } catch (Exception ignored) {
        }
        try {
            return java.time.LocalDateTime.parse(s).atZone(java.time.ZoneId.systemDefault()).toInstant();
        } catch (Exception ignored) {
        }
        return Instant.now();
    }
}
