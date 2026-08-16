package com.intellops.copilot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Plain HTTP liveness / readiness endpoints for container orchestrators and
 * host-level health checks (Railway, Render, Docker healthchecks, ...).
 * <p>
 * - GET /health  — liveness: the process is up and serving traffic.
 * - GET /ready   — readiness: PostgreSQL is reachable and Ollama responds.
 * <p>
 * Actuator's /actuator/health remains available for richer detail.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @Value("${intellops.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${intellops.ai.ollama.model:llama3.1}")
    private String ollamaModel;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", "ai-copilot-service");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> ready() {
        Map<String, Object> checks = new LinkedHashMap<>();

        // 1. Database reachability
        boolean dbUp = false;
        try {
            Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            dbUp = one != null && one == 1;
        } catch (Exception e) {
            log.warn("Readiness: database check failed: {}", e.getMessage());
        }
        checks.put("database", dbUp ? "UP" : "DOWN");

        // 2. Ollama reachability + model availability
        boolean ollamaUp = false;
        boolean modelReady = false;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaBaseUrl + "/api/tags"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            ollamaUp = response.statusCode() == 200;
            modelReady = ollamaUp && response.body().contains(ollamaModel);
        } catch (Exception e) {
            log.warn("Readiness: Ollama check failed: {}", e.getMessage());
        }
        checks.put("ollama", ollamaUp ? "UP" : "DOWN");
        checks.put("model", modelReady ? ollamaModel + " ready" : ollamaModel + " not loaded yet");

        boolean ready = dbUp && ollamaUp;
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", ready ? "READY" : "NOT_READY");
        body.put("service", "ai-copilot-service");
        body.put("checks", checks);

        return ready
                ? ResponseEntity.ok(body)
                : ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
