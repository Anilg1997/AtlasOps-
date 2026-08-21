import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="wishlist-page animate-fadeIn">
      <div class="page-header-bar">
        <div>
          <h1><i class="fas fa-heart"></i> My Wishlist</h1>
          <p>{{ wishlistService.count() }} items saved</p>
        </div>
        <button class="btn btn-secondary" *ngIf="wishlistService.count() > 0"
                (click)="clearAll()">
          <i class="fas fa-trash"></i> Clear All
        </button>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="wishlistService.count() === 0">
        <div class="empty-icon"><i class="far fa-heart"></i></div>
        <h3>Your wishlist is empty</h3>
        <p>Save your favorite products by clicking the heart icon</p>
        <a routerLink="/products" class="btn btn-primary"><i class="fas fa-shopping-bag"></i> Browse Products</a>
      </div>

      <!-- Wishlist Grid -->
      <div class="wishlist-grid" *ngIf="wishlistService.count() > 0">
        <div class="wishlist-card" *ngFor="let product of wishlistService.wishlist()">
          <div class="card-image" (click)="goToProduct(product.id)">
            <img [src]="product.thumbnail" [alt]="product.title" loading="lazy">
            <span class="discount-badge" *ngIf="product.discountPercentage > 5">
              -{{ product.discountPercentage | number:'1.0-0' }}%
            </span>
          </div>
          <div class="card-body">
            <span class="product-category">{{ product.category }}</span>
            <h3 (click)="goToProduct(product.id)">{{ product.title }}</h3>
            <div class="product-rating">
              <div class="stars">
                <i *ngFor="let s of getStars(product.rating)" class="fas"
                   [ngClass]="{'fa-star': s === 'full', 'fa-star-half-alt': s === 'half', 'fa-star empty-star': s === 'empty'}"></i>
              </div>
              <span>({{ product.rating | number:'1.1-1' }})</span>
            </div>
            <div class="product-price">
              <span class="current-price">\${{ getDiscountedPrice(product) | number:'1.2-2' }}</span>
              <span class="original-price" *ngIf="product.discountPercentage > 0">\${{ product.price | number:'1.2-2' }}</span>
            </div>
            <div class="stock-status" [ngClass]="product.stock < 10 ? 'low' : 'ok'">
              <i class="fas" [ngClass]="product.stock < 10 ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
              {{ product.stock < 10 ? 'Only ' + product.stock + ' left' : 'In Stock' }}
            </div>
            <div class="card-actions">
              <button class="btn btn-primary btn-sm" (click)="addToCart(product)" [disabled]="product.stock === 0">
                <i class="fas fa-cart-plus"></i> Add to Cart
              </button>
              <button class="remove-btn" (click)="removeFromWishlist(product.id)" title="Remove from Wishlist">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wishlist-page { max-width: 1200px; margin: 0 auto; }
    .page-header-bar {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
      h1 { font-size: 1.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;
        i { color: #ef4444; } }
      p { color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem; }
    }

    .empty-state {
      text-align: center; padding: 4rem 1rem;
      .empty-icon { width: 100px; height: 100px; border-radius: 50%; background: #fef2f2;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
        i { font-size: 2.5rem; color: #fca5a5; } }
      h3 { font-size: 1.25rem; color: var(--gray-800); margin-bottom: 0.5rem; }
      p { color: var(--gray-500); margin-bottom: 1.5rem; }
    }

    .wishlist-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;
    }
    .wishlist-card {
      background: white; border-radius: 16px; overflow: hidden;
      box-shadow: var(--shadow); border: 1px solid var(--gray-100);
      transition: all 0.3s;
      &:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
    }
    .card-image {
      position: relative; height: 200px; overflow: hidden;
      background: var(--gray-50); display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      img { width: 100%; height: 100%; object-fit: contain; padding: 1rem; transition: transform 0.3s; }
      &:hover img { transform: scale(1.05); }
    }
    .discount-badge {
      position: absolute; top: 12px; left: 12px;
      background: var(--danger); color: white; padding: 0.25rem 0.75rem;
      border-radius: 9999px; font-size: 0.75rem; font-weight: 700;
    }
    .card-body { padding: 1.25rem; }
    .product-category {
      font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--primary); font-weight: 600;
    }
    .card-body h3 {
      font-size: 0.9375rem; font-weight: 600; margin: 0.375rem 0 0.5rem;
      color: var(--gray-900); line-height: 1.3; cursor: pointer;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      &:hover { color: var(--primary); }
    }
    .product-rating { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .stars { display: flex; gap: 2px; }
    .stars i { font-size: 0.75rem; color: #f59e0b; }
    .stars .empty-star { color: var(--gray-300); }
    .product-rating span { font-size: 0.75rem; color: var(--gray-500); }
    .product-price { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.5rem; }
    .current-price { font-size: 1.25rem; font-weight: 700; color: var(--gray-900); }
    .original-price { font-size: 0.875rem; color: var(--gray-400); text-decoration: line-through; }
    .stock-status {
      display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem;
      &.ok { color: var(--success); }
      &.low { color: var(--warning); }
    }
    .card-actions { display: flex; gap: 0.5rem; }
    .card-actions .btn { flex: 1; }
    .remove-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--gray-200);
      background: white; color: var(--gray-400); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.8125rem;
      transition: all 0.2s; flex-shrink: 0;
      &:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
    }
  `]
})
export class WishlistComponent {
  constructor(
    public wishlistService: WishlistService,
    private cartService: CartService,
    private router: Router
  ) {}

  getDiscountedPrice(product: Product): number { return ProductService.discountedPrice(product); }
  getStars(rating: number) { return ProductService.starsArray(rating); }

  addToCart(product: Product) {
    this.cartService.addItem(product);
  }

  removeFromWishlist(productId: number) {
    this.wishlistService.remove(productId);
  }

  clearAll() {
    this.wishlistService.wishlist().forEach(p => this.wishlistService.remove(p.id));
  }

  goToProduct(id: number) {
    this.router.navigate(['/product', id]);
  }
}
