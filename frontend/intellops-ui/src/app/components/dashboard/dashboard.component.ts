import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { RecentActivityComponent } from '../feed/recent-activity.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RecentActivityComponent],
  template: `
    <div class="dashboard animate-fadeIn">
      <div class="page-header">
        <h1><i class="fas fa-chart-line"></i> Operations Dashboard</h1>
        <p>Real-time overview of enterprise operations</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #dbeafe; color: #2563eb;"><i class="fas fa-receipt"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalOrders || 0 }}</span>
            <span class="stat-label">Total Orders</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #d1fae5; color: #059669;"><i class="fas fa-dollar-sign"></i></div>
          <div class="stat-info">
            <span class="stat-value">\${{ formatNumber(stats.totalRevenue || 0) }}</span>
            <span class="stat-label">Total Revenue</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-clock"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.pendingOrders || 0 }}</span>
            <span class="stat-label">Pending Orders</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #e0e7ff; color: #4f46e5;"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.deliveredOrders || 0 }}</span>
            <span class="stat-label">Delivered</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <h3><i class="fas fa-receipt"></i> Recent Orders</h3>
          <table class="table" *ngIf="orders.length; else noOrders">
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of orders">
                <td><a [routerLink]="['/orders', order.orderNumber]">{{ order.orderNumber }}</a></td>
                <td>{{ order.customer?.name || 'N/A' }}</td>
                <td><span class="badge" [ngClass]="'badge-' + order.status.toLowerCase()">{{ order.status }}</span></td>
                <td>\${{ order.totalAmount | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noOrders><p class="empty-state">No orders yet</p></ng-template>
          <a routerLink="/orders" class="btn btn-sm btn-secondary" style="margin-top: 1rem;">View All Orders</a>
        </div>

        <div class="card">
          <h3><i class="fas fa-robot"></i> AI Insights</h3>
          <div class="insights-list">
            <div class="insight-item" *ngIf="stats.pendingOrders > 5">
              <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
              <span>{{ stats.pendingOrders }} orders are pending confirmation</span>
            </div>
            <div class="insight-item">
              <i class="fas fa-info-circle" style="color: var(--info);"></i>
              <span>Fulfillment rate: {{ getFulfillmentRate() }}%</span>
            </div>
            <div class="insight-item">
              <i class="fas fa-chart-bar" style="color: var(--success);"></i>
              <span>Average order value: \${{ getAvgOrderValue() }}</span>
            </div>
          </div>
          <a routerLink="/copilot" class="btn btn-sm btn-primary" style="margin-top: 1rem;">
            <i class="fas fa-robot"></i> Ask AI Co-Pilot
          </a>
        </div>
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <app-recent-activity></app-recent-activity>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; h1 { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; } p { color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem; } }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { display: flex; align-items: center; gap: 1rem; background: white; padding: 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--gray-900); }
    .stat-label { font-size: 0.8125rem; color: var(--gray-500); }
    .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
    @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
    .card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .empty-state { text-align: center; padding: 2rem; color: var(--gray-400); }
    .insights-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .insight-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); font-size: 0.875rem; }
  `]
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  orders: any[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getStats().subscribe(stats => this.stats = stats);
    this.orderService.getOrders(0, 5).subscribe(res => this.orders = res.content || []);
  }

  formatNumber(n: number) { return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  getFulfillmentRate() { const t = this.stats.totalOrders || 1; return Math.round(((this.stats.deliveredOrders || 0) / t) * 100); }
  getAvgOrderValue() { const t = this.stats.totalOrders || 1; return this.formatNumber((this.stats.totalRevenue || 0) / t); }
}
