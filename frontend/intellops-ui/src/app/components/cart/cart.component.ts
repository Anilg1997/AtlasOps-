import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cart-overlay" (click)="close.emit()" *ngIf="cartService.cartItems().length > 0 || true"></div>
    <div class="cart-drawer" [class.open]="true">
      <div class="cart-header">
        <h2><i class="fas fa-shopping-cart"></i> Your Cart</h2>
        <button class="close-btn" (click)="close.emit()"><i class="fas fa-times"></i></button>
      </div>

      <!-- Empty -->
      <div class="cart-empty" *ngIf="cartService.cartItems().length === 0">
        <div class="empty-icon"><i class="fas fa-shopping-bag"></i></div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything yet</p>
        <button class="btn btn-primary" (click)="close.emit()">Continue Shopping</button>
      </div>

      <!-- Items -->
      <div class="cart-items" *ngIf="cartService.cartItems().length > 0">
        <div class="cart-item" *ngFor="let item of cartService.cartItems()">
          <img [src]="item.product.thumbnail" [alt]="item.product.title" class="item-image">
          <div class="item-details">
            <h4>{{ item.product.title }}</h4>
            <span class="item-price">\${{ getDiscounted(item.product) | number:'1.2-2' }}</span>
            <div class="item-qty">
              <button (click)="updateQty(item.product.id, item.quantity - 1)"><i class="fas fa-minus"></i></button>
              <span>{{ item.quantity }}</span>
              <button (click)="updateQty(item.product.id, item.quantity + 1)"><i class="fas fa-plus"></i></button>
            </div>
          </div>
          <button class="remove-btn" (click)="remove(item.product.id)">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="cart-footer" *ngIf="cartService.cartItems().length > 0">
        <div class="summary-row">
          <span>Subtotal ({{ cartService.itemCount() }} items)</span>
          <strong>\${{ cartService.subtotal() | number:'1.2-2' }}</strong>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span class="free-shipping">FREE</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <strong>\${{ cartService.total() | number:'1.2-2' }}</strong>
        </div>
        <button class="btn btn-primary btn-lg checkout-btn" (click)="checkout()">
          <i class="fas fa-lock"></i> Proceed to Checkout
        </button>
        <button class="btn btn-secondary clear-btn" (click)="cartService.clear()">
          <i class="fas fa-trash"></i> Clear Cart
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cart-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 998;
      backdrop-filter: blur(4px); animation: fadeIn 0.2s;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .cart-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 90vw;
      background: white; z-index: 999; display: flex; flex-direction: column;
      box-shadow: -10px 0 40px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

    .cart-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--gray-100);
      h2 { font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;
        i { color: var(--primary); } }
    }
    .close-btn {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: var(--gray-100); cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--gray-600); transition: all 0.2s;
      &:hover { background: var(--gray-200); color: var(--gray-900); }
    }

    .cart-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2rem; text-align: center; color: var(--gray-400);
      .empty-icon { width: 80px; height: 80px; border-radius: 50%; background: var(--gray-100);
        display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 1rem; }
      h3 { color: var(--gray-700); margin-bottom: 0.25rem; }
      p { font-size: 0.875rem; margin-bottom: 1.5rem; }
    }

    .cart-items { flex: 1; overflow-y: auto; padding: 1rem 1.5rem; }
    .cart-item {
      display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--gray-100);
      &:last-child { border-bottom: none; }
    }
    .item-image {
      width: 72px; height: 72px; border-radius: 12px; object-fit: contain;
      background: var(--gray-50); padding: 0.25rem; flex-shrink: 0;
    }
    .item-details { flex: 1; display: flex; flex-direction: column;
      h4 { font-size: 0.875rem; font-weight: 600; color: var(--gray-900); line-height: 1.3;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    }
    .item-price { font-size: 0.9375rem; font-weight: 700; color: var(--primary); margin-top: 0.25rem; }
    .item-qty { display: flex; align-items: center; gap: 0; margin-top: 0.5rem; border: 1px solid var(--gray-200); border-radius: 8px; overflow: hidden; width: fit-content;
      button { width: 28px; height: 28px; border: none; background: var(--gray-50); cursor: pointer;
        display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; color: var(--gray-600);
        &:hover { background: var(--gray-200); } }
      span { width: 32px; text-align: center; font-size: 0.8125rem; font-weight: 600; }
    }
    .remove-btn {
      background: none; border: none; color: var(--gray-400); cursor: pointer;
      padding: 0.5rem; border-radius: 8px; align-self: flex-start; transition: all 0.2s;
      &:hover { color: var(--danger); background: #fef2f2; }
    }

    .cart-footer {
      padding: 1.25rem 1.5rem; border-top: 1px solid var(--gray-100);
      background: var(--gray-50);
    }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;
      font-size: 0.875rem; color: var(--gray-600);
      &.total { font-size: 1.125rem; color: var(--gray-900); margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--gray-200); }
      strong { font-weight: 700; }
    }
    .free-shipping { color: var(--success); font-weight: 600; }
    .checkout-btn { width: 100%; margin-top: 0.75rem; }
    .clear-btn { width: 100%; margin-top: 0.5rem; }
  `]
})
export class CartComponent {
  @Output() close = new EventEmitter<void>();

  constructor(public cartService: CartService, private router: Router) {}

  getDiscounted(product: any): number {
    return ProductService.discountedPrice(product);
  }

  updateQty(productId: number, qty: number) {
    this.cartService.updateQuantity(productId, qty);
  }

  remove(productId: number) {
    this.cartService.removeItem(productId);
  }

  checkout() {
    this.close.emit();
    this.router.navigate(['/checkout']);
  }
}
