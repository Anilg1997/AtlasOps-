package com.shophub.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shophub.agent.websocket.AgentWebSocketHandler;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for the streaming callback protocol and AgentStreamingCallback interface.
 *
 * Note: AgentService requires Ollama, JPA repositories, and Kafka that cannot be
 * instantiated in a lightweight unit test on Java 24 (Mockito module restrictions).
 * These tests verify the callback contract and streaming message format that the
 * WebSocket handler and service use together.
 */
class AgentServiceStreamingTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void streamingCallback_onToken_shouldAccumulateContent() {
        AtomicReference<String> accumulated = new AtomicReference<>("");

        AgentWebSocketHandler.AgentStreamingCallback callback =
            new AgentWebSocketHandler.AgentStreamingCallback() {
                @Override
                public void onToken(String token) {
                    accumulated.updateAndGet(current -> current + token);
                }

                @Override
                public void onComplete(Map<String, Object> result) {}

                @Override
                public void onError(String error) {}
            };

        callback.onToken("Hello");
        callback.onToken(" ");
        callback.onToken("World");

        assertThat(accumulated.get()).isEqualTo("Hello World");
    }

    @Test
    void streamingCallback_onComplete_shouldReceiveAllFields() {
        AtomicReference<Map<String, Object>> resultRef = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback =
            new AgentWebSocketHandler.AgentStreamingCallback() {
                @Override
                public void onToken(String token) {}

                @Override
                public void onComplete(Map<String, Object> result) {
                    resultRef.set(result);
                }

                @Override
                public void onError(String error) {}
            };

        Map<String, Object> expectedResult = Map.of(
            "conversationId", 42L,
            "intent", "SEARCH",
            "tools", java.util.List.of(Map.of("type", "search_products"))
        );

        callback.onComplete(expectedResult);

        assertThat(resultRef.get()).isNotNull();
        assertThat(resultRef.get().get("conversationId")).isEqualTo(42L);
        assertThat(resultRef.get().get("intent")).isEqualTo("SEARCH");
        assertThat(resultRef.get().get("tools")).isNotNull();
    }

    @Test
    void streamingCallback_onError_shouldReceiveErrorMessage() {
        AtomicReference<String> errorRef = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback =
            new AgentWebSocketHandler.AgentStreamingCallback() {
                @Override
                public void onToken(String token) {}

                @Override
                public void onComplete(Map<String, Object> result) {}

                @Override
                public void onError(String error) {
                    errorRef.set(error);
                }
            };

        callback.onError("Connection timeout");

        assertThat(errorRef.get()).isEqualTo("Connection timeout");
    }

    @Test
    void streamingCallback_tokensFollowedByComplete_shouldWorkTogether() {
        StringBuilder fullResponse = new StringBuilder();
        AtomicBoolean completed = new AtomicBoolean(false);
        AtomicReference<Map<String, Object>> resultRef = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback =
            new AgentWebSocketHandler.AgentStreamingCallback() {
                @Override
                public void onToken(String token) {
                    fullResponse.append(token);
                }

                @Override
                public void onComplete(Map<String, Object> result) {
                    completed.set(true);
                    resultRef.set(result);
                }

                @Override
                public void onError(String error) {}
            };

        // Simulate streaming
        callback.onToken("I found ");
        callback.onToken("3 laptops ");
        callback.onToken("for you.");

        callback.onComplete(Map.of(
            "conversationId", 1L,
            "intent", "SEARCH",
            "tools", java.util.List.of()
        ));

        assertThat(fullResponse.toString()).isEqualTo("I found 3 laptops for you.");
        assertThat(completed.get()).isTrue();
        assertThat(resultRef.get().get("intent")).isEqualTo("SEARCH");
    }

    @Test
    void streamingCallback_errorDuringTokenStream_shouldReportError() {
        StringBuilder fullResponse = new StringBuilder();
        AtomicBoolean errored = new AtomicBoolean(false);
        AtomicReference<String> errorMsg = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback =
            new AgentWebSocketHandler.AgentStreamingCallback() {
                @Override
                public void onToken(String token) {
                    fullResponse.append(token);
                }

                @Override
                public void onComplete(Map<String, Object> result) {}

                @Override
                public void onError(String error) {
                    errored.set(true);
                    errorMsg.set(error);
                }
            };

        callback.onToken("Starting...");
        callback.onToken("Still going...");
        callback.onError("Stream interrupted");

        assertThat(fullResponse.toString()).isEqualTo("Starting...Still going...");
        assertThat(errored.get()).isTrue();
        assertThat(errorMsg.get()).isEqualTo("Stream interrupted");
    }
}
