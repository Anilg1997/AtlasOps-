import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InventoryComponent } from './inventory.component';
import { InventoryService, InventoryProduct } from '../../services/inventory.service';

describe('InventoryComponent', () => {
  let fixture: ComponentFixture<InventoryComponent>;
  let component: InventoryComponent;
  let inventoryServiceSpy: jasmine.SpyObj<InventoryService>;

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

  beforeEach(async () => {
    inventoryServiceSpy = jasmine.createSpyObj('InventoryService', ['getProducts']);
    inventoryServiceSpy.getProducts.and.returnValue(of({ products: [mockProduct], totalCount: 1, page: 0, pageSize: 20 }));

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [{ provide: InventoryService, useValue: inventoryServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    fixture.detectChanges();
    expect(inventoryServiceSpy.getProducts).toHaveBeenCalledWith(undefined);
    expect(component.products.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should render product cards with stock badges', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.product-card').length).toBe(1);
    expect(compiled.textContent).toContain('Server Rack 42U');
    expect(compiled.textContent).toContain('SRV-RACK-42U');
    expect(compiled.textContent).toContain('Low Stock');
  });

  it('should reload with the selected category', () => {
    fixture.detectChanges();
    component.selectedCategory = 'electronics';
    component.loadProducts();
    expect(inventoryServiceSpy.getProducts).toHaveBeenCalledWith('electronics');
  });

  it('should reset loading on error', () => {
    inventoryServiceSpy.getProducts.and.returnValue(throwError(() => new Error('boom')));
    component.loadProducts();
    expect(component.loading).toBeFalse();
    expect(component.products).toEqual([]);
  });

  it('should compute a capped stock percentage', () => {
    expect(component.getStockPercentage(mockProduct)).toBeLessThanOrEqual(100);
    const full: InventoryProduct = { ...mockProduct, stockQuantity: 1000, reorderThreshold: 5 };
    expect(component.getStockPercentage(full)).toBe(100);
  });

  it('should show the empty state when there are no products', () => {
    inventoryServiceSpy.getProducts.and.returnValue(of({ products: [], totalCount: 0, page: 0, pageSize: 20 }));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No products found');
  });
});
