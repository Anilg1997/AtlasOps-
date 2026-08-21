import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';
import { ToastService } from '../../services/notification/toast.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page animate-fadeIn" *ngIf="order">
      <div class="page-header">
        <div>
          <a routerLink="/orders" class="back-link"><i class="fas fa-arrow-left"></i> Back to Orders</a>
          <div class="title-row">
            <h1>{{ order.orderNumber }}</h1>
            <span class="badge badge-lg" [ngClass]="'badge-' + order.status.toLowerCase()">{{ formatStatus(order.status) }}</span>
          </div>
          <p *ngIf="order.statusReason" class="status-reason">
            <i class="fas fa-circle-info"></i> {{ formatStatus(order.statusReason) }}
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="changeStatus()" *ngIf="order.status !== 'DELIVERED' && order.status !== 'CANCELLED'">
            <i class="fas fa-arrows-rotate"></i> Update Status
          </button>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="detail-grid">
        <div class="card">
          <h3><i class="fas fa-building"></i> Customer</h3>
          <div class="info-rows">
            <div class="info-row"><label>Company</label><span>{{ order.customer.name || 'N/A' }}</span></div>
            <div class="info-row"><label>Email</label><span>{{ order.customer.email || 'N/A' }}</span></div>
            <div class="info-row"><label>Phone</label><span>{{ order.customer.phone || 'N/A' }}</span></div>
            <div class="info-row"><label>Customer #</label><span class="mono">{{ order.customer.customerNumber || 'N/A' }}</span></div>
          </div>
        </div>

        <div class="card">
          <h3><i class="fas fa-calculator"></i> Financials</h3>
          <div class="info-rows">
            <div class="info-row highlight"><label>Total Amount</label><span class="amount">\${{ order.totalAmount | number:'1.2-2' }}</span></div>
            <div class="info-row"><label>Tax</label><span>\${{ order.taxAmount | number:'1.2-2' }}</span></div>
            <div class="info-row"><label>Subtotal</label><span>\${{ (order.totalAmount - order.taxAmount) | number:'1.2-2' }}</span></div>
          </div>
        </div>

        <div class="card">
          <h3><i class="fas fa-clock"></i> Timeline</h3>
          <div class="info-rows">
            <div class="info-row"><label>Created</label><span>{{ order.createdAt | date:'MMM d, y HH:mm' }}</span></div>
            <div class="info-row"><label>Updated</label><span>{{ order.updatedAt | date:'MMM d, y HH:mm' }}</span></div>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="card" style="margin-top: 1.5rem;">
        <h3><i class="fas fa-box"></i> Line Items ({{ order.lineItems?.length || 0 }})</h3>
        <table class="table" *ngIf="order.lineItems?.length">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of order.lineItems">
              <td>
                <div class="product-cell">
                  <div class="product-icon"><i class="fas fa-cube"></i></div>
                  <div>
                    <div class="product-name">{{ item.product.name }}</div>
                    <div class="product-desc">{{ item.product.description | slice:0:60 }}...</div>
                  </div>
                </div>
              </td>
              <td><code class="sku">{{ item.product.sku }}</code></td>
              <td><span class="category-tag">{{ item.product.category }}</span></td>
              <td class="qty">{{ item.quantity }}</td>
              <td>\${{ item.unitPrice | number:'1.2-2' }}</td>
              <td class="subtotal">\${{ item.subtotal | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Notes -->
      <div class="card notes-card" style="margin-top: 1.5rem;" *ngIf="order.notes">
        <h3><i class="fas fa-sticky-note"></i> Notes</h3>
        <div class="notes-content">{{ order.notes }}</div>
      </div>
    </div>
  `,
  styles: [`
    .back-link { font-size: 0.8125rem; color: var(--gray-500); display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.5rem; }
    .back-link:hover { color: var(--primary); text-decoration: none; }
    .title-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
    h1 { font-size: 1.5rem; font-weight: 700; }
    .badge-lg { font-size: 0.8125rem; padding: 0.375rem 0.875rem; }
    .status-reason { font-size: 0.875rem; color: var(--warning); display: flex; align-items: center; gap: 0.375rem; }
    .header-actions { display: flex; gap: 0.5rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .card h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .info-rows { display: flex; flex-direction: column; }
    .info-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-50); }
    .info-row:last-child { border-bottom: none; }
    .info-row label { font-weight: 500; color: var(--gray-500); font-size: 0.8125rem; }
    .info-row span { color: var(--gray-900); font-size: 0.875rem; font-weight: 500; }
    .info-row.highlight { background: var(--gray-50); margin: 0 -0.5rem; padding: 0.75rem 0.5rem; border-radius: var(--radius); border-bottom: none; }
    .amount { font-weight: 700; font-size: 1.25rem; color: var(--success); }
    .mono { font-family: monospace; font-size: 0.8125rem; }
    .product-cell { display: flex; align-items: center; gap: 0.75rem; }
    .product-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--primary-50); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.875rem; }
    .product-name { font-weight: 600; font-size: 0.875rem; }
    .product-desc { font-size: 0.75rem; color: var(--gray-400); }
    .sku { background: var(--gray-100); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8125rem; }
    .category-tag { background: var(--gray-100); color: var(--gray-600); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; text-transform: capitalize; }
    .qty { font-weight: 600; }
    .subtotal { font-weight: 600; color: var(--gray-900); }
    .notes-content { font-size: 0.875rem; color: var(--gray-600); line-height: 1.6; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;

  constructor(private orderService: OrderService, private route: ActivatedRoute, private router: Router, private toastService: ToastService) {}

  ngOnInit() {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber');
    if (orderNumber) {
      this.orderService.getOrder(orderNumber).subscribe(order => this.order = order);
    }
  }

  formatStatus(s: string) { return (s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

  changeStatus() {
    if (!this.order) return;
    const nextStatuses: Record<string, string> = {
      'PENDING': 'CONFIRMED', 'CONFIRMED': 'PROCESSING', 'PROCESSING': 'SHIPPED', 'SHIPPED': 'DELIVERED'
    };
    const next = nextStatuses[this.order.status];
    if (!next) return;
    this.orderService.updateStatus(this.order.orderNumber, next).subscribe({
      next: (updated) => { this.order = updated; this.toastService.success('Status updated', `Order ${updated.orderNumber} is now ${this.formatStatus(next)}`); },
      error: () => this.toastService.error('Error', 'Could not update order status')
    });
  }
}
