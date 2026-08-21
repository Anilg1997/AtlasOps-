import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

const API = 'https://dummyjson.com';

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: Review[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: { createdAt: string; updatedAt: string; barcode: string; qrCode: string };
  thumbnail: string;
  images: string[];
}

export interface Review {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  constructor(private http: HttpClient) {}

  getProducts(params: {
    limit?: number;
    skip?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
    select?: string;
  } = {}): Observable<ProductPage> {
    let httpParams = new HttpParams();
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.skip !== undefined) httpParams = httpParams.set('skip', params.skip.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.order) httpParams = httpParams.set('order', params.order);
    if (params.select) httpParams = httpParams.set('select', params.select);
    return this.http.get<ProductPage>(`${API}/products`, { params: httpParams });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${API}/products/${id}`);
  }

  searchProducts(query: string, limit = 30, skip = 0): Observable<ProductPage> {
    return this.http.get<ProductPage>(`${API}/products/search`, {
      params: new HttpParams().set('q', query).set('limit', limit).set('skip', skip)
    });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${API}/products/categories`);
  }

  getCategoryProducts(category: string): Observable<ProductPage> {
    return this.http.get<ProductPage>(`${API}/products/category/${category}`);
  }

  addProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${API}/products/add`, product);
  }

  updateProduct(id: number, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${API}/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${API}/products/${id}`);
  }

  /** Helper: compute discounted price */
  static discountedPrice(product: Product): number {
    return +(product.price * (1 - product.discountPercentage / 100)).toFixed(2);
  }

  /** Helper: star array for display */
  static starsArray(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }
}
