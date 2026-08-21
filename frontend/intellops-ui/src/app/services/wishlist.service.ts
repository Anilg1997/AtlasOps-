import { Injectable, signal, computed } from '@angular/core';
import { Product } from './product.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private items = signal<Product[]>(this.loadFromStorage());

  readonly wishlist = this.items.asReadonly();
  readonly count = computed(() => this.items().length);

  constructor() {}

  isWishlisted(productId: number): boolean {
    return this.items().some(p => p.id === productId);
  }

  toggle(product: Product): boolean {
    if (this.isWishlisted(product.id)) {
      this.remove(product.id);
      return false;
    } else {
      this.add(product);
      return true;
    }
  }

  add(product: Product): void {
    if (!this.isWishlisted(product.id)) {
      this.items.update(items => [...items, product]);
      this.save();
    }
  }

  remove(productId: number): void {
    this.items.update(items => items.filter(p => p.id !== productId));
    this.save();
  }

  private save(): void {
    try {
      localStorage.setItem('shop_wishlist', JSON.stringify(this.items()));
    } catch {}
  }

  private loadFromStorage(): Product[] {
    try {
      const raw = localStorage.getItem('shop_wishlist');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
