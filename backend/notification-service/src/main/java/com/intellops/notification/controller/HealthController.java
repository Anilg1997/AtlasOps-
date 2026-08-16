package com.intellops.notification.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Plain HTTP liveness / readiness endpoints for container orchestrators and
 * host-level health checks (Docker healthchecks, Railway, Render, ...).
 * <p>
 * - GET /health  — liveness: the process is up and serving traffic.
 * - GET /ready   — readiness: MongoDB is reachable.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final MongoTemplate mongoTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", "notification-service");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> ready() {
        boolean mongoUp = false;
        try {
            mongoUp = mongoTemplate.executeCommand("{ ping: 1 }").containsKey("ok");
        } catch (Exception e) {
            log.warn("Readiness: MongoDB check failed: {}", e.getMessage());
        }

        Map<String, Object> checks = new LinkedHashMap<>();
        checks.put("mongodb", mongoUp ? "UP" : "DOWN");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", mongoUp ? "READY" : "NOT_READY");
        body.put("service", "notification-service");
        body.put("checks", checks);

        return mongoUp
                ? ResponseEntity.ok(body)
                : ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
