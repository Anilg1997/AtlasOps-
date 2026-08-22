import { Component, signal, computed } from '@angular/core';
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
      <!-- Left: Form Side -->
      <div class="auth-form-side">
        <div class="auth-card animate-fadeIn">
          <!-- Brand -->
          <div class="auth-brand">
            <div class="logo-icon"><i class="fas fa-bolt"></i></div>
            <h1>Shop<span>Hub</span></h1>
          </div>

          <!-- Step 1: Email/Username -->
          <div class="auth-step" *ngIf="step() === 1">
            <h2>Welcome back</h2>
            <p class="auth-subtitle">Sign in to continue shopping</p>

            <form (ngSubmit)="onEmailSubmit()">
              <div class="form-group" [class.error]="emailError()">
                <label>Email or Username</label>
                <div class="input-wrap" [class.focused]="emailFocused()">
                  <i class="fas fa-user"></i>
                  <input type="text" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email"
                         placeholder="Enter email or username"
                         (focus)="emailFocused.set(true)"
                         (blur)="emailFocused.set(false); validateEmail()"
                         autocomplete="username">
                  <i class="fas fa-check-circle valid-icon" *ngIf="email() && !emailError()"></i>
                </div>
                <span class="field-error" *ngIf="emailError()">{{ emailError() }}</span>
              </div>

              <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="!email()">
                Continue <i class="fas fa-arrow-right"></i>
              </button>
            </form>

            <!-- Continue as Guest -->
            <div class="guest-divider">
              <span>or</span>
            </div>
            <button class="btn-guest" (click)="continueAsGuest()">
              <i class="fas fa-eye"></i> Continue as Guest — Browse Products
            </button>
          </div>

          <!-- Step 2: Password -->
          <div class="auth-step" *ngIf="step() === 2">
            <button class="back-btn" (click)="step.set(1); error.set('')">
              <i class="fas fa-arrow-left"></i> Back
            </button>
            <h2>Enter password</h2>
            <p class="auth-subtitle">
              Signing in as <strong>{{ email() }}</strong>
            </p>

            <!-- Role Tabs -->
            <div class="role-tabs">
              <button class="role-tab" [class.active]="activeTab() === 'user'" (click)="activeTab.set('user')">
                <i class="fas fa-user"></i> User
              </button>
              <button class="role-tab" [class.active]="activeTab() === 'admin'" (click)="activeTab.set('admin')">
                <i class="fas fa-shield-halved"></i> Admin
              </button>
            </div>

            <div class="demo-info" *ngIf="activeTab() === 'user'">
              <i class="fas fa-info-circle"></i>
              Demo: <strong>emilys</strong> / <strong>emilyspass</strong>
            </div>

            <form (ngSubmit)="onLogin()">
              <div class="form-group" [class.error]="passwordError()">
                <label>Password</label>
                <div class="input-wrap" [class.focused]="passwordFocused()">
                  <i class="fas fa-lock"></i>                    <input [type]="showPassword() ? 'text' : 'password'"
                         [ngModel]="password()" (ngModelChange)="password.set($event)" name="password"
                         placeholder="Enter your password"
                         (focus)="passwordFocused.set(true)"
                         (blur)="passwordFocused.set(false)"
                         autocomplete="current-password">
                  <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                    <i class="fas" [ngClass]="showPassword() ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
                <span class="field-error" *ngIf="passwordError()">{{ passwordError() }}</span>
              </div>

              <!-- Password strength meter -->
              <div class="strength-meter" *ngIf="password()">
                <div class="strength-bar">
                  <div class="strength-fill" [style.width]="passwordStrength() + '%'"
                       [class.weak]="passwordStrength() < 33"
                       [class.medium]="passwordStrength() >= 33 && passwordStrength() < 66"
                       [class.strong]="passwordStrength() >= 66"></div>
                </div>
                <span class="strength-label" [ngClass]="{
                  'weak': passwordStrength() < 33,
                  'medium': passwordStrength() >= 33 && passwordStrength() < 66,
                  'strong': passwordStrength() >= 66
                }">{{ passwordStrengthLabel() }}</span>
              </div>

              <div class="error-msg" *ngIf="error()">
                <i class="fas fa-exclamation-circle"></i> {{ error() }}
              </div>

              <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="loading() || !password()">
                <span *ngIf="!loading()"><i class="fas fa-right-to-bracket"></i> Sign In</span>
                <span *ngIf="loading()" class="loading-state">
                  <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Signing in...
                </span>
              </button>
            </form>
          </div>

          <div class="auth-footer">
            <p *ngIf="step() === 1">Don't have an account? <a routerLink="/signup">Create one</a></p>
            <p *ngIf="step() === 2">Need help? <a href="#">Contact support</a></p>
          </div>
        </div>
      </div>

      <!-- Right: Branded Side -->
      <div class="auth-branded-side">
        <div class="branded-content">
          <div class="branded-icon"><i class="fas fa-robot"></i></div>
          <h2>Smart Shopping<br><span class="gradient-text">Powered by AI</span></h2>
          <p>Our intelligent agent helps you find the perfect products, compares prices, and handles checkout automatically.</p>
          <div class="features-list">
            <div class="feature"><i class="fas fa-check-circle"></i> AI-powered product recommendations</div>
            <div class="feature"><i class="fas fa-check-circle"></i> Automatic price comparison</div>
            <div class="feature"><i class="fas fa-check-circle"></i> Autonomous order issue resolution</div>
            <div class="feature"><i class="fas fa-check-circle"></i> Conversational shopping experience</div>
          </div>

          <div class="testimonial">
            <div class="testimonial-stars">
              <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
            </div>
            <p>"The AI agent resolved my payment issue automatically — no waiting on hold!"</p>
            <span class="testimonial-author">— Sarah C., Power Shopper</span>
          </div>
        </div>

        <!-- Decorative elements -->
        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
        <div class="deco-circle deco-3"></div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; background: var(--gray-50); }

    /* ── Form Side ── */
    .auth-form-side {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 3rem 2rem;
    }
    .auth-card { width: 100%; max-width: 440px; }
    .auth-brand {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.5rem;
      .logo-icon {
        width: 48px; height: 48px; background: var(--primary); border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 1.125rem;
      }
      h1 { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); span { color: var(--primary); } }
    }

    .auth-step h2 { font-size: 1.75rem; font-weight: 800; color: var(--gray-900); margin-bottom: 0.25rem; }
    .auth-subtitle { color: var(--gray-500); font-size: 0.9375rem; margin-bottom: 2rem; }

    .back-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.375rem 0.75rem; margin-bottom: 1.5rem;
      background: none; border: none; color: var(--gray-500); cursor: pointer;
      font-size: 0.875rem; font-family: inherit; border-radius: 8px;
      &:hover { background: var(--gray-100); color: var(--gray-700); }
    }

    .role-tabs {
      display: flex; gap: 0.5rem; background: var(--gray-100); border-radius: 12px;
      padding: 0.375rem; margin-bottom: 1rem;
    }
    .role-tab {
      flex: 1; padding: 0.625rem; border: none; background: transparent;
      border-radius: 10px; font-size: 0.8125rem; font-weight: 600; cursor: pointer;
      color: var(--gray-500); display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      transition: all 0.2s;
      &.active { background: white; color: var(--gray-900); box-shadow: var(--shadow); }
      &:hover:not(.active) { color: var(--gray-700); }
    }

    .demo-info {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
      background: var(--primary-50); border-radius: 10px; font-size: 0.8125rem;
      color: var(--primary); margin-bottom: 1.5rem; width: 100%;
    }

    form { width: 100%; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label {
      display: block; font-size: 0.8125rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.375rem;
    }
    .input-wrap {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0 1rem; background: white; border: 2px solid var(--gray-200);
      border-radius: 12px; transition: all 0.2s;
      i { color: var(--gray-400); font-size: 1rem; }
      input {
        flex: 1; padding: 0.875rem 0; border: none; font-size: 0.9375rem;
        font-family: inherit; background: transparent; color: var(--gray-900);
        &:focus { outline: none; }
        &::placeholder { color: var(--gray-400); }
      }
      &.focused { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    }
    .form-group.error .input-wrap { border-color: var(--danger); }
    .valid-icon { color: var(--success) !important; }
    .field-error { display: block; font-size: 0.75rem; color: var(--danger); margin-top: 0.375rem; }

    .toggle-pw {
      background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 4px;
      &:hover { color: var(--gray-600); }
    }

    /* Strength meter */
    .strength-meter { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
    .strength-bar { flex: 1; height: 4px; background: var(--gray-200); border-radius: 2px; overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 2px; transition: all 0.3s;
      &.weak { background: #ef4444; }
      &.medium { background: #f59e0b; }
      &.strong { background: #10b981; }
    }
    .strength-label { font-size: 0.75rem; font-weight: 600;
      &.weak { color: #ef4444; }
      &.medium { color: #f59e0b; }
      &.strong { color: #10b981; }
    }

    .error-msg {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
      color: #dc2626; font-size: 0.8125rem; margin-bottom: 1rem;
    }

    .full-width { width: 100%; }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; }

    .guest-divider {
      display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--gray-200); }
      span { font-size: 0.8125rem; color: var(--gray-400); }
    }
    .btn-guest {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      width: 100%; padding: 0.875rem; border: 2px solid var(--gray-200);
      border-radius: 12px; background: white; color: var(--gray-700);
      font-size: 0.9375rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: all 0.2s;
      &:hover { border-color: var(--gray-300); background: var(--gray-50); }
    }

    .auth-footer { margin-top: 2rem; text-align: center; font-size: 0.875rem; color: var(--gray-500); a { font-weight: 600; } }

    /* ── Branded Side ── */
    .auth-branded-side {
      flex: 1; background: linear-gradient(135deg, #1e293b, #0f172a);
      display: flex; align-items: center; justify-content: center;
      padding: 3rem; position: relative; overflow: hidden;
    }
    .branded-content { max-width: 480px; z-index: 2; color: white; }
    .branded-icon {
      width: 64px; height: 64px; border-radius: 18px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: white; margin-bottom: 2rem;
    }
    .branded-content h2 {
      font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-bottom: 1rem;
    }
    .gradient-text {
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .branded-content > p { color: rgba(255,255,255,0.6); font-size: 1rem; line-height: 1.7; margin-bottom: 2rem; }
    .features-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2.5rem; }
    .feature {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.9375rem; color: rgba(255,255,255,0.8);
      i { color: #34d399; }
    }

    .testimonial {
      padding: 1.5rem; background: rgba(255,255,255,0.05); border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .testimonial-stars { color: #f59e0b; font-size: 0.875rem; margin-bottom: 0.75rem; i { margin-right: 2px; } }
    .testimonial p { font-size: 0.9375rem; color: rgba(255,255,255,0.8); font-style: italic; margin-bottom: 0.75rem; }
    .testimonial-author { font-size: 0.8125rem; color: rgba(255,255,255,0.5); }

    .deco-circle {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%);
    }
    .deco-1 { width: 400px; height: 400px; top: -20%; right: -10%; }
    .deco-2 { width: 300px; height: 300px; bottom: -15%; left: -10%; background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%); }
    .deco-3 { width: 200px; height: 200px; top: 40%; left: 20%; background: radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%); }

    @media (max-width: 768px) {
      .auth-branded-side { display: none; }
      .auth-form-side { padding: 2rem 1.5rem; }
    }
  `]
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  step = signal<1 | 2>(1);
  activeTab = signal<'user' | 'admin'>('user');
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');
  emailError = signal('');
  passwordError = signal('');
  emailFocused = signal(false);
  passwordFocused = signal(false);

  passwordStrength = computed(() => {
    const pw = this.password();
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score += 20;
    if (pw.length >= 8) score += 15;
    if (pw.length >= 12) score += 15;
    if (/[A-Z]/.test(pw)) score += 15;
    if (/[0-9]/.test(pw)) score += 15;
    if (/[^A-Za-z0-9]/.test(pw)) score += 20;
    return Math.min(score, 100);
  });

  passwordStrengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s < 33) return 'Weak';
    if (s < 66) return 'Medium';
    return 'Strong';
  });

  constructor(private authService: AuthService, private router: Router) {}

  validateEmail() {
    const val = this.email().trim();
    if (!val) { this.emailError.set('Email or username is required'); return false; }
    if (val.length < 2) { this.emailError.set('Enter a valid email or username'); return false; }
    this.emailError.set('');
    return true;
  }

  onEmailSubmit() {
    if (!this.validateEmail()) return;
    this.step.set(2);
    // Auto-focus password field
    setTimeout(() => {
      const pwInput = document.querySelector('input[name="password"]') as HTMLInputElement;
      if (pwInput) pwInput.focus();
    }, 100);
  }

  onLogin() {
    if (!this.password()) { this.passwordError.set('Password is required'); return; }
    this.passwordError.set('');
    this.loading.set(true);
    this.error.set('');

    const username = this.email();
    this.authService.login(username, this.password()).subscribe({
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

  continueAsGuest() {
    // Guest mode: login with default demo credentials
    this.loading.set(true);
    this.authService.login('emilys', 'emilyspass').subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/home']); },
      error: () => { this.loading.set(false); this.router.navigate(['/home']); }
    });
  }
}
