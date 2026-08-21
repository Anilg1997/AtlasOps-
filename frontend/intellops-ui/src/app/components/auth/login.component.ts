import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card animate-fadeIn">
        <div class="auth-brand">
          <div class="logo-icon"><i class="fas fa-bolt"></i></div>
          <h1>Shop<span>Hub</span></h1>
          <p>Sign in to your account</p>
        </div>

        <!-- Role Tabs -->
        <div class="role-tabs">
          <button class="role-tab" [class.active]="activeTab() === 'user'" (click)="activeTab.set('user')">
            <i class="fas fa-user"></i> User
          </button>
          <button class="role-tab" [class.active]="activeTab() === 'admin'" (click)="activeTab.set('admin')">
            <i class="fas fa-shield-halved"></i> Admin
          </button>
        </div>

        <!-- Demo Credentials -->
        <div class="demo-info">
          <i class="fas fa-info-circle"></i>
          <span *ngIf="activeTab() === 'user'">Demo: <strong>emilys</strong> / <strong>emilyspass</strong></span>
          <span *ngIf="activeTab() === 'admin'">Demo: <strong>emilys</strong> / <strong>emilyspass</strong></span>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label><i class="fas fa-user"></i> Username</label>
            <input class="form-control" [(ngModel)]="username" name="username" placeholder="Enter username" required>
          </div>
          <div class="form-group">
            <label><i class="fas fa-lock"></i> Password</label>
            <div class="password-field">
              <input class="form-control" [(ngModel)]="password" name="password"
                     [type]="showPassword() ? 'text' : 'password'" placeholder="Enter password" required>
              <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                <i class="fas" [ngClass]="showPassword() ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>

          <div class="error-msg" *ngIf="error()">
            <i class="fas fa-exclamation-circle"></i> {{ error() }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg login-btn" [disabled]="loading()">
            <span *ngIf="!loading()"><i class="fas fa-right-to-bracket"></i> Sign In</span>
            <span *ngIf="loading()" class="loading-state">
              <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Signing in...
            </span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/signup">Create one</a></p>
        </div>

        <div class="ai-promo">
          <i class="fas fa-robot"></i>
          <span>AI Shopping Agent included — try it after login!</span>
        </div>
      </div>

      <!-- Decorative Side -->
      <div class="auth-side">
        <div class="side-content">
          <h2>Smart Shopping<br><span class="gradient-text">Powered by AI</span></h2>
          <p>Our intelligent agent helps you find the perfect products, compares prices, and handles checkout automatically.</p>
          <div class="features-list">
            <div class="feature"><i class="fas fa-check-circle"></i> AI-powered product recommendations</div>
            <div class="feature"><i class="fas fa-check-circle"></i> Automatic price comparison</div>
            <div class="feature"><i class="fas fa-check-circle"></i> Conversational shopping experience</div>
            <div class="feature"><i class="fas fa-check-circle"></i> One-click checkout</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex; min-height: 100vh; background: var(--gray-50);
    }
    .auth-card {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 3rem 2rem; max-width: 480px; margin: 0 auto;
    }
    .auth-brand {
      text-align: center; margin-bottom: 2rem;
      .logo-icon { width: 56px; height: 56px; background: var(--primary); border-radius: 16px;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;
        color: white; font-size: 1.25rem; }
      h1 { font-size: 1.75rem; font-weight: 800; color: var(--gray-900);
        span { color: var(--primary); } }
      p { color: var(--gray-500); font-size: 0.9375rem; margin-top: 0.25rem; }
    }
    .role-tabs {
      display: flex; gap: 0.5rem; background: var(--gray-100); border-radius: 12px;
      padding: 0.375rem; width: 100%; margin-bottom: 1rem;
    }
    .role-tab {
      flex: 1; padding: 0.75rem; border: none; background: transparent;
      border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      color: var(--gray-500); display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      transition: all 0.2s;
      &.active { background: white; color: var(--gray-900); box-shadow: var(--shadow); }
      &:hover:not(.active) { color: var(--gray-700); }
    }
    .demo-info {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
      background: var(--primary-50); border-radius: 10px; font-size: 0.8125rem;
      color: var(--primary); margin-bottom: 1.5rem; width: 100%;
      i { flex-shrink: 0; }
    }
    form { width: 100%; }
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: flex; align-items: center; gap: 0.375rem;
      font-size: 0.8125rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.375rem;
      i { font-size: 0.75rem; color: var(--gray-400); }
    }
    .form-control {
      width: 100%; padding: 0.75rem 1rem; border: 2px solid var(--gray-200);
      border-radius: 10px; font-size: 0.9375rem; font-family: inherit;
      background: white; color: var(--gray-900); transition: all 0.2s;
      &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      &::placeholder { color: var(--gray-400); }
    }
    .password-field { position: relative; }
    .toggle-pw {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 4px;
      &:hover { color: var(--gray-600); }
    }
    .error-msg {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
      color: #dc2626; font-size: 0.8125rem; margin-bottom: 1rem;
    }
    .login-btn { width: 100%; padding: 0.875rem; font-size: 1rem; margin-top: 0.5rem; }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; }
    .auth-footer {
      margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: var(--gray-500);
      a { font-weight: 600; }
    }
    .ai-promo {
      display: flex; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #ede9fe, #dbeafe); border-radius: 12px;
      font-size: 0.8125rem; font-weight: 500; color: var(--gray-700);
      i { color: var(--purple); }
    }

    /* Side Panel */
    .auth-side {
      flex: 1; background: linear-gradient(135deg, #1e293b, #0f172a);
      display: flex; align-items: center; justify-content: center;
      padding: 3rem; position: relative; overflow: hidden;
      &::before {
        content: ''; position: absolute; top: -30%; right: -20%;
        width: 500px; height: 500px; border-radius: 50%;
        background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%);
      }
    }
    .side-content {
      max-width: 440px; z-index: 1; color: white;
      h2 { font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-bottom: 1rem; }
      .gradient-text { background: linear-gradient(135deg, #60a5fa, #a78bfa);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      p { color: rgba(255,255,255,0.6); font-size: 1rem; line-height: 1.7; margin-bottom: 2rem; }
    }
    .features-list { display: flex; flex-direction: column; gap: 1rem; }
    .feature {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.9375rem; color: rgba(255,255,255,0.8);
      i { color: #34d399; font-size: 1rem; }
    }

    @media (max-width: 768px) {
      .auth-side { display: none; }
      .auth-card { max-width: 100%; padding: 2rem 1.5rem; }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  activeTab = signal<'user' | 'admin'>('user');
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    if (!this.username || !this.password) {
      this.error.set('Please enter username and password');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid credentials. Try emilys / emilyspass');
      }
    });
  }
}
