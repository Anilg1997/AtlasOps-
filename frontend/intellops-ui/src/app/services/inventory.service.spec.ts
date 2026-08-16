import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InventoryService, InventoryProduct, InventoryResponse } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;

  const mockProduct: InventoryProduct = {
    id: 'p1',
    sku: 'SRV-RACK-42U',
    name: 'Server Rack 42U',
    description: '42U rack',
    price: 2499.99,
    category: 'Hardware',
    stockQuantity: 4,
    reorderThreshold: 10,
    active: true
  };

  const mockResponse: InventoryResponse = {
    products: [mockProduct],
    totalCount: 1,
    page: 0,
    pageSize: 20
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InventoryService]
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch products with default pagination', () => {
    service.getProducts().subscribe(res => {
      expect(res.products.length).toBe(1);
      expect(res.products[0].sku).toBe('SRV-RACK-42U');
    });

    const req = httpMock.expectOne('/api/v1/inventory/products?page=0&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should append the category param when provided', () => {
    service.getProducts('electronics', 2, 50).subscribe();

    const req = httpMock.expectOne('/api/v1/inventory/products?page=2&pageSize=50&category=electronics');
    req.flush(mockResponse);
  });

  it('should fetch a single product', () => {
    service.getProduct('p1').subscribe(product => {
      expect(product.id).toBe('p1');
    });

    const req = httpMock.expectOne('/api/v1/inventory/products/p1');
    expect(req.request.method).toBe('GET');
    req.flush(mockProduct);
  });

  it('should check stock with a quantity param', () => {
    service.checkStock('p1', 3).subscribe();

    const req = httpMock.expectOne('/api/v1/inventory/stock/p1?quantity=3');
    expect(req.request.method).toBe('GET');
    req.flush({ available: true });
  });

  it('should default the stock quantity to 1', () => {
    service.checkStock('p1').subscribe();

    const req = httpMock.expectOne('/api/v1/inventory/stock/p1?quantity=1');
    req.flush({ available: true });
  });
});
