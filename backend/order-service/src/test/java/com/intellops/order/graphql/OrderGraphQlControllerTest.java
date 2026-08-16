package com.intellops.order.graphql;

import com.intellops.order.dto.OrderResponse;
import com.intellops.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderGraphQlControllerTest {

    @Mock
    private OrderService orderService;

    private OrderGraphQlController controller;

    @BeforeEach
    void setUp() {
        controller = new OrderGraphQlController(orderService);
    }

    private OrderResponse sampleOrder() {
        return OrderResponse.builder()
                .id(1L).orderNumber("ORD-001").status("PENDING")
                .totalAmount(new BigDecimal("162.00"))
                .build();
    }

    @Test
    void order_shouldDelegateToService() {
        when(orderService.getOrder("ORD-001")).thenReturn(sampleOrder());

        OrderResponse result = controller.order("ORD-001");

        assertThat(result.getOrderNumber()).isEqualTo("ORD-001");
        assertThat(result.getStatus()).isEqualTo("PENDING");
        verify(orderService).getOrder("ORD-001");
    }

    @Test
    void orders_shouldReturnPageContent() {
        Page<OrderResponse> page = new PageImpl<>(List.of(sampleOrder()));
        when(orderService.listOrders(eq(0), eq(10), eq(null))).thenReturn(page);

        List<OrderResponse> result = controller.orders(0, 10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOrderNumber()).isEqualTo("ORD-001");
        verify(orderService).listOrders(0, 10, null);
    }

    @Test
    void orderStats_shouldDelegateToService() {
        Map<String, Object> stats = Map.of(
                "totalOrders", 100L,
                "pendingOrders", 10L,
                "totalRevenue", new BigDecimal("50000.00"));
        when(orderService.getOrderStats()).thenReturn(stats);

        Map<String, Object> result = controller.orderStats();

        assertThat(result.get("totalOrders")).isEqualTo(100L);
        verify(orderService).getOrderStats();
    }
}
