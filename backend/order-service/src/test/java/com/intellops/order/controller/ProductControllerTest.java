package com.intellops.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.order.dto.CreateProductRequest;
import com.intellops.order.dto.OrderResponse;
import com.intellops.order.repository.CustomerRepository;
import com.intellops.order.repository.OrderLineItemRepository;
import com.intellops.order.repository.OrderRepository;
import com.intellops.order.repository.ProductRepository;
import com.intellops.order.service.ProductService;
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

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = ProductController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                DataSourceAutoConfiguration.class,
                HibernateJpaAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

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

    private OrderResponse.ProductDto sampleProduct() {
        return OrderResponse.ProductDto.builder()
                .id(1L).sku("SKU-001").name("Widget")
                .description("A useful widget").price(new BigDecimal("29.99"))
                .category("Tools").build();
    }

    @Test
    void createProduct_shouldReturnCreated() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-001").name("Widget").price(new BigDecimal("29.99")).build();

        when(productService.createProduct(any(CreateProductRequest.class))).thenReturn(sampleProduct());

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("SKU-001"));
    }

    @Test
    void createProduct_withoutPrice_shouldReturnBadRequest() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-001").name("Widget").build();

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listProducts_shouldReturnList() throws Exception {
        when(productService.listProducts()).thenReturn(List.of(sampleProduct()));

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sku").value("SKU-001"));
    }

    @Test
    void getProduct_shouldReturnProduct() throws Exception {
        when(productService.getProductById(1L)).thenReturn(sampleProduct());

        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(29.99));
    }
}
