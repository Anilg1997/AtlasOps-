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
          <p>Manage enterprise orders</p>
        </div>
        <a routerLink="/orders/create" class="btn btn-primary"><i class="fas fa-plus"></i> Create Order</a>
      </div>

      <div class="card">
        <div class="toolbar">
          <input type="text" class="form-control" placeholder="Search orders..." [(ngModel)]="search" (keyup.enter)="loadOrders()" style="max-width: 300px;">
          <button class="btn btn-secondary" (click)="loadOrders()"><i class="fas fa-search"></i> Search</button>
        </div>

        <table class="table" *ngIf="orders.length; else noOrders">
          <thead>
            <tr><th>Order #</th><th>Customer</th><th>Status</th><th>Total</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders">
              <td><a [routerLink]="['/orders', order.orderNumber]" class="order-link">{{ order.orderNumber }}</a></td>
              <td>{{ order.customer.name || 'N/A' }}</td>
              <td><span class="badge" [ngClass]="'badge-' + order.status.toLowerCase()">{{ order.status }}</span></td>
              <td>\${{ order.totalAmount | number:'1.2-2' }}</td>
              <td>{{ order.createdAt | date:'short' }}</td>
              <td><a [routerLink]="['/orders', order.orderNumber]" class="btn btn-sm btn-secondary">View</a></td>
            </tr>
          </tbody>
        </table>
        <ng-template #noOrders><p class="empty-state">No orders found</p></ng-template>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { color: var(--gray-500); font-size: 0.875rem; }
    .toolbar { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
    .order-link { font-weight: 600; color: var(--primary); }
    .empty-state { text-align: center; padding: 3rem; color: var(--gray-400); }
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
}
