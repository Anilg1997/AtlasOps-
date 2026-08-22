import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <!-- Left: Form Side -->
      <div class="auth-form-side">
        <div class="auth-card animate-fadeIn">
          <div class="auth-brand">
            <div class="logo-icon"><i class="fas fa-bolt"></i></div>
            <h1>Shop<span>Hub</span></h1>
          </div>

          <!-- Step 1: Personal Info -->
          <div class="auth-step" *ngIf="step() === 1">
            <h2>Create account</h2>
            <p class="auth-subtitle">Start shopping with AI-powered assistance</p>

            <form (ngSubmit)="onStep1Submit()">
              <div class="form-row">
                <div class="form-group">
                  <label>First Name</label>
                  <div class="input-wrap" [class.focused]="firstNameFocused()">
                    <i class="fas fa-user"></i>
                    <input type="text" [(ngModel)]="firstName" name="firstName"
                           placeholder="John"
                           (focus)="firstNameFocused.set(true)"
                           (blur)="firstNameFocused.set(false)">
                  </div>
                </div>
                <div class="form-group">
                  <label>Last Name</label>
                  <div class="input-wrap" [class.focused]="lastNameFocused()">
                    <i class="fas fa-user"></i>
                    <input type="text" [(ngModel)]="lastName" name="lastName"
                           placeholder="Doe"
                           (focus)="lastNameFocused.set(true)"
                           (blur)="lastNameFocused.set(false)">
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Email</label>
                <div class="input-wrap" [class.focused]="emailFocused()">
                  <i class="fas fa-envelope"></i>
                  <input type="email" [(ngModel)]="email" name="email"
                         placeholder="john@example.com"
                         (focus)="emailFocused.set(true)"
                         (blur)="emailFocused.set(false); validateEmail()">
                </div>
                <span class="field-error" *ngIf="emailError()">{{ emailError() }}</span>
              </div>

              <div class="form-group">
                <label>Username</label>
                <div class="input-wrap" [class.focused]="usernameFocused()">
                  <i class="fas fa-at"></i>
                  <input type="text" [(ngModel)]="username" name="username"
                         placeholder="johndoe"
                         (focus)="usernameFocused.set(true)"
                         (blur)="usernameFocused.set(false)">
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-lg full-width"
                      [disabled]="!firstName || !lastName || !email || !username">
                Continue <i class="fas fa-arrow-right"></i>
              </button>
            </form>
          </div>

          <!-- Step 2: Password -->
          <div class="auth-step" *ngIf="step() === 2">
            <button class="back-btn" (click)="step.set(1); error.set('')">
              <i class="fas fa-arrow-left"></i> Back
            </button>
            <h2>Set your password</h2>
            <p class="auth-subtitle">Almost there! Create a secure password.</p>

            <form (ngSubmit)="onSignup()">
              <div class="form-group" [class.error]="passwordError()">
                <label>Password</label>
                <div class="input-wrap" [class.focused]="passwordFocused()">
                  <i class="fas fa-lock"></i>
                  <input [type]="showPassword() ? 'text' : 'password'"
                         [(ngModel)]="password" name="password"
                         placeholder="Min 6 characters"
                         (focus)="passwordFocused.set(true)"
                         (blur)="passwordFocused.set(false)"
                         autocomplete="new-password">
                  <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                    <i class="fas" [ngClass]="showPassword() ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
                <span class="field-error" *ngIf="passwordError()">{{ passwordError() }}</span>
              </div>

              <!-- Strength meter -->
              <div class="strength-meter" *ngIf="password">
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

              <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="loading() || !password">
                <span *ngIf="!loading()"><i class="fas fa-user-plus"></i> Create Account</span>
                <span *ngIf="loading()" class="loading-state">
                  <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Creating...
                </span>
              </button>
            </form>
          </div>

          <div class="auth-footer">
            <p>Already have an account? <a routerLink="/login">Sign in</a></p>
          </div>
        </div>
      </div>

      <!-- Right: Branded Side -->
      <div class="auth-branded-side">
        <div class="branded-content">
          <div class="branded-icon"><i class="fas fa-rocket"></i></div>
          <h2>Join <span class="gradient-text">10K+ Shoppers</span></h2>
          <p>Experience the future of e-commerce with our AI agent that shops for you.</p>
          <div class="features-list">
            <div class="feature"><i class="fas fa-check-circle"></i> Personalized AI recommendations</div>
            <div class="feature"><i class="fas fa-check-circle"></i> Smart budget matching</div>
            <div class="feature"><i class="fas fa-check-circle"></i> Automated checkout flow</div>
            <div class="feature"><i class="fas fa-check-circle"></i> Autonomous order issue resolution</div>
          </div>

          <div class="steps-preview">
            <div class="preview-step">
              <div class="step-num">1</div>
              <span>Create account</span>
            </div>
            <div class="step-line"></div>
            <div class="preview-step">
              <div class="step-num">2</div>
              <span>Browse products</span>
            </div>
            <div class="step-line"></div>
            <div class="preview-step">
              <div class="step-num">3</div>
              <span>AI shops for you</span>
            </div>
          </div>
        </div>

        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; background: var(--gray-50); }

    .auth-form-side {
      flex: 1; display: flex; align-items: center; justify-content: center; padding: 3rem 2rem;
    }
    .auth-card { width: 100%; max-width: 480px; }
    .auth-brand {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.5rem;
      .logo-icon { width: 48px; height: 48px; background: var(--primary); border-radius: 14px;
        display: flex; align-items: center; justify-content: center; color: white; font-size: 1.125rem; }
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

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    form { width: 100%; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.8125rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.375rem; }
    .input-wrap {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0 1rem; background: white; border: 2px solid var(--gray-200);
      border-radius: 12px; transition: all 0.2s;
      i { color: var(--gray-400); }
      input {
        flex: 1; padding: 0.875rem 0; border: none; font-size: 0.9375rem;
        font-family: inherit; background: transparent; color: var(--gray-900);
        &:focus { outline: none; }
        &::placeholder { color: var(--gray-400); }
      }
      &.focused { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    }
    .form-group.error .input-wrap { border-color: var(--danger); }
    .field-error { display: block; font-size: 0.75rem; color: var(--danger); margin-top: 0.375rem; }

    .toggle-pw { background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 4px; }

    .strength-meter { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .strength-bar { flex: 1; height: 4px; background: var(--gray-200); border-radius: 2px; overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 2px; transition: all 0.3s;
      &.weak { background: #ef4444; } &.medium { background: #f59e0b; } &.strong { background: #10b981; }
    }
    .strength-label { font-size: 0.75rem; font-weight: 600;
      &.weak { color: #ef4444; } &.medium { color: #f59e0b; } &.strong { color: #10b981; }
    }

    .error-msg {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
      color: #dc2626; font-size: 0.8125rem; margin-bottom: 1rem;
    }
    .full-width { width: 100%; }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; }
    .auth-footer { margin-top: 2rem; text-align: center; font-size: 0.875rem; color: var(--gray-500); a { font-weight: 600; } }

    .auth-branded-side {
      flex: 1; background: linear-gradient(135deg, #1e293b, #0f172a);
      display: flex; align-items: center; justify-content: center;
      padding: 3rem; position: relative; overflow: hidden;
    }
    .branded-content { max-width: 480px; z-index: 2; color: white; }
    .branded-icon {
      width: 64px; height: 64px; border-radius: 18px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: white; margin-bottom: 2rem;
    }
    .branded-content h2 { font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-bottom: 1rem; }
    .gradient-text { background: linear-gradient(135deg, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .branded-content > p { color: rgba(255,255,255,0.6); font-size: 1rem; line-height: 1.7; margin-bottom: 2rem; }
    .features-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem; }
    .feature { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9375rem; color: rgba(255,255,255,0.8); i { color: #34d399; } }

    .steps-preview { display: flex; align-items: center; gap: 1rem; }
    .preview-step { display: flex; align-items: center; gap: 0.5rem; }
    .step-num {
      width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8125rem; font-weight: 700;
    }
    .preview-step span { font-size: 0.8125rem; color: rgba(255,255,255,0.6); }
    .step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.15); }

    .deco-circle { position: absolute; border-radius: 50%; }
    .deco-1 { width: 400px; height: 400px; top: -20%; right: -10%; background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%); }
    .deco-2 { width: 300px; height: 300px; bottom: -15%; left: -10%; background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%); }

    @media (max-width: 768px) {
      .auth-branded-side { display: none; }
      .auth-form-side { padding: 2rem 1.5rem; }
    }
  `]
})
export class SignupComponent {
  firstName = '';
  lastName = '';
  email = '';
  username = '';
  password = '';
  step = signal<1 | 2>(1);
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');
  emailError = signal('');
  passwordError = signal('');
  firstNameFocused = signal(false);
  lastNameFocused = signal(false);
  emailFocused = signal(false);
  usernameFocused = signal(false);
  passwordFocused = signal(false);

  passwordStrength = computed(() => {
    const pw = this.password;
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
    const val = this.email.trim();
    if (!val) { this.emailError.set('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { this.emailError.set('Enter a valid email'); return false; }
    this.emailError.set('');
    return true;
  }

  onStep1Submit() {
    if (!this.firstName || !this.lastName || !this.email || !this.username) return;
    if (!this.validateEmail()) return;
    this.step.set(2);
    setTimeout(() => {
      const pwInput = document.querySelector('input[name="password"]') as HTMLInputElement;
      if (pwInput) pwInput.focus();
    }, 100);
  }

  onSignup() {
    if (!this.password) { this.passwordError.set('Password is required'); return; }
    if (this.password.length < 6) { this.passwordError.set('Password must be at least 6 characters'); return; }
    this.passwordError.set('');
    this.loading.set(true);
    this.error.set('');
    this.authService.register({
      username: this.username, password: this.password,
      email: this.email, firstName: this.firstName, lastName: this.lastName
    }).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/home']); },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message || 'Registration failed'); }
    });
  }
}
