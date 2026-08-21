import { Injectable, signal, computed } from '@angular/core';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.loadFromStorage());

  readonly cartItems = this.items.asReadonly();
  readonly itemCount = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));
  readonly subtotal = computed(() =>
    this.items().reduce((sum, i) => sum + this.discounted(i.product) * i.quantity, 0)
  );
  readonly total = computed(() => +this.subtotal().toFixed(2));

  constructor() {}

  addItem(product: Product, qty = 1): void {
    this.items.update(items => {
      const idx = items.findIndex(i => i.product.id === product.id);
      if (idx >= 0) {
        const updated = [...items];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
        return updated;
      }
      return [...items, { product, quantity: qty }];
    });
    this.save();
  }

  removeItem(productId: number): void {
    this.items.update(items => items.filter(i => i.product.id !== productId));
    this.save();
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) return this.removeItem(productId);
    this.items.update(items =>
      items.map(i => i.product.id === productId ? { ...i, quantity } : i)
    );
    this.save();
  }

  clear(): void {
    this.items.set([]);
    this.save();
  }

  private discounted(product: Product): number {
    return +(product.price * (1 - product.discountPercentage / 100)).toFixed(2);
  }

  private save(): void {
    try {
      localStorage.setItem('shop_cart', JSON.stringify(this.items()));
    } catch {}
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem('shop_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
