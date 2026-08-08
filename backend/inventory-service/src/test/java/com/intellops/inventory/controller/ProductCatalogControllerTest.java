package com.intellops.inventory.controller;

import com.intellops.inventory.service.ProductCatalogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProductCatalogController.class)
class ProductCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductCatalogService productCatalogService;

    @Test
    void contextLoads() {
    }
}
