package com.shophub.agent.service;

import com.shophub.agent.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * VectorStoreService — handles pgvector operations for RAG.
 * Uses pgvector extension for cosine similarity search on product embeddings.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VectorStoreService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductRepository productRepository;

    /**
     * Store a product embedding in pgvector
     */
    public void storeProductEmbedding(Long productId, float[] embedding) {
        String vectorStr = vectorToString(embedding);
        jdbcTemplate.update(
            "UPDATE products SET embedding = ?::vector, synced_at = NOW() WHERE id = ?",
            vectorStr, productId
        );
        log.debug("Stored embedding for product {}", productId);
    }

    /**
     * Store a knowledge base entry embedding for RAG
     */
    public void storeKnowledgeEmbedding(String source, String sourceId, String content, float[] embedding) {
        String vectorStr = vectorToString(embedding);
        jdbcTemplate.update(
            "INSERT INTO knowledge_base (source, source_id, content, embedding) VALUES (?, ?, ?, ?::vector)",
            source, sourceId, content, vectorStr
        );
        log.debug("Stored knowledge embedding from {} / {}", source, sourceId);
    }

    /**
     * Find similar products using cosine similarity
     */
    public List<Map<String, Object>> findSimilarProducts(float[] queryEmbedding, int topK) {
        String vectorStr = vectorToString(queryEmbedding);
        return jdbcTemplate.queryForList(
            "SELECT id, external_id, title, description, category, brand, price, " +
            "discount_percentage, rating, stock, thumbnail, " +
            "1 - (embedding <=> ?::vector) AS similarity " +
            "FROM products WHERE embedding IS NOT NULL " +
            "ORDER BY embedding <=> ?::vector LIMIT ?",
            vectorStr, vectorStr, topK
        );
    }

    /**
     * Find relevant knowledge base entries for RAG context
     */
    public List<Map<String, Object>> findRelevantKnowledge(float[] queryEmbedding, int topK, double minScore) {
        String vectorStr = vectorToString(queryEmbedding);
        return jdbcTemplate.queryForList(
            "SELECT id, source, source_id, content, " +
            "1 - (embedding <=> ?::vector) AS score " +
            "FROM knowledge_base WHERE embedding IS NOT NULL " +
            "AND 1 - (embedding <=> ?::vector) >= ? " +
            "ORDER BY embedding <=> ?::vector LIMIT ?",
            vectorStr, vectorStr, minScore, vectorStr, topK
        );
    }

    /**
     * Find products by text search (fallback when embeddings not available)
     */
    public List<Map<String, Object>> searchProducts(String query, int limit) {
        return jdbcTemplate.queryForList(
            "SELECT id, external_id, title, description, category, brand, price, " +
            "discount_percentage, rating, stock, thumbnail " +
            "FROM products " +
            "WHERE LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) " +
            "OR LOWER(category) LIKE LOWER(?) OR LOWER(brand) LIKE LOWER(?) " +
            "ORDER BY rating DESC LIMIT ?",
            "%" + query + "%", "%" + query + "%", "%" + query + "%", "%" + query + "%", limit
        );
    }

    /**
     * Store product data for RAG
     */
    public void syncProductForRag(Long productId, String title, String description,
                                   String category, String brand, double price,
                                   double rating, int stock, String thumbnail) {
        jdbcTemplate.update(
            "INSERT INTO products (external_id, title, description, category, brand, price, " +
            "rating, stock, thumbnail, synced_at) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) " +
            "ON CONFLICT (external_id) DO UPDATE SET " +
            "title = EXCLUDED.title, description = EXCLUDED.description, " +
            "category = EXCLUDED.category, brand = EXCLUDED.brand, " +
            "price = EXCLUDED.price, rating = EXCLUDED.rating, " +
            "stock = EXCLUDED.stock, thumbnail = EXCLUDED.thumbnail, synced_at = NOW()",
            productId, title, description, category, brand, price, rating, stock, thumbnail
        );
    }

    /**
     * Get all categories for agent context
     */
    public List<String> getAllCategories() {
        return productRepository.findAllCategories();
    }

    /**
     * Get product stats for agent context
     */
    public Map<String, Object> getProductStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProducts", jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM products", Long.class));
        stats.put("categories", jdbcTemplate.queryForList(
            "SELECT DISTINCT category FROM products ORDER BY category", String.class));
        stats.put("avgPrice", jdbcTemplate.queryForObject(
            "SELECT COALESCE(AVG(price), 0) FROM products", Double.class));
        stats.put("avgRating", jdbcTemplate.queryForObject(
            "SELECT COALESCE(AVG(rating), 0) FROM products", Double.class));
        return stats;
    }

    private String vectorToString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
