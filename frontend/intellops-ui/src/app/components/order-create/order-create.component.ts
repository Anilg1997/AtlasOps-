import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
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

      <div class="card" style="max-width: 700px;">
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Customer ID</label>
            <input type="number" class="form-control" [(ngModel)]="customerId" name="customerId" placeholder="Enter customer ID" required>
          </div>

          <div class="line-items">
            <h3>Line Items</h3>
            <div class="line-item" *ngFor="let item of lineItems; let i = index">
              <div class="form-group" style="flex: 1;">
                <label>Product ID</label>
                <input type="number" class="form-control" [(ngModel)]="item.productId" [name]="'pid' + i" required>
              </div>
              <div class="form-group" style="width: 100px;">
                <label>Qty</label>
                <input type="number" class="form-control" [(ngModel)]="item.quantity" [name]="'qty' + i" min="1" required>
              </div>
              <button type="button" class="btn btn-danger btn-sm" (click)="removeItem(i)" *ngIf="lineItems.length > 1"><i class="fas fa-trash"></i></button>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" (click)="addItem()"><i class="fas fa-plus"></i> Add Item</button>
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea class="form-control" [(ngModel)]="notes" name="notes" rows="3" placeholder="Optional notes..."></textarea>
          </div>

          <div class="error-message" *ngIf="error">{{ error }}</div>

          <div class="form-actions">
            <a routerLink="/orders" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              <span class="spinner" *ngIf="loading"></span>
              <span *ngIf="!loading"><i class="fas fa-check"></i> Create Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .back-link { font-size: 0.875rem; color: var(--gray-500); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .line-items { margin-bottom: 1.5rem; h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; } }
    .line-item { display: flex; align-items: flex-end; gap: 0.75rem; margin-bottom: 0.75rem; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .error-message { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: var(--radius); font-size: 0.875rem; margin-bottom: 1rem; }
  `]
})
export class OrderCreateComponent {
  customerId: number | null = null;
  lineItems: { productId: number | null; quantity: number }[] = [{ productId: null, quantity: 1 }];
  notes = '';
  loading = false;
  error = '';

  constructor(private orderService: OrderService, private router: Router, private toastService: ToastService) {}

  addItem() { this.lineItems.push({ productId: null, quantity: 1 }); }
  removeItem(i: number) { this.lineItems.splice(i, 1); }

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
        this.toastService.success('Order created', `Order ${order.orderNumber} created successfully`);
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
