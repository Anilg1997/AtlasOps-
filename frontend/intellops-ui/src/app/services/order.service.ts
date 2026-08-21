import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
  id: number;
  orderNumber: string;
  customer: CustomerDto;
  status: string;
  statusReason?: string;
  totalAmount: number;
  taxAmount: number;
  notes: string;
  lineItems: LineItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDto {
  id: number;
  customerNumber: string;
  name: string;
  email: string;
  phone: string;
}

export interface LineItemDto {
  id: number;
  product: ProductDto;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ProductDto {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface OrderPage {
  content: Order[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API_URL = '/api/v1/orders';

  constructor(private http: HttpClient) {}

  getOrders(page = 0, size = 20, search = ''): Observable<OrderPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<OrderPage>(this.API_URL, { params });
  }

  getOrder(orderNumber: string): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/${orderNumber}`);
  }

  createOrder(data: any): Observable<Order> {
    return this.http.post<Order>(this.API_URL, data);
  }

  updateStatus(orderNumber: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.API_URL}/${orderNumber}/status`, { status });
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.API_URL}/stats`);
  }
}
