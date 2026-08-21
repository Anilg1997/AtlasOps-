import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cart-page animate-fadeIn">
      <div class="page-header-bar">
        <h1><i class="fas fa-shopping-cart"></i> Shopping Cart</h1>
        <p>{{ cartService.itemCount() }} item(s) in your cart</p>
      </div>

      <div class="empty-state" *ngIf="cartService.itemCount() === 0">
        <div class="empty-icon"><i class="fas fa-shopping-bag"></i></div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started</p>
        <a routerLink="/products" class="btn btn-primary"><i class="fas fa-shopping-bag"></i> Browse Products</a>
      </div>

      <div class="cart-layout" *ngIf="cartService.itemCount() > 0">
        <div class="cart-items">
          <div class="cart-item" *ngFor="let item of cartService.cartItems()">
            <img [src]="item.product.thumbnail" [alt]="item.product.title" class="item-image">
            <div class="item-details">
              <a [routerLink]="['/product', item.product.id]" class="item-name">{{ item.product.title }}</a>
              <span class="item-category">{{ item.product.category }}</span>
              <div class="item-qty">
                <button (click)="updateQty(item.product.id, item.quantity - 1)"><i class="fas fa-minus"></i></button>
                <span>{{ item.quantity }}</span>
                <button (click)="updateQty(item.product.id, item.quantity + 1)"><i class="fas fa-plus"></i></button>
              </div>
            </div>
            <div class="item-price-col">
              <span class="item-total">\${{ getDiscounted(item.product) * item.quantity | number:'1.2-2' }}</span>
              <span class="item-unit" *ngIf="item.quantity > 1">\${{ getDiscounted(item.product) | number:'1.2-2' }} each</span>
              <button class="remove-btn" (click)="remove(item.product.id)">
                <i class="fas fa-trash-alt"></i> Remove
              </button>
            </div>
          </div>
        </div>

        <div class="order-summary card">
          <h2>Order Summary</h2>
          <div class="summary-row"><span>Subtotal</span><span>\${{ cartService.subtotal() | number:'1.2-2' }}</span></div>
          <div class="summary-row"><span>Shipping</span><span class="free">FREE</span></div>
          <div class="summary-row"><span>Tax (8%)</span><span>\${{ tax | number:'1.2-2' }}</span></div>
          <div class="summary-row grand"><span>Total</span><strong>\${{ grandTotal | number:'1.2-2' }}</strong></div>
          <button class="btn btn-primary btn-lg checkout-btn" (click)="goToCheckout()">
            <i class="fas fa-lock"></i> Proceed to Checkout
          </button>
          <a routerLink="/products" class="continue-link"><i class="fas fa-arrow-left"></i> Continue Shopping</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-page { max-width: 1200px; margin: 0 auto; }
    .page-header-bar { margin-bottom: 2rem;
      h1 { font-size: 1.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;
        i { color: var(--primary); } }
      p { color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem; }
    }
    .empty-state { text-align: center; padding: 4rem 1rem;
      .empty-icon { width: 100px; height: 100px; border-radius: 50%; background: var(--gray-100);
        display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
        font-size: 2.5rem; color: var(--gray-400); }
      h3 { color: var(--gray-800); margin-bottom: 0.5rem; } p { color: var(--gray-500); margin-bottom: 1.5rem; }
    }
    .cart-layout { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; }
    @media (max-width: 900px) { .cart-layout { grid-template-columns: 1fr; } }
    .cart-items { display: flex; flex-direction: column; gap: 1rem; }
    .cart-item {
      display: flex; gap: 1rem; padding: 1.25rem; background: white;
      border-radius: 16px; box-shadow: var(--shadow); border: 1px solid var(--gray-100);
    }
    .item-image { width: 100px; height: 100px; border-radius: 12px; object-fit: contain;
      background: var(--gray-50); padding: 0.5rem; flex-shrink: 0; }
    .item-details { flex: 1; display: flex; flex-direction: column; }
    .item-name { font-weight: 600; color: var(--gray-900); font-size: 0.9375rem; text-decoration: none;
      &:hover { color: var(--primary); text-decoration: underline; } }
    .item-category { font-size: 0.75rem; color: var(--gray-500); text-transform: capitalize; margin-top: 0.125rem; }
    .item-qty { display: flex; align-items: center; margin-top: auto; border: 1px solid var(--gray-200);
      border-radius: 8px; overflow: hidden; width: fit-content; margin-top: 0.75rem;
      button { width: 32px; height: 32px; border: none; background: var(--gray-50); cursor: pointer;
        display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--gray-600);
        &:hover { background: var(--gray-200); } }
      span { width: 40px; text-align: center; font-weight: 600; font-size: 0.875rem; } }
    .item-price-col { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
    .item-total { font-weight: 700; font-size: 1.125rem; color: var(--gray-900); }
    .item-unit { font-size: 0.75rem; color: var(--gray-500); }
    .remove-btn { background: none; border: none; color: var(--gray-400); cursor: pointer; font-size: 0.75rem;
      margin-top: auto; padding: 0.375rem 0.5rem; border-radius: 6px; font-family: inherit;
      &:hover { color: var(--danger); background: #fef2f2; } }
    .order-summary { position: sticky; top: 84px; align-self: start; }
    .order-summary h2 { font-size: 1.125rem; font-weight: 700; margin-bottom: 1.25rem; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--gray-600);
      .free { color: var(--success); font-weight: 600; }
      &.grand { font-size: 1.125rem; color: var(--gray-900); margin-top: 0.75rem; padding-top: 0.75rem;
        border-top: 1px solid var(--gray-200); } }
    .checkout-btn { width: 100%; margin-top: 1rem; padding: 0.875rem; }
    .continue-link { display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      margin-top: 0.75rem; font-size: 0.875rem; color: var(--gray-500); text-decoration: none;
      &:hover { color: var(--primary); text-decoration: underline; } }
  `]
})
export class CartPageComponent {
  constructor(public cartService: CartService, private router: Router) {}
  get tax() { return +(this.cartService.subtotal() * 0.08).toFixed(2); }
  get grandTotal() { return +(this.cartService.subtotal() + this.tax).toFixed(2); }
  getDiscounted(product: Product): number { return ProductService.discountedPrice(product); }
  updateQty(id: number, qty: number) { this.cartService.updateQuantity(id, qty); }
  remove(id: number) { this.cartService.removeItem(id); }
  goToCheckout() { this.router.navigate(['/checkout']); }
}
