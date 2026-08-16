package com.intellops.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.order.dto.CreateCustomerRequest;
import com.intellops.order.dto.OrderResponse;
import com.intellops.order.repository.CustomerRepository;
import com.intellops.order.repository.OrderLineItemRepository;
import com.intellops.order.repository.OrderRepository;
import com.intellops.order.repository.ProductRepository;
import com.intellops.order.service.CustomerService;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = CustomerController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                DataSourceAutoConfiguration.class,
                HibernateJpaAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

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

    private OrderResponse.CustomerDto sampleCustomer() {
        return OrderResponse.CustomerDto.builder()
                .id(1L).customerNumber("CUST-ABC12345").name("John Doe")
                .email("john@example.com").phone("555-1234")
                .build();
    }

    @Test
    void createCustomer_shouldReturnCreated() throws Exception {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("John Doe").email("john@example.com").phone("555-1234").build();

        when(customerService.createCustomer(any(CreateCustomerRequest.class))).thenReturn(sampleCustomer());

        mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerNumber").value("CUST-ABC12345"));
    }

    @Test
    void createCustomer_withBlankName_shouldReturnBadRequest() throws Exception {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("").email("john@example.com").build();

        mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listCustomers_shouldReturnList() throws Exception {
        when(customerService.listCustomers()).thenReturn(List.of(sampleCustomer()));

        mockMvc.perform(get("/api/v1/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("John Doe"));
    }

    @Test
    void getCustomer_shouldReturnCustomer() throws Exception {
        when(customerService.getCustomerById(1L)).thenReturn(sampleCustomer());

        mockMvc.perform(get("/api/v1/customers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("john@example.com"));
    }
}
