package com.intellops.billing.soap;

import com.intellops.billing.dto.PaymentDto;
import com.intellops.billing.entity.BillingAccount;
import com.intellops.billing.entity.Invoice;
import com.intellops.billing.exception.ResourceNotFoundException;
import com.intellops.billing.repository.BillingAccountRepository;
import com.intellops.billing.repository.InvoiceRepository;
import com.intellops.billing.service.BillingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.dom.DOMSource;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * SOAP Web Service Endpoint — simulates a legacy Oracle billing system.
 * <p>
 * Handles SOAP/XML payloads using DOM-based processing (no JAXB codegen required).
 * WSDL is auto-generated from billing.xsd at runtime.
 */
@Endpoint
@RequiredArgsConstructor
@Slf4j
public class BillingEndpoint {

    private static final String NAMESPACE_URI = "http://intellops.com/billing";

    private final BillingAccountRepository accountRepository;
    private final InvoiceRepository invoiceRepository;
    private final BillingService billingService;

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAccountDetailsRequest")
    @ResponsePayload
    public DOMSource getAccountDetails(@RequestPayload DOMSource request) {
        log.info("📞 SOAP: getAccountDetails called");
        try {
            String accountNumber = getElementText(request, "accountNumber");
            BillingAccount account = accountRepository.findByAccountNumber(accountNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("BillingAccount", "accountNumber", accountNumber));

            Document doc = createDocument();
            Element root = doc.createElementNS(NAMESPACE_URI, "getAccountDetailsResponse");
            doc.appendChild(root);

            addChild(doc, root, "accountNumber", account.getAccountNumber());
            addChild(doc, root, "customerName", account.getCustomerName());
            addChild(doc, root, "customerEmail", account.getCustomerEmail());
            addChild(doc, root, "status", account.getStatus().name());
            addChild(doc, root, "balance", account.getBalance().toPlainString());
            addChild(doc, root, "creditLimit", account.getCreditLimit().toPlainString());

            return new DOMSource(doc);
        } catch (Exception e) {
            log.error("SOAP error in getAccountDetails: {}", e.getMessage());
            return createErrorResponse("Account lookup failed: " + e.getMessage());
        }
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getInvoiceStatusRequest")
    @ResponsePayload
    public DOMSource getInvoiceStatus(@RequestPayload DOMSource request) {
        log.info("📞 SOAP: getInvoiceStatus called");
        try {
            String invoiceNumber = getElementText(request, "invoiceNumber");
            Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("Invoice", "invoiceNumber", invoiceNumber));

            Document doc = createDocument();
            Element root = doc.createElementNS(NAMESPACE_URI, "getInvoiceStatusResponse");
            doc.appendChild(root);

            addChild(doc, root, "invoiceNumber", invoice.getInvoiceNumber());
            addChild(doc, root, "orderNumber", invoice.getOrderNumber());
            addChild(doc, root, "status", invoice.getStatus());
            addChild(doc, root, "amount", invoice.getTotalAmount().toPlainString());
            addChild(doc, root, "paidAmount", invoice.getTotalAmount().toPlainString());
            addChild(doc, root, "dueDate", invoice.getDueDate().toString());
            addChild(doc, root, "customerEmail", invoice.getCustomerEmail());

            return new DOMSource(doc);
        } catch (Exception e) {
            log.error("SOAP error in getInvoiceStatus: {}", e.getMessage());
            return createErrorResponse("Invoice lookup failed: " + e.getMessage());
        }
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAccountBalanceRequest")
    @ResponsePayload
    public DOMSource getAccountBalance(@RequestPayload DOMSource request) {
        log.info("📞 SOAP: getAccountBalance called");
        try {
            String accountNumber = getElementText(request, "accountNumber");
            BillingAccount account = accountRepository.findByAccountNumber(accountNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("BillingAccount", "accountNumber", accountNumber));

            BigDecimal availableCredit = account.getCreditLimit().subtract(account.getBalance());
            if (availableCredit.compareTo(BigDecimal.ZERO) < 0) {
                availableCredit = BigDecimal.ZERO;
            }

            Document doc = createDocument();
            Element root = doc.createElementNS(NAMESPACE_URI, "getAccountBalanceResponse");
            doc.appendChild(root);

            addChild(doc, root, "accountNumber", account.getAccountNumber());
            addChild(doc, root, "balance", account.getBalance().toPlainString());
            addChild(doc, root, "creditLimit", account.getCreditLimit().toPlainString());
            addChild(doc, root, "availableCredit", availableCredit.toPlainString());
            addChild(doc, root, "status", account.getStatus().name());

            return new DOMSource(doc);
        } catch (Exception e) {
            log.error("SOAP error in getAccountBalance: {}", e.getMessage());
            return createErrorResponse("Balance lookup failed: " + e.getMessage());
        }
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "submitPaymentRequest")
    @ResponsePayload
    public DOMSource submitPayment(@RequestPayload DOMSource request) {
        log.info("📞 SOAP: submitPayment called");
        try {
            String invoiceNumber = getElementText(request, "invoiceNumber");
            BigDecimal amount = new BigDecimal(getElementText(request, "amount"));
            String paymentMethod = getElementText(request, "paymentMethod");
            String transactionId = getElementTextSafe(request, "transactionId");

            Invoice paidInvoice = billingService.processPayment(invoiceNumber, paymentMethod, transactionId);

            Document doc = createDocument();
            Element root = doc.createElementNS(NAMESPACE_URI, "submitPaymentResponse");
            doc.appendChild(root);

            addChild(doc, root, "success", "true");
            addChild(doc, root, "paymentRef", paidInvoice.getTransactionId() != null ? paidInvoice.getTransactionId()
                    : "SOAP-" + System.currentTimeMillis());
            addChild(doc, root, "message", "Payment processed successfully via legacy SOAP billing system");
            addChild(doc, root, "updatedBalance", paidInvoice.getTotalAmount().toPlainString());

            return new DOMSource(doc);
        } catch (Exception e) {
            log.error("SOAP error in submitPayment: {}", e.getMessage());
            Document doc = createDocument();
            Element root = doc.createElementNS(NAMESPACE_URI, "submitPaymentResponse");
            doc.appendChild(root);
            addChild(doc, root, "success", "false");
            addChild(doc, root, "paymentRef", "");
            addChild(doc, root, "message", "Payment failed: " + e.getMessage());
            addChild(doc, root, "updatedBalance", "0");
            return new DOMSource(doc);
        }
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getBillingHistoryRequest")
    @ResponsePayload
    public DOMSource getBillingHistory(@RequestPayload DOMSource request) {
        log.info("📞 SOAP: getBillingHistory called");
        try {
            String accountNumber = getElementText(request, "accountNumber");
            BillingAccount account = accountRepository.findByAccountNumber(accountNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("BillingAccount", "accountNumber", accountNumber));

            var invoices = invoiceRepository.findAll().stream()
                    .filter(inv -> account.getCustomerEmail().equals(inv.getCustomerEmail()))
                    .toList();

            Document doc = createDocument();
            Element root = doc.createElementNS(NAMESPACE_URI, "getBillingHistoryResponse");
            doc.appendChild(root);

            addChild(doc, root, "accountNumber", account.getAccountNumber());

            for (Invoice inv : invoices) {
                Element entry = doc.createElementNS(NAMESPACE_URI, "entries");
                root.appendChild(entry);

                addChild(doc, entry, "date", inv.getCreatedAt().toLocalDate().toString());
                addChild(doc, entry, "type", "INVOICE");
                addChild(doc, entry, "description", "Invoice " + inv.getInvoiceNumber());
                addChild(doc, entry, "reference", inv.getInvoiceNumber());
                addChild(doc, entry, "amount", inv.getTotalAmount().toPlainString());
            }

            return new DOMSource(doc);
        } catch (Exception e) {
            log.error("SOAP error in getBillingHistory: {}", e.getMessage());
            return createErrorResponse("Billing history lookup failed: " + e.getMessage());
        }
    }

    // ─── DOM Helpers ───────────────────────────────────────────────────────

    private String getElementText(DOMSource source, String tagName) {
        Element docElement = (Element) source.getNode();
        NodeList list = docElement.getElementsByTagNameNS(NAMESPACE_URI, tagName);
        if (list.getLength() == 0) {
            throw new IllegalArgumentException("Missing required field: " + tagName);
        }
        return list.item(0).getTextContent().trim();
    }

    private String getElementTextSafe(DOMSource source, String tagName) {
        try {
            return getElementText(source, tagName);
        } catch (Exception e) {
            return null;
        }
    }

    private void addChild(Document doc, Element parent, String tagName, String value) {
        Element child = doc.createElementNS(NAMESPACE_URI, tagName);
        child.setTextContent(value != null ? value : "");
        parent.appendChild(child);
    }

    private Document createDocument() {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.newDocument();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create XML document", e);
        }
    }

    private DOMSource createErrorResponse(String message) {
        Document doc = createDocument();
        Element root = doc.createElementNS(NAMESPACE_URI, "errorResponse");
        doc.appendChild(root);
        addChild(doc, root, "error", message);
        return new DOMSource(doc);
    }
}
