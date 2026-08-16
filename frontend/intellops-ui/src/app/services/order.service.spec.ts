import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService, Order, CustomerDto, LineItemDto, ProductDto } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch orders with page and size params', () => {
    const page = { content: [mockOrder], totalElements: 1, totalPages: 1, size: 20, number: 0 };
    service.getOrders(0, 20).subscribe(res => {
      expect(res.content.length).toBe(1);
      expect(res.content[0].orderNumber).toBe('ORD-1007');
    });

    const req = httpMock.expectOne(req => req.url === '/api/v1/orders' && req.method === 'GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.has('search')).toBeFalse();
    req.flush(page);
  });

  it('should include the search param when provided', () => {
    service.getOrders(1, 10, 'ORD-10').subscribe();

    const req = httpMock.expectOne(r => r.url === '/api/v1/orders' && r.method === 'GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('search')).toBe('ORD-10');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 1 });
  });

  it('should fetch a single order by order number', () => {
    service.getOrder('ORD-1007').subscribe(order => {
      expect(order.orderNumber).toBe('ORD-1007');
    });

    const req = httpMock.expectOne('/api/v1/orders/ORD-1007');
    expect(req.request.method).toBe('GET');
    req.flush(mockOrder);
  });

  it('should create an order via POST', () => {
    const payload = { customerId: 1, lineItems: [{ productId: 10, quantity: 2 }], notes: 'x' };
    service.createOrder(payload).subscribe(order => {
      expect(order.id).toBe(100);
    });

    const req = httpMock.expectOne('/api/v1/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockOrder);
  });

  it('should update order status via PATCH', () => {
    service.updateStatus('ORD-1007', 'SHIPPED').subscribe(order => {
      expect(order.status).toBe('PENDING');
    });

    const req = httpMock.expectOne('/api/v1/orders/ORD-1007/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'SHIPPED' });
    req.flush(mockOrder);
  });

  it('should fetch order stats', () => {
    const stats = { totalOrders: 10, totalRevenue: 1000, pendingOrders: 2, deliveredOrders: 8 };
    service.getStats().subscribe(result => {
      expect(result).toEqual(stats);
    });

    const req = httpMock.expectOne('/api/v1/orders/stats');
    expect(req.request.method).toBe('GET');
    req.flush(stats);
  });
});
