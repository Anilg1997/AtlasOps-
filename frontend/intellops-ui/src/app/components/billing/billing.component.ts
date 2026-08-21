import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/notification/toast.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-file-invoice-dollar"></i> Billing</h1>
          <p>Legacy billing integration with Oracle + SOAP</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card" style="--accent: #2563eb;">
          <div class="stat-icon"><i class="fas fa-file-invoice"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalInvoices || 0 }}</span>
            <span class="stat-label">Total Invoices</span>
          </div>
        </div>
        <div class="stat-card" style="--accent: #f59e0b;">
          <div class="stat-icon"><i class="fas fa-clock"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.pendingInvoices || 0 }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card" style="--accent: #ef4444;">
          <div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.overdueInvoices || 0 }}</span>
            <span class="stat-label">Overdue</span>
          </div>
        </div>
        <div class="stat-card" style="--accent: #10b981;">
          <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.paidInvoices || 0 }}</span>
            <span class="stat-label">Paid</span>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-file-invoice"></i> Invoices</h3>
        </div>
        <table class="table" *ngIf="invoices.length; else noInvoices">
          <thead>
            <tr><th>Invoice #</th><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Payment</th><th>Due Date</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let inv of invoices">
              <td><strong>{{ inv.invoiceNumber }}</strong></td>
              <td>{{ inv.orderNumber }}</td>
              <td>{{ inv.customerName }}</td>
              <td class="amount">\${{ inv.totalAmount | number:'1.2-2' }}</td>
              <td><span class="badge" [ngClass]="'badge-' + inv.status.toLowerCase()">{{ inv.status }}</span></td>
              <td><span class="badge" [ngClass]="'badge-' + inv.paymentStatus.toLowerCase()">{{ inv.paymentStatus }}</span></td>
              <td class="date-cell">{{ inv.dueDate }}</td>
            </tr>
          </tbody>
        </table>
        <ng-template #noInvoices>
          <div class="empty-state">
            <i class="fas fa-file-invoice"></i>
            <p>No invoices found</p>
          </div>
        </ng-template>
      </div>

      <!-- Legacy Integration -->
      <div class="card" style="margin-top: 1.5rem;">
        <div class="card-header">
          <h3><i class="fas fa-plug"></i> Legacy Integration</h3>
        </div>
        <div class="integration-grid">
          <div class="integration-item">
            <div class="int-icon" style="background: #dbeafe; color: #2563eb;"><i class="fas fa-database"></i></div>
            <div><strong>Oracle XE</strong><span>Port 1521</span></div>
          </div>
          <div class="integration-item">
            <div class="int-icon" style="background: #ede9fe; color: #7c3aed;"><i class="fas fa-file-code"></i></div>
            <div><strong>SOAP/WSDL</strong><span>Web Service Protocol</span></div>
          </div>
          <div class="integration-item">
            <div class="int-icon" style="background: #d1fae5; color: #059669;"><i class="fas fa-stream"></i></div>
            <div><strong>Apache Kafka</strong><span>Event Pipeline</span></div>
          </div>
          <div class="integration-item">
            <div class="int-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-file-code"></i></div>
            <div><strong>WSDL</strong><span><a href="http://localhost:8084/soap/billing.wsdl" target="_blank">View WSDL</a></span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { display: flex; align-items: center; gap: 1rem; background: white; padding: 1.25rem; border-radius: var(--radius-lg); box-shadow: var(--shadow); border: 1px solid var(--gray-100); position: relative; overflow: hidden; }
    .stat-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--accent); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.8125rem; color: var(--gray-500); }
    .card-header { margin-bottom: 1rem; }
    .card-header h3 { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .amount { font-weight: 600; }
    .date-cell { color: var(--gray-500); font-size: 0.8125rem; }
    .empty-state { text-align: center; padding: 3rem; color: var(--gray-400); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; i { font-size: 2rem; } }
    .integration-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .integration-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem; background: var(--gray-50); border-radius: var(--radius); }
    .int-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .integration-item div { display: flex; flex-direction: column; }
    .integration-item strong { font-size: 0.875rem; color: var(--gray-800); }
    .integration-item span { font-size: 0.75rem; color: var(--gray-500); }
  `]
})
export class BillingComponent implements OnInit {
  stats: any = {};
  invoices: any[] = [];

  constructor(private http: HttpClient, private toastService: ToastService) {}

  ngOnInit() {
    this.http.get<any>('/api/v1/billing/stats').subscribe(stats => this.stats = stats);
    this.http.get<any>('/api/v1/billing/invoices').subscribe(res => this.invoices = Array.isArray(res) ? res : []);
  }
}
