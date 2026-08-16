package com.intellops.copilot.service;

import com.intellops.copilot.mongo.Conversation;
import com.intellops.copilot.mongo.ConversationRepository;
import com.intellops.copilot.model.EvidenceItem;
import com.intellops.copilot.service.tools.ActivityTool;
import com.intellops.copilot.service.tools.BillingTool;
import com.intellops.copilot.service.tools.InventoryTool;
import com.intellops.copilot.service.tools.OrderTool;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class AiCopilotService {

    private final OrderTool orderTool;
    private final InventoryTool inventoryTool;
    private final BillingTool billingTool;
    private final ActivityTool activityTool;
    private final RagService ragService;
    private final ConversationRepository conversationRepository;
    private final EvidenceCollector evidenceCollector;

    @Value("${intellops.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${intellops.ai.ollama.model:llama3.1}")
    private String modelName;

    @Value("${intellops.ai.ollama.temperature:0.7}")
    private double temperature;

    private ChatModel chatModel;
    private StreamingChatModel streamingChatModel;

    public AiCopilotService(OrderTool orderTool, InventoryTool inventoryTool,
                             BillingTool billingTool, ActivityTool activityTool,
                             RagService ragService, ConversationRepository conversationRepository,
                             EvidenceCollector evidenceCollector) {
        this.orderTool = orderTool;
        this.inventoryTool = inventoryTool;
        this.billingTool = billingTool;
        this.activityTool = activityTool;
        this.ragService = ragService;
        this.conversationRepository = conversationRepository;
        this.evidenceCollector = evidenceCollector;
    }

    @PostConstruct
    public void init() {
        try {
            chatModel = OllamaChatModel.builder()
                    .baseUrl(ollamaBaseUrl)
                    .modelName(modelName)
                    .temperature(temperature)
                    .build();

            streamingChatModel = OllamaStreamingChatModel.builder()
                    .baseUrl(ollamaBaseUrl)
                    .modelName(modelName)
                    .temperature(temperature)
                    .build();

            log.info("AI Co-Pilot initialized with model: {} at {}", modelName, ollamaBaseUrl);
        } catch (Exception e) {
            log.warn("Failed to initialize Ollama model: {}. Using fallback.", e.getMessage());
        }
    }

    @SystemMessage("""
            You are IntelliOps AI Co-Pilot, an enterprise operations assistant.
            You help support engineers troubleshoot orders, check inventory, and review billing.
            
            You have access to these tools:
            - OrderTool: Get order details, list orders, get order statistics
            - InventoryTool: Check stock, get product details, list products
            - BillingTool: Check invoice status, list overdue invoices
            - ActivityTool: Query the activity timeline / audit trail for an order, invoice, or other entity
            
            When answering questions:
            1. Use the RAG context when available for documentation
            2. Call the appropriate tools to get real-time data
            3. Synthesize a clear, actionable answer
            4. If you identify issues, recommend next steps
            
            Always be concise, professional, and helpful.
            """)
    interface CopilotAssistant {
        @UserMessage("{{message}}")
        String chat(String message);
    }

    public String chat(String conversationId, String message) {
        ensureModel();
        try {
            String ragContext = ragService.retrieveRelevantContext(message);
            String fullPrompt = String.format(
                    "Context from enterprise runbooks:\n%s\n\nUser question: %s",
                    ragContext, message);

            if (chatModel != null) {
                CopilotAssistant assistant = AiServices.builder(CopilotAssistant.class)
                        .chatModel(chatModel)
                        .tools(orderTool, inventoryTool, billingTool, activityTool)
                        .build();

                String response = assistant.chat(fullPrompt);
                saveMessage(conversationId, "user", message);
                // Persist tool evidence with the answer so it survives reloads.
                saveMessage(conversationId, "assistant", response, evidenceCollector.getItems());
                return response;
            }

            return generateFallbackResponse(message);
        } catch (Exception e) {
            log.error("AI chat error: {}", e.getMessage());
            return "I apologize, but I'm having trouble connecting to the AI model. " +
                   "Please ensure Ollama is running with the " + modelName + " model. " +
                   "Error: " + e.getMessage();
        }
    }

    public Flux<String> streamChat(String conversationId, String message) {
        ensureModel();
        try {
            String ragContext = ragService.retrieveRelevantContext(message);
            String fullPrompt = String.format(
                    "Context from enterprise runbooks:\n%s\n\nUser question: %s",
                    ragContext, message);

            if (streamingChatModel != null) {
                Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();

                streamingChatModel.chat(fullPrompt, new StreamingChatResponseHandler() {
                    @Override
                    public void onPartialResponse(String partialResponse) {
                        sink.tryEmitNext(partialResponse);
                    }

                    @Override
                    public void onCompleteResponse(ChatResponse chatResponse) {
                        sink.tryEmitComplete();
                        saveMessage(conversationId, "user", message);
                        saveMessage(conversationId, "assistant", chatResponse.aiMessage().text());
                    }

                    @Override
                    public void onError(Throwable error) {
                        sink.tryEmitError(error);
                    }
                });

                return sink.asFlux();
            }

            String response = generateFallbackResponse(message);
            return Flux.just(response);
        } catch (Exception e) {
            log.error("AI stream chat error: {}", e.getMessage());
            return Flux.just("Error: " + e.getMessage());
        }
    }

    public Conversation getOrCreateConversation(String conversationId, String userId) {
        if (conversationId != null && !conversationId.isEmpty()) {
            return conversationRepository.findById(conversationId)
                    .orElseGet(() -> createNewConversation(userId));
        }
        return createNewConversation(userId);
    }

    private Conversation createNewConversation(String userId) {
        Conversation conversation = Conversation.builder()
                .userId(userId != null ? userId : "anonymous")
                .title("New Conversation")
                .messages(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return conversationRepository.save(conversation);
    }

    /**
     * Ensures the Ollama chat model is initialized before serving a request.
     * <p>
     * The first boot of a demo environment can race with Ollama pulling the
     * model weights, so we retry initialization lazily instead of permanently
     * falling back to the canned responses.
     */
    private synchronized void ensureModel() {
        if (chatModel == null || streamingChatModel == null) {
            init();
        }
    }

    void saveMessage(String conversationId, String role, String content) {
        saveMessage(conversationId, role, content, null);
    }

    void saveMessage(String conversationId, String role, String content, List<EvidenceItem> evidence) {
        if (conversationId == null) return;

        conversationRepository.findById(conversationId).ifPresent(conv -> {
            Conversation.Message msg = Conversation.Message.builder()
                    .role(role)
                    .content(content)
                    .evidence(evidence)
                    .timestamp(LocalDateTime.now())
                    .build();
            conv.getMessages().add(msg);
            conv.setUpdatedAt(LocalDateTime.now());
            if (conv.getMessages().size() == 1 && "user".equals(role)) {
                conv.setTitle(content.length() > 100 ? content.substring(0, 100) + "..." : content);
            }
            conversationRepository.save(conv);
        });
    }

    private String generateFallbackResponse(String message) {
        String lowerMsg = message.toLowerCase();

        if (lowerMsg.contains("order") && (lowerMsg.contains("status") || lowerMsg.contains("stuck"))) {
            return "I can help you check order status. However, the AI model is currently unavailable. " +
                   "Please use the Order Management section to check order details directly, " +
                   "or ensure Ollama is running with: ollama pull " + modelName;
        }

        if (lowerMsg.contains("stock") || lowerMsg.contains("inventory")) {
            return "I can help you check inventory levels. The AI model is currently unavailable. " +
                   "Please use the Inventory section to check stock levels directly.";
        }

        if (lowerMsg.contains("bill") || lowerMsg.contains("invoice") || lowerMsg.contains("payment")) {
            return "I can help you check billing information. The AI model is currently unavailable. " +
                   "Please use the Billing section to check invoice status.";
        }

        return "I'm IntelliOps AI Co-Pilot, your enterprise operations assistant. " +
               "The AI model (" + modelName + ") is currently unavailable. " +
               "Please ensure Ollama is running locally for full AI capabilities.\n\n" +
               "I can help with:\n" +
               "- Order status and troubleshooting\n" +
               "- Inventory and stock checking\n" +
               "- Billing and invoice inquiries\n" +
               "- General operations questions";
    }
}
