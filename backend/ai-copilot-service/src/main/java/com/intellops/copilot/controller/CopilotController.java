package com.intellops.copilot.controller;

import com.intellops.copilot.mongo.Conversation;
import com.intellops.copilot.mongo.ConversationRepository;
import com.intellops.copilot.service.AiCopilotService;
import com.intellops.copilot.service.EvidenceCollector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/copilot")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class CopilotController {

    private final AiCopilotService copilotService;
    private final ConversationRepository conversationRepository;
    private final EvidenceCollector evidenceCollector;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String conversationId = request.get("conversationId");
        String userId = request.getOrDefault("userId", "anonymous");

        log.info("Chat request: {} (conversation: {})", message, conversationId);

        Conversation conversation = copilotService.getOrCreateConversation(conversationId, userId);
        String response = copilotService.chat(conversation.getId(), message);

        // Attach structured tool evidence (e.g. activity feed events) so the
        // chat UI can render it under the answer.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("response", response);
        body.put("conversationId", conversation.getId());
        if (!evidenceCollector.isEmpty()) {
            body.put("evidence", evidenceCollector.getItems());
        }
        return ResponseEntity.ok(body);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String conversationId = request.get("conversationId");
        String userId = request.getOrDefault("userId", "anonymous");

        log.info("Stream chat request: {} (conversation: {})", message, conversationId);

        Conversation conversation = copilotService.getOrCreateConversation(conversationId, userId);
        SseEmitter emitter = new SseEmitter(120000L);

        copilotService.streamChat(conversation.getId(), message)
                .subscribe(
                        chunk -> {
                            try {
                                emitter.send(SseEmitter.event()
                                        .name("message")
                                        .data(Map.of("content", chunk)));
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            }
                        },
                        error -> {
                            log.error("Stream error: {}", error.getMessage());
                            emitter.completeWithError(error);
                        },
                        () -> {
                            try {
                                emitter.send(SseEmitter.event()
                                        .name("done")
                                        .data(Map.of("conversationId", conversation.getId())));
                                emitter.complete();
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            }
                        }
                );

        return emitter;
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<Conversation>> listConversations(
            @RequestParam(defaultValue = "anonymous") String userId) {
        return ResponseEntity.ok(conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<Conversation> getConversation(@PathVariable String id) {
        return conversationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "ai-copilot-service",
                "model", "ollama"
        ));
    }
}
