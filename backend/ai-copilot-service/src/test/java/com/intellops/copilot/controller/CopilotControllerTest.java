package com.intellops.copilot.controller;

import com.intellops.copilot.mongo.Conversation;
import com.intellops.copilot.mongo.ConversationRepository;
import com.intellops.copilot.model.EvidenceItem;
import com.intellops.copilot.service.AiCopilotService;
import com.intellops.copilot.service.EvidenceCollector;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CopilotController.class)
@AutoConfigureMockMvc(addFilters = false)
class CopilotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AiCopilotService copilotService;

    @MockBean
    private ConversationRepository conversationRepository;

    @MockBean
    private EvidenceCollector evidenceCollector;

    @Test
    void chat_withoutEvidence_shouldOmitEvidenceKey() throws Exception {
        Conversation conversation = Conversation.builder().id("conv-1").build();
        when(copilotService.getOrCreateConversation(any(), any())).thenReturn(conversation);
        when(copilotService.chat(any(), any())).thenReturn("The order is on hold awaiting payment.");
        when(evidenceCollector.isEmpty()).thenReturn(true);

        mockMvc.perform(post("/api/v1/copilot/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Why is ORD-1001 on hold?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response").value("The order is on hold awaiting payment."))
                .andExpect(jsonPath("$.conversationId").value("conv-1"))
                .andExpect(jsonPath("$.evidence").doesNotExist());
    }

    @Test
    void chat_withEvidence_shouldIncludeActivityEvents() throws Exception {
        Conversation conversation = Conversation.builder().id("conv-1").build();
        when(copilotService.getOrCreateConversation(any(), any())).thenReturn(conversation);
        when(copilotService.chat(any(), any())).thenReturn("ORD-1001 was created then placed on hold.");

        EvidenceItem item = new EvidenceItem(
                "ActivityTool", "getActivityTimeline", "ORDER", "ORD-1001",
                List.of(Map.of("eventType", "ORDER_CREATED", "timestamp", "2026-08-16T10:00:00Z")));
        when(evidenceCollector.isEmpty()).thenReturn(false);
        when(evidenceCollector.getItems()).thenReturn(List.of(item));

        mockMvc.perform(post("/api/v1/copilot/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Why is ORD-1001 on hold?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.evidence[0].tool").value("ActivityTool"))
                .andExpect(jsonPath("$.evidence[0].entityType").value("ORDER"))
                .andExpect(jsonPath("$.evidence[0].entityId").value("ORD-1001"))
                .andExpect(jsonPath("$.evidence[0].events[0].eventType").value("ORDER_CREATED"));
    }
}
