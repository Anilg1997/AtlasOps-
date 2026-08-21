package com.shophub.agent.service;

import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.ollama.OllamaEmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;

/**
 * EmbeddingService — manages text embeddings for RAG using Ollama.
 * Uses nomic-embed-text model for embeddings (lightweight, free).
 * Falls back to simple hashing if Ollama is unavailable.
 */
@Service
@Slf4j
public class EmbeddingService {

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/shophub}")
    private String dbUrl;

    @Value("${spring.datasource.username:shophub}")
    private String dbUser;

    @Value("${spring.datasource.password:shophub_secret}")
    private String dbPassword;

    private EmbeddingModel embeddingModel;
    private EmbeddingStore<TextSegment> embeddingStore;
    private boolean ollamaAvailable = false;

    @PostConstruct
    public void init() {
        try {
            // Initialize Ollama embedding model (nomic-embed-text)
            embeddingModel = OllamaEmbeddingModel.builder()
                .baseUrl(ollamaBaseUrl)
                .modelName("nomic-embed-text")
                .timeout(Duration.ofSeconds(30))
                .build();

            // Initialize pgvector embedding store
            String jdbcUrl = dbUrl.replace("jdbc:", "");
            embeddingStore = PgVectorEmbeddingStore.builder()
                .host(extractHost(jdbcUrl))
                .port(extractPort(jdbcUrl))
                .database(extractDatabase(jdbcUrl))
                .user(dbUser)
                .password(dbPassword)
                .table("knowledge_base")
                .dimension(768) // nomic-embed-text dimension
                .build();

            ollamaAvailable = true;
            log.info("✅ EmbeddingService initialized with Ollama + pgvector");
        } catch (Exception e) {
            log.warn("⚠️ Ollama not available, using fallback embedding. Error: {}", e.getMessage());
            ollamaAvailable = false;
        }
    }

    /**
     * Generate embeddings for text
     */
    public float[] embed(String text) {
        if (!ollamaAvailable || embeddingModel == null) {
            return fallbackEmbed(text);
        }
        try {
            Response<dev.langchain4j.data.embedding.Embedding> response =
                embeddingModel.embed(text);
            return response.content().vector();
        } catch (Exception e) {
            log.warn("Embedding failed, using fallback: {}", e.getMessage());
            return fallbackEmbed(text);
        }
    }

    /**
     * Store text with embedding in vector store
     */
    public void store(String text, String source, String sourceId) {
        if (!ollamaAvailable || embeddingStore == null) {
            log.debug("Skipping vector store (Ollama unavailable)");
            return;
        }
        try {
            float[] embedding = embed(text);
            Metadata metadata = Metadata.from("source", source);
            if (sourceId != null) {
                metadata.put("sourceId", sourceId);
            }
            TextSegment segment = TextSegment.from(text, metadata);
            embeddingStore.add(
                dev.langchain4j.data.embedding.Embedding.from(embedding),
                segment
            );
            log.debug("Stored embedding: {} / {}", source, sourceId);
        } catch (Exception e) {
            log.warn("Failed to store embedding: {}", e.getMessage());
        }
    }

    /**
     * Find relevant context using vector similarity search
     */
    public List<EmbeddingMatch<TextSegment>> findRelevant(String query, int topK) {
        if (!ollamaAvailable || embeddingStore == null) {
            return List.of();
        }
        try {
            float[] queryEmbedding = embed(query);
            return embeddingStore.findRelevant(
                dev.langchain4j.data.embedding.Embedding.from(queryEmbedding),
                topK,
                0.6 // min similarity score
            );
        } catch (Exception e) {
            log.warn("Vector search failed: {}", e.getMessage());
            return List.of();
        }
    }

    public boolean isAvailable() {
        return ollamaAvailable;
    }

    /**
     * Simple fallback embedding when Ollama is unavailable
     * Uses a deterministic hash-based approach for basic similarity
     */
    private float[] fallbackEmbed(String text) {
        float[] embedding = new float[768];
        String lower = text.toLowerCase();
        // Create a simple feature-based embedding
        for (int i = 0; i < Math.min(lower.length(), 768); i++) {
            embedding[i] = (float) (lower.charAt(i) % 100) / 100.0f;
        }
        // Normalize
        float norm = 0;
        for (float v : embedding) norm += v * v;
        norm = (float) Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < embedding.length; i++) embedding[i] /= norm;
        }
        return embedding;
    }

    private String extractHost(String jdbcUrl) {
        // jdbc:postgresql://localhost:5432/shophub
        String host = jdbcUrl.replace("postgresql://", "").split(":")[0];
        return host;
    }

    private int extractPort(String jdbcUrl) {
        try {
            String[] parts = jdbcUrl.replace("postgresql://", "").split(":");
            String portStr = parts[1].split("/")[0];
            return Integer.parseInt(portStr);
        } catch (Exception e) {
            return 5432;
        }
    }

    private String extractDatabase(String jdbcUrl) {
        try {
            return jdbcUrl.split("/")[3].split("\\?")[0];
        } catch (Exception e) {
            return "shophub";
        }
    }
}
