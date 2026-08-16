package com.intellops.notification.grpc;

import com.intellops.notification.model.ActivityEntry;
import com.intellops.notification.service.ActivityLogService;
import com.intellops.proto.notification.ActivityLogRequest;
import com.intellops.proto.notification.ActivityLogResponse;
import com.intellops.proto.notification.NotificationRequest;
import com.intellops.proto.notification.NotificationResponse;
import com.intellops.proto.notification.NotificationServiceGrpc;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * gRPC implementation of the {@code NotificationService} proto
 * (backend/proto/notification_service.proto).
 * <p>
 * - GetActivityLog: query the activity timeline for an entity (order, invoice, ...)
 * - SendNotification: record a notification/activity entry directly
 */
@GrpcService
@RequiredArgsConstructor
@Slf4j
public class NotificationGrpcServiceImpl extends NotificationServiceGrpc.NotificationServiceImplBase {

    private final ActivityLogService activityLogService;

    @Override
    public void sendNotification(NotificationRequest request, StreamObserver<NotificationResponse> responseObserver) {
        try {
            ActivityEntry entry = activityLogService.record(ActivityEntry.builder()
                    .eventType(request.getEventType())
                    .source("notification-service")
                    .entityId(request.getEntityId())
                    .entityType(request.getEntityType())
                    .details(request.getMetadataMap())
                    .timestamp(Instant.now())
                    .build());

            log.info("gRPC sendNotification: {} entity={} {}", request.getEventType(),
                    request.getEntityType(), request.getEntityId());

            NotificationResponse response = NotificationResponse.newBuilder()
                    .setSuccess(true)
                    .setNotificationId(entry.getId())
                    .setMessage("Notification recorded")
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC sendNotification failed: {}", e.getMessage());
            responseObserver.onError(e);
        }
    }

    @Override
    public void getActivityLog(ActivityLogRequest request, StreamObserver<ActivityLogResponse> responseObserver) {
        try {
            int limit = request.getLimit() > 0 ? request.getLimit() : 50;
            List<ActivityEntry> entries = activityLogService.getActivity(
                    blankToNull(request.getEntityId()),
                    blankToNull(request.getEntityType()),
                    null,
                    limit);

            ActivityLogResponse.Builder builder = ActivityLogResponse.newBuilder()
                    .setTotalCount(entries.size());

            for (ActivityEntry entry : entries) {
                builder.addEntries(com.intellops.proto.notification.ActivityEntry.newBuilder()
                        .setId(entry.getId())
                        .setEventType(entry.getEventType())
                        .setSource(entry.getSource())
                        .setEntityId(entry.getEntityId() != null ? entry.getEntityId() : "")
                        .setEntityType(entry.getEntityType() != null ? entry.getEntityType() : "")
                        .putAllDetails(entry.getDetails() != null ? entry.getDetails() : Map.of())
                        .setTimestamp(entry.getTimestamp() != null ? entry.getTimestamp().toEpochMilli() : 0L)
                        .build());
            }

            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC getActivityLog failed: {}", e.getMessage());
            responseObserver.onError(e);
        }
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
