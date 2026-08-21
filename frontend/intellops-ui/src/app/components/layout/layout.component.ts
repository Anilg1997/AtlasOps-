import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">
            <i class="fas fa-bolt"></i>
          </div>
          <span class="brand-text" *ngIf="!sidebarCollapsed()">AtlasOps</span>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <span class="nav-label" *ngIf="!sidebarCollapsed()">MAIN</span>
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <i class="fas fa-chart-pie"></i><span *ngIf="!sidebarCollapsed()">Dashboard</span>
            </a>
            <a routerLink="/orders" routerLinkActive="active" class="nav-item">
              <i class="fas fa-receipt"></i><span *ngIf="!sidebarCollapsed()">Orders</span>
            </a>
            <a routerLink="/inventory" routerLinkActive="active" class="nav-item">
              <i class="fas fa-boxes-stacked"></i><span *ngIf="!sidebarCollapsed()">Inventory</span>
            </a>
            <a routerLink="/billing" routerLinkActive="active" class="nav-item">
              <i class="fas fa-file-invoice-dollar"></i><span *ngIf="!sidebarCollapsed()">Billing</span>
            </a>
          </div>

          <div class="nav-section">
            <span class="nav-label" *ngIf="!sidebarCollapsed()">TOOLS</span>
            <a routerLink="/copilot" routerLinkActive="active" class="nav-item ai-nav">
              <i class="fas fa-robot"></i><span *ngIf="!sidebarCollapsed()">AI Co-Pilot</span>
              <span class="ai-badge" *ngIf="!sidebarCollapsed()">AI</span>
            </a>
            <a routerLink="/feed" routerLinkActive="active" class="nav-item">
              <i class="fas fa-stream"></i><span *ngIf="!sidebarCollapsed()">Activity Feed</span>
            </a>
            <a routerLink="/health" routerLinkActive="active" class="nav-item">
              <i class="fas fa-heart-pulse"></i><span *ngIf="!sidebarCollapsed()">Health</span>
            </a>
          </div>

          <div class="nav-section" *ngIf="isAdmin()">
            <span class="nav-label" *ngIf="!sidebarCollapsed()">ADMIN</span>
            <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
              <i class="fas fa-users-gear"></i><span *ngIf="!sidebarCollapsed()">User Management</span>
            </a>
            <a routerLink="/admin/settings" routerLinkActive="active" class="nav-item">
              <i class="fas fa-gear"></i><span *ngIf="!sidebarCollapsed()">Settings</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <button class="collapse-btn" (click)="toggleSidebar()">
            <i class="fas" [ngClass]="sidebarCollapsed() ? 'fa-angles-right' : 'fa-angles-left'"></i>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrapper">
        <!-- Top Bar -->
        <header class="topbar">
          <div class="topbar-left">
            <div class="user-role-chip" [ngClass]="getRoleClass()">
              <i class="fas" [ngClass]="getRoleIcon()"></i>
              {{ authService.user()?.role || 'USER' }}
            </div>
          </div>
          <div class="topbar-right">
            <div class="user-menu">
              <div class="user-avatar" [ngClass]="getRoleClass()">
                {{ getInitials() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ authService.user()?.fullName || 'User' }}</span>
                <span class="user-email">{{ authService.user()?.email || '' }}</span>
              </div>
              <button class="btn btn-sm btn-secondary logout-btn" (click)="authService.logout()">
                <i class="fas fa-right-from-bracket"></i>
              </button>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--gray-50);
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 260px;
      background: var(--gray-900);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
      transition: width 0.25s ease;
      overflow: hidden;
    }
    .sidebar-collapsed .sidebar { width: 72px; }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--gray-700);
    }
    .brand-icon {
      width: 36px; height: 36px; background: var(--primary); border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      i { color: white; font-size: 1rem; }
    }
    .brand-text {
      font-size: 1.125rem; font-weight: 700; white-space: nowrap;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem 0;
    }
    .nav-section { margin-bottom: 0.5rem; }
    .nav-label {
      display: block;
      padding: 0.5rem 1.25rem 0.375rem;
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--gray-500);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      margin: 0.125rem 0.5rem;
      border-radius: 8px;
      color: var(--gray-400);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s;
      position: relative;
      white-space: nowrap;
      i { width: 20px; text-align: center; font-size: 0.9375rem; }
      &:hover { background: var(--gray-800); color: white; text-decoration: none; }
      &.active {
        background: var(--primary);
        color: white;
        i { color: white; }
      }
    }
    .ai-nav {
      .ai-badge {
        margin-left: auto;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.625rem;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
    }

    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--gray-700);
    }
    .collapse-btn {
      width: 100%;
      background: none;
      border: 1px solid var(--gray-700);
      color: var(--gray-400);
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      &:hover { background: var(--gray-800); color: white; }
    }

    /* ── Main wrapper ── */
    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      transition: margin-left 0.25s ease;
    }
    .sidebar-collapsed .main-wrapper { margin-left: 72px; }

    /* ── Top bar ── */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 60px;
      background: white;
      border-bottom: 1px solid var(--gray-200);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .topbar-left { display: flex; align-items: center; gap: 1rem; }
    .topbar-right { display: flex; align-items: center; gap: 1rem; }

    .user-role-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      &.admin { background: #ede9fe; color: #7c3aed; }
      &.operator { background: #dbeafe; color: #2563eb; }
      &.user { background: #f1f5f9; color: #475569; }
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0;
      &.admin { background: linear-gradient(135deg, #7c3aed, #a855f7); }
      &.operator { background: linear-gradient(135deg, #2563eb, #3b82f6); }
      &.user { background: linear-gradient(135deg, #64748b, #94a3b8); }
    }
    .user-info {
      display: flex; flex-direction: column;
      .user-name { font-size: 0.8125rem; font-weight: 600; color: var(--gray-800); }
      .user-email { font-size: 0.6875rem; color: var(--gray-500); }
    }
    .logout-btn { padding: 0.375rem 0.625rem; }

    /* ── Main content ── */
    .main-content {
      flex: 1;
      padding: 2rem;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .sidebar { width: 72px; }
      .main-wrapper { margin-left: 72px; }
      .sidebar .nav-label,
      .sidebar .brand-text,
      .sidebar .nav-item span,
      .sidebar .ai-badge { display: none; }
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);

  constructor(public authService: AuthService) {}

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  isAdmin(): boolean {
    return this.authService.user()?.role === 'ADMIN';
  }

  getInitials(): string {
    const user = this.authService.user();
    if (!user) return 'U';
    return (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
  }

  getRoleClass(): string {
    return (this.authService.user()?.role || 'USER').toLowerCase();
  }

  getRoleIcon(): string {
    const role = this.authService.user()?.role;
    if (role === 'ADMIN') return 'fa-shield-halved';
    if (role === 'OPERATOR') return 'fa-user-gear';
    return 'fa-user';
  }
}
