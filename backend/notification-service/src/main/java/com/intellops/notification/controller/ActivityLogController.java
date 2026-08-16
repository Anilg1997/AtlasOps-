package com.intellops.notification.controller;

import com.intellops.notification.model.ActivityEntry;
import com.intellops.notification.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for the cross-service activity timeline.
 * <p>
 * - GET  /api/v1/activity?entityId=&entityType=&eventType=&limit=
 * - GET  /api/v1/activity/stats
 * - POST /api/v1/activity/events  — manual event injection for demos
 * <p>
 * The POST endpoint accepts the same JSON shape the services publish to Kafka
 * (e.g. {"eventType":"ORDER_CREATED","orderNumber":"ORD-1001","status":"PENDING"})
 * and records it straight into the activity log with source "manual", so a feed
 * can be populated without needing Kafka running.
 */
@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<ActivityEntry>> getActivity(
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String eventType,
            @RequestParam(defaultValue = "50") int limit) {

        List<ActivityEntry> entries = activityLogService.getActivity(entityId, entityType, eventType, limit);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(activityLogService.getStats());
    }

    /**
     * Publishes a demo event into the activity feed.
     *
     * @param payload the event payload (eventType plus optional entity fields
     *                such as orderNumber / invoiceNumber / paymentRef / accountNumber)
     * @return 201 with the persisted entry, or 400 when the body is empty or
     *         {@code eventType} is missing
     */
    @PostMapping("/events")
    public ResponseEntity<?> publishEvent(@RequestBody(required = false) Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Request body is required"));
        }

        ActivityEntry entry = activityLogService.recordEvent("manual", payload);
        if (entry == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "eventType is required in the payload"));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(entry);
    }
}
