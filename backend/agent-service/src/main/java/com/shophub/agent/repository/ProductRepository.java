package com.shophub.agent.repository;

import com.shophub.agent.model.ProductEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<ProductEmbedding, Long> {

    @Query(value = "SELECT *, 1 - (embedding <=> :queryVector::vector) AS score " +
           "FROM products " +
           "WHERE embedding IS NOT NULL " +
           "ORDER BY embedding <=> :queryVector::vector " +
           "LIMIT :limit", nativeQuery = true)
    List<Object[]> findSimilarProducts(@Param("queryVector") String queryVector,
                                       @Param("limit") int limit);

    List<ProductEmbedding> findByCategory(String category);

    @Query(value = "SELECT * FROM products " +
           "WHERE title ILIKE %:keyword% OR description ILIKE %:keyword% OR brand ILIKE %:keyword% " +
           "ORDER BY rating DESC LIMIT :limit", nativeQuery = true)
    List<ProductEmbedding> searchByKeyword(@Param("keyword") String keyword,
                                           @Param("limit") int limit);

    @Query("SELECT DISTINCT p.category FROM ProductEmbedding p")
    List<String> findAllCategories();
}
