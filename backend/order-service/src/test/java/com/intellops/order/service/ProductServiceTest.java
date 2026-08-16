package com.intellops.order.service;

import com.intellops.order.dto.CreateProductRequest;
import com.intellops.order.dto.OrderResponse;
import com.intellops.order.entity.Product;
import com.intellops.order.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository);
    }

    @Test
    void createProduct_shouldSaveAndReturnDto() {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-001").name("Widget").description("A useful widget")
                .price(new BigDecimal("29.99")).category("Tools").stockQuantity(50)
                .build();

        Product saved = Product.builder()
                .id(1L).sku("SKU-001").name("Widget").description("A useful widget")
                .price(new BigDecimal("29.99")).category("Tools").stockQuantity(50)
                .active(true).build();
        when(productRepository.save(any(Product.class))).thenReturn(saved);

        OrderResponse.ProductDto result = productService.createProduct(request);

        assertThat(result.getSku()).isEqualTo("SKU-001");
        assertThat(result.getPrice()).isEqualByComparingTo("29.99");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void listProducts_shouldReturnActiveOnly() {
        Product product = Product.builder()
                .id(1L).sku("SKU-001").name("Widget").price(new BigDecimal("29.99"))
                .active(true).build();
        when(productRepository.findByActiveTrue()).thenReturn(List.of(product));

        List<OrderResponse.ProductDto> result = productService.listProducts();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSku()).isEqualTo("SKU-001");
    }

    @Test
    void getProductById_shouldReturnProduct() {
        Product product = Product.builder()
                .id(1L).sku("SKU-001").name("Widget").price(new BigDecimal("29.99"))
                .active(true).build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        OrderResponse.ProductDto result = productService.getProductById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Widget");
    }

    @Test
    void getProductById_withUnknownId_shouldThrow() {
        when(productRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void getProductEntity_shouldReturnEntity() {
        Product product = Product.builder()
                .id(1L).sku("SKU-001").name("Widget").price(new BigDecimal("29.99"))
                .active(true).build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        Product result = productService.getProductEntity(1L);

        assertThat(result).isSameAs(product);
    }

    @Test
    void getProductEntity_withUnknownId_shouldThrow() {
        when(productRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductEntity(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }
}
