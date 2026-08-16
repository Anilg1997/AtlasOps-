package com.intellops.inventory.controller;

import com.intellops.inventory.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = InventoryRestController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class InventoryRestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InventoryService inventoryService;

    @Test
    void listProducts_shouldReturnPagedProducts() throws Exception {
        Map<String, Object> result = Map.of(
                "products", List.of(Map.of("sku", "SKU-001", "name", "Widget", "price", 29.99)),
                "totalCount", 1,
                "page", 0,
                "pageSize", 20);

        when(inventoryService.listProducts(eq(null), eq(true), anyInt(), anyInt())).thenReturn(result);

        mockMvc.perform(get("/api/v1/inventory/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(1))
                .andExpect(jsonPath("$.products[0].sku").value("SKU-001"));
    }

    @Test
    void getProduct_shouldReturnDetails() throws Exception {
        Map<String, Object> result = Map.of(
                "id", "p1", "sku", "SKU-001", "name", "Widget", "stockQuantity", 100);

        when(inventoryService.getProduct("SKU-001")).thenReturn(result);

        mockMvc.perform(get("/api/v1/inventory/products/SKU-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Widget"));
    }

    @Test
    void checkStock_shouldReturnAvailability() throws Exception {
        Map<String, Object> result = Map.of(
                "inStock", true, "availableQuantity", 95, "reorderStatus", "OK");

        when(inventoryService.checkStock("SKU-001", 5)).thenReturn(result);

        mockMvc.perform(get("/api/v1/inventory/stock/SKU-001").param("quantity", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inStock").value(true))
                .andExpect(jsonPath("$.availableQuantity").value(95));
    }

    @Test
    void checkStock_withDefaultQuantity_shouldUseOne() throws Exception {
        Map<String, Object> result = Map.of(
                "inStock", true, "availableQuantity", 99, "reorderStatus", "OK");

        when(inventoryService.checkStock(anyString(), eq(1))).thenReturn(result);

        mockMvc.perform(get("/api/v1/inventory/stock/SKU-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inStock").value(true));
    }
}
