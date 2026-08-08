package com.intellops.billing.config;

import com.intellops.billing.entity.BillingAccount;
import com.intellops.billing.entity.Invoice;
import com.intellops.billing.entity.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class BillingEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishInvoiceCreated(Invoice invoice, BillingAccount account) {
        var event = Map.of(
                "eventType", "INVOICE_CREATED",
                "invoiceNumber", invoice.getInvoiceNumber(),
                "orderNumber", invoice.getOrderNumber(),
                "accountNumber", account.getAccountNumber(),
                "customerEmail", account.getCustomerEmail(),
                "amount", invoice.getTotalAmount(),
                "dueDate", invoice.getDueDate().toString(),
                "status", invoice.getStatus(),
                "timestamp", LocalDateTime.now().toString()
        );
        kafkaTemplate.send(KafkaConfig.INVOICE_CREATED_TOPIC, invoice.getInvoiceNumber(), event);
        log.info("📄 Published invoice.created event for invoice: {}", invoice.getInvoiceNumber());
    }

    public void publishInvoicePaid(Invoice invoice, Payment payment, BillingAccount account) {
        var event = Map.of(
                "eventType", "INVOICE_PAID",
                "invoiceNumber", invoice.getInvoiceNumber(),
                "orderNumber", invoice.getOrderNumber(),
                "accountNumber", account.getAccountNumber(),
                "paymentRef", payment.getPaymentRef(),
                "amount", payment.getAmount(),
                "paymentMethod", payment.getPaymentMethod(),
                "timestamp", LocalDateTime.now().toString()
        );
        kafkaTemplate.send(KafkaConfig.INVOICE_PAID_TOPIC, invoice.getInvoiceNumber(), event);
        log.info("💰 Published invoice.paid event for invoice: {}", invoice.getInvoiceNumber());
    }

    public void publishPaymentReceived(Payment payment, Invoice invoice, BillingAccount account) {
        var event = Map.of(
                "eventType", "PAYMENT_RECEIVED",
                "paymentRef", payment.getPaymentRef(),
                "invoiceNumber", payment.getInvoiceNumber(),
                "accountNumber", account.getAccountNumber(),
                "amount", payment.getAmount(),
                "paymentMethod", payment.getPaymentMethod(),
                "transactionId", payment.getTransactionId(),
                "timestamp", LocalDateTime.now().toString()
        );
        kafkaTemplate.send(KafkaConfig.PAYMENT_RECEIVED_TOPIC, payment.getPaymentRef(), event);
        log.info("💳 Published payment.received event: {}", payment.getPaymentRef());
    }
}
