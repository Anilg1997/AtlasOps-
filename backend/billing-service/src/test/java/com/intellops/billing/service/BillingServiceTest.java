package com.intellops.billing.service;

import com.intellops.billing.entity.Invoice;
import com.intellops.billing.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    private BillingService billingService;

    @BeforeEach
    void setUp() {
        billingService = new BillingService(invoiceRepository);
    }

    @Test
    void createInvoice_shouldReturnInvoice() {
        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-20260630-ABC123")
                .orderNumber("ORD-001")
                .customerName("John Doe")
                .customerEmail("john@example.com")
                .totalAmount(BigDecimal.valueOf(1500.00))
                .taxAmount(BigDecimal.valueOf(150.00))
                .status("ISSUED")
                .paymentStatus("PENDING")
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .build();

        when(invoiceRepository.save(any())).thenReturn(invoice);

        Invoice result = billingService.createInvoice("ORD-001", "John Doe", "john@example.com",
                BigDecimal.valueOf(1500.00), BigDecimal.valueOf(150.00));

        assertThat(result.getInvoiceNumber()).contains("INV-");
        assertThat(result.getStatus()).isEqualTo("ISSUED");
        assertThat(result.getPaymentStatus()).isEqualTo("PENDING");
    }

    @Test
    void getInvoice_shouldReturnInvoice() {
        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-001")
                .status("PAID")
                .paymentStatus("PAID")
                .totalAmount(BigDecimal.valueOf(500.00))
                .paidDate(LocalDate.now())
                .build();

        when(invoiceRepository.findByInvoiceNumber("INV-001")).thenReturn(Optional.of(invoice));

        var result = billingService.getInvoice("INV-001");

        assertThat(result).isPresent();
        assertThat(result.get().getInvoiceNumber()).isEqualTo("INV-001");
        assertThat(result.get().getStatus()).isEqualTo("PAID");
    }

    @Test
    void getInvoice_withUnknownNumber_shouldReturnEmpty() {
        when(invoiceRepository.findByInvoiceNumber(anyString())).thenReturn(Optional.empty());

        var result = billingService.getInvoice("UNKNOWN");

        assertThat(result).isEmpty();
    }

    @Test
    void listInvoices_withStatus_shouldFilter() {
        Invoice invoice = Invoice.builder().invoiceNumber("INV-001").status("ISSUED").build();
        when(invoiceRepository.findByStatus("ISSUED")).thenReturn(List.of(invoice));

        var invoices = billingService.listInvoices("ISSUED");

        assertThat(invoices).hasSize(1);
    }

    @Test
    void processPayment_shouldUpdateInvoice() {
        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-001")
                .status("ISSUED")
                .paymentStatus("PENDING")
                .build();

        when(invoiceRepository.findByInvoiceNumber("INV-001")).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any())).thenReturn(invoice);

        Invoice result = billingService.processPayment("INV-001", "CREDIT_CARD", "TXN-123");

        assertThat(result.getPaymentStatus()).isEqualTo("PAID");
        assertThat(result.getStatus()).isEqualTo("PAID");
        assertThat(result.getPaymentMethod()).isEqualTo("CREDIT_CARD");
        assertThat(result.getTransactionId()).isEqualTo("TXN-123");
    }

    @Test
    void processPayment_withUnknownInvoice_shouldThrow() {
        when(invoiceRepository.findByInvoiceNumber(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.processPayment("UNKNOWN", "CASH", "N/A"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void getBillingStats_shouldReturnCounts() {
        when(invoiceRepository.countAll()).thenReturn(100L);
        when(invoiceRepository.countPending()).thenReturn(30L);
        when(invoiceRepository.countOverdue()).thenReturn(5L);
        when(invoiceRepository.countPaid()).thenReturn(65L);

        var stats = billingService.getBillingStats();

        assertThat(stats.get("totalInvoices")).isEqualTo(100L);
        assertThat(stats.get("pendingInvoices")).isEqualTo(30L);
        assertThat(stats.get("overdueInvoices")).isEqualTo(5L);
        assertThat(stats.get("paidInvoices")).isEqualTo(65L);
    }
}
