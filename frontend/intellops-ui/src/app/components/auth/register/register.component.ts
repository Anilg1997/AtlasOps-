import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/notification/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card animate-fadeIn">
        <div class="auth-header">
          <div class="logo"><i class="fas fa-bolt"></i></div>
          <h1>Create Account</h1>
          <p>Join IntelliOps Platform</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input id="firstName" type="text" class="form-control" [(ngModel)]="firstName" name="firstName" required>
            </div>
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input id="lastName" type="text" class="form-control" [(ngModel)]="lastName" name="lastName" required>
            </div>
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input id="email" type="email" class="form-control" [(ngModel)]="email" name="email" placeholder="you@company.com" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" class="form-control" [(ngModel)]="password" name="password" placeholder="Min 8 characters" required minlength="8">
          </div>
          <div class="error-message" *ngIf="error">{{ error }}</div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            <span class="spinner" *ngIf="loading"></span>
            <span *ngIf="!loading">Create Account</span>
          </button>
        </form>
        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, var(--gray-900), var(--gray-700)); }
    .auth-card { background: white; border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 480px; box-shadow: var(--shadow-lg); }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .logo { width: 64px; height: 64px; background: var(--primary); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; i { color: white; font-size: 1.75rem; } }
    .auth-header h1 { font-size: 1.5rem; font-weight: 700; }
    .auth-header p { color: var(--gray-500); font-size: 0.875rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .btn-block { width: 100%; justify-content: center; padding: 0.75rem; font-size: 1rem; }
    .error-message { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: var(--radius); font-size: 0.875rem; margin-bottom: 1rem; }
    .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--gray-500); }
  `]
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router, private toastService: ToastService) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.authService.register({ email: this.email, password: this.password, firstName: this.firstName, lastName: this.lastName })
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastService.success('Account created', 'You can now sign in');
          this.router.navigate(['/register/success']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Registration failed';
          this.toastService.error('Registration failed', this.error);
        }
      });
  }
}
