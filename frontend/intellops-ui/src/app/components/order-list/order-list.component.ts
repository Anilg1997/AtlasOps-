import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-receipt"></i> Orders</h1>
          <p>Manage and track enterprise orders</p>
        </div>
        <a routerLink="/orders/create" class="btn btn-primary"><i class="fas fa-plus"></i> Create Order</a>
      </div>

      <!-- Filter Bar -->
      <div class="card filter-card">
        <div class="toolbar">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" class="form-control" placeholder="Search orders..." [(ngModel)]="search" (keyup.enter)="loadOrders()">
          </div>
          <button class="btn btn-secondary" (click)="loadOrders()"><i class="fas fa-rotate"></i> Refresh</button>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="card">
        <table class="table" *ngIf="orders.length; else noOrders">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders">
              <td><a [routerLink]="['/orders', order.orderNumber]" class="order-link">{{ order.orderNumber }}</a></td>
              <td>
                <div class="customer-cell">
                  <div class="customer-avatar">{{ getInitials(order.customer?.name) }}</div>
                  <div>
                    <div class="customer-name">{{ order.customer?.name || 'N/A' }}</div>
                    <div class="customer-email">{{ order.customer?.email || '' }}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge" [ngClass]="'badge-' + order.status.toLowerCase()">{{ formatStatus(order.status) }}</span></td>
              <td class="amount">\${{ order.totalAmount | number:'1.2-2' }}</td>
              <td class="date-cell">{{ order.createdAt | date:'MMM d, y' }}</td>
              <td>
                <div class="action-btns">
                  <a [routerLink]="['/orders', order.orderNumber]" class="btn btn-sm btn-secondary">View</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noOrders>
          <div class="empty-state">
            <i class="fas fa-receipt"></i>
            <p>No orders found</p>
            <a routerLink="/orders/create" class="btn btn-primary btn-sm">Create First Order</a>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .filter-card { padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
    .toolbar { display: flex; gap: 0.75rem; align-items: center; }
    .search-box { position: relative; flex: 1; max-width: 400px; i { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: var(--gray-400); font-size: 0.875rem; } input { padding-left: 2.5rem; } }
    .order-link { font-weight: 600; color: var(--primary); }
    .customer-cell { display: flex; align-items: center; gap: 0.75rem; }
    .customer-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--gray-200); display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; font-weight: 700; color: var(--gray-600); flex-shrink: 0; }
    .customer-name { font-weight: 500; font-size: 0.875rem; }
    .customer-email { font-size: 0.75rem; color: var(--gray-400); }
    .amount { font-weight: 600; }
    .date-cell { color: var(--gray-500); font-size: 0.8125rem; }
    .action-btns { display: flex; gap: 0.375rem; }
    .empty-state { text-align: center; padding: 3rem; color: var(--gray-400); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; i { font-size: 2rem; } }
  `]
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  search = '';
  page = 0;

  constructor(private orderService: OrderService) {}
  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.orderService.getOrders(this.page, 20, this.search).subscribe(res => {
      this.orders = res.content || [];
    });
  }

  getInitials(name?: string) {
    if (!name) return '?';
    return name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  formatStatus(s: string) { return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }
}
