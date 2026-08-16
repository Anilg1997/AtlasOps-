package com.intellops.inventory.service;

import com.intellops.inventory.document.ProductDocument;
import com.intellops.inventory.dto.ProductDto;
import com.intellops.inventory.exception.DuplicateResourceException;
import com.intellops.inventory.exception.ResourceNotFoundException;
import com.intellops.inventory.repository.ProductCatalogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductCatalogServiceTest {

    @Mock
    private ProductCatalogRepository productCatalogRepository;

    private ProductCatalogService productCatalogService;

    @BeforeEach
    void setUp() {
        productCatalogService = new ProductCatalogService(productCatalogRepository);
    }

    private ProductDocument sampleProduct() {
        return ProductDocument.builder()
                .id("p1").sku("SKU-001").name("Widget").description("A useful widget")
                .category("Tools").price(new BigDecimal("29.99"))
                .specs(Map.of("material", "Steel")).tags(List.of("tool", "popular"))
                .active(true).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
    }

    private ProductDto.Request sampleRequest() {
        return ProductDto.Request.builder()
                .name("Widget").sku("SKU-001").category("Tools").price(new BigDecimal("29.99"))
                .build();
    }

    @Test
    void createProduct_shouldSaveAndReturnResponse() {
        when(productCatalogRepository.existsBySku("SKU-001")).thenReturn(false);
        when(productCatalogRepository.save(any(ProductDocument.class))).thenReturn(sampleProduct());

        ProductDto.Response result = productCatalogService.createProduct(sampleRequest());

        assertThat(result.getSku()).isEqualTo("SKU-001");
        assertThat(result.getName()).isEqualTo("Widget");
        assertThat(result.isActive()).isTrue();
        verify(productCatalogRepository).save(any(ProductDocument.class));
    }

    @Test
    void createProduct_withDuplicateSku_shouldThrow() {
        when(productCatalogRepository.existsBySku("SKU-001")).thenReturn(true);

        assertThatThrownBy(() -> productCatalogService.createProduct(sampleRequest()))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("SKU-001");
    }

    @Test
    void getProduct_shouldReturnResponse() {
        when(productCatalogRepository.findById("p1")).thenReturn(Optional.of(sampleProduct()));

        ProductDto.Response result = productCatalogService.getProduct("p1");

        assertThat(result.getId()).isEqualTo("p1");
        assertThat(result.getCategory()).isEqualTo("Tools");
    }

    @Test
    void getProduct_withUnknownId_shouldThrow() {
        when(productCatalogRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productCatalogService.getProduct("missing"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void getProductBySku_shouldReturnResponse() {
        when(productCatalogRepository.findBySku("SKU-001")).thenReturn(Optional.of(sampleProduct()));

        ProductDto.Response result = productCatalogService.getProductBySku("SKU-001");

        assertThat(result.getSku()).isEqualTo("SKU-001");
    }

    @Test
    void getProductBySku_withUnknownSku_shouldThrow() {
        when(productCatalogRepository.findBySku(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productCatalogService.getProductBySku("UNKNOWN"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void getAllProducts_shouldReturnActiveProducts() {
        when(productCatalogRepository.findByActiveTrue()).thenReturn(List.of(sampleProduct()));

        List<ProductDto.Response> result = productCatalogService.getAllProducts();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSku()).isEqualTo("SKU-001");
    }

    @Test
    void getProductsByCategory_shouldFilter() {
        when(productCatalogRepository.findByCategory("Tools")).thenReturn(List.of(sampleProduct()));

        List<ProductDto.Response> result = productCatalogService.getProductsByCategory("Tools");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo("Tools");
    }

    @Test
    void updateProduct_shouldApplyChangesAndSave() {
        ProductDocument product = sampleProduct();
        when(productCatalogRepository.findById("p1")).thenReturn(Optional.of(product));
        when(productCatalogRepository.save(any(ProductDocument.class))).thenReturn(product);

        ProductDto.Request request = ProductDto.Request.builder().name("Super Widget").build();

        ProductDto.Response result = productCatalogService.updateProduct("p1", request);

        assertThat(result.getName()).isEqualTo("Super Widget");
        assertThat(result.getSku()).isEqualTo("SKU-001");
    }

    @Test
    void updateProduct_withUnknownId_shouldThrow() {
        when(productCatalogRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productCatalogService.updateProduct("missing", sampleRequest()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void deleteProduct_shouldDeactivateInsteadOfRemoving() {
        ProductDocument product = sampleProduct();
        when(productCatalogRepository.findById("p1")).thenReturn(Optional.of(product));
        when(productCatalogRepository.save(any(ProductDocument.class))).thenReturn(product);

        productCatalogService.deleteProduct("p1");

        assertThat(product.isActive()).isFalse();
        verify(productCatalogRepository).save(product);
    }

    @Test
    void getProductEntityBySku_shouldReturnEntity() {
        when(productCatalogRepository.findBySku("SKU-001")).thenReturn(Optional.of(sampleProduct()));

        ProductDocument result = productCatalogService.getProductEntityBySku("SKU-001");

        assertThat(result.getId()).isEqualTo("p1");
    }
}
