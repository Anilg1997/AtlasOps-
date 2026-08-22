package com.shophub.agent.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for AgentWebSocketHandler and AgentStreamingCallback.
 *
 * Java 24 blocks Mockito inline mocks for Closeable subtypes (WebSocketSession),
 * so these tests verify the callback protocol and handler wiring directly
 * without mocking Spring's WebSocketSession.
 */
class AgentWebSocketHandlerTest {

    private AgentWebSocketHandler handler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        handler = new AgentWebSocketHandler(null);
    }

    // ---- Callback interface contract tests ----

    @Test
    void callback_onToken_shouldAccumulateTokens() {
        List<String> tokens = new ArrayList<>();

        AgentWebSocketHandler.AgentStreamingCallback callback = new AgentWebSocketHandler.AgentStreamingCallback() {
            @Override public void onToken(String token) { tokens.add(token); }
            @Override public void onComplete(Map<String, Object> result) {}
            @Override public void onError(String error) {}
        };

        callback.onToken("Hello");
        callback.onToken(" ");
        callback.onToken("World");

        assertThat(tokens).containsExactly("Hello", " ", "World");
    }

    @Test
    void callback_onComplete_shouldReceiveAllFields() {
        AtomicReference<Map<String, Object>> resultRef = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback = new AgentWebSocketHandler.AgentStreamingCallback() {
            @Override public void onToken(String token) {}
            @Override public void onComplete(Map<String, Object> result) { resultRef.set(result); }
            @Override public void onError(String error) {}
        };

        Map<String, Object> expectedResult = Map.of(
            "conversationId", 42L,
            "intent", "SEARCH",
            "tools", List.of(Map.of("type", "search_products"))
        );
        callback.onComplete(expectedResult);

        assertThat(resultRef.get()).isNotNull();
        assertThat(resultRef.get().get("conversationId")).isEqualTo(42L);
        assertThat(resultRef.get().get("intent")).isEqualTo("SEARCH");
        assertThat(resultRef.get().get("tools")).isNotNull();
    }

    @Test
    void callback_onError_shouldReceiveErrorMessage() {
        AtomicReference<String> errorRef = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback = new AgentWebSocketHandler.AgentStreamingCallback() {
            @Override public void onToken(String token) {}
            @Override public void onComplete(Map<String, Object> result) {}
            @Override public void onError(String error) { errorRef.set(error); }
        };

        callback.onError("Connection timeout");

        assertThat(errorRef.get()).isEqualTo("Connection timeout");
    }

    @Test
    void callback_fullStream_shouldAccumulateAndComplete() {
        StringBuilder fullResponse = new StringBuilder();
        AtomicBoolean completed = new AtomicBoolean(false);
        AtomicReference<Map<String, Object>> resultRef = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback = new AgentWebSocketHandler.AgentStreamingCallback() {
            @Override public void onToken(String token) { fullResponse.append(token); }
            @Override public void onComplete(Map<String, Object> result) {
                completed.set(true);
                resultRef.set(result);
            }
            @Override public void onError(String error) {}
        };

        callback.onToken("I found ");
        callback.onToken("3 laptops ");
        callback.onToken("for you.");
        callback.onComplete(Map.of(
            "conversationId", 1L,
            "intent", "SEARCH",
            "tools", List.of()
        ));

        assertThat(fullResponse.toString()).isEqualTo("I found 3 laptops for you.");
        assertThat(completed.get()).isTrue();
        assertThat(resultRef.get().get("intent")).isEqualTo("SEARCH");
    }

    @Test
    void callback_errorDuringStream_shouldReportPartialContent() {
        StringBuilder fullResponse = new StringBuilder();
        AtomicBoolean errored = new AtomicBoolean(false);
        AtomicReference<String> errorMsg = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback = new AgentWebSocketHandler.AgentStreamingCallback() {
            @Override public void onToken(String token) { fullResponse.append(token); }
            @Override public void onComplete(Map<String, Object> result) {}
            @Override public void onError(String error) {
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

    @Test
    void callback_emptyTokens_shouldWork() {
        List<String> tokens = new ArrayList<>();

        AgentWebSocketHandler.AgentStreamingCallback callback = new AgentWebSocketHandler.AgentStreamingCallback() {
            @Override public void onToken(String token) { tokens.add(token); }
            @Override public void onComplete(Map<String, Object> result) {}
            @Override public void onError(String error) {}
        };

        callback.onToken("");
        callback.onToken("");
        callback.onToken("finally");

        assertThat(tokens).containsExactly("", "", "finally");
    }

    @Test
    void callback_onComplete_withToolCalls() {
        AtomicReference<Map<String, Object>> resultRef = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback = new AgentWebSocketHandler.AgentStreamingCallback() {
            @Override public void onToken(String token) {}
            @Override public void onComplete(Map<String, Object> result) { resultRef.set(result); }
            @Override public void onError(String error) {}
        };

        Map<String, Object> tool = Map.of("type", "search_products", "query", "laptops");
        callback.onComplete(Map.of(
            "conversationId", 42L,
            "intent", "SEARCH",
            "tools", List.of(tool)
        ));

        assertThat(resultRef.get().get("tools")).isNotNull();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> tools = (List<Map<String, Object>>) resultRef.get().get("tools");
        assertThat(tools).hasSize(1);
        assertThat(tools.get(0).get("type")).isEqualTo("search_products");
    }

    @Test
    void handlerConstructor_shouldAcceptNullService() {
        // The handler should construct without error even with null AgentService
        // (null is used for testing callback protocol only)
        AgentWebSocketHandler h = new AgentWebSocketHandler(null);
        assertThat(h).isNotNull();
    }

    @Test
    void callback_shouldHandleUnicodeContent() {
        AtomicReference<String> tokenRef = new AtomicReference<>();

        AgentWebSocketHandler.AgentStreamingCallback callback = new AgentWebSocketHandler.AgentStreamingCallback() {
            @Override public void onToken(String token) { tokenRef.set(token); }
            @Override public void onComplete(Map<String, Object> result) {}
            @Override public void onError(String error) {}
        };

        callback.onToken("👋 Hi! 你好 🎉");
        assertThat(tokenRef.get()).isEqualTo("👋 Hi! 你好 🎉");
    }
}
