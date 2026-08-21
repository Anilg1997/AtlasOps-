import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ActivityService } from '../../services/activity.service';
import { RecentActivityComponent } from '../feed/recent-activity.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RecentActivityComponent],
  template: `
    <div class="dashboard animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-chart-pie"></i> Operations Dashboard</h1>
          <p>Real-time overview of enterprise operations</p>
        </div>
        <div class="header-actions">
          <a routerLink="/orders/create" class="btn btn-primary"><i class="fas fa-plus"></i> New Order</a>
          <a routerLink="/copilot" class="btn btn-secondary"><i class="fas fa-robot"></i> Ask AI</a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card" style="--accent: #2563eb;">
          <div class="stat-icon"><i class="fas fa-receipt"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalOrders || 0 }}</span>
            <span class="stat-label">Total Orders</span>
          </div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> 12%</div>
        </div>
        <div class="stat-card" style="--accent: #10b981;">
          <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
          <div class="stat-info">
            <span class="stat-value">\${{ formatNumber(stats.totalRevenue || 0) }}</span>
            <span class="stat-label">Total Revenue</span>
          </div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> 8%</div>
        </div>
        <div class="stat-card" style="--accent: #f59e0b;">
          <div class="stat-icon"><i class="fas fa-clock"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.pendingOrders || 0 }}</span>
            <span class="stat-label">Pending Orders</span>
          </div>
          <div class="stat-trend" [ngClass]="(stats.pendingOrders || 0) > 3 ? 'down' : 'up'">
            <i class="fas" [ngClass]="(stats.pendingOrders || 0) > 3 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
            {{ (stats.pendingOrders || 0) > 3 ? 'Attention' : 'On track' }}
          </div>
        </div>
        <div class="stat-card" style="--accent: #10b981;">
          <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.deliveredOrders || 0 }}</span>
            <span class="stat-label">Delivered</span>
          </div>
          <div class="stat-trend up"><i class="fas fa-check"></i> {{ getFulfillmentRate() }}%</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- Recent Orders -->
        <div class="card orders-card">
          <div class="card-header">
            <h3><i class="fas fa-receipt"></i> Recent Orders</h3>
            <a routerLink="/orders" class="card-link">View All <i class="fas fa-arrow-right"></i></a>
          </div>
          <table class="table" *ngIf="orders.length; else noOrders">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of orders">
                <td><a [routerLink]="['/orders', order.orderNumber]" class="order-link">{{ order.orderNumber }}</a></td>
                <td>{{ order.customer?.name || 'N/A' }}</td>
                <td><span class="badge" [ngClass]="'badge-' + order.status.toLowerCase()">{{ formatStatus(order.status) }}</span></td>
                <td class="amount">\${{ order.totalAmount | number:'1.2-2' }}</td>
                <td class="date-cell">{{ order.createdAt | date:'MMM d' }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noOrders>
            <div class="empty-state">
              <i class="fas fa-receipt"></i>
              <p>No orders yet</p>
              <a routerLink="/orders/create" class="btn btn-primary btn-sm">Create First Order</a>
            </div>
          </ng-template>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- AI Insights -->
          <div class="card insights-card">
            <div class="card-header">
              <h3><i class="fas fa-robot"></i> AI Insights</h3>
              <a routerLink="/copilot" class="card-link">Ask <i class="fas fa-arrow-right"></i></a>
            </div>
            <div class="insights-list">
              <div class="insight-item warning" *ngIf="(stats.pendingOrders || 0) > 2">
                <div class="insight-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="insight-text">
                  <strong>{{ stats.pendingOrders }} orders pending</strong>
                  <span>Review pending orders for potential delays</span>
                </div>
              </div>
              <div class="insight-item success">
                <div class="insight-icon"><i class="fas fa-chart-line"></i></div>
                <div class="insight-text">
                  <strong>Fulfillment: {{ getFulfillmentRate() }}%</strong>
                  <span>{{ stats.deliveredOrders || 0 }} of {{ stats.totalOrders || 0 }} orders delivered</span>
                </div>
              </div>
              <div class="insight-item info">
                <div class="insight-icon"><i class="fas fa-calculator"></i></div>
                <div class="insight-text">
                  <strong>Avg. Order: \${{ getAvgOrderValue() }}</strong>
                  <span>Across all {{ stats.totalOrders || 0 }} orders</span>
                </div>
              </div>
              <div class="insight-item" *ngIf="(stats.cancelledOrders || 0) > 0">
                <div class="insight-icon"><i class="fas fa-ban"></i></div>
                <div class="insight-text">
                  <strong>{{ stats.cancelledOrders }} cancelled orders</strong>
                  <span>Check for payment or stock issues</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card quick-actions-card">
            <div class="card-header">
              <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
            </div>
            <div class="quick-actions">
              <a routerLink="/orders/create" class="quick-action">
                <div class="qa-icon" style="background: #dbeafe; color: #2563eb;"><i class="fas fa-plus-circle"></i></div>
                <span>New Order</span>
              </a>
              <a routerLink="/copilot" class="quick-action">
                <div class="qa-icon" style="background: #ede9fe; color: #7c3aed;"><i class="fas fa-robot"></i></div>
                <span>AI Co-Pilot</span>
              </a>
              <a routerLink="/inventory" class="quick-action">
                <div class="qa-icon" style="background: #d1fae5; color: #059669;"><i class="fas fa-boxes-stacked"></i></div>
                <span>Inventory</span>
              </a>
              <a routerLink="/feed" class="quick-action">
                <div class="qa-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-stream"></i></div>
                <span>Activity Feed</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card activity-card">
        <app-recent-activity></app-recent-activity>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { }
    .page-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
      flex-wrap: wrap; gap: 1rem;
    }
    .header-actions { display: flex; gap: 0.5rem; }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card {
      display: flex; align-items: center; gap: 1rem; background: white;
      padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); box-shadow: var(--shadow);
      border: 1px solid var(--gray-100); position: relative; overflow: hidden;
    }
    .stat-card::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
      background: var(--accent, var(--primary));
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; background: color-mix(in srgb, var(--accent, var(--primary)) 10%, transparent);
      color: var(--accent, var(--primary));
    }
    .stat-info { display: flex; flex-direction: column; flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--gray-900); line-height: 1.2; }
    .stat-label { font-size: 0.8125rem; color: var(--gray-500); }
    .stat-trend { font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; }
    .stat-trend.up { color: var(--success); }
    .stat-trend.down { color: var(--warning); }

    /* Dashboard Grid */
    .dashboard-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }

    .card-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
      h3 { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    }
    .card-link { font-size: 0.8125rem; color: var(--primary); font-weight: 500; display: inline-flex; align-items: center; gap: 0.25rem; }
    .card-link:hover { text-decoration: underline; }

    .order-link { font-weight: 600; color: var(--primary); }
    .amount { font-weight: 600; color: var(--gray-900); }
    .date-cell { color: var(--gray-500); font-size: 0.8125rem; }

    /* Insights */
    .right-column { display: flex; flex-direction: column; gap: 1.5rem; }
    .insights-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .insight-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); }
    .insight-item.warning { background: #fffbeb; }
    .insight-item.success { background: #f0fdf4; }
    .insight-item.info { background: #f0f9ff; }
    .insight-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.875rem; }
    .insight-item.warning .insight-icon { background: #fef3c7; color: #d97706; }
    .insight-item.success .insight-icon { background: #d1fae5; color: #059669; }
    .insight-item.info .insight-icon { background: #dbeafe; color: #2563eb; }
    .insight-text { display: flex; flex-direction: column; font-size: 0.8125rem; line-height: 1.4; }
    .insight-text strong { color: var(--gray-800); }
    .insight-text span { color: var(--gray-500); }

    /* Quick Actions */
    .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .quick-action {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
      background: var(--gray-50); border-radius: var(--radius); text-decoration: none !important;
      border: 1px solid var(--gray-100); transition: all 0.2s; color: var(--gray-700);
      &:hover { background: white; border-color: var(--primary); box-shadow: var(--shadow); transform: translateY(-1px); }
    }
    .qa-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.875rem; }
    .quick-action span { font-size: 0.8125rem; font-weight: 500; }

    .empty-state { text-align: center; padding: 2.5rem 1rem; color: var(--gray-400); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; i { font-size: 2rem; } }
    .activity-card { margin-top: 1.5rem; }
  `]
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  orders: any[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getStats().subscribe(stats => this.stats = stats);
    this.orderService.getOrders(0, 6).subscribe(res => this.orders = res.content || []);
  }

  formatNumber(n: number) { return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  getFulfillmentRate() { const t = this.stats.totalOrders || 1; return Math.round(((this.stats.deliveredOrders || 0) / t) * 100); }
  getAvgOrderValue() { const t = this.stats.totalOrders || 1; return this.formatNumber((this.stats.totalRevenue || 0) / t); }
  formatStatus(s: string) { return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }
}
