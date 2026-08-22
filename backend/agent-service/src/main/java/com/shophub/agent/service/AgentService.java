package com.shophub.agent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shophub.agent.model.Conversation;
import com.shophub.agent.model.Message;
import com.shophub.agent.repository.ConversationRepository;
import com.shophub.agent.repository.MessageRepository;
import dev.langchain4j.data.message.*;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.shophub.agent.websocket.AgentWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AgentService — Core AI Shopping Agent.
 *
 * Orchestrates the agentic flow:
 * 1. User sends message → 2. Intent detection → 3. RAG context retrieval
 * 4. LLM generates response with tool calls → 5. Execute tools (search, add-to-cart, etc.)
 * 6. Return enriched response → 7. Stream to frontend
 *
 * Uses:
 * - LangChain4j for LLM orchestration
 * - Ollama (llama3.2) for local LLM inference
 * - pgvector for RAG vector search
 * - MCP for tool protocol
 * - Kafka for event streaming
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;
    private final VectorStoreService vectorStore;
    private final EmbeddingService embeddingService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:llama3.2}")
    private String ollamaModel;

    private ChatLanguageModel chatModel;
    private StreamingChatLanguageModel streamingChatModel;
    private boolean llmAvailable = false;

    @PostConstruct
    public void init() {
        try {
            chatModel = OllamaChatModel.builder()
                .baseUrl(ollamaBaseUrl)
                .modelName(ollamaModel)
                .temperature(0.7)
                .timeout(Duration.ofSeconds(120))
                .build();
            streamingChatModel = OllamaStreamingChatModel.builder()
                .baseUrl(ollamaBaseUrl)
                .modelName(ollamaModel)
                .temperature(0.7)
                .timeout(Duration.ofSeconds(120))
                .build();
            llmAvailable = true;
            log.info("✅ Agent LLM initialized: {} at {}", ollamaModel, ollamaBaseUrl);
        } catch (Exception e) {
            log.warn("⚠️ Ollama not available, using rule-based agent. Error: {}", e.getMessage());
            llmAvailable = false;
        }
    }

    /**
     * Process a user message through the agentic pipeline
     */
    public Map<String, Object> processMessage(Long conversationId, Long userId, String userMessage) {
        log.info("🤖 Processing message for user {}: {}", userId, userMessage);

        // 1. Ensure conversation exists
        Conversation conversation = getOrCreateConversation(conversationId, userId, userMessage);

        // 2. Save user message
        Message userMsg = Message.builder()
            .conversation(conversation)
            .role(Message.MessageRole.USER)
            .content(userMessage)
            .build();
        messageRepo.save(userMsg);

        // 3. Detect intent
        AgentIntent intent = detectIntent(userMessage);

        // 4. Gather context via RAG
        String ragContext = gatherRagContext(userMessage, intent);

        // 5. Build system prompt with MCP tools and RAG context
        String systemPrompt = buildSystemPrompt(ragContext, intent);

        // 6. Generate response (LLM or rule-based)
        String agentResponse;
        List<Map<String, Object>> toolResults = new ArrayList<>();

        if (llmAvailable) {
            agentResponse = generateLlmResponse(conversation.getId(), systemPrompt, userMessage, toolResults);
        } else {
            agentResponse = generateRuleBasedResponse(userMessage, intent, toolResults);
        }

        // 7. Save agent message
        Message agentMsg = Message.builder()
            .conversation(conversation)
            .role(Message.MessageRole.AGENT)
            .content(agentResponse)
            .metadata(objectMapper.valueToTree(Map.of("intent", intent.name(), "tools", toolResults)).toString())
            .build();
        messageRepo.save(agentMsg);

        // 8. Publish Kafka event
        publishAgentEvent(userId, intent, userMessage, agentResponse);

        // 9. Return response
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("conversationId", conversation.getId());
        result.put("message", agentResponse);
        result.put("intent", intent.name());
        result.put("tools", toolResults);
        return result;
    }

    /**
     * Process a user message with streaming response via WebSocket
     */
    public void processMessageStreaming(Long conversationId, Long userId, String userMessage,
                                        AgentWebSocketHandler.AgentStreamingCallback callback) {
        log.info("🤖 Processing streaming message for user {}: {}", userId, userMessage);

        // 1. Ensure conversation exists
        Conversation conversation = getOrCreateConversation(conversationId, userId, userMessage);

        // 2. Save user message
        Message userMsg = Message.builder()
            .conversation(conversation)
            .role(Message.MessageRole.USER)
            .content(userMessage)
            .build();
        messageRepo.save(userMsg);

        // 3. Detect intent
        AgentIntent intent = detectIntent(userMessage);

        // 4. Gather context via RAG
        String ragContext = gatherRagContext(userMessage, intent);

        // 5. Build system prompt with MCP tools and RAG context
        String systemPrompt = buildSystemPrompt(ragContext, intent);

        // 6. Generate streaming response
        if (llmAvailable && streamingChatModel != null) {
            generateStreamingLlmResponse(conversation.getId(), systemPrompt, userMessage, callback);
        } else {
            // Fallback to synchronous for rule-based responses
            List<Map<String, Object>> toolResults = new ArrayList<>();
            String agentResponse = generateRuleBasedResponse(userMessage, intent, toolResults);
            
            // Send as single token for consistency
            callback.onToken(agentResponse);
            
            // Save agent message
            Message agentMsg = Message.builder()
                .conversation(conversation)
                .role(Message.MessageRole.AGENT)
                .content(agentResponse)
                .metadata(objectMapper.valueToTree(Map.of("intent", intent.name(), "tools", toolResults)).toString())
                .build();
            messageRepo.save(agentMsg);

            // Publish Kafka event
            publishAgentEvent(userId, intent, userMessage, agentResponse);

            callback.onComplete(Map.of(
                "conversationId", conversation.getId(),
                "intent", intent.name(),
                "tools", toolResults
            ));
        }
    }

    /**
     * Generate streaming response using Ollama streaming model
     */
    private void generateStreamingLlmResponse(Long conversationId, String systemPrompt,
                                               String userMessage,
                                               AgentWebSocketHandler.AgentStreamingCallback callback) {
        try {
            // Build message history
            List<ChatMessage> messages = new ArrayList<>();
            messages.add(SystemMessage.from(systemPrompt));

            // Add last 10 messages for context
            List<Message> history = messageRepo.findByConversationIdOrderByCreatedAtAsc(conversationId);
            int start = Math.max(0, history.size() - 10);
            for (int i = start; i < history.size(); i++) {
                Message msg = history.get(i);
                if (msg.getRole() == Message.MessageRole.USER) {
                    messages.add(UserMessage.from(msg.getContent()));
                } else if (msg.getRole() == Message.MessageRole.AGENT) {
                    messages.add(AiMessage.from(msg.getContent()));
                }
            }

            StringBuilder fullResponse = new StringBuilder();

            streamingChatModel.generate(messages, new StreamingResponseHandler<>() {
                @Override
                public void onNext(String token) {
                    fullResponse.append(token);
                    callback.onToken(token);
                }

                @Override
                public void onComplete(Response<AiMessage> response) {
                    String completeResponse = fullResponse.toString();
                    List<Map<String, Object>> toolResults = new ArrayList<>();
                    extractToolCalls(completeResponse, toolResults);

                    // Save agent message
                    Message agentMsg = Message.builder()
                        .conversation(conversationRepo.findById(conversationId).orElseThrow())
                        .role(Message.MessageRole.AGENT)
                        .content(completeResponse)
                        .metadata(objectMapper.valueToTree(toolResults).toString())
                        .build();
                    messageRepo.save(agentMsg);

                    callback.onComplete(Map.of(
                        "conversationId", conversationId,
                        "intent", detectIntent(userMessage).name(),
                        "tools", toolResults
                    ));
                }

                @Override
                public void onError(Throwable error) {
                    log.error("Streaming error: {}", error.getMessage());
                    callback.onError("Stream error: " + error.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("Streaming generation failed: {}", e.getMessage());
            callback.onError("Failed to generate response: " + e.getMessage());
        }
    }

    /**
     * Detect user intent from message
     */
    private AgentIntent detectIntent(String message) {
        String lower = message.toLowerCase();

        if (lower.matches(".*(buy|purchase|checkout|pay|order now).*")) return AgentIntent.CHECKOUT;
        if (lower.matches(".*(add.*cart|cart|basket).*")) return AgentIntent.ADD_TO_CART;
        if (lower.matches(".*(recommend|suggest|show|find|search|look for|want|need).*")) return AgentIntent.SEARCH;
        if (lower.matches(".*(price|cost|budget|cheap|afford).*")) return AgentIntent.PRICE_QUERY;
        if (lower.matches(".*(compare|vs|versus|difference).*")) return AgentIntent.COMPARE;
        if (lower.matches(".*(review|rating|feedback).*")) return AgentIntent.REVIEW;
        if (lower.matches(".*(ship|delivery|deliver|track).*")) return AgentIntent.SHIPPING;
        if (lower.matches(".*(order issue|order problem|payment failed|refund|replace|exchange|stuck|delayed|wrong item|damaged|missing|complain|support|help with order).*")) return AgentIntent.ORDER_ISSUE;
        if (lower.matches(".*(detect issue|check order|order status|issue with).*")) return AgentIntent.ORDER_ISSUE;
        if (lower.matches(".*(hello|hi|hey|greet).*")) return AgentIntent.GREETING;
        if (lower.matches(".*(thank|thanks|bye|goodbye).*")) return AgentIntent.FAREWELL;
        return AgentIntent.GENERAL;
    }

    /**
     * Gather RAG context from vector store
     */
    private String gatherRagContext(String query, AgentIntent intent) {
        StringBuilder context = new StringBuilder();

        // Vector similarity search for relevant products
        if (embeddingService.isAvailable()) {
            var relevantProducts = vectorStore.findSimilarProducts(
                embeddingService.embed(query), 5
            );
            if (!relevantProducts.isEmpty()) {
                context.append("=== RELEVANT PRODUCTS (from vector search) ===\n");
                for (var product : relevantProducts) {
                    context.append(String.format("- %s (%s) - $%.2f, Rating: %.1f/5\n",
                        product.get("title"), product.get("category"),
                        product.get("price"), product.get("rating")));
                }
                context.append("\n");
            }
        }

        // Fallback: text search
        if (context.length() == 0) {
            var searchResults = vectorStore.searchProducts(extractSearchTerms(query), 5);
            if (!searchResults.isEmpty()) {
                context.append("=== SEARCH RESULTS ===\n");
                for (var product : searchResults) {
                    context.append(String.format("- %s (%s) - $%.2f, Rating: %.1f/5, Stock: %d\n",
                        product.get("title"), product.get("category"),
                        product.get("price"), product.get("rating"), product.get("stock")));
                }
                context.append("\n");
            }
        }

        // Add product stats
        Map<String, Object> stats = vectorStore.getProductStats();
        context.append(String.format("=== STORE INFO ===\nTotal products: %s, Categories: %s, Avg price: $%.2f\n",
            stats.get("totalProducts"), stats.get("categories"), stats.get("avgPrice")));

        return context.toString();
    }

    /**
     * Build system prompt with MCP tools and RAG context
     */
    private String buildSystemPrompt(String ragContext, AgentIntent intent) {
        return """
            You are ShopHub AI — an intelligent shopping assistant. You help users find products,
            compare options, answer questions about pricing/shipping/reviews, and guide them through checkout.
            You also proactively detect and resolve order issues autonomously.

            CAPABILITIES (MCP Tools):
            — Shopping Tools —
            - search_products(query): Search product catalog
            - get_product_details(id): Get detailed product info
            - add_to_cart(product_id, quantity): Add item to cart
            - get_cart_summary(): Show cart contents and total
            - process_checkout(): Complete the purchase
            - get_product_reviews(product_id): Show product reviews
            - compare_products(ids): Compare multiple products

            — Order Issue Resolution Tools —
            - detect_order_issues(orderId): Check order for payment, stock, delivery, duplicate, or price issues
            - resolve_payment_retry(orderId): Automatically retry a failed payment
            - resolve_stock_substitution(orderId, itemId): Find similar in-stock products as alternatives
            - resolve_delivery_delay(orderId): Check delivery status and offer compensation
            - escalate_to_human(orderId, reason): Create support ticket for issues you can't resolve

            RULES:
            1. Be helpful, concise, and friendly
            2. When user wants to buy something, ask about budget, preferences, brand
            3. Always mention prices and ratings when recommending products
            4. When ready, guide them to checkout
            5. Use the product data below for recommendations
            6. If you don't have enough info, ask clarifying questions
            7. Format responses with markdown for readability
            8. Be proactive — suggest related products and deals
            9. When users mention order problems, immediately run detect_order_issues
            10. Always attempt automated resolution before escalating to human
            11. Show the user what you detected, decided, and did (reasoning trace)

            CURRENT CONTEXT:
            %s

            RESPOND IN A NATURAL, HELPFUL TONE. USE EMOJIS SPARINGLY.
            """.formatted(ragContext);
    }

    /**
     * Generate response using Ollama LLM
     */
    private String generateLlmResponse(Long conversationId, String systemPrompt,
                                        String userMessage, List<Map<String, Object>> tools) {
        try {
            // Build message history
            List<ChatMessage> messages = new ArrayList<>();
            messages.add(SystemMessage.from(systemPrompt));

            // Add last 10 messages for context
            List<Message> history = messageRepo.findByConversationIdOrderByCreatedAtAsc(conversationId);
            int start = Math.max(0, history.size() - 10);
            for (int i = start; i < history.size(); i++) {
                Message msg = history.get(i);
                if (msg.getRole() == Message.MessageRole.USER) {
                    messages.add(UserMessage.from(msg.getContent()));
                } else if (msg.getRole() == Message.MessageRole.AGENT) {
                    messages.add(AiMessage.from(msg.getContent()));
                }
            }

            // Generate response
            Response<AiMessage> response = chatModel.generate(messages);
            String content = response.content().text();

            // Parse tool calls from response (simple pattern matching)
            extractToolCalls(content, tools);

            return content;
        } catch (Exception e) {
            log.error("LLM generation failed: {}", e.getMessage());
            return generateFallbackResponse("I'm having trouble processing that right now. Could you try again?");
        }
    }

    /**
     * Rule-based response when Ollama is unavailable
     */
    private String generateRuleBasedResponse(String message, AgentIntent intent,
                                              List<Map<String, Object>> tools) {
        String lower = message.toLowerCase();

        return switch (intent) {
            case GREETING -> """
                👋 Hi there! I'm ShopHub AI, your personal shopping assistant!

                I can help you:
                • 🔍 Find the perfect products
                • 💰 Compare prices and find deals
                • ⭐ Get product reviews and ratings
                • 🛒 Add items to cart and checkout

                What are you looking for today?
                """;

            case SEARCH -> {
                var results = vectorStore.searchProducts(extractSearchTerms(lower), 5);
                StringBuilder response = new StringBuilder("🔍 Here's what I found:\n\n");
                tools.add(Map.of("type", "search_products", "query", extractSearchTerms(lower)));
                if (results.isEmpty()) {
                    response.append("No exact matches found. Try different keywords or browse our categories!");
                } else {
                    for (var product : results) {
                        response.append(String.format("**%s** — $%.2f ⭐%.1f (%s)\n",
                            product.get("title"), product.get("price"),
                            product.get("rating"), product.get("category")));
                    }
                    response.append("\nWant me to add any of these to your cart? Just say **\"add [product name]\"**");
                }
                yield response.toString();
            }

            case PRICE_QUERY -> {
                var results = vectorStore.searchProducts(extractSearchTerms(lower), 10);
                results.sort((a, b) -> Double.compare((double)a.get("price"), (double)b.get("price")));
                StringBuilder response = new StringBuilder("💰 Here are some options by price:\n\n");
                int count = 0;
                for (var product : results) {
                    if (count++ >= 5) break;
                    double discount = product.get("discount_percentage") != null ? (double)product.get("discount_percentage") : 0;
                    double originalPrice = (double) product.get("price");
                    double salePrice = originalPrice * (1 - discount / 100);
                    response.append(String.format("**%s** — $%.2f", product.get("title"), salePrice));
                    if (discount > 0) {
                        response.append(String.format(" ~~$%.2f~~ (-%.0f%%)", originalPrice, discount));
                    }
                    response.append(" ⭐").append(product.get("rating")).append("\n");
                }
                yield response.toString();
            }

            case CHECKOUT -> {
                tools.add(Map.of("type", "process_checkout", "action", "checkout"));
                yield "🎉 Great choice! I'm processing your checkout.\n\n" +
                      "Your order will be confirmed shortly. You'll receive:\n" +
                      "• Order confirmation email\n" +
                      "• Shipping tracking number\n" +
                      "• Estimated delivery date\n\n" +
                      "Redirecting to checkout page...";
            }

            case ORDER_ISSUE -> {
                tools.add(Map.of("type", "detect_order_issues", "action", "issue_detection"));
                yield "🔍 I'll check your order for any issues right away.\n\n" +
                      "Please provide your **order number** (e.g., ORD-20260822-ABC123) " +
                      "and I'll run a full diagnostic including:\n" +
                      "• Payment status check\n" +
                      "• Stock availability verification\n" +
                      "• Delivery timeline review\n" +
                      "• Duplicate order detection\n" +
                      "• Price mismatch verification\n\n" +
                      "I'll automatically resolve what I can and escalate what I can't.";
            }

            default -> {
                var results = vectorStore.searchProducts(extractSearchTerms(lower), 3);
                StringBuilder response = new StringBuilder();
                if (!results.isEmpty()) {
                    response.append("Based on your message, here are some products you might like:\n\n");
                    for (var product : results) {
                        response.append(String.format("• **%s** — $%.2f ⭐%.1f\n",
                            product.get("title"), product.get("price"), product.get("rating")));
                    }
                    response.append("\nWould you like more details or want to add any to your cart?");
                } else {
                    response.append("I'm here to help! You can:\n");
                    response.append("• Tell me what you're looking to buy\n");
                    response.append("• Ask about prices or deals\n");
                    response.append("• Request product recommendations\n");
                    response.append("• Say \"checkout\" when ready to pay\n\n");
                    response.append("What would you like to do?");
                }
                yield response.toString();
            }
        };
    }

    private void extractToolCalls(String response, List<Map<String, Object>> tools) {
        // Simple pattern matching for tool calls in LLM response
        if (response.contains("add_to_cart") || response.toLowerCase().contains("added to cart")) {
            tools.add(Map.of("type", "add_to_cart", "action", "cart_update"));
        }
        if (response.contains("checkout") || response.toLowerCase().contains("proceed to checkout")) {
            tools.add(Map.of("type", "process_checkout", "action", "checkout"));
        }
        if (response.contains("search_products") || response.toLowerCase().contains("searching for")) {
            tools.add(Map.of("type", "search_products", "action", "search"));
        }
    }

    private String generateFallbackResponse(String message) {
        return "🤖 " + message;
    }

    private String extractSearchTerms(String message) {
        return message.replaceAll("\\b(i want|i need|buy|find me|show me|search for|looking for|get me)\\b", "")
            .replaceAll("\\b(a|an|the|some|any|with|for|that|which)\\b", "")
            .trim();
    }

    private Conversation getOrCreateConversation(Long conversationId, Long userId, String firstMessage) {
        if (conversationId != null) {
            return conversationRepo.findById(conversationId).orElseGet(
                () -> createConversation(userId, firstMessage));
        }
        return createConversation(userId, firstMessage);
    }

    private Conversation createConversation(Long userId, String firstMessage) {
        String title = firstMessage.length() > 50
            ? firstMessage.substring(0, 50) + "..."
            : firstMessage;
        Conversation conv = Conversation.builder()
            .userId(userId)
            .title(title)
            .build();
        return conversationRepo.save(conv);
    }

    private void publishAgentEvent(Long userId, AgentIntent intent, String message, String response) {
        try {
            Map<String, Object> event = Map.of(
                "userId", userId,
                "intent", intent.name(),
                "userMessage", message,
                "agentResponse", response.substring(0, Math.min(response.length(), 200)),
                "timestamp", System.currentTimeMillis()
            );
            kafkaTemplate.send("agent.events", objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            log.warn("Failed to publish agent event: {}", e.getMessage());
        }
    }

    public enum AgentIntent {
        GREETING, SEARCH, PRICE_QUERY, ADD_TO_CART, CHECKOUT,
        COMPARE, REVIEW, SHIPPING, ORDER_ISSUE, FAREWELL, GENERAL
    }
}
