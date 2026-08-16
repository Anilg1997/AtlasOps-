package com.intellops.copilot.config;

import com.intellops.copilot.service.tools.ActivityTool;
import com.intellops.copilot.service.tools.BillingTool;
import com.intellops.copilot.service.tools.InventoryTool;
import com.intellops.copilot.service.tools.OrderTool;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * AI Co-Pilot configuration — wires up Ollama LLM, LangChain4j AI Service,
 * tool bindings, and conversation memory.
 */
@Configuration
public class AiConfig {

    @Value("${intellops.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${intellops.ai.ollama.model:llama3.1}")
    private String ollamaModel;

    @Value("${intellops.ai.ollama.temperature:0.1}")
    private Double temperature;

    @Value("${intellops.ai.ollama.timeout:120}")
    private Long timeoutSeconds;

    /**
     * The LangChain4j chat language model backed by Ollama.
     * Uses llama3.1 (or configured model) which supports tool calling natively.
     */
    @Bean
    public ChatModel chatModel() {
        return OllamaChatModel.builder()
                .baseUrl(ollamaBaseUrl)
                .modelName(ollamaModel)
                .temperature(temperature)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .build();
    }

    /**
     * The AI Assistant — a LangChain4j AI Service that automatically wires
     * the LLM with registered tools (@Tool beans) and conversation memory.
     */
    @Bean
    public Assistant assistant(ChatModel chatModel,
                               OrderTool orderTool,
                               InventoryTool inventoryTool,
                               BillingTool billingTool,
                               ActivityTool activityTool) {
        return AiServices.builder(Assistant.class)
                .chatModel(chatModel)
                .tools(orderTool, inventoryTool, billingTool, activityTool)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(20))
                .build();
    }

    /**
     * AI Assistant interface — LangChain4j generates the implementation.
     * The @AiService annotation is replaced by the manual AiServices builder above
     * for more control over configuration.
     */
    public interface Assistant {
        String chat(String userMessage);
    }
}
