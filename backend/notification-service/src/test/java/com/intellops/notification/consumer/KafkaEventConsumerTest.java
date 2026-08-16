package com.intellops.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.notification.model.ActivityEntry;
import com.intellops.notification.service.ActivityLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KafkaEventConsumerTest {

    @Mock
    private ActivityLogService activityLogService;

    private KafkaEventConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new KafkaEventConsumer(activityLogService, new ObjectMapper());
    }

    @Test
    void onEvent_validJson_shouldRecordActivity() {
        String payload = """
                {"eventType":"ORDER_STATUS_CHANGED","orderNumber":"ORD-1001","status":"SHIPPED"}
                """;

        when(activityLogService.recordEvent(any(), any())).thenReturn(ActivityEntry.builder().build());

        consumer.onEvent(payload);

        verify(activityLogService).recordEvent(eq("kafka"), argThat(event ->
                "ORDER_STATUS_CHANGED".equals(event.get("eventType"))
                        && "ORD-1001".equals(event.get("orderNumber"))));
    }

    @Test
    void onEvent_invalidJson_shouldLogAndSkip() {
        consumer.onEvent("{not valid json");

        verify(activityLogService, never()).recordEvent(any(), any());
    }

    @Test
    void onEvent_blankPayload_shouldBeIgnored() {
        consumer.onEvent("   ");

        verify(activityLogService, never()).recordEvent(any(), any());
    }
}
