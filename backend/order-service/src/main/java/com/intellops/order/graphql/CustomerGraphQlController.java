package com.intellops.order.graphql;

import com.intellops.order.dto.OrderResponse;
import com.intellops.order.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class CustomerGraphQlController {

    private final CustomerService customerService;

    @QueryMapping
    public OrderResponse.CustomerDto customer(@Argument Long id) {
        return customerService.getCustomerById(id);
    }

    @QueryMapping
    public List<OrderResponse.CustomerDto> allCustomers() {
        return customerService.listCustomers();
    }
}
