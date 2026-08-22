package com.shophub.agent.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IssueType issueType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private IssueStatus status = IssueStatus.DETECTED;

    @Column(columnDefinition = "TEXT")
    private String detectionDetails;

    @Column(columnDefinition = "TEXT")
    private String resolutionAction;

    @Column(columnDefinition = "TEXT")
    private String resolutionResult;

    @Column(name = "resolved_automatically")
    @Builder.Default
    private Boolean resolvedAutomatically = false;

    @Column(name = "escalated_to_human")
    @Builder.Default
    private Boolean escalatedToHuman = false;

    @Column(name = "escalation_reason")
    private String escalationReason;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public enum IssueType {
        PAYMENT_FAILED,
        PAYMENT_PENDING,
        OUT_OF_STOCK,
        DELIVERY_DELAYED,
        DUPLICATE_ORDER,
        PRICE_MISMATCH
    }

    public enum IssueStatus {
        DETECTED,
        RESOLVING,
        RESOLVED,
        ESCALATED,
        FAILED
    }
}
