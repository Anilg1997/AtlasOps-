import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BillingService, Invoice } from './billing.service';

describe('BillingService', () => {
  let service: BillingService;
  let httpMock: HttpTestingController;

  const mockInvoice: Invoice = {
    id: 1,
    invoiceNumber: 'INV-1001',
    orderNumber: 'ORD-1001',
    customerName: 'Acme Corp',
    totalAmount: 499.99,
    taxAmount: 40.99,
    status: 'OPEN',
    paymentStatus: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    transactionId: 'TXN-0001',
    issueDate: '2026-08-01',
    dueDate: '2026-09-01',
    paidDate: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BillingService]
    });
    service = TestBed.inject(BillingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch invoices without a status param', () => {
    service.getInvoices().subscribe(invoices => {
      expect(invoices.length).toBe(1);
      expect(invoices[0].invoiceNumber).toBe('INV-1001');
    });

    const req = httpMock.expectOne('/api/v1/billing/invoices');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('status')).toBeFalse();
    req.flush([mockInvoice]);
  });

  it('should append the status param when provided', () => {
    service.getInvoices('PENDING').subscribe();

    const req = httpMock.expectOne('/api/v1/billing/invoices?status=PENDING');
    expect(req.request.method).toBe('GET');
    req.flush([mockInvoice]);
  });

  it('should fetch a single invoice by invoice number', () => {
    service.getInvoice('INV-1001').subscribe(invoice => {
      expect(invoice.id).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/billing/invoices/INV-1001');
    expect(req.request.method).toBe('GET');
    req.flush(mockInvoice);
  });

  it('should fetch an invoice by order number', () => {
    service.getInvoiceByOrder('ORD-1001').subscribe(invoice => {
      expect(invoice.orderNumber).toBe('ORD-1001');
    });

    const req = httpMock.expectOne('/api/v1/billing/invoices/order/ORD-1001');
    expect(req.request.method).toBe('GET');
    req.flush(mockInvoice);
  });

  it('should fetch billing stats', () => {
    const stats = { totalInvoices: 10, pendingInvoices: 3, overdueInvoices: 1, paidInvoices: 6 };
    service.getStats().subscribe(result => {
      expect(result).toEqual(stats);
    });

    const req = httpMock.expectOne('/api/v1/billing/stats');
    expect(req.request.method).toBe('GET');
    req.flush(stats);
  });

  it('should process a payment via POST', () => {
    service.processPayment('INV-1001', 'BANK_TRANSFER', 'TXN-9999').subscribe(invoice => {
      expect(invoice.paymentStatus).toBe('PENDING');
    });

    const req = httpMock.expectOne('/api/v1/billing/invoices/INV-1001/pay');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ paymentMethod: 'BANK_TRANSFER', transactionId: 'TXN-9999' });
    req.flush(mockInvoice);
  });
});
