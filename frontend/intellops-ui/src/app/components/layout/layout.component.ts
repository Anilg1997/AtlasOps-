import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { CartComponent } from '../cart/cart.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, CartComponent],
  template: `
    <div class="shop-layout">
      <!-- Header -->
      <header class="shop-header">
        <div class="header-inner">
          <!-- Logo -->
          <a routerLink="/" class="logo">
            <div class="logo-icon"><i class="fas fa-bolt"></i></div>
            <span class="logo-text">Shop<span class="accent">Hub</span></span>
          </a>

          <!-- Search Bar -->
          <div class="header-search">
            <i class="fas fa-search"></i>
            <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="search()"
                   placeholder="Search products, brands, categories...">
            <button class="search-btn" (click)="search()"><i class="fas fa-arrow-right"></i></button>
          </div>

          <!-- Nav Links -->
          <nav class="header-nav">
            <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              <i class="fas fa-home"></i> Home
            </a>
            <a routerLink="/products" routerLinkActive="active">
              <i class="fas fa-shopping-bag"></i> Products
            </a>
            <a routerLink="/categories" routerLinkActive="active">
              <i class="fas fa-th-large"></i> Categories
            </a>
            <a routerLink="/agent" routerLinkActive="active" class="agent-nav">
              <i class="fas fa-robot"></i> AI Agent
              <span class="ai-badge">AI</span>
            </a>
          </nav>

          <!-- Actions -->
          <div class="header-actions">
            <button class="theme-toggle" (click)="themeService.toggle()" [title]="themeService.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              <i class="fas" [ngClass]="themeService.isDark() ? 'fa-sun' : 'fa-moon'"></i>
            </button>
            <a routerLink="/wishlist" class="wishlist-btn" routerLinkActive="active">
              <i class="fas fa-heart"></i>
              <span class="wishlist-count" *ngIf="wishlistService.count() > 0">{{ wishlistService.count() }}</span>
            </a>
            <button class="cart-btn" (click)="showCart.set(!showCart())">
              <i class="fas fa-shopping-cart"></i>
              <span class="cart-count" *ngIf="cartService.itemCount() > 0">{{ cartService.itemCount() }}</span>
            </button>
            <div class="user-menu" *ngIf="authService.user() as user">
              <div class="user-avatar-sm">
                <img *ngIf="user.image" [src]="user.image" [alt]="user.firstName">
                <span *ngIf="!user.image">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</span>
              </div>
              <div class="user-dropdown">
                <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                <span class="user-email">{{ user.email }}</span>
                <button class="logout-btn" (click)="authService.logout()">
                  <i class="fas fa-right-from-bracket"></i> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="shop-main">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="shop-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <div class="logo">
              <div class="logo-icon"><i class="fas fa-bolt"></i></div>
              <span class="logo-text">Shop<span class="accent">Hub</span></span>
            </div>
            <p>Your trusted online store for premium products. Quality guaranteed.</p>
          </div>
          <div class="footer-links">
            <div class="footer-col">
              <h4>Shop</h4>
              <a routerLink="/products">All Products</a>
              <a routerLink="/categories">Categories</a>
            </div>
            <div class="footer-col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Shipping Info</a>
              <a href="#">Returns</a>
            </div>
            <div class="footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Privacy</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 ShopHub. Built with DummyJSON API.</p>
        </div>
      </footer>

      <!-- Cart Drawer -->
      <app-cart *ngIf="showCart()" (close)="showCart.set(false)"></app-cart>
    </div>
  `,
  styles: [`
    .shop-layout { display: flex; flex-direction: column; min-height: 100vh; background: var(--gray-50); }

    /* Header */
    .shop-header {
      background: var(--card-bg); border-bottom: 1px solid var(--gray-200);
      position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-inner {
      max-width: 1400px; margin: 0 auto; padding: 0 2rem;
      display: flex; align-items: center; gap: 2rem; height: 68px;
    }

    .logo {
      display: flex; align-items: center; gap: 0.75rem; text-decoration: none !important;
      flex-shrink: 0;
    }
    .logo-icon {
      width: 40px; height: 40px; background: var(--primary); border-radius: 12px;
      display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem;
    }
    .logo-text { font-size: 1.375rem; font-weight: 800; color: var(--gray-900); }
    .accent { color: var(--primary); }

    .header-search {
      flex: 1; max-width: 520px; position: relative;
      i.fa-search { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--gray-400); }
      input {
        width: 100%; padding: 0.75rem 3rem 0.75rem 2.75rem; border: 2px solid var(--gray-200);
        border-radius: 12px; font-size: 0.875rem; font-family: inherit; background: var(--gray-50);
        transition: all 0.2s;
        &:focus { outline: none; border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        &::placeholder { color: var(--gray-400); }
      }
      .search-btn {
        position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
        width: 36px; height: 36px; border-radius: 10px; border: none;
        background: var(--primary); color: white; cursor: pointer;
        display: flex; align-items: center; justify-content: center; transition: background 0.2s;
        &:hover { background: var(--primary-dark); }
      }
    }

    .header-nav { display: flex; gap: 0.25rem; }
    .header-nav a {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 1rem; border-radius: 10px;
      font-size: 0.875rem; font-weight: 500; color: var(--gray-600);
      text-decoration: none !important; transition: all 0.2s;
      i { font-size: 0.875rem; }
      &:hover { background: var(--gray-100); color: var(--gray-900); }
      &.active { background: var(--primary-50); color: var(--primary); font-weight: 600; }
    }

    .header-actions { display: flex; align-items: center; gap: 0.5rem; }
    .cart-btn {
      position: relative; width: 44px; height: 44px; border-radius: 12px;
      border: 2px solid var(--gray-200); background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--gray-700); font-size: 1.125rem; transition: all 0.2s;
      &:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-50); }
    }
    .theme-toggle {
      width: 44px; height: 44px; border-radius: 12px;
      border: 2px solid var(--gray-200); background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--gray-700); font-size: 1.125rem; transition: all 0.3s;
      &:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-50); transform: rotate(15deg); }
      i { transition: transform 0.3s; }
    }
    .wishlist-btn {
      position: relative; width: 44px; height: 44px; border-radius: 12px;
      border: 2px solid var(--gray-200); background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--gray-700); font-size: 1.125rem; transition: all 0.2s; text-decoration: none !important;
      &:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
      &.active { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
    }
    .wishlist-count {
      position: absolute; top: -6px; right: -6px;
      min-width: 20px; height: 20px; border-radius: 9999px;
      background: #ef4444; color: white; font-size: 0.625rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; padding: 0 4px;
    }
    .cart-count {
      position: absolute; top: -6px; right: -6px;
      min-width: 22px; height: 22px; border-radius: 9999px;
      background: var(--danger); color: white; font-size: 0.6875rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; padding: 0 4px;
    }

    /* Main */
    .shop-main { flex: 1; padding: 2rem; max-width: 1400px; width: 100%; margin: 0 auto; }

    /* Footer */
    .shop-footer {
      background: var(--gray-900); color: white; margin-top: 4rem;
    }
    .footer-inner {
      max-width: 1400px; margin: 0 auto; padding: 3rem 2rem 2rem;
      display: grid; grid-template-columns: 1.5fr 2fr; gap: 3rem;
    }
    .footer-brand {
      p { color: var(--gray-400); font-size: 0.875rem; margin-top: 0.75rem; line-height: 1.6; }
      .logo-text { color: white; }
    }
    .footer-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .footer-col {
      h4 { font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
        color: var(--gray-400); margin-bottom: 1rem; }
      a { display: block; font-size: 0.875rem; color: var(--gray-300); text-decoration: none;
        margin-bottom: 0.625rem; transition: color 0.2s;
        &:hover { color: white; text-decoration: underline; } }
    }
    .footer-bottom {
      border-top: 1px solid var(--gray-700); padding: 1.25rem 2rem;
      text-align: center; font-size: 0.8125rem; color: var(--gray-500);
      max-width: 1400px; margin: 0 auto;
    }

    /* Dark mode overrides for layout */
    [data-theme="dark"] .shop-header { border-bottom-color: var(--gray-300); }
    [data-theme="dark"] .shop-header .logo-text { color: var(--gray-900); }
    [data-theme="dark"] .header-search input { border-color: var(--gray-300); background: var(--gray-100); color: var(--gray-900); }
    [data-theme="dark"] .header-search input::placeholder { color: var(--gray-500); }
    [data-theme="dark"] .header-nav a { color: var(--gray-500); }
    [data-theme="dark"] .header-nav a:hover { background: var(--gray-200); color: var(--gray-900); }
    [data-theme="dark"] .header-nav a.active { background: var(--primary-50); color: var(--primary); }
    [data-theme="dark"] .theme-toggle,
    [data-theme="dark"] .wishlist-btn,
    [data-theme="dark"] .cart-btn { background: var(--gray-100); border-color: var(--gray-300); color: var(--gray-600); }
    [data-theme="dark"] .theme-toggle:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-50); }
    [data-theme="dark"] .shop-footer { background: #020617; }
    [data-theme="dark"] .footer-bottom { border-top-color: var(--gray-300); }
    [data-theme="dark"] .shop-main { background: var(--gray-50); }
    .agent-nav { position: relative; }
    .ai-badge { margin-left: 0.375rem; background: linear-gradient(135deg, #7c3aed, #a855f7);
      padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.5625rem; font-weight: 700;
      letter-spacing: 0.05em; color: white; }
    .user-menu { position: relative; margin-left: 0.5rem; cursor: pointer;
      &:hover .user-dropdown { opacity: 1; visibility: visible; transform: translateY(0); }
    }
    .user-avatar-sm { width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
      border: 2px solid var(--gray-200); display: flex; align-items: center; justify-content: center;
      background: var(--primary); color: white; font-size: 0.75rem; font-weight: 700;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .user-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px;
      background: white; border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--gray-100);
      padding: 0.75rem; opacity: 0; visibility: hidden; transform: translateY(-4px);
      transition: all 0.2s; z-index: 200;
      .user-name { display: block; font-weight: 600; font-size: 0.875rem; color: var(--gray-900); }
      .user-email { display: block; font-size: 0.75rem; color: var(--gray-500); margin-top: 0.125rem; }
      .logout-btn {
        display: flex; align-items: center; gap: 0.5rem; width: 100%; margin-top: 0.75rem;
        padding: 0.5rem 0.75rem; border: 1px solid var(--gray-200); border-radius: 8px;
        background: white; color: var(--gray-700); font-size: 0.8125rem; cursor: pointer;
        font-family: inherit; transition: all 0.2s;
        &:hover { background: #fef2f2; border-color: #fecaca; color: var(--danger); }
      }
    }

    @media (max-width: 768px) {
      .header-inner { gap: 0.75rem; padding: 0 1rem; }
      .header-nav { display: none; }
      .header-search { max-width: 250px; }
      .shop-main { padding: 1rem; }
      .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
      .footer-links { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class LayoutComponent {
  showCart = signal(false);
  searchQuery = '';

  constructor(public cartService: CartService, public wishlistService: WishlistService, public themeService: ThemeService, public authService: AuthService, private router: Router) {}

  search() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { q: this.searchQuery.trim() } });
      this.searchQuery = '';
    }
  }
}
