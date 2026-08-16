package com.intellops.copilot.config;

import com.intellops.copilot.service.tools.ActivityTool;
import com.intellops.copilot.service.tools.BillingTool;
import com.intellops.copilot.service.tools.InventoryTool;
import com.intellops.copilot.service.tools.OrderTool;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = AiConfig.class)
@TestPropertySource(properties = {
        "intellops.ai.ollama.base-url=http://localhost:11434",
        "intellops.ai.ollama.model=llama3.1",
        "intellops.ai.ollama.temperature=0.1",
        "intellops.ai.ollama.timeout=120"
})
class AiConfigTest {

    @MockBean
    private OrderTool orderTool;
    @MockBean
    private InventoryTool inventoryTool;
    @MockBean
    private BillingTool billingTool;
    @MockBean
    private ActivityTool activityTool;

    @Autowired
    private ChatModel chatModel;

    @Test
    void chatModel_shouldBeOllamaChatModel() {
        assertThat(chatModel).isInstanceOf(OllamaChatModel.class);
    }
}
