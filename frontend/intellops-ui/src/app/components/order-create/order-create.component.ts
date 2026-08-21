import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { InventoryService, InventoryProduct } from '../../services/inventory.service';
import { ToastService } from '../../services/notification/toast.service';

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page animate-fadeIn">
      <div class="page-header">
        <div>
          <a routerLink="/orders" class="back-link"><i class="fas fa-arrow-left"></i> Back to Orders</a>
          <h1><i class="fas fa-plus-circle"></i> Create Order</h1>
        </div>
      </div>

      <div class="create-grid">
        <div class="card form-card">
          <form (ngSubmit)="onSubmit()">
            <div class="section">
              <h3><i class="fas fa-building"></i> Customer</h3>
              <div class="form-group">
                <label>Customer ID</label>
                <select class="form-control" [(ngModel)]="customerId" name="customerId">
                  <option [ngValue]="null" disabled>Select customer...</option>
                  <option [ngValue]="1">CUST-0001 — Acme Corporation</option>
                  <option [ngValue]="2">CUST-0002 — Globex Industries</option>
                  <option [ngValue]="3">CUST-0003 — Initech Solutions</option>
                  <option [ngValue]="4">CUST-0004 — Stark Industries</option>
                  <option [ngValue]="5">CUST-0005 — Wayne Enterprises</option>
                  <option [ngValue]="6">CUST-0006 — Umbrella Corp</option>
                  <option [ngValue]="7">CUST-0007 — Cyberdyne Systems</option>
                  <option [ngValue]="8">CUST-0008 — Oscorp Technologies</option>
                </select>
              </div>
            </div>

            <div class="section">
              <h3><i class="fas fa-box"></i> Line Items</h3>
              <div class="line-items">
                <div class="line-item" *ngFor="let item of lineItems; let i = index; trackBy: trackByIndex">
                  <div class="form-group" style="flex: 2;">
                    <label>Product</label>
                    <select class="form-control" [(ngModel)]="item.productId" [name]="'product' + i">
                      <option [ngValue]="null" disabled>Select product...</option>
                      <option *ngFor="let p of products" [ngValue]="p.id">{{ p.sku }} — {{ p.name }} (\${{ p.price | number:'1.2-2' }})</option>
                    </select>
                  </div>
                  <div class="form-group" style="flex: 1;">
                    <label>Quantity</label>
                    <input type="number" class="form-control" [(ngModel)]="item.quantity" [name]="'qty' + i" min="1" max="9999">
                  </div>
                  <div class="line-item-total">
                    \${{ getItemTotal(item) | number:'1.2-2' }}
                  </div>
                  <button type="button" class="btn btn-sm btn-danger remove-btn" (click)="removeItem(i)" *ngIf="lineItems.length > 1">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" (click)="addItem()"><i class="fas fa-plus"></i> Add Line Item</button>
            </div>

            <div class="section">
              <h3><i class="fas fa-sticky-note"></i> Notes</h3>
              <div class="form-group">
                <textarea class="form-control" [(ngModel)]="notes" name="notes" rows="3" placeholder="Optional order notes..."></textarea>
              </div>
            </div>

            <div class="error-message" *ngIf="error">{{ error }}</div>

            <div class="form-actions">
              <a routerLink="/orders" class="btn btn-secondary">Cancel</a>
              <button type="submit" class="btn btn-primary" [disabled]="loading || !customerId">
                <span class="spinner" *ngIf="loading"></span>
                <span *ngIf="!loading"><i class="fas fa-check"></i> Create Order</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Order Summary -->
        <div class="card summary-card">
          <h3><i class="fas fa-receipt"></i> Order Summary</h3>
          <div class="summary-rows">
            <div class="summary-row"><span>Items</span><span>{{ getItemCount() }}</span></div>
            <div class="summary-row"><span>Subtotal</span><span>\${{ getSubtotal() | number:'1.2-2' }}</span></div>
            <div class="summary-row"><span>Tax (7.41%)</span><span>\${{ getTax() | number:'1.2-2' }}</span></div>
            <div class="summary-row total"><span>Total</span><span>\${{ getTotal() | number:'1.2-2' }}</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-link { font-size: 0.8125rem; color: var(--gray-500); display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.5rem; }
    .back-link:hover { color: var(--primary); text-decoration: none; }
    .create-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start; }
    @media (max-width: 900px) { .create-grid { grid-template-columns: 1fr; } }
    .section { margin-bottom: 1.5rem; }
    .section h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .line-items { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .line-item { display: flex; align-items: flex-end; gap: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); }
    .line-item-total { font-weight: 600; color: var(--gray-900); white-space: nowrap; padding-bottom: 0.625rem; }
    .remove-btn { flex-shrink: 0; }
    .summary-card { position: sticky; top: 80px; }
    .summary-card h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .summary-rows { display: flex; flex-direction: column; gap: 0.5rem; }
    .summary-row { display: flex; justify-content: space-between; font-size: 0.875rem; padding: 0.375rem 0; border-bottom: 1px solid var(--gray-100); }
    .summary-row.total { border-bottom: none; border-top: 2px solid var(--gray-200); margin-top: 0.5rem; padding-top: 0.75rem; font-weight: 700; font-size: 1.125rem; }
    .error-message { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: var(--radius); font-size: 0.875rem; margin-bottom: 1rem; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--gray-200); }
  `]
})
export class OrderCreateComponent implements OnInit {
  customerId: number | null = null;
  lineItems: { productId: number | null; quantity: number }[] = [{ productId: null, quantity: 1 }];
  notes = '';
  loading = false;
  error = '';
  products: InventoryProduct[] = [];

  constructor(private orderService: OrderService, private inventoryService: InventoryService, private router: Router, private toastService: ToastService) {}

  ngOnInit() {
    this.inventoryService.getProducts().subscribe({ next: (res) => this.products = res.products || [], error: () => {} });
  }

  trackByIndex(index: number) { return index; }
  addItem() { this.lineItems.push({ productId: null, quantity: 1 }); }
  removeItem(i: number) { if (this.lineItems.length > 1) this.lineItems.splice(i, 1); }

  getItemTotal(item: { productId: number | null; quantity: number }) {
    const p = this.products.find(p => String(p.id) === String(item.productId));
    return p ? p.price * item.quantity : 0;
  }
  getItemCount() { return this.lineItems.filter(i => i.productId).reduce((s, i) => s + i.quantity, 0); }
  getSubtotal() { return this.lineItems.reduce((s, i) => s + this.getItemTotal(i), 0); }
  getTax() { return this.getSubtotal() * 0.0741; }
  getTotal() { return this.getSubtotal() + this.getTax(); }

  onSubmit() {
    this.loading = true;
    this.error = '';
    const data = {
      customerId: this.customerId,
      lineItems: this.lineItems.filter(i => i.productId).map(i => ({ productId: i.productId, quantity: i.quantity })),
      notes: this.notes
    };
    this.orderService.createOrder(data).subscribe({
      next: (order) => {
        this.loading = false;
        this.toastService.success('Order created', `${order.orderNumber} created successfully`);
        this.router.navigate(['/orders', order.orderNumber]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to create order';
        this.toastService.error('Order creation failed', this.error);
      }
    });
  }
}
