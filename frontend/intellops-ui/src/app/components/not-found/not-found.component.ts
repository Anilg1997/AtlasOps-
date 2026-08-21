import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found animate-fadeIn">
      <div class="error-code">404</div>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <div class="actions">
        <a routerLink="/dashboard" class="btn btn-primary"><i class="fas fa-home"></i> Go to Dashboard</a>
        <a routerLink="/orders" class="btn btn-secondary"><i class="fas fa-receipt"></i> View Orders</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; }
    .error-code { font-size: 8rem; font-weight: 900; background: linear-gradient(135deg, var(--gray-200), var(--gray-300)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; margin-bottom: 1rem; }
    h1 { font-size: 2rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.5rem; }
    p { color: var(--gray-500); font-size: 1rem; margin-bottom: 2rem; }
    .actions { display: flex; gap: 1rem; }
  `]
})
export class NotFoundComponent {}
