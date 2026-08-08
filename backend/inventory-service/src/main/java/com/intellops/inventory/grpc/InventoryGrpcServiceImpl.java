package com.intellops.inventory.grpc;

import com.intellops.inventory.service.InventoryService;
import com.intellops.proto.inventory.*;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;
import java.util.Map;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class InventoryGrpcServiceImpl extends InventoryGrpcServiceGrpc.InventoryGrpcServiceImplBase {

    private final InventoryService inventoryService;

    @Override
    public void checkStock(StockCheckRequest request, StreamObserver<StockCheckResponse> responseObserver) {
        log.info("gRPC checkStock: product={}, quantity={}", request.getProductId(), request.getRequestedQuantity());

        try {
            Map<String, Object> result = inventoryService.checkStock(request.getProductId(), request.getRequestedQuantity());

            StockCheckResponse response = StockCheckResponse.newBuilder()
                    .setInStock((Boolean) result.get("inStock"))
                    .setAvailableQuantity((Integer) result.get("availableQuantity"))
                    .setReservedQuantity((Integer) result.get("reservedQuantity"))
                    .setReorderStatus((String) result.get("reorderStatus"))
                    .setEstimatedRestockDate((String) result.get("estimatedRestockDate"))
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC checkStock failed: {}", e.getMessage());
            responseObserver.onError(e);
        }
    }

    @Override
    public void reserveStock(StockReserveRequest request, StreamObserver<StockReserveResponse> responseObserver) {
        log.info("gRPC reserveStock: order={}, product={}, quantity={}",
                request.getOrderId(), request.getProductId(), request.getQuantity());

        try {
            Map<String, Object> result = inventoryService.reserveStock(
                    request.getOrderId(),
                    request.getProductId(),
                    request.getQuantity(),
                    request.getReservationTtlMinutes()
            );

            StockReserveResponse response = StockReserveResponse.newBuilder()
                    .setSuccess((Boolean) result.get("success"))
                    .setReservationId((String) result.get("reservationId"))
                    .setMessage((String) result.get("message"))
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC reserveStock failed: {}", e.getMessage());
            responseObserver.onError(e);
        }
    }

    @Override
    public void releaseStock(StockReleaseRequest request, StreamObserver<StockReleaseResponse> responseObserver) {
        log.info("gRPC releaseStock: reservation={}, order={}", request.getReservationId(), request.getOrderId());

        try {
            Map<String, Object> result = inventoryService.releaseStock(
                    request.getReservationId(),
                    request.getOrderId()
            );

            StockReleaseResponse response = StockReleaseResponse.newBuilder()
                    .setSuccess((Boolean) result.get("success"))
                    .setMessage((String) result.get("message"))
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC releaseStock failed: {}", e.getMessage());
            responseObserver.onError(e);
        }
    }

    @Override
    public void getProduct(GetProductRequest request, StreamObserver<GetProductResponse> responseObserver) {
        log.info("gRPC getProduct: {}", request.getProductId());

        try {
            Map<String, Object> product = inventoryService.getProduct(request.getProductId());

            GetProductResponse response = GetProductResponse.newBuilder()
                    .setId((String) product.get("id"))
                    .setSku((String) product.get("sku"))
                    .setName((String) product.get("name"))
                    .setDescription((String) product.get("description"))
                    .setPrice(((Number) product.get("price")).doubleValue())
                    .setCategory((String) product.get("category"))
                    .setStockQuantity((Integer) product.get("stockQuantity"))
                    .setReorderThreshold((Integer) product.get("reorderThreshold"))
                    .setActive((Boolean) product.get("active"))
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC getProduct failed: {}", e.getMessage());
            responseObserver.onError(e);
        }
    }

    @Override
    public void listProducts(ListProductsRequest request, StreamObserver<ListProductsResponse> responseObserver) {
        log.info("gRPC listProducts: category={}, page={}", request.getCategory(), request.getPage());

        try {
            Map<String, Object> result = inventoryService.listProducts(
                    request.getCategory(),
                    request.getActiveOnly(),
                    request.getPage(),
                    request.getPageSize()
            );

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> products = (List<Map<String, Object>>) result.get("products");

            ListProductsResponse.Builder responseBuilder = ListProductsResponse.newBuilder()
                    .setTotalCount((Integer) result.get("totalCount"))
                    .setPage((Integer) result.get("page"))
                    .setPageSize((Integer) result.get("pageSize"));

            for (Map<String, Object> p : products) {
                responseBuilder.addProducts(GetProductResponse.newBuilder()
                        .setId((String) p.get("id"))
                        .setSku((String) p.get("sku"))
                        .setName((String) p.get("name"))
                        .setDescription((String) p.get("description"))
                        .setPrice(((Number) p.get("price")).doubleValue())
                        .setCategory((String) p.get("category"))
                        .setStockQuantity((Integer) p.get("stockQuantity"))
                        .setReorderThreshold((Integer) p.get("reorderThreshold"))
                        .setActive((Boolean) p.get("active"))
                        .build());
            }

            responseObserver.onNext(responseBuilder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC listProducts failed: {}", e.getMessage());
            responseObserver.onError(e);
        }
    }
}
