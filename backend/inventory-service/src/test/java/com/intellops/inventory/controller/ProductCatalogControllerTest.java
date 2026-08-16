package com.intellops.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.inventory.dto.ApiResponse;
import com.intellops.inventory.dto.ProductDto;
import com.intellops.inventory.service.ProductCatalogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = ProductCatalogController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class ProductCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductCatalogService productCatalogService;

    private ProductDto.Response sampleResponse() {
        return ProductDto.Response.builder()
                .id("p1").sku("SKU-001").name("Widget").category("Tools")
                .price(new BigDecimal("29.99")).active(true)
                .build();
    }

    @Test
    void createProduct_shouldReturnCreated() throws Exception {
        ProductDto.Request request = ProductDto.Request.builder()
                .name("Widget").sku("SKU-001").category("Tools").price(new BigDecimal("29.99"))
                .build();

        when(productCatalogService.createProduct(any(ProductDto.Request.class))).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/catalog/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("SKU-001"));
    }

    @Test
    void createProduct_withMissingName_shouldReturnBadRequest() throws Exception {
        ProductDto.Request request = ProductDto.Request.builder()
                .sku("SKU-001").category("Tools").build();

        mockMvc.perform(post("/api/v1/catalog/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAllProducts_shouldReturnList() throws Exception {
        when(productCatalogService.getAllProducts()).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/catalog/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Widget"));
    }

    @Test
    void getProduct_shouldReturnProduct() throws Exception {
        when(productCatalogService.getProduct("p1")).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/catalog/products/p1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("p1"));
    }

    @Test
    void getProductBySku_shouldReturnProduct() throws Exception {
        when(productCatalogService.getProductBySku("SKU-001")).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/catalog/products/sku/SKU-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sku").value("SKU-001"));
    }

    @Test
    void getProductsByCategory_shouldReturnFilteredList() throws Exception {
        when(productCatalogService.getProductsByCategory("Tools")).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/catalog/products/category/Tools"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].category").value("Tools"));
    }

    @Test
    void updateProduct_shouldReturnUpdatedProduct() throws Exception {
        ProductDto.Request request = ProductDto.Request.builder()
                .name("Super Widget").sku("SKU-001").category("Tools").price(new BigDecimal("39.99"))
                .build();

        ProductDto.Response updated = sampleResponse();
        updated.setName("Super Widget");
        when(productCatalogService.updateProduct(anyString(), any(ProductDto.Request.class))).thenReturn(updated);

        mockMvc.perform(put("/api/v1/catalog/products/p1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Super Widget"));
    }

    @Test
    void deleteProduct_shouldDeactivateProduct() throws Exception {
        doNothing().when(productCatalogService).deleteProduct("p1");

        mockMvc.perform(delete("/api/v1/catalog/products/p1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Product deactivated"));
    }
}
