package com.intellops.inventory.service;

import com.intellops.inventory.model.Product;
import com.intellops.inventory.model.StockReservation;
import com.intellops.inventory.repository.ProductRepository;
import com.intellops.inventory.repository.StockReservationRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockReservationRepository reservationRepository;

    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(productRepository, reservationRepository);
    }

    @Test
    void checkStock_withSufficientStock_shouldReturnInStock() {
        Product product = Product.builder()
                .id("p1").sku("SKU-001").name("Widget")
                .stockQuantity(100).reorderThreshold(10).active(true)
                .build();

        when(productRepository.findBySku("SKU-001")).thenReturn(Optional.of(product));
        when(reservationRepository.findByProductIdAndStatus("SKU-001", "RESERVED"))
                .thenReturn(List.of());

        Map<String, Object> result = inventoryService.checkStock("SKU-001", 5);

        assertThat(result.get("inStock")).isEqualTo(true);
        assertThat(result.get("availableQuantity")).isEqualTo(100);
    }

    @Test
    void checkStock_withInsufficientStock_shouldReturnOutOfStock() {
        Product product = Product.builder()
                .id("p1").sku("SKU-002").name("Limited Widget")
                .stockQuantity(3).reorderThreshold(10).active(true)
                .build();

        when(productRepository.findBySku("SKU-002")).thenReturn(Optional.of(product));
        when(reservationRepository.findByProductIdAndStatus("SKU-002", "RESERVED")).thenReturn(List.of());

        Map<String, Object> result = inventoryService.checkStock("SKU-002", 10);

        assertThat(result.get("inStock")).isEqualTo(false);
        assertThat(result.get("availableQuantity")).isEqualTo(3);
    }

    @Test
    void checkStock_withUnknownProduct_shouldThrow() {
        when(productRepository.findBySku("UNKNOWN")).thenReturn(Optional.empty());
        when(productRepository.findById("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.checkStock("UNKNOWN", 1))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void reserveStock_withAvailableStock_shouldSucceed() {
        Product product = Product.builder()
                .id("p1").sku("SKU-001").name("Widget")
                .stockQuantity(50).reorderThreshold(10).build();

        StockReservation reservation = StockReservation.builder()
                .id("RES-001").orderId("ORD-123").productId("SKU-001").quantity(5)
                .status("RESERVED").reservedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        when(productRepository.findBySku("SKU-001")).thenReturn(Optional.of(product));
        when(reservationRepository.findByProductIdAndStatus("SKU-001", "RESERVED")).thenReturn(List.of());
        when(reservationRepository.save(any(StockReservation.class))).thenReturn(reservation);

        Map<String, Object> result = inventoryService.reserveStock("ORD-123", "SKU-001", 5, 30);

        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("message")).isEqualTo("Stock reserved successfully");
    }

    @Test
    void reserveStock_withInsufficientStock_shouldFail() {
        Product product = Product.builder()
                .id("p1").sku("SKU-001").name("Widget")
                .stockQuantity(2).reorderThreshold(10).build();

        when(productRepository.findBySku("SKU-001")).thenReturn(Optional.of(product));
        when(reservationRepository.findByProductIdAndStatus("SKU-001", "RESERVED")).thenReturn(List.of());

        Map<String, Object> result = inventoryService.reserveStock("ORD-123", "SKU-001", 10, 30);

        assertThat(result.get("success")).isEqualTo(false);
        assertThat((String) result.get("message")).contains("Insufficient stock");
    }

    @Test
    void getProduct_shouldReturnDetails() {
        Product product = Product.builder()
                .id("p1").sku("SKU-001").name("Widget")
                .description("A useful widget").price(new BigDecimal("29.99"))
                .category("Tools").stockQuantity(100).reorderThreshold(10)
                .active(true).build();

        when(productRepository.findBySku("SKU-001")).thenReturn(Optional.of(product));

        Map<String, Object> result = inventoryService.getProduct("SKU-001");

        assertThat(result.get("name")).isEqualTo("Widget");
        assertThat(result.get("price")).isEqualTo(new BigDecimal("29.99"));
    }
}
