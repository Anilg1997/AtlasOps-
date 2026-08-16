import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivityService, ActivityEntry, ActivityStats } from '../../services/activity.service';
import { EventMeta, eventMeta, entityIcon as entityIconFor, entityRoute as entityRouteFor, relativeTime as relativeTimeFor, EVENT_META } from './activity-meta';

const ENTITY_TYPES = ['ORDER', 'INVOICE', 'PAYMENT', 'ACCOUNT'];

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="feed animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-stream"></i> Activity Feed</h1>
          <p>Cross-service operations timeline</p>
        </div>
        <div class="header-actions">
          <label class="auto-refresh">
            <input type="checkbox" [(ngModel)]="autoRefresh" (ngModelChange)="onAutoRefreshChange()">
            <span>Auto-refresh (15s)</span>
          </label>
          <button class="btn btn-secondary" (click)="load()" [disabled]="loading">
            <i class="fas" [ngClass]="loading ? 'fa-spinner fa-spin' : 'fa-rotate'"></i> Refresh
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #dbeafe; color: #2563eb;"><i class="fas fa-list"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats?.totalEntries || 0 }}</span>
            <span class="stat-label">Total Events</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #d1fae5; color: #059669;"><i class="fas fa-receipt"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats?.totalOrders || 0 }}</span>
            <span class="stat-label">Order Events</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #f3e8ff; color: #9333ea;"><i class="fas fa-file-invoice-dollar"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats?.totalInvoices || 0 }}</span>
            <span class="stat-label">Invoice Events</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #e0e7ff; color: #4f46e5;"><i class="fas fa-credit-card"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats?.totalPayments || 0 }}</span>
            <span class="stat-label">Payment Events</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <select class="form-control filter" [(ngModel)]="entityType" (ngModelChange)="load()">
            <option value="">All entity types</option>
            <option *ngFor="let t of entityTypes" [value]="t">{{ t }}</option>
          </select>
          <select class="form-control filter" [(ngModel)]="eventType" (ngModelChange)="load()">
            <option value="">All event types</option>
            <option *ngFor="let e of eventTypes" [value]="e">{{ eventLabel(e) }}</option>
          </select>
          <select class="form-control filter" [(ngModel)]="limit" (ngModelChange)="load()" style="max-width: 120px;">
            <option [ngValue]="25">25</option>
            <option [ngValue]="50">50</option>
            <option [ngValue]="100">100</option>
            <option [ngValue]="200">200</option>
          </select>
          <span class="result-count" *ngIf="entries.length">{{ entries.length }} event(s)</span>
        </div>

        <div class="timeline" *ngIf="entries.length; else noEntries">
          <div class="timeline-item" *ngFor="let entry of entries">
            <div class="timeline-marker" [style.background]="meta(entry.eventType).bg" [style.color]="meta(entry.eventType).color">
              <i class="fas" [ngClass]="meta(entry.eventType).icon"></i>
            </div>
            <div class="timeline-body">
              <div class="timeline-head">
                <span class="event-label" [style.color]="meta(entry.eventType).color">{{ meta(entry.eventType).label }}</span>
                <span class="badge entity-badge">{{ entry.entityType || 'UNKNOWN' }}</span>
                <ng-container *ngIf="entry.entityId">
                  <a *ngIf="entityRoute(entry) as route" [routerLink]="route" class="entity-link">
                    <i class="fas" [ngClass]="entityIcon(entry.entityType)"></i> {{ entry.entityId }}
                  </a>
                  <span *ngIf="!entityRoute(entry)" class="entity-link plain"><i class="fas" [ngClass]="entityIcon(entry.entityType)"></i> {{ entry.entityId }}</span>
                </ng-container>
                <span class="source-chip"><i class="fas fa-server"></i> {{ entry.source || 'system' }}</span>
              </div>
              <div class="timeline-details" *ngIf="detailChips(entry).length">
                <span class="detail-chip" *ngFor="let d of detailChips(entry)" title="{{ d.key }}">{{ d.key }}: {{ d.value }}</span>
              </div>
              <div class="timeline-time">
                <span [title]="entry.timestamp | date:'medium'">{{ relativeTime(entry.timestamp) }}</span>
                <span class="full-time">{{ entry.timestamp | date:'MMM d, HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>
        <ng-template #noEntries>
          <div class="empty-state" *ngIf="!loading">
            <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
            <p>No activity yet — events appear here as services publish to Kafka.</p>
          </div>
          <div class="empty-state" *ngIf="loading"><div class="spinner"></div></div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { color: var(--gray-500); font-size: 0.875rem; }
    .header-actions { display: flex; align-items: center; gap: 1rem; }
    .auto-refresh { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--gray-600); cursor: pointer; user-select: none; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { display: flex; align-items: center; gap: 1rem; background: white; padding: 1.1rem 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow); }
    .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.375rem; font-weight: 700; color: var(--gray-900); }
    .stat-label { font-size: 0.8125rem; color: var(--gray-500); }
    .toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .filter { max-width: 220px; }
    .result-count { font-size: 0.8125rem; color: var(--gray-500); margin-left: auto; }
    .timeline { position: relative; padding-left: 1.5rem; }
    .timeline::before { content: ''; position: absolute; left: 0.75rem; top: 0.25rem; bottom: 0.25rem; width: 2px; background: var(--gray-200); }
    .timeline-item { position: relative; display: flex; gap: 1rem; padding-bottom: 1.5rem; }
    .timeline-marker { position: absolute; left: -1.5rem; top: 0; width: 1.75rem; height: 1.75rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; box-shadow: 0 0 0 3px white; }
    .timeline-body { flex: 1; min-width: 0; }
    .timeline-head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .event-label { font-weight: 600; font-size: 0.9375rem; }
    .entity-badge { background: var(--gray-100); color: var(--gray-600); }
    .entity-link { display: inline-flex; align-items: center; gap: 0.375rem; font-weight: 600; font-size: 0.875rem; color: var(--primary); }
    .entity-link:hover { text-decoration: underline; }
    .entity-link.plain { color: var(--gray-700); }
    .source-chip { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--gray-500); background: var(--gray-50); padding: 0.125rem 0.5rem; border-radius: 9999px; }
    .timeline-details { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.375rem; }
    .detail-chip { font-size: 0.75rem; color: var(--gray-600); background: var(--gray-100); padding: 0.125rem 0.5rem; border-radius: 4px; }
    .timeline-time { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; font-size: 0.75rem; color: var(--gray-400); }
    .full-time { color: var(--gray-300); }
    .empty-state { text-align: center; padding: 3rem; color: var(--gray-400); display: flex; flex-direction: column; align-items: center; }
  `]
})
export class FeedComponent implements OnInit, OnDestroy {
  entries: ActivityEntry[] = [];
  stats?: ActivityStats;
  entityTypes = ENTITY_TYPES;
  eventTypes = Object.keys(EVENT_META);
  entityType = '';
  eventType = '';
  limit: number = 50;
  loading = false;
  autoRefresh = false;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private activityService: ActivityService) {}

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  load() {
    this.loading = true;
    const query = {
      entityType: this.entityType || undefined,
      eventType: this.eventType || undefined,
      limit: this.limit
    };
    this.activityService.getActivity(query).subscribe({
      next: entries => {
        this.entries = entries || [];
        this.loading = false;
      },
      error: () => {
        this.entries = [];
        this.loading = false;
      }
    });
    this.activityService.getStats().subscribe({
      next: stats => this.stats = stats,
      error: () => this.stats = undefined
    });
  }

  onAutoRefreshChange() {
    if (this.autoRefresh) {
      this.timer = setInterval(() => this.load(), 15000);
    } else {
      this.stopAutoRefresh();
    }
  }

  private stopAutoRefresh() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  meta(eventType: string): EventMeta {
    return eventMeta(eventType);
  }

  eventLabel(eventType: string): string {
    return eventMeta(eventType).label;
  }

  entityIcon(entityType: string): string {
    return entityIconFor(entityType);
  }

  entityRoute(entry: ActivityEntry): string[] | null {
    return entityRouteFor(entry);
  }

  detailChips(entry: ActivityEntry): { key: string; value: string }[] {
    if (!entry.details) return [];
    const skip = new Set(['eventType', 'event_type', 'timestamp', 'orderNumber', 'order_number',
      'invoiceNumber', 'invoice_number', 'paymentRef', 'payment_ref', 'accountNumber', 'account_number',
      'customerEmail', 'customer_email']);
    return Object.entries(entry.details)
      .filter(([k, v]) => !skip.has(k) && v != null && String(v).trim() !== '')
      .slice(0, 5)
      .map(([k, v]) => ({ key: k, value: String(v) }));
  }

  relativeTime(iso: string): string {
    return relativeTimeFor(iso);
  }
}
