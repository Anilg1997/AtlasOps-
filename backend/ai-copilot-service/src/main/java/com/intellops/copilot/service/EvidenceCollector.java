package com.intellops.copilot.service;

import com.intellops.copilot.model.EvidenceItem;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.List;

/**
 * Collects the structured data an AI tool fetched during a chat request so the
 * controller can return it to the frontend as "evidence" alongside the answer.
 * <p>
 * Request-scoped: one collector per HTTP request. Tools write into it while the
 * LLM's tool-calling loop runs (same thread as the controller for non-streaming
 * chat), and the controller reads it once the answer is complete.
 */
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class EvidenceCollector {

    private final List<EvidenceItem> items = new ArrayList<>();

    public void add(EvidenceItem item) {
        if (item != null && item.events() != null && !item.events().isEmpty()) {
            items.add(item);
        }
    }

    public List<EvidenceItem> getItems() {
        return List.copyOf(items);
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }
}
