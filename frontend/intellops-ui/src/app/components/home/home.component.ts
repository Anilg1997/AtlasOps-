import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home animate-fadeIn">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">
            <i class="fas fa-fire"></i> Trending Now
          </div>
          <h1>Discover <span class="gradient-text">Premium Products</span></h1>
          <p>Shop the latest collection from top brands. Quality products at unbeatable prices with fast delivery.</p>
          <div class="hero-actions">
            <a routerLink="/products" class="btn btn-primary btn-lg">
              <i class="fas fa-shopping-bag"></i> Shop Now
            </a>
            <a routerLink="/categories" class="btn btn-outline btn-lg">
              <i class="fas fa-th-large"></i> Browse Categories
            </a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="stat-num">194+</span>
              <span class="stat-text">Products</span>
            </div>
            <div class="hero-stat">
              <span class="stat-num">24</span>
              <span class="stat-text">Categories</span>
            </div>
            <div class="hero-stat">
              <span class="stat-num">4.5</span>
              <span class="stat-text">Avg Rating</span>
            </div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-card hero-card-1">
            <img src="https://cdn.dummyjson.com/products/images/smartphones/iPhone%209/thumbnail.webp" alt="iPhone" loading="lazy">
          </div>
          <div class="hero-card hero-card-2">
            <img src="https://cdn.dummyjson.com/products/images/laptops/MacBook%20Pro/thumbnail.webp" alt="MacBook" loading="lazy">
          </div>
          <div class="hero-card hero-card-3">
            <img src="https://cdn.dummyjson.com/products/images/sunglasses/Sunglasses/thumbnail.webp" alt="Sunglasses" loading="lazy">
          </div>
        </div>
      </section>

      <!-- Featured Products -->
      <section class="section">
        <div class="section-header">
          <div>
            <h2><i class="fas fa-star"></i> Featured Products</h2>
            <p>Hand-picked top-rated products</p>
          </div>
          <a routerLink="/products" class="view-all">View All <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="products-grid">
          <div class="product-card" *ngFor="let product of featuredProducts" (click)="goToProduct(product.id)">
            <div class="product-image">
              <img [src]="product.thumbnail" [alt]="product.title" loading="lazy">
              <span class="discount-badge" *ngIf="product.discountPercentage > 5">
                -{{ product.discountPercentage | number:'1.0-0' }}%
              </span>
              <button class="heart-btn" [class.active]="wishlistService.isWishlisted(product.id)"
                      title="{{ wishlistService.isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist' }}"
                      (click)="toggleWishlist(product, $event)">
                <i class="fas" [ngClass]="wishlistService.isWishlisted(product.id) ? 'fa-heart' : 'fa-heart'"></i>
              </button>
              <div class="product-overlay">
                <button class="btn-icon-circle" title="Quick Add" (click)="addToCart(product, $event)">
                  <i class="fas fa-cart-plus"></i>
                </button>
                <button class="btn-icon-circle" title="View Details" (click)="goToProduct(product.id); $event.stopPropagation()">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <div class="product-info">
              <span class="product-category">{{ product.category }}</span>
              <h3>{{ product.title }}</h3>
              <div class="product-rating">
                <div class="stars">
                  <i *ngFor="let s of getStars(product.rating)" class="fas"
                     [ngClass]="{'fa-star': s === 'full', 'fa-star-half-alt': s === 'half', 'fa-star empty-star': s === 'empty'}"></i>
                </div>
                <span class="rating-count">({{ product.rating | number:'1.1-1' }})</span>
              </div>
              <div class="product-price">
                <span class="current-price">\${{ getDiscountedPrice(product) | number:'1.2-2' }}</span>
                <span class="original-price" *ngIf="product.discountPercentage > 0">\${{ product.price | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="section">
        <div class="section-header">
          <div>
            <h2><i class="fas fa-th-large"></i> Shop by Category</h2>
            <p>Find what you're looking for</p>
          </div>
          <a routerLink="/categories" class="view-all">All Categories <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="categories-grid">
          <a *ngFor="let cat of displayCategories" [routerLink]="['/category', cat.slug]" class="category-card">
            <div class="cat-icon" [style.background]="getCatColor(cat.slug)">
              <i class="fas" [ngClass]="getCatIcon(cat.slug)"></i>
            </div>
            <span class="cat-name">{{ cat.name }}</span>
          </a>
        </div>
      </section>

      <!-- Top Deals -->
      <section class="section">
        <div class="section-header">
          <div>
            <h2><i class="fas fa-fire-flame-curved"></i> Top Deals</h2>
            <p>Biggest discounts right now</p>
          </div>
        </div>
        <div class="deals-grid">
          <div class="deal-card" *ngFor="let product of topDeals" (click)="goToProduct(product.id)">
            <div class="deal-image">
              <img [src]="product.thumbnail" [alt]="product.title" loading="lazy">
              <span class="deal-badge">-{{ product.discountPercentage | number:'1.0-0' }}%</span>
            </div>
            <div class="deal-info">
              <span class="deal-brand" *ngIf="product.brand">{{ product.brand }}</span>
              <h4>{{ product.title }}</h4>
              <div class="deal-prices">
                <span class="deal-price">\${{ getDiscountedPrice(product) | number:'1.2-2' }}</span>
                <span class="deal-original">\${{ product.price | number:'1.2-2' }}</span>
                <span class="deal-save">Save \${{ (product.price - getDiscountedPrice(product)) | number:'1.2-2' }}</span>
              </div>
              <div class="stock-indicator" [ngClass]="product.stock < 10 ? 'low' : 'ok'">
                <i class="fas" [ngClass]="product.stock < 10 ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
                {{ product.stock < 10 ? 'Only ' + product.stock + ' left' : 'In Stock' }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home { max-width: 1400px; margin: 0 auto; }

    /* Hero */
    .hero {
      display: flex; align-items: center; gap: 3rem;
      padding: 3rem 2rem; margin-bottom: 3rem;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 24px; overflow: hidden; position: relative;
      color: white;
    }
    .hero::before {
      content: ''; position: absolute; top: -50%; right: -20%;
      width: 600px; height: 600px; border-radius: 50%;
      background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%);
    }
    .hero-content { flex: 1; z-index: 1; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
      padding: 0.5rem 1rem; border-radius: 9999px;
      font-size: 0.8125rem; font-weight: 600; margin-bottom: 1.5rem;
      border: 1px solid rgba(255,255,255,0.15);
      i { color: #f59e0b; }
    }
    .hero h1 { font-size: 3rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem; }
    .gradient-text {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero p { font-size: 1.125rem; color: rgba(255,255,255,0.7); margin-bottom: 2rem; max-width: 480px; }
    .hero-actions { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .btn-lg { padding: 0.875rem 2rem; font-size: 1rem; }
    .btn-outline {
      background: transparent; color: white; border: 2px solid rgba(255,255,255,0.3);
      &:hover { background: rgba(255,255,255,0.1); border-color: white; text-decoration: none; }
    }
    .hero-stats { display: flex; gap: 2rem; }
    .hero-stat { display: flex; flex-direction: column; }
    .stat-num { font-size: 1.5rem; font-weight: 700; }
    .stat-text { font-size: 0.8125rem; color: rgba(255,255,255,0.5); }
    .hero-visual {
      flex: 0 0 380px; position: relative; height: 320px; z-index: 1;
    }
    .hero-card {
      position: absolute; background: white; border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .hero-card-1 { width: 180px; height: 200px; top: 0; right: 100px; z-index: 3; transform: rotate(-3deg); }
    .hero-card-2 { width: 160px; height: 180px; top: 40px; right: 0; z-index: 2; transform: rotate(3deg); }
    .hero-card-3 { width: 140px; height: 160px; bottom: 0; right: 60px; z-index: 1; transform: rotate(-5deg); }

    @media (max-width: 900px) {
      .hero { flex-direction: column; text-align: center; padding: 2rem 1.5rem; }
      .hero h1 { font-size: 2rem; }
      .hero p { margin: 0 auto 2rem; }
      .hero-actions { justify-content: center; }
      .hero-stats { justify-content: center; }
      .hero-visual { display: none; }
    }

    /* Section */
    .section { margin-bottom: 3rem; }
    .section-header {
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-900);
        i { color: var(--primary); } }
      p { color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem; }
    }
    .view-all {
      font-size: 0.875rem; font-weight: 600; color: var(--primary); display: flex; align-items: center; gap: 0.25rem;
      &:hover { text-decoration: underline; }
    }

    /* Products Grid */
    .products-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;
    }
    .product-card {
      background: white; border-radius: 16px; overflow: hidden;
      box-shadow: var(--shadow); border: 1px solid var(--gray-100);
      cursor: pointer; transition: all 0.3s;
      &:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px);
        .product-overlay { opacity: 1; }
        .product-image img { transform: scale(1.05); }
      }
    }
    .product-image {
      position: relative; height: 200px; overflow: hidden;
      background: var(--gray-50); display: flex; align-items: center; justify-content: center;
      img { width: 100%; height: 100%; object-fit: contain; padding: 1rem; transition: transform 0.3s; }
    }
    .heart-btn {
      position: absolute; top: 12px; right: 12px; z-index: 2;
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);
      color: var(--gray-400); cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: all 0.25s;
      &:hover { transform: scale(1.15); color: #ef4444; background: white; }
      &.active { color: #ef4444; background: #fef2f2;
        i { animation: heartBeat 0.4s ease; }
      }
    }
    @keyframes heartBeat {
      0% { transform: scale(1); }
      30% { transform: scale(1.3); }
      60% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    .discount-badge {
      position: absolute; top: 12px; left: 12px;
      background: var(--danger); color: white; padding: 0.25rem 0.75rem;
      border-radius: 9999px; font-size: 0.75rem; font-weight: 700;
    }
    .product-overlay {
      position: absolute; bottom: 12px; right: 12px;
      display: flex; gap: 0.5rem; opacity: 0; transition: opacity 0.3s;
    }
    .btn-icon-circle {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: white; color: var(--primary); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.2s;
      &:hover { background: var(--primary); color: white; }
    }
    .product-info { padding: 1rem 1.25rem 1.25rem; }
    .product-category {
      font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--primary); font-weight: 600;
    }
    .product-info h3 {
      font-size: 0.9375rem; font-weight: 600; margin: 0.375rem 0 0.5rem;
      color: var(--gray-900); line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .product-rating { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .stars { display: flex; gap: 2px; }
    .stars i { font-size: 0.75rem; color: #f59e0b; }
    .stars .empty-star { color: var(--gray-300); }
    .rating-count { font-size: 0.75rem; color: var(--gray-500); }
    .product-price { display: flex; align-items: baseline; gap: 0.5rem; }
    .current-price { font-size: 1.25rem; font-weight: 700; color: var(--gray-900); }
    .original-price { font-size: 0.875rem; color: var(--gray-400); text-decoration: line-through; }

    /* Categories */
    .categories-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;
    }
    .category-card {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 1.5rem 1rem; background: white; border-radius: 16px;
      box-shadow: var(--shadow); border: 1px solid var(--gray-100);
      text-decoration: none !important; color: var(--gray-700); transition: all 0.3s;
      &:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); background: var(--primary); color: white;
        .cat-icon { background: rgba(255,255,255,0.2); color: white; }
      }
    }
    .cat-icon {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
      transition: all 0.3s;
    }
    .cat-name { font-size: 0.8125rem; font-weight: 600; text-align: center; }

    /* Deals */
    .deals-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem;
    }
    .deal-card {
      display: flex; gap: 1rem; padding: 1rem;
      background: white; border-radius: 16px; box-shadow: var(--shadow);
      border: 1px solid var(--gray-100); cursor: pointer; transition: all 0.3s;
      &:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
    }
    .deal-image {
      position: relative; width: 120px; height: 120px; flex-shrink: 0;
      background: var(--gray-50); border-radius: 12px; overflow: hidden;
      img { width: 100%; height: 100%; object-fit: contain; padding: 0.5rem; }
    }
    .deal-badge {
      position: absolute; top: 6px; left: 6px;
      background: var(--danger); color: white; padding: 0.15rem 0.5rem;
      border-radius: 6px; font-size: 0.6875rem; font-weight: 700;
    }
    .deal-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .deal-brand { font-size: 0.6875rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .deal-info h4 { font-size: 0.9375rem; font-weight: 600; color: var(--gray-900); margin: 0.25rem 0; line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .deal-prices { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
    .deal-price { font-size: 1.125rem; font-weight: 700; color: var(--primary); }
    .deal-original { font-size: 0.8125rem; color: var(--gray-400); text-decoration: line-through; }
    .deal-save { font-size: 0.6875rem; color: var(--success); font-weight: 600; }
    .stock-indicator { font-size: 0.75rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.375rem;
      &.ok { color: var(--success); }
      &.low { color: var(--warning); }
    }
  `]
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  topDeals: Product[] = [];
  displayCategories: { slug: string; name: string }[] = [];

  private categoryColors: Record<string, string> = {
    beauty: '#fce7f3', fragrances: '#ede9fe', furniture: '#fef3c7',
    groceries: '#d1fae5', 'home-decoration': '#ffedd5', 'kitchen-accessories': '#e0f2fe',
    laptops: '#dbeafe', 'mens-shirts': '#cffafe', 'mens-shoes': '#f3e8ff',
    'mens-watches': '#fef9c3', 'mobile-accessories': '#e0e7ff', motorcycle: '#fee2e2',
    'skin-care': '#fce7f3', smartphones: '#dbeafe', 'sports-accessories': '#d1fae5',
    sunglasses: '#fef3c7', tablets: '#e0f2fe', tops: '#cffafe', vehicle: '#fee2e2',
    'womens-bags': '#fce7f3', 'womens-dresses': '#ede9fe', 'womens-jewellery': '#fef9c3',
    'womens-shoes': '#e0f2fe', 'womens-watches': '#f3e8ff'
  };
  private categoryIcons: Record<string, string> = {
    beauty: 'fa-palette', fragrances: 'fa-spray-can', furniture: 'fa-couch',
    groceries: 'fa-apple-whole', 'home-decoration': 'fa-vase', 'kitchen-accessories': 'fa-utensils',
    laptops: 'fa-laptop', 'mens-shirts': 'fa-shirt', 'mens-shoes': 'fa-shoe-prints',
    'mens-watches': 'fa-clock', 'mobile-accessories:': 'fa-headphones', motorcycle: 'fa-motorcycle',
    'skin-care': 'fa-spa', smartphones: 'fa-mobile-alt', 'sports-accessories': 'fa-dumbbell',
    sunglasses: 'fa-glasses', tablets: 'fa-tablet-alt', tops: 'fa-vest',
    vehicle: 'fa-car', 'womens-bags': 'fa-bag-shopping', 'womens-dresses': 'fa-vest-patches',
    'womens-jewellery': 'fa-gem', 'womens-shoes': 'fa-shoe-prints', 'womens-watches': 'fa-clock'
  };

  constructor(private productService: ProductService, private cartService: CartService, private router: Router, public wishlistService: WishlistService) {}

  ngOnInit() {
    this.productService.getProducts({ limit: 8, sortBy: 'rating', order: 'desc' })
      .subscribe(res => this.featuredProducts = res.products);

    this.productService.getProducts({ limit: 6, sortBy: 'discountPercentage', order: 'desc' })
      .subscribe(res => this.topDeals = res.products);

    this.productService.getCategories()
      .subscribe(cats => this.displayCategories = cats.slice(0, 12));
  }

  getDiscountedPrice(product: Product): number {
    return ProductService.discountedPrice(product);
  }

  getStars(rating: number) { return ProductService.starsArray(rating); }

  getCatColor(slug: string): string { return this.categoryColors[slug] || '#f1f5f9'; }
  getCatIcon(slug: string): string { return this.categoryIcons[slug] || 'fa-folder'; }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addItem(product);
  }

  toggleWishlist(product: Product, event: Event) {
    event.stopPropagation();
    this.wishlistService.toggle(product);
  }

  goToProduct(id: number) {
    this.router.navigate(['/product', id]);
  }
}
