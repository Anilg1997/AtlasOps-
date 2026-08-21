import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryProduct } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-boxes-stacked"></i> Inventory</h1>
          <p>Product catalog and stock management</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filter-card">
        <div class="toolbar">
          <select class="form-control" [(ngModel)]="selectedCategory" (change)="loadProducts()" style="max-width: 200px;">
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
            <option value="accessories">Accessories</option>
            <option value="services">Services</option>
          </select>
          <span class="result-count">{{ products.length }} product(s)</span>
        </div>
      </div>

      <!-- Product Grid -->
      <div class="products-grid">
        <div class="product-card" *ngFor="let product of products">
          <div class="product-header">
            <div class="product-icon" [ngClass]="getCategoryClass(product.category)">
              <i class="fas" [ngClass]="getCategoryIcon(product.category)"></i>
            </div>
            <span class="stock-badge" [ngClass]="getStockClass(product)">
              {{ getStockLabel(product) }}
            </span>
          </div>
          <h3>{{ product.name }}</h3>
          <p class="sku">{{ product.sku }}</p>
          <p class="description">{{ product.description }}</p>
          <div class="product-footer">
            <span class="price">\${{ product.price | number:'1.2-2' }}</span>
            <div class="stock-info">
              <span class="stock-qty">Stock: {{ product.stockQuantity }}</span>
              <span class="reorder">Reorder at: {{ product.reorderThreshold }}</span>
            </div>
          </div>
          <div class="stock-bar">
            <div class="stock-fill" [style.width.%]="getStockPercentage(product)" [ngClass]="getStockBarClass(product)"></div>
          </div>
        </div>
      </div>

      <p class="empty-state" *ngIf="!products.length && !loading">No products found</p>
    </div>
  `,
  styles: [`
    .filter-card { padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
    .toolbar { display: flex; align-items: center; gap: 0.75rem; }
    .result-count { font-size: 0.8125rem; color: var(--gray-500); margin-left: auto; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
    .product-card {
      background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow); padding: 1.5rem;
      border: 1px solid var(--gray-100); transition: all 0.2s;
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
      h3 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.25rem; color: var(--gray-900); }
      .sku { font-size: 0.8125rem; color: var(--gray-400); font-family: monospace; }
      .description { font-size: 0.875rem; color: var(--gray-600); margin: 0.5rem 0; line-height: 1.5; }
    }
    .product-header { display: flex; justify-content: space-between; align-items: center; }
    .product-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
    .product-icon.electronics { background: #dbeafe; color: #2563eb; }
    .product-icon.furniture { background: #fef3c7; color: #d97706; }
    .product-icon.accessories { background: #ede9fe; color: #7c3aed; }
    .product-icon.services { background: #d1fae5; color: #059669; }
    .stock-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .stock-badge.in-stock { background: #d1fae5; color: #065f46; }
    .stock-badge.low-stock { background: #fef3c7; color: #92400e; }
    .stock-badge.critical { background: #fee2e2; color: #991b1b; }
    .product-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--gray-100); }
    .price { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    .stock-info { text-align: right; display: flex; flex-direction: column; gap: 0.125rem; }
    .stock-qty { font-size: 0.8125rem; color: var(--gray-600); font-weight: 500; }
    .reorder { font-size: 0.75rem; color: var(--gray-400); }
    .stock-bar { height: 4px; background: var(--gray-100); border-radius: 2px; margin-top: 0.75rem; overflow: hidden; }
    .stock-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
    .stock-fill.good { background: var(--success); }
    .stock-fill.warning { background: var(--warning); }
    .stock-fill.critical { background: var(--danger); }
    .empty-state { text-align: center; padding: 3rem; color: var(--gray-400); }
  `]
})
export class InventoryComponent implements OnInit {
  products: InventoryProduct[] = [];
  selectedCategory = '';
  loading = false;

  constructor(private inventoryService: InventoryService) {}
  ngOnInit() { this.loadProducts(); }

  loadProducts() {
    this.loading = true;
    this.inventoryService.getProducts(this.selectedCategory || undefined).subscribe({
      next: (res) => { this.products = res.products || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = { electronics: 'fa-microchip', furniture: 'fa-chair', accessories: 'fa-plug', services: 'fa-headset' };
    return icons[cat] || 'fa-box';
  }
  getCategoryClass(cat: string): string { return cat; }

  getStockClass(product: InventoryProduct): string {
    if (product.stockQuantity <= product.reorderThreshold * 0.5) return 'critical';
    if (product.stockQuantity <= product.reorderThreshold) return 'low-stock';
    return 'in-stock';
  }
  getStockLabel(product: InventoryProduct): string {
    if (product.stockQuantity <= product.reorderThreshold * 0.5) return 'Critical';
    if (product.stockQuantity <= product.reorderThreshold) return 'Low Stock';
    return 'In Stock';
  }
  getStockPercentage(product: InventoryProduct): number {
    const max = Math.max(product.reorderThreshold * 3, product.stockQuantity, 1);
    return Math.min((product.stockQuantity / max) * 100, 100);
  }
  getStockBarClass(product: InventoryProduct): string {
    if (product.stockQuantity <= product.reorderThreshold * 0.5) return 'critical';
    if (product.stockQuantity <= product.reorderThreshold) return 'warning';
    return 'good';
  }
}
