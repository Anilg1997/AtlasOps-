import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService, Category } from '../../services/product.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="categories-page animate-fadeIn">
      <div class="page-header-bar">
        <h1><i class="fas fa-th-large"></i> All Categories</h1>
        <p>Browse our {{ categories.length }} product categories</p>
      </div>

      <div class="categories-grid">
        <a *ngFor="let cat of categories" [routerLink]="['/category', cat.slug]" class="category-card">
          <div class="cat-icon" [style.background]="getColor(cat.slug)">
            <i class="fas" [ngClass]="getIcon(cat.slug)"></i>
          </div>
          <h3>{{ cat.name }}</h3>
          <span class="cat-count">Browse products <i class="fas fa-arrow-right"></i></span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .categories-page { max-width: 1200px; margin: 0 auto; }
    .page-header-bar { margin-bottom: 2rem;
      h1 { font-size: 1.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;
        i { color: var(--primary); } }
      p { color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem; }
    }
    .categories-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem;
    }
    .category-card {
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
      padding: 2rem 1.5rem; background: white; border-radius: 20px;
      box-shadow: var(--shadow); border: 1px solid var(--gray-100);
      text-decoration: none !important; color: var(--gray-700);
      transition: all 0.3s; cursor: pointer;
      &:hover { box-shadow: var(--shadow-lg); transform: translateY(-6px);
        .cat-icon { transform: scale(1.1); }
      }
      h3 { font-size: 0.9375rem; font-weight: 600; text-align: center; color: var(--gray-900); }
    }
    .cat-icon {
      width: 72px; height: 72px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
      transition: transform 0.3s;
    }
    .cat-count { font-size: 0.75rem; color: var(--primary); font-weight: 500; display: flex; align-items: center; gap: 0.25rem; }
  `]
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];

  private colors: Record<string, string> = {
    beauty: '#fce7f3', fragrances: '#ede9fe', furniture: '#fef3c7',
    groceries: '#d1fae5', 'home-decoration': '#ffedd5', 'kitchen-accessories': '#e0f2fe',
    laptops: '#dbeafe', 'mens-shirts': '#cffafe', 'mens-shoes': '#f3e8ff',
    'mens-watches': '#fef9c3', 'mobile-accessories': '#e0e7ff', motorcycle: '#fee2e2',
    'skin-care': '#fce7f3', smartphones: '#dbeafe', 'sports-accessories': '#d1fae5',
    sunglasses: '#fef3c7', tablets: '#e0f2fe', tops: '#cffafe', vehicle: '#fee2e2',
    'womens-bags': '#fce7f3', 'womens-dresses': '#ede9fe', 'womens-jewellery': '#fef9c3',
    'womens-shoes': '#e0f2fe', 'womens-watches': '#f3e8ff'
  };
  private icons: Record<string, string> = {
    beauty: 'fa-palette', fragrances: 'fa-spray-can', furniture: 'fa-couch',
    groceries: 'fa-apple-whole', 'home-decoration': 'fa-vase', 'kitchen-accessories': 'fa-utensils',
    laptops: 'fa-laptop', 'mens-shirts': 'fa-shirt', 'mens-shoes': 'fa-shoe-prints',
    'mens-watches': 'fa-clock', 'mobile-accessories': 'fa-headphones', motorcycle: 'fa-motorcycle',
    'skin-care': 'fa-spa', smartphones: 'fa-mobile-alt', 'sports-accessories': 'fa-dumbbell',
    sunglasses: 'fa-glasses', tablets: 'fa-tablet-alt', tops: 'fa-vest',
    vehicle: 'fa-car', 'womens-bags': 'fa-bag-shopping', 'womens-dresses': 'fa-vest-patches',
    'womens-jewellery': 'fa-gem', 'womens-shoes': 'fa-shoe-prints', 'womens-watches': 'fa-clock'
  };

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.productService.getCategories().subscribe(cats => this.categories = cats);
  }

  getColor(slug: string): string { return this.colors[slug] || '#f1f5f9'; }
  getIcon(slug: string): string { return this.icons[slug] || 'fa-folder'; }
}
