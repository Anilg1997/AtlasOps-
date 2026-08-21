import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="product-detail animate-fadeIn" *ngIf="product() as p">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/">Home</a> <i class="fas fa-chevron-right"></i>
        <a routerLink="/products">Products</a> <i class="fas fa-chevron-right"></i>
        <a [routerLink]="['/category', p.category]">{{ p.category }}</a> <i class="fas fa-chevron-right"></i>
        <span class="current">{{ p.title }}</span>
      </nav>

      <div class="detail-grid">
        <!-- Images -->
        <div class="images-section">
          <div class="main-image">
            <img [src]="selectedImage() || p.thumbnail" [alt]="p.title">
            <span class="discount-badge" *ngIf="p.discountPercentage > 0">-{{ p.discountPercentage | number:'1.0-0' }}%</span>
          </div>
          <div class="thumbnail-row">
            <button *ngFor="let img of getAllImages(p)" class="thumb" [class.active]="selectedImage() === img"
                    (click)="selectedImage.set(img)">
              <img [src]="img" [alt]="p.title">
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="info-section">
          <div class="info-header">
            <span class="category-chip">{{ p.category }}</span>
            <div class="rating-badge">
              <i class="fas fa-star"></i> {{ p.rating | number:'1.1-1' }}
            </div>
          </div>
          <h1>{{ p.title }}</h1>
          <p class="brand" *ngIf="p.brand">by <strong>{{ p.brand }}</strong></p>

          <p class="description">{{ p.description }}</p>

          <div class="price-section">
            <span class="current-price">\${{ getDiscountedPrice(p) | number:'1.2-2' }}</span>
            <span class="original-price" *ngIf="p.discountPercentage > 0">\${{ p.price | number:'1.2-2' }}</span>
            <span class="savings" *ngIf="p.discountPercentage > 0">
              You save \${{ (p.price - getDiscountedPrice(p)) | number:'1.2-2' }} ({{ p.discountPercentage | number:'1.0-0' }}%)
            </span>
          </div>

          <!-- Stock & Availability -->
          <div class="availability" [ngClass]="p.stock < 10 ? 'low' : 'ok'">
            <i class="fas" [ngClass]="p.stock < 10 ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
            {{ p.availabilityStatus }} — {{ p.stock }} units available
          </div>

          <!-- Quantity & Add to Cart -->
          <div class="purchase-section">
            <div class="quantity-control">
              <button class="qty-btn" (click)="decrementQty()" [disabled]="quantity() <= 1"><i class="fas fa-minus"></i></button>
              <span class="qty-value">{{ quantity() }}</span>
              <button class="qty-btn" (click)="incrementQty()" [disabled]="quantity() >= p.stock"><i class="fas fa-plus"></i></button>
            </div>
            <button class="btn btn-primary btn-lg add-to-cart" (click)="addToCart(p)" [disabled]="p.stock === 0">
              <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
            <button class="wishlist-btn" [class.active]="wishlistService.isWishlisted(p.id)" (click)="toggleWishlist(p)">
              <i class="fas fa-heart"></i>
            </button>
          </div>

          <!-- Quick Info -->
          <div class="quick-info">
            <div class="info-item">
              <i class="fas fa-truck"></i>
              <span>{{ p.shippingInformation }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-shield-halved"></i>
              <span>{{ p.warrantyInformation }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-rotate-left"></i>
              <span>{{ p.returnPolicy }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-box"></i>
              <span>Min. order: {{ p.minimumOrderQuantity }} units</span>
            </div>
          </div>

          <!-- Tags -->
          <div class="tags" *ngIf="p.tags?.length">
            <span class="tag" *ngFor="let tag of p.tags">{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- Specs -->
      <div class="specs-section">
        <h2><i class="fas fa-list-check"></i> Product Specifications</h2>
        <div class="specs-grid">
          <div class="spec-card">
            <div class="spec-icon"><i class="fas fa-ruler-combined"></i></div>
            <div><strong>Dimensions</strong><br><span>{{ p.dimensions.width }} × {{ p.dimensions.height }} × {{ p.dimensions.depth }} cm</span></div>
          </div>
          <div class="spec-card">
            <div class="spec-icon"><i class="fas fa-weight-hanging"></i></div>
            <div><strong>Weight</strong><br><span>{{ p.weight }} g</span></div>
          </div>
          <div class="spec-card">
            <div class="spec-icon"><i class="fas fa-barcode"></i></div>
            <div><strong>SKU</strong><br><span class="mono">{{ p.sku }}</span></div>
          </div>
          <div class="spec-card">
            <div class="spec-icon"><i class="fas fa-hashtag"></i></div>
            <div><strong>Barcode</strong><br><span class="mono">{{ p.meta.barcode }}</span></div>
          </div>
        </div>
      </div>

      <!-- Reviews -->
      <div class="reviews-section" *ngIf="p.reviews?.length">
        <h2><i class="fas fa-comments"></i> Customer Reviews ({{ p.reviews.length }})</h2>
        <div class="review-stats">
          <div class="avg-rating">
            <span class="big-number">{{ p.rating | number:'1.1-1' }}</span>
            <div class="stars">
              <i *ngFor="let s of getStars(p.rating)" class="fas"
                 [ngClass]="{'fa-star': s === 'full', 'fa-star-half-alt': s === 'half', 'fa-star empty-star': s === 'empty'}"></i>
            </div>
            <span class="review-count">{{ p.reviews.length }} reviews</span>
          </div>
        </div>
        <div class="reviews-list">
          <div class="review-card" *ngFor="let review of p.reviews">
            <div class="review-header">
              <div class="reviewer-avatar">{{ review.reviewerName.charAt(0) }}</div>
              <div class="reviewer-info">
                <strong>{{ review.reviewerName }}</strong>
                <span class="review-date">{{ review.date | date:'MMM d, yyyy' }}</span>
              </div>
              <div class="review-stars">
                <i *ngFor="let s of getStars(review.rating)" class="fas"
                   [ngClass]="{'fa-star': s === 'full', 'fa-star-half-alt': s === 'half', 'fa-star empty-star': s === 'empty'}"></i>
              </div>
            </div>
            <p class="review-comment">{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" *ngIf="!product() && loading()">
      <div class="spinner"></div>
      <p>Loading product...</p>
    </div>
  `,
  styles: [`
    .product-detail { max-width: 1200px; margin: 0 auto; }
    .breadcrumb {
      display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem;
      font-size: 0.8125rem; color: var(--gray-500); flex-wrap: wrap;
      a { color: var(--gray-500); text-decoration: none; &:hover { color: var(--primary); text-decoration: underline; } }
      i { font-size: 0.5rem; color: var(--gray-400); }
      .current { color: var(--gray-900); font-weight: 500; }
    }

    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem;
    }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; gap: 2rem; } }

    /* Images */
    .images-section { position: sticky; top: 80px; align-self: start; }
    .main-image {
      position: relative; background: var(--gray-50); border-radius: 20px;
      overflow: hidden; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--gray-100);
      img { width: 80%; height: 80%; object-fit: contain; }
    }
    .discount-badge {
      position: absolute; top: 16px; left: 16px;
      background: var(--danger); color: white; padding: 0.375rem 1rem;
      border-radius: 9999px; font-size: 0.875rem; font-weight: 700;
    }
    .thumbnail-row {
      display: flex; gap: 0.75rem; margin-top: 1rem; overflow-x: auto; padding-bottom: 0.5rem;
    }
    .thumb {
      width: 72px; height: 72px; flex-shrink: 0; border-radius: 12px; overflow: hidden;
      border: 2px solid var(--gray-200); background: white; cursor: pointer;
      transition: all 0.2s; padding: 0.25rem;
      &:hover { border-color: var(--primary); }
      &.active { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
      img { width: 100%; height: 100%; object-fit: contain; }
    }

    /* Info */
    .info-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .category-chip {
      background: var(--primary-50); color: var(--primary); padding: 0.375rem 1rem;
      border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .rating-badge {
      display: flex; align-items: center; gap: 0.375rem;
      background: #fef3c7; color: #92400e; padding: 0.375rem 0.875rem;
      border-radius: 9999px; font-size: 0.8125rem; font-weight: 600;
      i { color: #f59e0b; }
    }
    .info-section h1 { font-size: 1.75rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.25rem; line-height: 1.2; }
    .brand { font-size: 0.9375rem; color: var(--gray-500); margin-bottom: 1rem; }
    .description { font-size: 0.9375rem; color: var(--gray-600); line-height: 1.7; margin-bottom: 1.5rem; }

    .price-section {
      display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;
    }
    .current-price { font-size: 2rem; font-weight: 800; color: var(--gray-900); }
    .original-price { font-size: 1.125rem; color: var(--gray-400); text-decoration: line-through; }
    .savings { font-size: 0.875rem; color: var(--success); font-weight: 600; }

    .availability {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1.5rem;
      &.ok { background: #d1fae5; color: #065f46; }
      &.low { background: #fef3c7; color: #92400e; }
    }

    .purchase-section { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
    .quantity-control {
      display: flex; align-items: center; border: 1px solid var(--gray-200); border-radius: 12px; overflow: hidden;
    }
    .qty-btn {
      width: 44px; height: 44px; border: none; background: var(--gray-50); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.875rem;
      color: var(--gray-700); transition: background 0.2s;
      &:hover:not(:disabled) { background: var(--gray-200); }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
    }
    .qty-value { width: 48px; text-align: center; font-size: 1rem; font-weight: 600; border-left: 1px solid var(--gray-200); border-right: 1px solid var(--gray-200); height: 44px; display: flex; align-items: center; justify-content: center; }
    .add-to-cart { flex: 1; padding: 0.875rem 2rem; font-size: 1rem; }
    .wishlist-btn {
      width: 48px; height: 48px; border-radius: 12px; border: 2px solid var(--gray-200);
      background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; color: var(--gray-400); transition: all 0.25s; flex-shrink: 0;
      &:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
      &.active { border-color: #ef4444; color: #ef4444; background: #fef2f2;
        i { animation: heartBeat 0.4s ease; }
      }
    }
    @keyframes heartBeat {
      0% { transform: scale(1); }
      30% { transform: scale(1.3); }
      60% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }

    .quick-info {
      display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem;
      background: var(--gray-50); border-radius: 14px; margin-bottom: 1.5rem;
    }
    .info-item {
      display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: var(--gray-600);
      i { width: 20px; text-align: center; color: var(--primary); }
    }

    .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tag {
      padding: 0.375rem 0.875rem; background: var(--gray-100); border-radius: 9999px;
      font-size: 0.75rem; font-weight: 500; color: var(--gray-600);
    }

    /* Specs */
    .specs-section { margin-bottom: 3rem;
      h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;
        i { color: var(--primary); } }
    }
    .specs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .spec-card {
      display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
      background: white; border-radius: 14px; box-shadow: var(--shadow); border: 1px solid var(--gray-100);
      .spec-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--primary-50); color: var(--primary);
        display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
      strong { font-size: 0.8125rem; color: var(--gray-700); }
      span { font-size: 0.875rem; color: var(--gray-600); }
      .mono { font-family: monospace; font-size: 0.8125rem; }
    }

    /* Reviews */
    .reviews-section { margin-bottom: 2rem;
      h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;
        i { color: var(--primary); } }
    }
    .review-stats { margin-bottom: 1.5rem; }
    .avg-rating {
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      padding: 2rem; background: white; border-radius: 16px; box-shadow: var(--shadow); border: 1px solid var(--gray-100);
      .big-number { font-size: 3rem; font-weight: 800; color: var(--gray-900); }
      .stars i { font-size: 1.125rem; color: #f59e0b; }
      .stars .empty-star { color: var(--gray-300); }
      .review-count { font-size: 0.875rem; color: var(--gray-500); }
    }
    .reviews-list { display: flex; flex-direction: column; gap: 1rem; }
    .review-card {
      padding: 1.25rem; background: white; border-radius: 14px; box-shadow: var(--shadow); border: 1px solid var(--gray-100);
    }
    .review-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .reviewer-avatar {
      width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0;
    }
    .reviewer-info { flex: 1;
      strong { display: block; font-size: 0.875rem; color: var(--gray-900); }
    }
    .review-date { font-size: 0.75rem; color: var(--gray-400); }
    .review-stars i { font-size: 0.75rem; color: #f59e0b; }
    .review-stars .empty-star { color: var(--gray-300); }
    .review-comment { font-size: 0.875rem; color: var(--gray-600); line-height: 1.6; }

    .loading-state { text-align: center; padding: 4rem 1rem; color: var(--gray-400); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  `]
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  selectedImage = signal<string>('');
  quantity = signal(1);
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    public wishlistService: WishlistService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) this.loadProduct(id);
    });
  }

  loadProduct(id: number) {
    this.loading.set(true);
    this.productService.getProduct(id).subscribe({
      next: p => { this.product.set(p); this.selectedImage.set(''); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/products']); }
    });
  }

  getAllImages(p: Product): string[] {
    return [p.thumbnail, ...p.images];
  }

  getDiscountedPrice(product: Product): number { return ProductService.discountedPrice(product); }
  getStars(rating: number) { return ProductService.starsArray(rating); }

  incrementQty() { this.quantity.update(q => q + 1); }
  decrementQty() { this.quantity.update(q => Math.max(1, q - 1)); }

  toggleWishlist(product: Product) {
    this.wishlistService.toggle(product);
  }

  addToCart(product: Product) {
    this.cartService.addItem(product, this.quantity());
    this.quantity.set(1);
  }
}
