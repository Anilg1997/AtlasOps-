package com.intellops.copilot.mongo;

import com.intellops.copilot.model.EvidenceItem;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Document
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Message {
        private String role;
        private String content;
        private List<ToolCall> toolCalls;
        private String toolResult;
        /** Tool evidence (e.g. activity feed events) backing this answer. */
        private List<EvidenceItem> evidence;
        private LocalDateTime timestamp;
    }

    @Document
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ToolCall {
        private String id;
        private String name;
        private String arguments;
        private String result;
    }
}
