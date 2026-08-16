package com.intellops.order.service;

import com.intellops.order.dto.CreateCustomerRequest;
import com.intellops.order.dto.OrderResponse;
import com.intellops.order.entity.Customer;
import com.intellops.order.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerService(customerRepository);
    }

    @Test
    void createCustomer_shouldGenerateNumberAndSave() {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("John Doe").email("john@example.com").phone("555-1234").build();

        Customer saved = Customer.builder()
                .id(1L).customerNumber("CUST-ABC12345")
                .name("John Doe").email("john@example.com").phone("555-1234")
                .build();
        when(customerRepository.save(any(Customer.class))).thenReturn(saved);

        OrderResponse.CustomerDto result = customerService.createCustomer(request);

        assertThat(result.getCustomerNumber()).startsWith("CUST-");
        assertThat(result.getName()).isEqualTo("John Doe");
        assertThat(result.getEmail()).isEqualTo("john@example.com");
        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    void listCustomers_shouldReturnAllCustomers() {
        Customer customer = Customer.builder()
                .id(1L).customerNumber("CUST-ABC12345").name("John Doe").email("john@example.com")
                .build();
        when(customerRepository.findAll()).thenReturn(List.of(customer));

        List<OrderResponse.CustomerDto> result = customerService.listCustomers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCustomerNumber()).isEqualTo("CUST-ABC12345");
    }

    @Test
    void getCustomerById_shouldReturnCustomer() {
        Customer customer = Customer.builder()
                .id(1L).customerNumber("CUST-ABC12345").name("John Doe").email("john@example.com")
                .build();
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));

        OrderResponse.CustomerDto result = customerService.getCustomerById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("john@example.com");
    }

    @Test
    void getCustomerById_withUnknownId_shouldThrow() {
        when(customerRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void getCustomerEntity_shouldReturnEntity() {
        Customer customer = Customer.builder()
                .id(1L).customerNumber("CUST-ABC12345").name("John Doe").email("john@example.com")
                .build();
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));

        Customer result = customerService.getCustomerEntity(1L);

        assertThat(result).isSameAs(customer);
    }

    @Test
    void getCustomerEntity_withUnknownId_shouldThrow() {
        when(customerRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerEntity(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }
}
