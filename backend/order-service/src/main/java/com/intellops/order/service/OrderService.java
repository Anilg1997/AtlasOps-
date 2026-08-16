package com.intellops.order.service;

import com.intellops.order.dto.CreateOrderRequest;
import com.intellops.order.dto.OrderResponse;
import com.intellops.order.dto.UpdateOrderStatusRequest;
import com.intellops.order.entity.Customer;
import com.intellops.order.entity.Order;
import com.intellops.order.entity.OrderLineItem;
import com.intellops.order.entity.Product;
import com.intellops.order.events.OrderEventPublisher;
import com.intellops.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerService customerService;
    private final ProductService productService;
    private final OrderEventPublisher eventPublisher;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Customer customer = customerService.getCustomerEntity(request.getCustomerId());

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .customer(customer)
                .status("PENDING")
                .notes(request.getNotes())
                .build();

        for (CreateOrderRequest.LineItemRequest lineItemReq : request.getLineItems()) {
            Product product = productService.getProductEntity(lineItemReq.getProductId());

            OrderLineItem lineItem = OrderLineItem.builder()
                    .product(product)
                    .quantity(lineItemReq.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();
            lineItem.calculateSubtotal();

            order.addLineItem(lineItem);
        }

        order.calculateTotals();
        order = orderRepository.save(order);

        eventPublisher.publishOrderCreated(order.getOrderNumber(), customer.getCustomerNumber());

        log.info("Order created: {} for customer: {}", order.getOrderNumber(), customer.getCustomerNumber());
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderNumber));
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> listOrders(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders;
        if (search != null && !search.isEmpty()) {
            orders = orderRepository.findByOrderNumberContainingOrStatusContaining(search, search, pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }

        return orders.map(this::toResponse);
    }

    @Transactional
    public OrderResponse updateOrderStatus(String orderNumber, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderNumber));

        String oldStatus = order.getStatus();
        String newStatus = request.getStatus().toUpperCase();

        validateStatusTransition(oldStatus, newStatus);

        order.setStatus(newStatus);
        order.setStatusReason(request.getReason());
        order = orderRepository.save(order);

        eventPublisher.publishOrderStatusChanged(orderNumber, oldStatus, newStatus);

        log.info("Order {} status changed from {} to {}", orderNumber, oldStatus, newStatus);
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", orderRepository.countAll());
        stats.put("pendingOrders", orderRepository.countByStatus("PENDING"));
        stats.put("confirmedOrders", orderRepository.countByStatus("CONFIRMED"));
        stats.put("processingOrders", orderRepository.countByStatus("PROCESSING"));
        stats.put("shippedOrders", orderRepository.countByStatus("SHIPPED"));
        stats.put("deliveredOrders", orderRepository.countByStatus("DELIVERED"));
        stats.put("totalRevenue", orderRepository.sumTotalAmount());
        stats.put("deliveredRevenue", orderRepository.sumDeliveredAmount());
        return stats;
    }

    private void validateStatusTransition(String currentStatus, String newStatus) {
        Map<String, List<String>> validTransitions = Map.of(
                "PENDING", List.of("CONFIRMED", "CANCELLED", "ON_HOLD"),
                "ON_HOLD", List.of("CONFIRMED", "PROCESSING", "CANCELLED"),
                "CONFIRMED", List.of("PROCESSING", "CANCELLED"),
                "PROCESSING", List.of("SHIPPED", "CANCELLED"),
                "SHIPPED", List.of("DELIVERED"),
                "DELIVERED", List.of(),
                "CANCELLED", List.of()
        );

        List<String> allowed = validTransitions.getOrDefault(currentStatus, List.of());
        if (!allowed.contains(newStatus)) {
            throw new RuntimeException(
                    String.format("Invalid status transition from %s to %s", currentStatus, newStatus));
        }
    }

    private String generateOrderNumber() {
        String date = java.time.LocalDate.now().toString().replace("-", "");
        String random = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "ORD-" + date + "-" + random;
    }

    public OrderResponse toResponse(Order order) {
        OrderResponse response = OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .statusReason(order.getStatusReason())
                .totalAmount(order.getTotalAmount())
                .taxAmount(order.getTaxAmount())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .lineItems(order.getLineItems().stream().map(this::toLineItemDto).collect(Collectors.toList()))
                .build();

        if (order.getCustomer() != null) {
            response.setCustomer(customerService.toDto(order.getCustomer()));
        }

        return response;
    }

    private OrderResponse.LineItemDto toLineItemDto(OrderLineItem item) {
        return OrderResponse.LineItemDto.builder()
                .id(item.getId())
                .product(productService.toDto(item.getProduct()))
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .build();
    }
}
