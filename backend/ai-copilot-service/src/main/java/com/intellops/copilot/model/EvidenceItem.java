package com.intellops.copilot.model;

import java.util.List;
import java.util.Map;

/**
 * One block of tool evidence attached to a chat answer: which tool produced
 * it, what entity it was about, and the raw structured records it returned
 * (e.g. activity feed events).
 * <p>
 * Stored on {@code Conversation.Message.evidence} so evidence survives reloads,
 * and returned by the chat API so the UI can render it live.
 */
public record EvidenceItem(
        String tool,
        String method,
        String entityType,
        String entityId,
        List<Map<String, Object>> events) {
}
