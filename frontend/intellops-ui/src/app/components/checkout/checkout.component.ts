import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="checkout-page animate-fadeIn">
      <!-- Success State -->
      <div class="success-card" *ngIf="orderPlaced()">
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h1>Order Placed Successfully!</h1>
        <p>Thank you for your purchase. Your order #{{ orderNumber }} has been confirmed.</p>
        <div class="success-details">
          <div class="detail-item">
            <span>Order Number</span><strong>#{{ orderNumber }}</strong>
          </div>
          <div class="detail-item">
            <span>Total Amount</span><strong>\${{ totalAmount | number:'1.2-2' }}</strong>
          </div>
          <div class="detail-item">
            <span>Payment</span><strong>Credit Card</strong>
          </div>
        </div>
        <div class="success-actions">
          <a routerLink="/products" class="btn btn-primary"><i class="fas fa-shopping-bag"></i> Continue Shopping</a>
          <a routerLink="/" class="btn btn-secondary"><i class="fas fa-home"></i> Back to Home</a>
        </div>
      </div>

      <!-- Checkout Form -->
      <div class="checkout-grid" *ngIf="!orderPlaced()">
        <div class="checkout-form">
          <h2><i class="fas fa-credit-card"></i> Shipping Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>First Name</label>
              <input class="form-control" [(ngModel)]="firstName" placeholder="John">
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input class="form-control" [(ngModel)]="lastName" placeholder="Doe">
            </div>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input class="form-control" type="email" [(ngModel)]="email" placeholder="john@example.com">
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input class="form-control" type="tel" [(ngModel)]="phone" placeholder="+1 (555) 123-4567">
          </div>
          <div class="form-group">
            <label>Street Address</label>
            <input class="form-control" [(ngModel)]="address" placeholder="123 Main Street">
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>City</label>
              <input class="form-control" [(ngModel)]="city" placeholder="New York">
            </div>
            <div class="form-group">
              <label>State</label>
              <input class="form-control" [(ngModel)]="state" placeholder="NY">
            </div>
            <div class="form-group">
              <label>ZIP Code</label>
              <input class="form-control" [(ngModel)]="zipCode" placeholder="10001">
            </div>
          </div>

          <h2><i class="fas fa-lock"></i> Payment Details</h2>
          <div class="form-group">
            <label>Card Number</label>
            <input class="form-control" [(ngModel)]="cardNumber" placeholder="4242 4242 4242 4242">
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Expiry Date</label>
              <input class="form-control" [(ngModel)]="cardExpiry" placeholder="MM/YY">
            </div>
            <div class="form-group">
              <label>CVV</label>
              <input class="form-control" [(ngModel)]="cardCvv" placeholder="123">
            </div>
          </div>
        </div>

        <div class="order-summary">
          <h2>Order Summary</h2>
          <div class="summary-items">
            <div class="summary-item" *ngFor="let item of cartService.cartItems()">
              <img [src]="item.product.thumbnail" [alt]="item.product.title">
              <div class="item-info">
                <span class="item-name">{{ item.product.title }}</span>
                <span class="item-qty">Qty: {{ item.quantity }}</span>
              </div>
              <span class="item-total">\${{ getDiscounted(item.product) * item.quantity | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="summary-totals">
            <div class="total-row">
              <span>Subtotal</span><span>\${{ cartService.subtotal() | number:'1.2-2' }}</span>
            </div>
            <div class="total-row">
              <span>Shipping</span><span class="free">FREE</span>
            </div>
            <div class="total-row">
              <span>Tax (8%)</span><span>\${{ tax | number:'1.2-2' }}</span>
            </div>
            <div class="total-row grand">
              <span>Total</span><strong>\${{ grandTotal | number:'1.2-2' }}</strong>
            </div>
          </div>
          <button class="btn btn-primary btn-lg place-order" (click)="placeOrder()" [disabled]="processing()">
            <span *ngIf="!processing()"><i class="fas fa-lock"></i> Place Order</span>
            <span *ngIf="processing()"><div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Processing...</span>
          </button>
          <p class="secure-text"><i class="fas fa-shield-halved"></i> Your payment info is secure and encrypted</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page { max-width: 1200px; margin: 0 auto; }
    .checkout-grid {
      display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem;
    }
    @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } }

    .checkout-form, .order-summary {
      background: white; border-radius: 20px; padding: 2rem;
      box-shadow: var(--shadow); border: 1px solid var(--gray-100);
    }
    .checkout-form h2, .order-summary h2 {
      font-size: 1.125rem; font-weight: 700; margin-bottom: 1.25rem;
      display: flex; align-items: center; gap: 0.5rem; color: var(--gray-900);
      &:not(:first-child) { margin-top: 2rem; }
      i { color: var(--primary); }
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.8125rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.375rem; }
    .form-control { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--gray-200); border-radius: 10px;
      font-size: 0.875rem; font-family: inherit; transition: all 0.2s;
      &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      &::placeholder { color: var(--gray-400); }
    }

    .summary-items { max-height: 300px; overflow-y: auto; margin-bottom: 1.25rem; }
    .summary-item {
      display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem 0;
      border-bottom: 1px solid var(--gray-100);
      img { width: 52px; height: 52px; border-radius: 10px; object-fit: contain; background: var(--gray-50); padding: 0.25rem; }
      .item-info { flex: 1; }
      .item-name { display: block; font-size: 0.8125rem; font-weight: 500; color: var(--gray-800); }
      .item-qty { font-size: 0.75rem; color: var(--gray-500); }
      .item-total { font-weight: 700; font-size: 0.875rem; color: var(--gray-900); }
    }
    .summary-totals { border-top: 2px solid var(--gray-100); padding-top: 1rem; }
    .total-row { display: flex; justify-content: space-between; padding: 0.375rem 0; font-size: 0.875rem; color: var(--gray-600);
      .free { color: var(--success); font-weight: 600; }
      &.grand { font-size: 1.125rem; color: var(--gray-900); margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--gray-200); }
    }
    .place-order { width: 100%; margin-top: 1.25rem; padding: 1rem; }
    .secure-text { text-align: center; font-size: 0.75rem; color: var(--gray-400); margin-top: 0.75rem;
      i { margin-right: 0.25rem; }
    }

    /* Success */
    .success-card {
      max-width: 560px; margin: 3rem auto; text-align: center;
      background: white; border-radius: 24px; padding: 3rem;
      box-shadow: var(--shadow-lg); border: 1px solid var(--gray-100);
    }
    .success-icon { font-size: 4rem; color: var(--success); margin-bottom: 1.5rem; }
    .success-card h1 { font-size: 1.75rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.5rem; }
    .success-card > p { color: var(--gray-500); margin-bottom: 2rem; }
    .success-details {
      display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;
      .detail-item { display: flex; flex-direction: column; gap: 0.25rem;
        span { font-size: 0.75rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
        strong { font-size: 1rem; color: var(--gray-900); }
      }
    }
    .success-actions { display: flex; gap: 1rem; justify-content: center; }
  `]
})
export class CheckoutComponent {
  orderPlaced = signal(false);
  processing = signal(false);
  orderNumber = '';
  totalAmount = 0;

  firstName = ''; lastName = ''; email = ''; phone = '';
  address = ''; city = ''; state = ''; zipCode = '';
  cardNumber = ''; cardExpiry = ''; cardCvv = '';

  get tax() { return +(this.cartService.subtotal() * 0.08).toFixed(2); }
  get grandTotal() { return +(this.cartService.subtotal() + this.tax).toFixed(2); }

  constructor(public cartService: CartService, private router: Router) {
    if (cartService.cartItems().length === 0) {
      this.router.navigate(['/products']);
    }
  }

  getDiscounted(product: any): number {
    return ProductService.discountedPrice(product);
  }

  placeOrder() {
    this.processing.set(true);
    this.totalAmount = this.grandTotal;
    this.orderNumber = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    setTimeout(() => {
      this.processing.set(false);
      this.orderPlaced.set(true);
      this.cartService.clear();
    }, 2000);
  }
}
