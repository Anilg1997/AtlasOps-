import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./components/auth/signup.component').then(m => m.SignupComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./components/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./components/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'category/:category',
        loadComponent: () => import('./components/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./components/cart/cart-page.component').then(m => m.CartPageComponent)
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./components/wishlist/wishlist.component').then(m => m.WishlistComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./components/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'agent',
        loadComponent: () => import('./components/agent/agent.component').then(m => m.AgentComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
