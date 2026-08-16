package com.intellops.order.graphql;

import com.intellops.order.dto.OrderResponse;
import com.intellops.order.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerGraphQlControllerTest {

    @Mock
    private CustomerService customerService;

    private CustomerGraphQlController controller;

    @BeforeEach
    void setUp() {
        controller = new CustomerGraphQlController(customerService);
    }

    private OrderResponse.CustomerDto sampleCustomer() {
        return OrderResponse.CustomerDto.builder()
                .id(1L).customerNumber("CUST-ABC12345").name("John Doe")
                .email("john@example.com").phone("555-1234")
                .build();
    }

    @Test
    void customer_shouldDelegateToService() {
        when(customerService.getCustomerById(1L)).thenReturn(sampleCustomer());

        OrderResponse.CustomerDto result = controller.customer(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("John Doe");
        verify(customerService).getCustomerById(1L);
    }

    @Test
    void allCustomers_shouldDelegateToService() {
        when(customerService.listCustomers()).thenReturn(List.of(sampleCustomer()));

        List<OrderResponse.CustomerDto> result = controller.allCustomers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCustomerNumber()).isEqualTo("CUST-ABC12345");
        verify(customerService).listCustomers();
    }
}
