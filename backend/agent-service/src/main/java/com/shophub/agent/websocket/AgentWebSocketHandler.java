package com.shophub.agent.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shophub.agent.service.AgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class AgentWebSocketHandler extends TextWebSocketHandler {

    private final AgentService agentService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
        log.info("WebSocket connected: {}", session.getId());
        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                "type", "connected",
                "sessionId", session.getId()
            ))));
        } catch (Exception e) {
            log.error("Failed to send connection message: {}", e.getMessage());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String action = (String) payload.get("action");

            if ("chat".equals(action)) {
                handleChat(session, payload);
            } else if ("ping".equals(action)) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("type", "pong"))));
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage());
            sendMessage(session, Map.of("type", "error", "message", e.getMessage()));
        }
    }

    private void handleChat(WebSocketSession session, Map<String, Object> payload) {
        String userMessage = (String) payload.get("message");
        Long userId = payload.get("userId") != null ? ((Number) payload.get("userId")).longValue() : 1L;
        Long conversationId = payload.get("conversationId") != null
            ? ((Number) payload.get("conversationId")).longValue() : null;

        // Send processing indicator
        sendMessage(session, Map.of("type", "processing", "status", "started"));

        try {
            // Use streaming if LLM is available, otherwise fallback to synchronous
            agentService.processMessageStreaming(conversationId, userId, userMessage, 
                new AgentStreamingCallback() {
                    @Override
                    public void onToken(String token) {
                        sendMessage(session, Map.of("type", "token", "content", token));
                    }

                    @Override
                    public void onComplete(Map<String, Object> result) {
                        sendMessage(session, Map.of(
                            "type", "complete",
                            "conversationId", result.get("conversationId"),
                            "intent", result.get("intent"),
                            "tools", result.get("tools")
                        ));
                    }

                    @Override
                    public void onError(String error) {
                        sendMessage(session, Map.of("type", "error", "message", error));
                    }
                });
        } catch (Exception e) {
            log.error("Error in streaming chat: {}", e.getMessage());
            sendMessage(session, Map.of("type", "error", "message", "Failed to process message: " + e.getMessage()));
        }
    }

    private void sendMessage(WebSocketSession session, Object payload) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            }
        } catch (Exception e) {
            log.error("Failed to send WebSocket message: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
        log.info("WebSocket disconnected: {} ({})", session.getId(), status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket transport error: {} - {}", session.getId(), exception.getMessage());
        sessions.remove(session.getId());
    }

    public interface AgentStreamingCallback {
        void onToken(String token);
        void onComplete(Map<String, Object> result);
        void onError(String error);
    }
}
