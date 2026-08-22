package com.shophub.agent.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductEmbedding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id")
    private Integer externalId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;
    private String brand;

    private BigDecimal price;

    @Column(name = "discount_percentage")
    private BigDecimal discountPercentage;

    private BigDecimal rating;
    private Integer stock;
    private String thumbnail;

    @Column(columnDefinition = "vector(1536)")
    private String embedding;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
