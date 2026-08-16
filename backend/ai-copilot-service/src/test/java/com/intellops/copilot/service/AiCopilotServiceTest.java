package com.intellops.copilot.service;

import com.intellops.copilot.mongo.Conversation;
import com.intellops.copilot.mongo.ConversationRepository;
import com.intellops.copilot.model.EvidenceItem;
import com.intellops.copilot.service.tools.ActivityTool;
import com.intellops.copilot.service.tools.BillingTool;
import com.intellops.copilot.service.tools.InventoryTool;
import com.intellops.copilot.service.tools.OrderTool;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiCopilotServiceTest {

    @Mock
    private OrderTool orderTool;

    @Mock
    private InventoryTool inventoryTool;

    @Mock
    private BillingTool billingTool;

    @Mock
    private ActivityTool activityTool;

    @Mock
    private RagService ragService;

    @Mock
    private ConversationRepository repository;

    @Mock
    private EvidenceCollector evidenceCollector;

    private AiCopilotService service;

    @BeforeEach
    void setUp() {
        service = new AiCopilotService(orderTool, inventoryTool, billingTool, activityTool,
                ragService, repository, evidenceCollector);
    }

    @Test
    void saveMessage_withEvidence_shouldPersistEvidenceOnMessage() {
        Conversation conv = Conversation.builder().id("conv-1").messages(new ArrayList<>()).build();
        when(repository.findById("conv-1")).thenReturn(Optional.of(conv));

        EvidenceItem item = new EvidenceItem("ActivityTool", "getActivityTimeline", "ORDER", "ORD-1001",
                List.of(Map.of("eventType", "ORDER_CREATED")));
        service.saveMessage("conv-1", "assistant", "The order is on hold.", List.of(item));

        verify(repository).save(conv);
        assertThat(conv.getMessages()).hasSize(1);

        Conversation.Message msg = conv.getMessages().get(0);
        assertThat(msg.getRole()).isEqualTo("assistant");
        assertThat(msg.getContent()).isEqualTo("The order is on hold.");
        assertThat(msg.getEvidence()).hasSize(1);
        assertThat(msg.getEvidence().get(0).entityId()).isEqualTo("ORD-1001");
        assertThat(msg.getEvidence().get(0).events().get(0).get("eventType")).isEqualTo("ORDER_CREATED");
    }

    @Test
    void saveMessage_withoutEvidence_shouldSaveMessageWithNullEvidence() {
        Conversation conv = Conversation.builder().id("conv-1").messages(new ArrayList<>()).build();
        when(repository.findById("conv-1")).thenReturn(Optional.of(conv));

        service.saveMessage("conv-1", "user", "Why is ORD-1001 on hold?");

        verify(repository).save(conv);
        assertThat(conv.getMessages()).hasSize(1);
        assertThat(conv.getMessages().get(0).getEvidence()).isNull();
    }

    @Test
    void saveMessage_firstUserMessage_shouldSetConversationTitle() {
        Conversation conv = Conversation.builder().id("conv-1").messages(new ArrayList<>()).build();
        when(repository.findById("conv-1")).thenReturn(Optional.of(conv));

        service.saveMessage("conv-1", "user", "Why is ORD-1001 on hold?");

        assertThat(conv.getTitle()).isEqualTo("Why is ORD-1001 on hold?");
    }
}
