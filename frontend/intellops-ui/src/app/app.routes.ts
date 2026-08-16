import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'register/success',
    loadComponent: () => import('./components/auth/register-success/register-success.component').then(m => m.RegisterSuccessComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./components/order-list/order-list.component').then(m => m.OrderListComponent)
      },
      {
        path: 'orders/create',
        loadComponent: () => import('./components/order-create/order-create.component').then(m => m.OrderCreateComponent)
      },
      {
        path: 'orders/:orderNumber',
        loadComponent: () => import('./components/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
      },
      {
        path: 'copilot',
        loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./components/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'billing',
        loadComponent: () => import('./components/billing/billing.component').then(m => m.BillingComponent)
      },
      {
        path: 'feed',
        loadComponent: () => import('./components/feed/feed.component').then(m => m.FeedComponent)
      },
      {
        path: 'health',
        loadComponent: () => import('./components/health/health.component').then(m => m.HealthComponent)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
