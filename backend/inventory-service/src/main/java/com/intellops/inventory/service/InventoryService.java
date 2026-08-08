package com.intellops.inventory.service;

import com.intellops.inventory.model.Product;
import com.intellops.inventory.model.StockReservation;
import com.intellops.inventory.repository.ProductRepository;
import com.intellops.inventory.repository.StockReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockReservationRepository reservationRepository;

    public Map<String, Object> checkStock(String productId, int requestedQuantity) {
        Product product = productRepository.findBySku(productId)
                .or(() -> productRepository.findById(productId))
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        int reservedQuantity = getReservedQuantity(productId);
        int availableQuantity = product.getStockQuantity() - reservedQuantity;
        boolean inStock = availableQuantity >= requestedQuantity;

        String reorderStatus = product.needsReorder() ? "REORDER_NEEDED" : "OK";
        String estimatedRestockDate = product.needsReorder()
                ? LocalDateTime.now().plusDays(5).toLocalDate().toString()
                : null;

        return Map.of(
                "inStock", inStock,
                "availableQuantity", availableQuantity,
                "reservedQuantity", reservedQuantity,
                "reorderStatus", reorderStatus,
                "estimatedRestockDate", estimatedRestockDate != null ? estimatedRestockDate : ""
        );
    }

    public Map<String, Object> reserveStock(String orderId, String productId, int quantity, int ttlMinutes) {
        Product product = productRepository.findBySku(productId)
                .or(() -> productRepository.findById(productId))
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        int reservedQuantity = getReservedQuantity(productId);
        int availableQuantity = product.getStockQuantity() - reservedQuantity;

        if (availableQuantity < quantity) {
            return Map.of(
                    "success", false,
                    "reservationId", "",
                    "message", "Insufficient stock. Available: " + availableQuantity + ", Requested: " + quantity
            );
        }

        StockReservation reservation = StockReservation.builder()
                .orderId(orderId)
                .productId(productId)
                .quantity(quantity)
                .status("RESERVED")
                .reservedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(ttlMinutes))
                .build();

        reservation = reservationRepository.save(reservation);
        log.info("Stock reserved: {} units of {} for order {}", quantity, productId, orderId);

        return Map.of(
                "success", true,
                "reservationId", reservation.getId(),
                "message", "Stock reserved successfully"
        );
    }

    public Map<String, Object> releaseStock(String reservationId, String orderId) {
        Optional<StockReservation> reservationOpt = reservationRepository.findByOrderIdAndProductId(orderId, reservationId);
        if (reservationOpt.isEmpty()) {
            return Map.of("success", false, "message", "Reservation not found");
        }

        StockReservation reservation = reservationOpt.get();
        reservation.setStatus("RELEASED");
        reservationRepository.save(reservation);

        log.info("Stock released for reservation: {} order: {}", reservationId, orderId);
        return Map.of("success", true, "message", "Stock released successfully");
    }

    public Map<String, Object> getProduct(String productId) {
        Product product = productRepository.findBySku(productId)
                .or(() -> productRepository.findById(productId))
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        return Map.of(
                "id", product.getId(),
                "sku", product.getSku(),
                "name", product.getName(),
                "description", product.getDescription() != null ? product.getDescription() : "",
                "price", product.getPrice(),
                "category", product.getCategory() != null ? product.getCategory() : "",
                "stockQuantity", product.getStockQuantity(),
                "reorderThreshold", product.getReorderThreshold(),
                "active", product.getActive()
        );
    }

    public Map<String, Object> listProducts(String category, boolean activeOnly, int page, int pageSize) {
        List<Product> products;
        if (category != null && !category.isEmpty()) {
            products = productRepository.findByCategoryAndActiveTrue(category);
        } else if (activeOnly) {
            products = productRepository.findByActiveTrue();
        } else {
            products = productRepository.findAll();
        }

        int start = page * pageSize;
        int end = Math.min(start + pageSize, products.size());
        List<Product> paged = start < products.size() ? products.subList(start, end) : List.of();

        List<Map<String, Object>> productMaps = paged.stream().map(p -> Map.<String, Object>of(
                "id", p.getId(),
                "sku", p.getSku(),
                "name", p.getName(),
                "description", p.getDescription() != null ? p.getDescription() : "",
                "price", p.getPrice(),
                "category", p.getCategory() != null ? p.getCategory() : "",
                "stockQuantity", p.getStockQuantity(),
                "reorderThreshold", p.getReorderThreshold() != null ? p.getReorderThreshold() : 0,
                "active", p.getActive()
        )).collect(Collectors.toList());

        return Map.<String, Object>of(
                "products", productMaps,
                "totalCount", products.size(),
                "page", page,
                "pageSize", pageSize
        );
    }

    private int getReservedQuantity(String productId) {
        List<StockReservation> activeReservations =
                reservationRepository.findByProductIdAndStatus(productId, "RESERVED");
        return activeReservations.stream()
                .filter(r -> !r.isExpired())
                .mapToInt(StockReservation::getQuantity)
                .sum();
    }
}
