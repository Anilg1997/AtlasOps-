package com.intellops.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.order.dto.CreateOrderRequest;
import com.intellops.order.dto.OrderResponse;
import com.intellops.order.dto.UpdateOrderStatusRequest;
import com.intellops.order.repository.CustomerRepository;
import com.intellops.order.repository.OrderLineItemRepository;
import com.intellops.order.repository.OrderRepository;
import com.intellops.order.repository.ProductRepository;
import com.intellops.order.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = OrderController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                DataSourceAutoConfiguration.class,
                HibernateJpaAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private OrderLineItemRepository orderLineItemRepository;

    @MockBean
    private CustomerRepository customerRepository;

    @MockBean
    private ProductRepository productRepository;

    @TestConfiguration
    static class JpaTestConfig {
        @Bean
        jakarta.persistence.EntityManagerFactory entityManagerFactory() {
            return org.mockito.Mockito.mock(jakarta.persistence.EntityManagerFactory.class);
        }
    }

    private OrderResponse sampleOrder() {
        return OrderResponse.builder()
                .id(1L)
                .orderNumber("ORD-001")
                .status("PENDING")
                .totalAmount(new BigDecimal("162.00"))
                .build();
    }

    @Test
    void createOrder_shouldReturnCreated() throws Exception {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerId(1L)
                .lineItems(List.of(CreateOrderRequest.LineItemRequest.builder()
                        .productId(10L)
                        .quantity(2)
                        .build()))
                .build();

        when(orderService.createOrder(any(CreateOrderRequest.class))).thenReturn(sampleOrder());

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").value("ORD-001"));
    }

    @Test
    void createOrder_withEmptyLineItems_shouldReturnBadRequest() throws Exception {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerId(1L)
                .lineItems(List.of())
                .build();

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getOrder_shouldReturnOrder() throws Exception {
        when(orderService.getOrder("ORD-001")).thenReturn(sampleOrder());

        mockMvc.perform(get("/api/v1/orders/ORD-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void listOrders_shouldReturnPagedResults() throws Exception {
        Page<OrderResponse> page = new PageImpl<>(List.of(sampleOrder()));
        when(orderService.listOrders(anyInt(), anyInt(), eq(null))).thenReturn(page);

        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].orderNumber").value("ORD-001"));
    }

    @Test
    void updateOrderStatus_shouldReturnUpdatedOrder() throws Exception {
        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setStatus("CONFIRMED");

        OrderResponse updated = OrderResponse.builder()
                .id(1L).orderNumber("ORD-001").status("CONFIRMED")
                .build();
        when(orderService.updateOrderStatus(eq("ORD-001"), any(UpdateOrderStatusRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(patch("/api/v1/orders/ORD-001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void getOrderStats_shouldReturnStats() throws Exception {
        when(orderService.getOrderStats()).thenReturn(Map.of(
                "totalOrders", 100L,
                "pendingOrders", 10L,
                "totalRevenue", new BigDecimal("50000.00")));

        mockMvc.perform(get("/api/v1/orders/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders").value(100));
    }
}
