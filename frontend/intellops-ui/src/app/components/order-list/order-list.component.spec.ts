import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrderListComponent } from './order-list.component';
import { OrderService, Order, OrderPage } from '../../services/order.service';

describe('OrderListComponent', () => {
  let fixture: ComponentFixture<OrderListComponent>;
  let component: OrderListComponent;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;

  const mockOrder: Order = {
    id: 1,
    orderNumber: 'ORD-1001',
    customer: { id: 1, customerNumber: 'CUST-0001', name: 'Acme Corp', email: 'a@b.c', phone: '1' },
    status: 'ON_HOLD',
    totalAmount: 6803.97,
    taxAmount: 503.98,
    notes: '',
    lineItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockPage: OrderPage = { content: [mockOrder], totalElements: 1, totalPages: 1, size: 20, number: 0 };

  beforeEach(async () => {
    orderServiceSpy = jasmine.createSpyObj('OrderService', ['getOrders']);
    orderServiceSpy.getOrders.and.returnValue(of(mockPage));

    await TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: orderServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders on init', () => {
    fixture.detectChanges();
    expect(orderServiceSpy.getOrders).toHaveBeenCalledWith(0, 20, '');
    expect(component.orders.length).toBe(1);
  });

  it('should render orders with status badges and links', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
    expect(compiled.textContent).toContain('ORD-1001');
    expect(compiled.textContent).toContain('Acme Corp');
    expect(compiled.querySelector('a[href="/orders/ORD-1001"]')).toBeTruthy();
  });

  it('should reload with the search term', () => {
    fixture.detectChanges();
    component.search = 'ORD-10';
    component.loadOrders();
    expect(orderServiceSpy.getOrders).toHaveBeenCalledWith(0, 20, 'ORD-10');
  });

  it('should show the empty state when there are no orders', () => {
    orderServiceSpy.getOrders.and.returnValue(of({ ...mockPage, content: [] }));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No orders found');
  });
});
