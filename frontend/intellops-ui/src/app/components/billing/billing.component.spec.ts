import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BillingComponent } from './billing.component';

describe('BillingComponent', () => {
  let fixture: ComponentFixture<BillingComponent>;
  let component: BillingComponent;
  let httpMock: HttpTestingController;

  const mockStats = { totalInvoices: 10, pendingInvoices: 3, overdueInvoices: 1, paidInvoices: 6 };
  const mockInvoices = [
    { invoiceNumber: 'INV-1001', orderNumber: 'ORD-1001', customerName: 'Acme Corp', totalAmount: 499.99, status: 'OPEN', paymentStatus: 'PENDING', dueDate: '2026-09-01' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats and invoices on init', () => {
    fixture.detectChanges();

    httpMock.expectOne('/api/v1/billing/stats').flush(mockStats);
    httpMock.expectOne('/api/v1/billing/invoices').flush(mockInvoices);

    expect(component.stats.totalInvoices).toBe(10);
    expect(component.invoices.length).toBe(1);
  });

  it('should render invoice rows and stats', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/billing/stats').flush(mockStats);
    httpMock.expectOne('/api/v1/billing/invoices').flush(mockInvoices);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('INV-1001');
    expect(compiled.textContent).toContain('Acme Corp');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('should guard against a non-array invoices response', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/billing/stats').flush(mockStats);
    httpMock.expectOne('/api/v1/billing/invoices').flush({ data: [] });

    expect(component.invoices).toEqual([]);
  });

  it('should show the empty state when there are no invoices', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/billing/stats').flush(mockStats);
    httpMock.expectOne('/api/v1/billing/invoices').flush([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No invoices found');
  });
});
