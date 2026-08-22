package com.shophub.agent.repository;

import com.shophub.agent.model.OrderIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderIssueRepository extends JpaRepository<OrderIssue, Long> {

    List<OrderIssue> findByOrderNumberOrderByCreatedAtDesc(String orderNumber);

    List<OrderIssue> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<OrderIssue> findByOrderNumberAndIssueTypeOrderByCreatedAtDesc(
            String orderNumber, OrderIssue.IssueType issueType);

    List<OrderIssue> findByStatusIn(List<OrderIssue.IssueStatus> statuses);

    @Query("SELECT oi FROM OrderIssue oi WHERE oi.orderNumber = :orderNumber " +
           "AND oi.issueType = :issueType AND oi.status IN ('DETECTED', 'RESOLVING')")
    List<OrderIssue> findActiveIssues(@Param("orderNumber") String orderNumber,
                                       @Param("issueType") OrderIssue.IssueType issueType);

    @Query("SELECT oi FROM OrderIssue oi WHERE oi.escalatedToHuman = true " +
           "AND oi.resolvedAt IS NULL ORDER BY oi.createdAt DESC")
    List<OrderIssue> findUnresolvedEscalations();

    @Query("SELECT oi FROM OrderIssue oi WHERE oi.createdAt >= :since ORDER BY oi.createdAt DESC")
    List<OrderIssue> findRecentIssues(@Param("since") LocalDateTime since);
}
