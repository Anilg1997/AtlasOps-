package com.intellops.order.service;

import com.intellops.order.dto.CreateOrderRequest;
import com.intellops.order.dto.OrderResponse;
import com.intellops.order.dto.UpdateOrderStatusRequest;
import com.intellops.order.entity.*;
import com.intellops.order.events.OrderEventPublisher;
import com.intellops.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerService customerService;

    @Mock
    private ProductService productService;

    @Mock
    private OrderEventPublisher eventPublisher;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, customerService, productService, eventPublisher);
    }

    @Test
    void getOrder_shouldReturnOrder() {
        Customer customer = Customer.builder().id(1L).customerNumber("CUST-001").name("John").email("john@test.com").build();
        Order order = Order.builder().orderNumber("ORD-001").status("CONFIRMED").totalAmount(new BigDecimal("1500.00")).customer(customer).build();
        order.setId(1L);

        when(orderRepository.findByOrderNumber("ORD-001")).thenReturn(Optional.of(order));
        when(customerService.toDto(customer)).thenReturn(
                OrderResponse.CustomerDto.builder().id(1L).customerNumber("CUST-001").name("John").email("john@test.com").build());

        OrderResponse result = orderService.getOrder("ORD-001");

        assertThat(result.getOrderNumber()).isEqualTo("ORD-001");
        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    void getOrder_withUnknownOrder_shouldThrow() {
        when(orderRepository.findByOrderNumber(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrder("UNKNOWN"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void listOrders_shouldReturnPagedResults() {
        Order order = Order.builder().orderNumber("ORD-001").status("PENDING").build();
        Page<Order> page = new PageImpl<>(List.of(order));

        when(orderRepository.findAll(any(PageRequest.class))).thenReturn(page);

        Page<OrderResponse> result = orderService.listOrders(0, 10, null);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void updateOrderStatus_withValidTransition_shouldUpdate() {
        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setStatus("CONFIRMED");

        Order order = Order.builder().orderNumber("ORD-001").status("PENDING").build();
        order.setId(1L);

        when(orderRepository.findByOrderNumber("ORD-001")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponse result = orderService.updateOrderStatus("ORD-001", request);

        assertThat(result).isNotNull();
        verify(eventPublisher).publishOrderStatusChanged("ORD-001", "PENDING", "CONFIRMED");
    }

    @Test
    void updateOrderStatus_withInvalidTransition_shouldThrow() {
        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setStatus("SHIPPED");

        Order order = Order.builder().orderNumber("ORD-001").status("PENDING").build();

        when(orderRepository.findByOrderNumber("ORD-001")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateOrderStatus("ORD-001", request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid status transition");
    }

    @Test
    void getOrderStats_shouldReturnStats() {
        when(orderRepository.countAll()).thenReturn(100L);
        when(orderRepository.countByStatus("PENDING")).thenReturn(10L);
        when(orderRepository.countByStatus("CONFIRMED")).thenReturn(20L);
        when(orderRepository.countByStatus("PROCESSING")).thenReturn(30L);
        when(orderRepository.countByStatus("SHIPPED")).thenReturn(25L);
        when(orderRepository.countByStatus("DELIVERED")).thenReturn(15L);
        when(orderRepository.sumTotalAmount()).thenReturn(BigDecimal.valueOf(50000.0));
        when(orderRepository.sumDeliveredAmount()).thenReturn(BigDecimal.valueOf(15000.0));

        var stats = orderService.getOrderStats();

        assertThat(stats.get("totalOrders")).isEqualTo(100L);
        assertThat(stats.get("pendingOrders")).isEqualTo(10L);
        assertThat(stats.get("totalRevenue")).isEqualTo(BigDecimal.valueOf(50000.0));
    }
}
