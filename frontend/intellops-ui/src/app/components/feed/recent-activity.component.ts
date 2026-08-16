import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivityService, ActivityEntry } from '../../services/activity.service';
import { eventMeta as eventMetaFor, entityIcon as entityIconFor, entityRoute as entityRouteFor, relativeTime as relativeTimeFor } from './activity-meta';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="recent-activity">
      <div class="widget-head">
        <h3><i class="fas fa-stream"></i> Recent Activity</h3>
        <a routerLink="/feed" class="widget-link"><i class="fas fa-arrow-right"></i> View all</a>
      </div>

      <div class="activity-list" *ngIf="entries.length; else noActivity">
        <div class="activity-item" *ngFor="let entry of entries">
          <div class="activity-marker" [style.background]="eventMeta(entry.eventType).bg" [style.color]="eventMeta(entry.eventType).color">
            <i class="fas" [ngClass]="eventMeta(entry.eventType).icon"></i>
          </div>
          <div class="activity-content">
            <div class="activity-line">
              <span class="activity-label">{{ eventMeta(entry.eventType).label }}</span>
              <span *ngIf="entry.entityId" class="activity-entity">
                <ng-container *ngIf="entityRoute(entry) as route">
                  <a [routerLink]="route"><i class="fas" [ngClass]="entityIcon(entry.entityType)"></i> {{ entry.entityId }}</a>
                </ng-container>
                <ng-container *ngIf="!entityRoute(entry)">
                  <i class="fas" [ngClass]="entityIcon(entry.entityType)"></i> {{ entry.entityId }}
                </ng-container>
              </span>
            </div>
            <div class="activity-time">{{ relativeTime(entry.timestamp) }}</div>
          </div>
        </div>
      </div>
      <ng-template #noActivity>
        <p class="empty-state"><i class="fas fa-inbox"></i> No activity yet</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .widget-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .widget-head h3 { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .widget-link { font-size: 0.8125rem; color: var(--primary); font-weight: 500; display: inline-flex; align-items: center; gap: 0.25rem; }
    .widget-link:hover { text-decoration: underline; }
    .activity-list { display: flex; flex-direction: column; }
    .activity-item { display: flex; gap: 0.75rem; padding: 0.625rem 0; border-bottom: 1px solid var(--gray-100); }
    .activity-item:last-child { border-bottom: none; }
    .activity-marker { width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }
    .activity-content { min-width: 0; }
    .activity-line { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .activity-label { font-size: 0.875rem; font-weight: 600; color: var(--gray-800); }
    .activity-entity { font-size: 0.8125rem; font-weight: 600; color: var(--gray-700); display: inline-flex; align-items: center; gap: 0.25rem; }
    .activity-entity a { color: var(--primary); }
    .activity-entity a:hover { text-decoration: underline; }
    .activity-time { font-size: 0.75rem; color: var(--gray-400); }
    .empty-state { text-align: center; padding: 1.5rem; color: var(--gray-400); font-size: 0.875rem; display: flex; flex-direction: column; align-items: center; gap: 0.375rem; }
  `]
})
export class RecentActivityComponent implements OnInit {
  entries: ActivityEntry[] = [];

  constructor(private activityService: ActivityService) {}

  ngOnInit() {
    this.activityService.getActivity({ limit: 8 }).subscribe({
      next: entries => this.entries = entries || [],
      error: () => this.entries = []
    });
  }

  eventMeta(eventType: string) { return eventMetaFor(eventType); }
  entityIcon(entityType: string) { return entityIconFor(entityType); }
  entityRoute(entry: ActivityEntry) { return entityRouteFor(entry); }
  relativeTime(iso: string) { return relativeTimeFor(iso); }
}
