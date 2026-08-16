import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrderDetailComponent } from './order-detail.component';
import { OrderService, Order } from '../../services/order.service';

describe('OrderDetailComponent', () => {
  let fixture: ComponentFixture<OrderDetailComponent>;
  let component: OrderDetailComponent;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;

  const mockOrder: Order = {
    id: 1,
    orderNumber: 'ORD-1001',
    customer: { id: 1, customerNumber: 'CUST-0001', name: 'Acme Corp', email: 'a@b.c', phone: '1' },
    status: 'ON_HOLD',
    totalAmount: 6803.97,
    taxAmount: 503.98,
    notes: 'Held for restock',
    lineItems: [
      {
        id: 1,
        product: { id: 10, sku: 'SRV-RACK-42U', name: 'Server Rack 42U', description: '42U', price: 2499.99, category: 'Hardware' },
        quantity: 2,
        unitPrice: 2499.99,
        subtotal: 4999.98
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    orderServiceSpy = jasmine.createSpyObj('OrderService', ['getOrder']);
    orderServiceSpy.getOrder.and.returnValue(of(mockOrder));

    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['orderNumber', 'ORD-1001']]) } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the order from the route param on init', () => {
    fixture.detectChanges();
    expect(orderServiceSpy.getOrder).toHaveBeenCalledWith('ORD-1001');
    expect(component.order?.orderNumber).toBe('ORD-1001');
  });

  it('should render customer, financials, and line items', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Acme Corp');
    expect(compiled.textContent).toContain('ON_HOLD');
    expect(compiled.textContent).toContain('Server Rack 42U');
    expect(compiled.textContent).toContain('SRV-RACK-42U');
    expect(compiled.textContent).toContain('Held for restock');
  });

  it('should render nothing when the route has no order number', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } }
      ]
    });
    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(orderServiceSpy.getOrder).not.toHaveBeenCalled();
    expect(component.order).toBeNull();
  });
});
