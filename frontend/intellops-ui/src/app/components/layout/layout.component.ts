import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <nav class="navbar">
        <div class="navbar-brand">
          <a routerLink="/dashboard" class="brand-link">
            <i class="fas fa-bolt"></i>
            <span>IntelliOps</span>
          </a>
        </div>
        <div class="navbar-links">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <i class="fas fa-chart-line"></i> Dashboard
          </a>
          <a routerLink="/orders" routerLinkActive="active">
            <i class="fas fa-receipt"></i> Orders
          </a>
          <a routerLink="/copilot" routerLinkActive="active">
            <i class="fas fa-robot"></i> AI Co-Pilot
          </a>
          <a routerLink="/inventory" routerLinkActive="active">
            <i class="fas fa-boxes-stacked"></i> Inventory
          </a>
          <a routerLink="/billing" routerLinkActive="active">
            <i class="fas fa-file-invoice-dollar"></i> Billing
          </a>
          <a routerLink="/feed" routerLinkActive="active">
            <i class="fas fa-stream"></i> Activity Feed
          </a>
          <a routerLink="/health" routerLinkActive="active">
            <i class="fas fa-heartbeat"></i> Health
          </a>
        </div>
        <div class="navbar-user">
          <span class="user-name">{{ authService.user()?.fullName || 'User' }}</span>
          <button class="btn btn-sm btn-secondary" (click)="authService.logout()">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout { min-height: 100vh; display: flex; flex-direction: column; }
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem; height: 64px; background: var(--gray-900); color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100;
    }
    .brand-link {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 1.25rem; font-weight: 700; color: white; text-decoration: none;
      i { color: var(--primary-light); }
    }
    .navbar-links { display: flex; gap: 0.25rem; }
    .navbar-links a {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem; border-radius: var(--radius);
      color: var(--gray-300); text-decoration: none; font-size: 0.875rem; font-weight: 500;
      transition: all 0.2s;
      &:hover { background: var(--gray-700); color: white; }
      &.active { background: var(--primary); color: white; }
      i { font-size: 0.875rem; }
    }
    .navbar-user {
      display: flex; align-items: center; gap: 1rem;
      .user-name { font-size: 0.875rem; color: var(--gray-300); }
    }
    .main-content { flex: 1; padding: 2rem; max-width: 1400px; margin: 0 auto; width: 100%; }
  `]
})
export class LayoutComponent {
  constructor(public authService: AuthService) {}
}
