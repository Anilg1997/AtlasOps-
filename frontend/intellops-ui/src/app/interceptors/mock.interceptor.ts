import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse
} from '@angular/common/http';
import { Observable, of, delay, throwError } from 'rxjs';

import {
  MOCK_USERS, MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_INVOICES,
  MOCK_ACTIVITIES, MOCK_CONVERSATIONS, MOCK_SERVICE_HEALTH,
  type MockUser, type MockOrder, type MockInvoice
} from '../services/mock-data.service';

/**
 * MockInterceptor — intercepts all HTTP requests and returns realistic demo
 * data when the backend services are not running.
 *
 * Toggle with the MOCK_ENABLED flag below. When false, requests pass through
 * to the real backend (for docker-compose or production deployments).
 */
const MOCK_ENABLED = true;
const SIMULATED_DELAY_MS = 150;

/** Fake JWT token for the mock auth flow. */
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBhdGxhc29wcy5pbyIsInJvbGUiOiJBRE1JTiJ9.mock';

function ok<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(SIMULATED_DELAY_MS));
}

function err(status: number, message: string): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error: { message } }));
}

function matchUrl(url: string, pattern: RegExp): RegExpMatchArray | null {
  return url.replace(/\?.*$/, '').match(pattern);
}

@Injectable()
export class MockInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!MOCK_ENABLED) return next.handle(req);

    const url = req.url;

    // ── Auth ────────────────────────────────────────────────────────────────
    if (matchUrl(url, /\/api\/auth\/login$/)) {
      const body = req.body as any;
      const user = MOCK_USERS.find(u => u.email === body?.email && u.password === body?.password);
      if (!user) return err(401, 'Invalid email or password');
      return ok({ token: MOCK_JWT, refreshToken: MOCK_JWT, tokenType: 'Bearer', expiresIn: 86400, user: this.toUserDto(user) });
    }
    if (matchUrl(url, /\/api\/auth\/register$/)) {
      const body = req.body as any;
      if (MOCK_USERS.some(u => u.email === body?.email)) return err(409, 'Email already registered');
      const newUser: MockUser = {
        id: MOCK_USERS.length + 1, email: body.email, password: body.password,
        firstName: body.firstName, lastName: body.lastName,
        fullName: `${body.firstName} ${body.lastName}`,
        role: 'USER', enabled: true, createdAt: new Date().toISOString()
      };
      MOCK_USERS.push(newUser);
      return ok({ token: MOCK_JWT, refreshToken: MOCK_JWT, tokenType: 'Bearer', expiresIn: 86400, user: this.toUserDto(newUser) });
    }
    if (matchUrl(url, /\/api\/auth\/me$/)) {
      return ok(this.toUserDto(MOCK_USERS[0]));
    }

    // ── Admin: Users ────────────────────────────────────────────────────────
    if (matchUrl(url, /\/api\/admin\/users$/)) {
      if (req.method === 'GET') return ok(MOCK_USERS.map(u => this.toUserDto(u)));
    }
    if (matchUrl(url, /\/api\/admin\/users\/\d+$/)) {
      const id = parseInt(url.match(/\/api\/admin\/users\/(\d+)/)![1], 10);
      const user = MOCK_USERS.find(u => u.id === id);
      if (!user) return err(404, 'User not found');
      if (req.method === 'GET') return ok(this.toUserDto(user));
      if (req.method === 'PUT') {
        const body = req.body as any;
        Object.assign(user, { firstName: body.firstName, lastName: body.lastName, role: body.role, enabled: body.enabled, fullName: `${body.firstName} ${body.lastName}` });
        return ok(this.toUserDto(user));
      }
      if (req.method === 'DELETE') {
        const idx = MOCK_USERS.indexOf(user);
        if (idx >= 0) MOCK_USERS.splice(idx, 1);
        return ok({ message: 'User deleted' });
      }
    }

    // ── Orders ──────────────────────────────────────────────────────────────
    if (matchUrl(url, /\/api\/v1\/orders\/stats$/)) {
      const orders = MOCK_ORDERS;
      const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
      return ok({
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders: orders.filter(o => o.status === 'PENDING').length,
        processingOrders: orders.filter(o => o.status === 'PROCESSING').length,
        shippedOrders: orders.filter(o => o.status === 'SHIPPED').length,
        deliveredOrders: orders.filter(o => o.status === 'DELIVERED').length,
        cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
        onHoldOrders: orders.filter(o => o.status === 'ON_HOLD').length,
        confirmedOrders: orders.filter(o => o.status === 'CONFIRMED').length
      });
    }
    if (matchUrl(url, /\/api\/v1\/orders$/) && req.method === 'GET') {
      const params = new URLSearchParams(url.split('?')[1] || '');
      let results = [...MOCK_ORDERS];
      const search = params.get('search') || '';
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(o => o.orderNumber.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q));
      }
      const page = parseInt(params.get('page') || '0', 10);
      const size = parseInt(params.get('size') || '20', 10);
      const start = page * size;
      return ok({ content: results.slice(start, start + size), totalElements: results.length, totalPages: Math.ceil(results.length / size), size, number: page });
    }
    if (matchUrl(url, /\/api\/v1\/orders$/) && req.method === 'POST') {
      const body = req.body as any;
      const customer = MOCK_CUSTOMERS.find(c => c.id === body.customerId) || MOCK_CUSTOMERS[0];
      const newOrder: MockOrder = {
        id: MOCK_ORDERS.length + 1,
        orderNumber: `ORD-${1000 + MOCK_ORDERS.length + 1}`,
        customerId: customer.id,
        customer: { id: customer.id, customerNumber: customer.customerNumber, name: customer.name, email: customer.email, phone: customer.phone },
        status: 'PENDING',
        totalAmount: (body.lineItems || []).reduce((s: number, i: any) => s + (i.quantity * (MOCK_PRODUCTS.find(p => p.id === i.productId)?.price || 0)), 0),
        taxAmount: 0,
        notes: body.notes || '',
        lineItems: (body.lineItems || []).map((li: any, idx: number) => {
          const prod = MOCK_PRODUCTS.find(p => p.id === li.productId) || MOCK_PRODUCTS[0];
          return { id: idx + 1, productId: prod.id, product: { id: prod.id, sku: prod.sku, name: prod.name, description: prod.description, price: prod.price, category: prod.category }, quantity: li.quantity, unitPrice: prod.price, subtotal: li.quantity * prod.price };
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newOrder.taxAmount = Math.round(newOrder.totalAmount * 0.0741 * 100) / 100;
      newOrder.totalAmount = Math.round((newOrder.totalAmount + newOrder.taxAmount) * 100) / 100;
      MOCK_ORDERS.unshift(newOrder);
      return ok(newOrder);
    }
    const orderMatch = matchUrl(url, /\/api\/v1\/orders\/([\w-]+)$/);
    if (orderMatch && req.method === 'GET') {
      const orderNum = orderMatch[1];
      const order = MOCK_ORDERS.find(o => o.orderNumber === orderNum);
      if (!order) return err(404, 'Order not found');
      return ok(order);
    }
    if (orderMatch && req.method === 'PATCH') {
      const orderNum = orderMatch[1];
      const order = MOCK_ORDERS.find(o => o.orderNumber === orderNum);
      if (!order) return err(404, 'Order not found');
      const body = req.body as any;
      order.status = body.status;
      order.updatedAt = new Date().toISOString();
      return ok(order);
    }

    // ── Inventory ───────────────────────────────────────────────────────────
    if (matchUrl(url, /\/api\/v1\/inventory\/products$/)) {
      const params = new URLSearchParams(url.split('?')[1] || '');
      let results = MOCK_PRODUCTS.filter(p => p.active);
      const category = params.get('category');
      if (category) results = results.filter(p => p.category === category);
      const page = parseInt(params.get('page') || '0', 10);
      const pageSize = parseInt(params.get('pageSize') || '20', 10);
      return ok({ products: results.slice(page * pageSize, (page + 1) * pageSize), totalCount: results.length, page, pageSize });
    }
    const prodMatch = matchUrl(url, /\/api\/v1\/inventory\/products\/([\w-]+)$/);
    if (prodMatch && req.method === 'GET') {
      const sku = prodMatch[1];
      const product = MOCK_PRODUCTS.find(p => p.sku === sku || p.id === parseInt(sku, 10));
      if (!product) return err(404, 'Product not found');
      return ok(product);
    }
    if (matchUrl(url, /\/api\/v1\/inventory\/stock\//)) {
      return ok({ available: true, stockQuantity: 50 });
    }

    // ── Billing ─────────────────────────────────────────────────────────────
    if (matchUrl(url, /\/api\/v1\/billing\/stats$/)) {
      const invs = MOCK_INVOICES;
      return ok({
        totalInvoices: invs.length,
        pendingInvoices: invs.filter(i => i.status === 'PENDING').length,
        paidInvoices: invs.filter(i => i.status === 'PAID').length,
        overdueInvoices: invs.filter(i => i.status === 'OVERDUE').length,
        cancelledInvoices: invs.filter(i => i.status === 'CANCELLED').length,
        totalRevenue: invs.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0)
      });
    }
    if (matchUrl(url, /\/api\/v1\/billing\/invoices$/) && req.method === 'GET') {
      const params = new URLSearchParams(url.split('?')[1] || '');
      let results = [...MOCK_INVOICES];
      const status = params.get('status');
      if (status) results = results.filter(i => i.status === status);
      return ok(results);
    }
    if (matchUrl(url, /\/api\/v1\/billing\/invoices\/order\//)) {
      const orderNum = url.split('/').pop();
      const inv = MOCK_INVOICES.find(i => i.orderNumber === orderNum);
      if (!inv) return err(404, 'Invoice not found');
      return ok(inv);
    }
    if (matchUrl(url, /\/api\/v1\/billing\/invoices\/[\w-]+$/) && req.method === 'GET') {
      const invNum = url.split('/').pop();
      const inv = MOCK_INVOICES.find(i => i.invoiceNumber === invNum);
      if (!inv) return err(404, 'Invoice not found');
      return ok(inv);
    }
    if (matchUrl(url, /\/api\/v1\/billing\/invoices\/[\w-]+\/pay$/) && req.method === 'POST') {
      const invNum = url.split('/').slice(-2, -1)[0];
      const inv = MOCK_INVOICES.find(i => i.invoiceNumber === invNum);
      if (!inv) return err(404, 'Invoice not found');
      const body = req.body as any;
      inv.status = 'PAID';
      inv.paymentStatus = 'PAID';
      inv.paymentMethod = body.paymentMethod;
      inv.transactionId = body.transactionId;
      inv.paidDate = new Date().toISOString().split('T')[0];
      return ok(inv);
    }

    // ── Activity Feed ───────────────────────────────────────────────────────
    if (matchUrl(url, /\/api\/v1\/activity\/stats$/)) {
      const entries = MOCK_ACTIVITIES;
      return ok({
        totalEntries: entries.length,
        totalOrders: entries.filter(e => e.entityType === 'ORDER').length,
        totalInvoices: entries.filter(e => e.entityType === 'INVOICE').length,
        totalPayments: entries.filter(e => e.entityType === 'PAYMENT').length
      });
    }
    if (matchUrl(url, /\/api\/v1\/activity\/events$/) && req.method === 'POST') {
      const body = req.body as any;
      const entry = { id: `a${Date.now()}`, ...body, source: 'seed-feed', entityType: body.entityType || 'ORDER', entityId: body.entityId || body.orderNumber || body.invoiceNumber || 'UNKNOWN', timestamp: body.timestamp || new Date().toISOString() };
      MOCK_ACTIVITIES.unshift(entry);
      return ok({ message: 'Event published' });
    }
    if (matchUrl(url, /\/api\/v1\/activity$/)) {
      const params = new URLSearchParams(url.split('?')[1] || '');
      let results = [...MOCK_ACTIVITIES];
      const entityType = params.get('entityType');
      const eventType = params.get('eventType');
      const limit = parseInt(params.get('limit') || '50', 10);
      if (entityType) results = results.filter(e => e.entityType === entityType);
      if (eventType) results = results.filter(e => e.eventType === eventType);
      return ok(results.slice(0, limit));
    }

    // ── Copilot ─────────────────────────────────────────────────────────────
    if (matchUrl(url, /\/api\/v1\/copilot\/health$/)) {
      return ok({ status: 'UP', model: 'mock-llama3.2:3b', ragEnabled: true });
    }
    if (matchUrl(url, /\/api\/v1\/copilot\/chat$/) && req.method === 'POST') {
      const body = req.body as any;
      const message = (body.message || '').toLowerCase();
      let response = '';
      if (message.includes('order') && message.includes('hold')) {
        response = 'Order ORD-1001 (Acme Corporation, $6,803.97) is currently on **STOCK_HOLD**. SKU SRV-RACK-42U has only 8 units in stock. Recommend contacting procurement for restock ETA and notifying the customer.';
      } else if (message.includes('inventory') || message.includes('stock')) {
        response = 'Current inventory status: 12 products tracked across electronics, furniture, and accessories. 4 items are near reorder threshold: SRV-RACK-42U (8 units), FW-APPL-1U (12), SRV-BLADE-M7 (6), UPS-3KVA (18).';
      } else if (message.includes('bill') || message.includes('invoice') || message.includes('overdue')) {
        response = 'There is 1 overdue invoice: INV-2009 for Umbrella Corp ($5,349.97, 5 days overdue). Payment was partial. 6 invoices are pending payment totaling $40,283.89.';
      } else if (message.includes('recent') || message.includes('status')) {
        response = 'Recent order activity:\n- ORD-1007 (Stark Industries): Confirmed, $18,249.97\n- ORD-1005 (Globex): Pending payment, $9,720.00\n- ORD-1004 (Acme): Processing at WH-NORTH-A12, $9,611.98\n- ORD-1002 (Globex): Shipped via Express, $7,235.87';
      } else {
        response = `I can help with orders, inventory, billing, and operational queries. Try asking:\n- "Why is order ORD-1001 on hold?"\n- "Show me low stock items"\n- "Are there any overdue invoices?"\n- "What are the recent order statuses?"`;
      }
      const convId = body.conversationId || `conv-${Date.now()}`;
      return ok({ response, conversationId: convId });
    }
    if (matchUrl(url, /\/api\/v1\/copilot\/conversations$/)) {
      return ok(MOCK_CONVERSATIONS.filter(c => c.userId === 'web-user'));
    }

    // ── Health checks ───────────────────────────────────────────────────────
    if (matchUrl(url, /\/actuator\/health$/) || matchUrl(url, /\/health$/)) {
      return ok('ok');
    }

    // ── Pass-through ────────────────────────────────────────────────────────
    return next.handle(req);
  }

  private toUserDto(u: MockUser) {
    return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, fullName: u.fullName, role: u.role, enabled: u.enabled, createdAt: u.createdAt };
  }
}
