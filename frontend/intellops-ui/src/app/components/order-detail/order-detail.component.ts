import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page animate-fadeIn" *ngIf="order">
      <div class="page-header">
        <div>
          <a routerLink="/orders" class="back-link"><i class="fas fa-arrow-left"></i> Back to Orders</a>
          <h1>Order {{ order.orderNumber }}</h1>
        </div>
        <span class="badge badge-lg" [ngClass]="'badge-' + order.status.toLowerCase()">{{ order.status }}</span>
      </div>

      <div class="detail-grid">
        <div class="card">
          <h3><i class="fas fa-user"></i> Customer</h3>
          <div class="info-row"><label>Name</label><span>{{ order.customer.name || 'N/A' }}</span></div>
          <div class="info-row"><label>Email</label><span>{{ order.customer.email || 'N/A' }}</span></div>
          <div class="info-row"><label>Customer #</label><span>{{ order.customer.customerNumber || 'N/A' }}</span></div>
        </div>

        <div class="card">
          <h3><i class="fas fa-calculator"></i> Financials</h3>
          <div class="info-row"><label>Total</label><span class="amount">\${{ order.totalAmount | number:'1.2-2' }}</span></div>
          <div class="info-row"><label>Tax</label><span>\${{ order.taxAmount | number:'1.2-2' }}</span></div>
          <div class="info-row"><label>Subtotal</label><span>\${{ (order.totalAmount - order.taxAmount) | number:'1.2-2' }}</span></div>
        </div>
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <h3><i class="fas fa-box"></i> Line Items</h3>
        <table class="table" *ngIf="order.lineItems?.length">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of order.lineItems">
              <td>{{ item.product.name }}</td>
              <td><code>{{ item.product.sku }}</code></td>
              <td>{{ item.quantity }}</td>
              <td>\${{ item.unitPrice | number:'1.2-2' }}</td>
              <td>\${{ item.subtotal | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top: 1.5rem;" *ngIf="order.notes">
        <h3><i class="fas fa-sticky-note"></i> Notes</h3>
        <p>{{ order.notes }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .back-link { font-size: 0.875rem; color: var(--gray-500); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; &:hover { color: var(--primary); } }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; }
    .badge-lg { font-size: 0.875rem; padding: 0.5rem 1rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
    .card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .info-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100); label { font-weight: 500; color: var(--gray-600); } span { color: var(--gray-900); } }
    .amount { font-weight: 700; font-size: 1.125rem; color: var(--success); }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;

  constructor(private orderService: OrderService, private route: ActivatedRoute) {}

  ngOnInit() {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber');
    if (orderNumber) {
      this.orderService.getOrder(orderNumber).subscribe(order => this.order = order);
    }
  }
}
