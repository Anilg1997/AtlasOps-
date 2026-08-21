import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService, Product, ProductPage } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="products-page animate-fadeIn">
      <!-- Page Header -->
      <div class="page-header-bar">
        <h1><i class="fas fa-shopping-bag"></i> {{ getPageTitle() }}</h1>
        <p>{{ totalProducts() }} products found</p>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar card">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="search()" placeholder="Search products..." class="form-control">
          <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()"><i class="fas fa-times"></i></button>
        </div>
        <div class="filter-group">
          <select class="form-control" [(ngModel)]="selectedCategory" (change)="onCategoryChange()">
            <option value="">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat.slug">{{ cat.name }}</option>
          </select>
          <select class="form-control" [(ngModel)]="sortBy" (change)="loadProducts()">
            <option value="">Sort by</option>
            <option value="title">Name</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="discountPercentage">Discount</option>
          </select>
          <select class="form-control" [(ngModel)]="sortOrder" (change)="loadProducts()">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>

      <!-- Products Grid -->
      <div class="products-grid" *ngIf="!loading()">
        <div class="product-card" *ngFor="let product of products" (click)="goToProduct(product.id)">
          <div class="product-image">
            <img [src]="product.thumbnail" [alt]="product.title" loading="lazy">
            <span class="discount-badge" *ngIf="product.discountPercentage > 5">
              -{{ product.discountPercentage | number:'1.0-0' }}%
            </span>
            <button class="heart-btn" [class.active]="wishlistService.isWishlisted(product.id)"
                    (click)="toggleWishlist(product, $event)">
              <i class="fas fa-heart"></i>
            </button>
            <div class="product-overlay">
              <button class="btn-icon-circle" title="Add to Cart" (click)="addToCart(product, $event)">
                <i class="fas fa-cart-plus"></i>
              </button>
            </div>
          </div>
          <div class="product-info">
            <div class="product-meta">
              <span class="product-category">{{ product.category }}</span>
              <span class="product-brand" *ngIf="product.brand">{{ product.brand }}</span>
            </div>
            <h3>{{ product.title }}</h3>
            <div class="product-rating">
              <div class="stars">
                <i *ngFor="let s of getStars(product.rating)" class="fas"
                   [ngClass]="{'fa-star': s === 'full', 'fa-star-half-alt': s === 'half', 'fa-star empty-star': s === 'empty'}"></i>
              </div>
              <span>({{ product.rating | number:'1.1-1' }})</span>
            </div>
            <p class="product-desc">{{ product.description }}</p>
            <div class="product-footer">
              <div class="price-group">
                <span class="current-price">\${{ getDiscountedPrice(product) | number:'1.2-2' }}</span>
                <span class="original-price" *ngIf="product.discountPercentage > 0">\${{ product.price | number:'1.2-2' }}</span>
              </div>
              <button class="btn btn-primary btn-sm add-btn" (click)="addToCart(product, $event)">
                <i class="fas fa-plus"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && products.length === 0">
        <i class="fas fa-search"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
        <button class="btn btn-primary" (click)="clearSearch()">Clear Filters</button>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages() > 1">
        <button class="btn btn-secondary" [disabled]="currentPage() === 0" (click)="goToPage(currentPage() - 1)">
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        <div class="page-numbers">
          <button *ngFor="let p of getPageNumbers()" class="page-btn" [class.active]="p === currentPage()"
                  (click)="goToPage(p)">{{ p + 1 }}</button>
        </div>
        <button class="btn btn-secondary" [disabled]="currentPage() >= totalPages() - 1" (click)="goToPage(currentPage() + 1)">
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .products-page { max-width: 1400px; margin: 0 auto; }
    .page-header-bar { margin-bottom: 1.5rem;
      h1 { font-size: 1.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;
        i { color: var(--primary); } }
      p { color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem; }
    }
    .filters-bar {
      display: flex; gap: 1rem; align-items: center; padding: 1rem 1.5rem;
      margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .search-box {
      flex: 1; min-width: 250px; position: relative;
      i.fa-search { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--gray-400); }
      .form-control { padding-left: 2.25rem; }
      .clear-btn {
        position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 4px;
        &:hover { color: var(--gray-600); }
      }
    }
    .filter-group { display: flex; gap: 0.75rem; }
    .filter-group .form-control { min-width: 150px; }

    .loading-state { text-align: center; padding: 4rem 1rem; color: var(--gray-400); display: flex; flex-direction: column; align-items: center; gap: 1rem; }

    .products-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;
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
    .discount-badge {
      position: absolute; top: 12px; left: 12px;
      background: var(--danger); color: white; padding: 0.25rem 0.75rem;
      border-radius: 9999px; font-size: 0.75rem; font-weight: 700;
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
    .stock-tag { display: none; }
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
    .product-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem; }
    .product-category {
      font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--primary); font-weight: 600;
    }
    .product-brand { font-size: 0.6875rem; color: var(--gray-400); }
    .product-info h3 {
      font-size: 0.9375rem; font-weight: 600; margin: 0.375rem 0 0.5rem;
      color: var(--gray-900); line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .product-rating { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .stars { display: flex; gap: 2px; }
    .stars i { font-size: 0.75rem; color: #f59e0b; }
    .stars .empty-star { color: var(--gray-300); }
    .product-rating span { font-size: 0.75rem; color: var(--gray-500); }
    .product-desc {
      font-size: 0.8125rem; color: var(--gray-500); line-height: 1.5; margin-bottom: 0.75rem;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .product-footer { display: flex; justify-content: space-between; align-items: center;
      padding-top: 0.75rem; border-top: 1px solid var(--gray-100); }
    .price-group { display: flex; align-items: baseline; gap: 0.5rem; }
    .current-price { font-size: 1.125rem; font-weight: 700; color: var(--gray-900); }
    .original-price { font-size: 0.8125rem; color: var(--gray-400); text-decoration: line-through; }
    .add-btn { padding: 0.5rem 1rem; }

    .empty-state {
      text-align: center; padding: 4rem 1rem; color: var(--gray-400);
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      i { font-size: 3rem; margin-bottom: 0.5rem; }
      h3 { color: var(--gray-700); }
    }

    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      margin-top: 2rem; padding: 1.5rem 0;
    }
    .page-numbers { display: flex; gap: 0.375rem; }
    .page-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--gray-200);
      background: white; color: var(--gray-700); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.875rem;
      transition: all 0.2s;
      &:hover { border-color: var(--primary); color: var(--primary); }
      &.active { background: var(--primary); color: white; border-color: var(--primary); }
    }

    @media (max-width: 768px) {
      .filter-group { width: 100%; }
      .filter-group .form-control { flex: 1; min-width: 0; }
      .products-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    }
  `]
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  categories: { slug: string; name: string }[] = [];
  searchQuery = '';
  selectedCategory = '';
  sortBy = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  loading = signal(false);
  totalProducts = signal(0);
  currentPage = signal(0);
  totalPages = signal(0);
  private pageSize = 12;
  private categoryParam = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    public wishlistService: WishlistService
  ) {}

  ngOnInit() {
    this.productService.getCategories().subscribe(cats => this.categories = cats);

    this.route.params.subscribe(params => {
      if (params['category']) {
        this.categoryParam = params['category'];
        this.selectedCategory = params['category'];
        this.loadByCategory();
      } else if (this.route.snapshot.url.length === 0 || !this.route.snapshot.url[0]?.path) {
        this.loadProducts();
      } else {
        this.loadProducts();
      }
    });

    this.route.queryParams.subscribe(qp => {
      if (qp['q']) {
        this.searchQuery = qp['q'];
        this.search();
      } else {
        this.loadProducts();
      }
    });
  }

  getPageTitle(): string {
    if (this.categoryParam) {
      return this.categoryParam.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    if (this.searchQuery) return `Search: "${this.searchQuery}"`;
    return 'All Products';
  }

  loadProducts() {
    this.loading.set(true);
    const skip = this.currentPage() * this.pageSize;
    const params: any = { limit: this.pageSize, skip };
    if (this.sortBy) { params.sortBy = this.sortBy; params.order = this.sortOrder; }

    this.productService.getProducts(params).subscribe({
      next: res => {
        this.products = res.products;
        this.totalProducts.set(res.total);
        this.totalPages.set(Math.ceil(res.total / this.pageSize));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadByCategory() {
    this.loading.set(true);
    this.productService.getCategoryProducts(this.categoryParam).subscribe({
      next: res => {
        this.products = res.products;
        this.totalProducts.set(res.total);
        this.totalPages.set(1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  search() {
    if (!this.searchQuery.trim()) return this.loadProducts();
    this.loading.set(true);
    this.currentPage.set(0);
    this.productService.searchProducts(this.searchQuery, this.pageSize, 0).subscribe({
      next: res => {
        this.products = res.products;
        this.totalProducts.set(res.total);
        this.totalPages.set(Math.ceil(res.total / this.pageSize));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onCategoryChange() {
    this.currentPage.set(0);
    if (this.selectedCategory) {
      this.categoryParam = this.selectedCategory;
      this.loadByCategory();
    } else {
      this.categoryParam = '';
      this.loadProducts();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.categoryParam = '';
    this.currentPage.set(0);
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page < 0) return;
    this.currentPage.set(page);
    this.loadProducts();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getDiscountedPrice(product: Product): number { return ProductService.discountedPrice(product); }
  getStars(rating: number) { return ProductService.starsArray(rating); }

  toggleWishlist(product: Product, event: Event) {
    event.stopPropagation();
    this.wishlistService.toggle(product);
  }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addItem(product);
  }

  goToProduct(id: number) {
    this.router.navigate(['/product', id]);
  }
}
