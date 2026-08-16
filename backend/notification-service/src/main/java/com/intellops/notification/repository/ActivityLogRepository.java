package com.intellops.notification.repository;

import com.intellops.notification.model.ActivityEntry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends MongoRepository<ActivityEntry, String> {

    List<ActivityEntry> findByEntityIdOrderByTimestampDesc(String entityId, Pageable pageable);

    List<ActivityEntry> findByEntityIdAndEntityTypeOrderByTimestampDesc(String entityId, String entityType, Pageable pageable);

    List<ActivityEntry> findByEventTypeOrderByTimestampDesc(String eventType, Pageable pageable);

    List<ActivityEntry> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    List<ActivityEntry> findAllByOrderByTimestampDesc(Pageable pageable);

    long countByEntityId(String entityId);

    long countByEventType(String eventType);

    long countByEntityType(String entityType);
}
