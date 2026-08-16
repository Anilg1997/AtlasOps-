package com.intellops.billing.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intellops.billing.entity.Invoice;
import com.intellops.billing.repository.BillingAccountRepository;
import com.intellops.billing.repository.InvoiceRepository;
import com.intellops.billing.repository.PaymentRepository;
import com.intellops.billing.service.BillingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = BillingController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                DataSourceAutoConfiguration.class,
                HibernateJpaAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class BillingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BillingService billingService;

    @MockBean
    private InvoiceRepository invoiceRepository;

    @MockBean
    private BillingAccountRepository billingAccountRepository;

    @MockBean
    private PaymentRepository paymentRepository;

    @TestConfiguration
    static class JpaTestConfig {
        @Bean
        jakarta.persistence.EntityManagerFactory entityManagerFactory() {
            return org.mockito.Mockito.mock(jakarta.persistence.EntityManagerFactory.class);
        }
    }

    private Invoice sampleInvoice() {
        return Invoice.builder()
                .id(1L).invoiceNumber("INV-001").orderNumber("ORD-001")
                .customerName("John Doe").customerEmail("john@example.com")
                .totalAmount(new BigDecimal("162.00")).taxAmount(new BigDecimal("12.00"))
                .status("ISSUED").paymentStatus("PENDING")
                .issueDate(LocalDate.now()).dueDate(LocalDate.now().plusDays(30))
                .build();
    }

    @Test
    void createInvoice_shouldReturnInvoice() throws Exception {
        when(billingService.createInvoice(anyString(), anyString(), anyString(),
                org.mockito.ArgumentMatchers.any(BigDecimal.class),
                org.mockito.ArgumentMatchers.any(BigDecimal.class)))
                .thenReturn(sampleInvoice());

        mockMvc.perform(post("/api/v1/billing/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderNumber\":\"ORD-001\",\"customerName\":\"John Doe\",\"customerEmail\":\"john@example.com\",\"totalAmount\":150.00,\"taxAmount\":12.00}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceNumber").value("INV-001"))
                .andExpect(jsonPath("$.status").value("ISSUED"));
    }

    @Test
    void getInvoice_shouldReturnInvoice() throws Exception {
        when(billingService.getInvoice("INV-001")).thenReturn(Optional.of(sampleInvoice()));

        mockMvc.perform(get("/api/v1/billing/invoices/INV-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"));
    }

    @Test
    void getInvoice_withUnknownNumber_shouldReturnNotFound() throws Exception {
        when(billingService.getInvoice(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/billing/invoices/UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getInvoiceByOrder_shouldReturnInvoice() throws Exception {
        when(billingService.getInvoiceByOrder("ORD-001")).thenReturn(Optional.of(sampleInvoice()));

        mockMvc.perform(get("/api/v1/billing/invoices/order/ORD-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("ORD-001"));
    }

    @Test
    void getInvoiceByOrder_withUnknownOrder_shouldReturnNotFound() throws Exception {
        when(billingService.getInvoiceByOrder(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/billing/invoices/order/UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    void listInvoices_shouldReturnFilteredList() throws Exception {
        when(billingService.listInvoices("ISSUED")).thenReturn(List.of(sampleInvoice()));

        mockMvc.perform(get("/api/v1/billing/invoices").param("status", "ISSUED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].invoiceNumber").value("INV-001"));
    }

    @Test
    void processPayment_shouldReturnPaidInvoice() throws Exception {
        Invoice paid = sampleInvoice();
        paid.setPaymentStatus("PAID");
        paid.setStatus("PAID");
        when(billingService.processPayment("INV-001", "CREDIT_CARD", "TXN-123")).thenReturn(paid);

        mockMvc.perform(post("/api/v1/billing/invoices/INV-001/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethod\":\"CREDIT_CARD\",\"transactionId\":\"TXN-123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"));
    }

    @Test
    void getBillingStats_shouldReturnStats() throws Exception {
        when(billingService.getBillingStats()).thenReturn(Map.of(
                "totalInvoices", 100L,
                "pendingInvoices", 30L,
                "overdueInvoices", 5L,
                "paidInvoices", 65L));

        mockMvc.perform(get("/api/v1/billing/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalInvoices").value(100));
    }
}
