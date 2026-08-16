package com.intellops.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private Long id;
    private String orderNumber;
    private CustomerDto customer;
    private String status;
    private String statusReason;
    private BigDecimal totalAmount;
    private BigDecimal taxAmount;
    private String notes;
    private List<LineItemDto> lineItems;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CustomerDto {
        private Long id;
        private String customerNumber;
        private String name;
        private String email;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LineItemDto {
        private Long id;
        private ProductDto product;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductDto {
        private Long id;
        private String sku;
        private String name;
        private String description;
        private BigDecimal price;
        private String category;
    }
}
