package com.intellops.order.graphql;

import com.intellops.order.dto.OrderResponse;
import com.intellops.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class OrderGraphQlController {

    private final OrderService orderService;

    @QueryMapping
    public OrderResponse order(@Argument String orderNumber) {
        return orderService.getOrder(orderNumber);
    }

    @QueryMapping
    public List<OrderResponse> orders(@Argument int page, @Argument int size) {
        return orderService.listOrders(page, size, null).getContent();
    }

    @QueryMapping
    public Map<String, Object> orderStats() {
        return orderService.getOrderStats();
    }
}
