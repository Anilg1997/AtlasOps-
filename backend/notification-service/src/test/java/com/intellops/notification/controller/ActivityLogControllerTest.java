package com.intellops.notification.controller;

import com.intellops.notification.model.ActivityEntry;
import com.intellops.notification.service.ActivityLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ActivityLogController.class)
@AutoConfigureMockMvc(addFilters = false)
class ActivityLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ActivityLogService activityLogService;

    @Test
    void getActivity_shouldReturnEntries() throws Exception {
        ActivityEntry entry = ActivityEntry.builder()
                .id("1")
                .eventType("ORDER_CREATED")
                .entityId("ORD-1001")
                .entityType("ORDER")
                .build();
        when(activityLogService.getActivity(any(), any(), any(), anyInt()))
                .thenReturn(List.of(entry));

        mockMvc.perform(get("/api/v1/activity").param("entityId", "ORD-1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventType").value("ORDER_CREATED"))
                .andExpect(jsonPath("$[0].entityId").value("ORD-1001"));
    }

    @Test
    void getActivity_withNoMatches_shouldReturnEmptyList() throws Exception {
        when(activityLogService.getActivity(any(), any(), any(), anyInt()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/v1/activity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getStats_shouldReturnStats() throws Exception {
        when(activityLogService.getStats()).thenReturn(java.util.Map.of("totalEntries", 5L));

        mockMvc.perform(get("/api/v1/activity/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEntries").value(5));
    }

    @Test
    void publishEvent_withValidPayload_shouldReturnCreatedEntry() throws Exception {
        ActivityEntry entry = ActivityEntry.builder()
                .id("1")
                .eventType("ORDER_CREATED")
                .entityId("ORD-1001")
                .entityType("ORDER")
                .source("manual")
                .build();
        when(activityLogService.recordEvent(eq("manual"), any())).thenReturn(entry);

        mockMvc.perform(post("/api/v1/activity/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"ORDER_CREATED\",\"orderNumber\":\"ORD-1001\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventType").value("ORDER_CREATED"))
                .andExpect(jsonPath("$.entityId").value("ORD-1001"))
                .andExpect(jsonPath("$.source").value("manual"));
    }

    @Test
    void publishEvent_withoutEventType_shouldReturnBadRequest() throws Exception {
        when(activityLogService.recordEvent(eq("manual"), any())).thenReturn(null);

        mockMvc.perform(post("/api/v1/activity/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderNumber\":\"ORD-1001\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("eventType is required in the payload"));
    }

    @Test
    void publishEvent_withEmptyBody_shouldReturnBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/activity/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Request body is required"));
    }
}
