import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

@Component({ selector: 'stub-order-detail', template: '' })
class StubOrderDetailComponent {}
import { of, throwError } from 'rxjs';
import { OrderCreateComponent } from './order-create.component';
import { OrderService, Order, CustomerDto, LineItemDto, ProductDto } from '../../services/order.service';
import { ToastService } from '../../services/notification/toast.service';

describe('OrderCreateComponent', () => {
  let fixture: ComponentFixture<OrderCreateComponent>;
  let component: OrderCreateComponent;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;
  let toastService: ToastService;
  let router: Router;

  const mockCustomer: CustomerDto = {
    id: 1,
    customerNumber: 'CUST-0001',
    name: 'Acme Corp',
    email: 'acme@example.com',
    phone: '555-0100'
  };

  const mockProduct: ProductDto = {
    id: 10,
    sku: 'SRV-RACK-42U',
    name: 'Server Rack 42U',
    description: '42U rack',
    price: 2499.99,
    category: 'Hardware'
  };

  const mockLineItem: LineItemDto = {
    id: 1,
    product: mockProduct,
    quantity: 2,
    unitPrice: 2499.99,
    subtotal: 4999.98
  };

  const mockOrder: Order = {
    id: 100,
    orderNumber: 'ORD-1007',
    customer: mockCustomer,
    status: 'PENDING',
    totalAmount: 4999.98,
    taxAmount: 370.37,
    notes: 'Demo order',
    lineItems: [mockLineItem],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    orderServiceSpy = jasmine.createSpyObj('OrderService', ['createOrder', 'getOrders', 'getOrder', 'updateStatus', 'getStats']);

    await TestBed.configureTestingModule({
      imports: [OrderCreateComponent],
      providers: [
        provideRouter([{ path: 'orders/:orderNumber', component: StubOrderDetailComponent }]),
        { provide: OrderService, useValue: orderServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderCreateComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with one empty line item', () => {
    expect(component.lineItems.length).toBe(1);
    expect(component.lineItems[0].productId).toBeNull();
  });

  it('should add and remove line items', () => {
    component.addItem();
    expect(component.lineItems.length).toBe(2);

    component.removeItem(0);
    expect(component.lineItems.length).toBe(1);
  });

  it('should not allow removing the last line item', () => {
    component.removeItem(0);
    expect(component.lineItems.length).toBe(1);
  });

  it('should create an order, show a success toast, and navigate to the order', () => {
    const navigateSpy = spyOn(router, 'navigate');
    orderServiceSpy.createOrder.and.returnValue(of(mockOrder));
    const toastSpy = spyOn(toastService, 'success');

    component.customerId = 1;
    component.lineItems = [{ productId: 10, quantity: 2 }];
    component.notes = 'Demo order';
    component.onSubmit();

    expect(orderServiceSpy.createOrder).toHaveBeenCalledWith({
      customerId: 1,
      lineItems: [{ productId: 10, quantity: 2 }],
      notes: 'Demo order'
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/orders', 'ORD-1007']);
    expect(component.loading).toBeFalse();
    expect(toastSpy).toHaveBeenCalledWith('Order created', jasmine.stringMatching(/ORD-1007/));
  });

  it('should skip line items without a product id', () => {
    orderServiceSpy.createOrder.and.returnValue(of(mockOrder));

    component.customerId = 1;
    component.lineItems = [
      { productId: 10, quantity: 2 },
      { productId: null, quantity: 1 }
    ];
    component.onSubmit();

    expect(orderServiceSpy.createOrder).toHaveBeenCalledWith({
      customerId: 1,
      lineItems: [{ productId: 10, quantity: 2 }],
      notes: ''
    });
  });

  it('should surface the error and show an error toast on failure', () => {
    const navigateSpy = spyOn(router, 'navigate');
    orderServiceSpy.createOrder.and.returnValue(throwError(() => ({ error: { message: 'Insufficient stock' } })));
    const toastSpy = spyOn(toastService, 'error');

    component.onSubmit();

    expect(component.error).toBe('Insufficient stock');
    expect(component.loading).toBeFalse();
    expect(toastSpy).toHaveBeenCalledWith('Order creation failed', 'Insufficient stock');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should fall back to a generic error message', () => {
    orderServiceSpy.createOrder.and.returnValue(throwError(() => ({})));
    const toastSpy = spyOn(toastService, 'error');

    component.onSubmit();

    expect(component.error).toBe('Failed to create order');
    expect(toastSpy).toHaveBeenCalledWith('Order creation failed', 'Failed to create order');
  });
});
