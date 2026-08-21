/**
 * AtlasOps Mock Data Service
 * Provides comprehensive, realistic test data so the frontend works standalone.
 * No backend required — anyone can clone, npm install, ng serve and see the full UI.
 */

// ─── Users ────────────────────────────────────────────────────────────────────

export interface MockUser {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'ADMIN' | 'USER' | 'OPERATOR';
  enabled: boolean;
  createdAt: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 1, email: 'admin@atlasops.io', password: 'admin123',
    firstName: 'Sarah', lastName: 'Chen', fullName: 'Sarah Chen',
    role: 'ADMIN', enabled: true, createdAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 2, email: 'demo@atlasops.io', password: 'demo123',
    firstName: 'Alex', lastName: 'Johnson', fullName: 'Alex Johnson',
    role: 'USER', enabled: true, createdAt: '2025-02-20T14:30:00Z'
  },
  {
    id: 3, email: 'ops@atlasops.io', password: 'ops123',
    firstName: 'Marcus', lastName: 'Williams', fullName: 'Marcus Williams',
    role: 'OPERATOR', enabled: true, createdAt: '2025-03-10T08:15:00Z'
  },
  {
    id: 4, email: 'jane@example.com', password: 'pass1234',
    firstName: 'Jane', lastName: 'Smith', fullName: 'Jane Smith',
    role: 'USER', enabled: true, createdAt: '2025-04-01T11:00:00Z'
  },
  {
    id: 5, email: 'raj@corp.io', password: 'pass1234',
    firstName: 'Raj', lastName: 'Patel', fullName: 'Raj Patel',
    role: 'OPERATOR', enabled: false, createdAt: '2025-05-12T16:45:00Z'
  },
  {
    id: 6, email: 'lisa@enterprise.com', password: 'pass1234',
    firstName: 'Lisa', lastName: 'Müller', fullName: 'Lisa Müller',
    role: 'USER', enabled: true, createdAt: '2025-06-05T10:20:00Z'
  },
  {
    id: 7, email: 'tom@startup.dev', password: 'pass1234',
    firstName: 'Tom', lastName: 'Davis', fullName: 'Tom Davis',
    role: 'USER', enabled: true, createdAt: '2025-07-18T13:10:00Z'
  },
  {
    id: 8, email: 'admin2@atlasops.io', password: 'admin123',
    firstName: 'Priya', lastName: 'Sharma', fullName: 'Priya Sharma',
    role: 'ADMIN', enabled: true, createdAt: '2025-08-01T07:30:00Z'
  }
];

// ─── Customers ────────────────────────────────────────────────────────────────

export interface MockCustomer {
  id: number;
  customerNumber: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  createdAt: string;
}

export const MOCK_CUSTOMERS: MockCustomer[] = [
  { id: 1, customerNumber: 'CUST-0001', name: 'Acme Corporation', email: 'orders@acme.com', phone: '+1-555-0101', company: 'Acme Corp', address: '123 Innovation Dr, San Francisco, CA 94105', createdAt: '2024-11-01T10:00:00Z' },
  { id: 2, customerNumber: 'CUST-0002', name: 'Globex Industries', email: 'procurement@globex.com', phone: '+1-555-0202', company: 'Globex Inc', address: '456 Enterprise Ave, Austin, TX 73301', createdAt: '2024-12-15T14:30:00Z' },
  { id: 3, customerNumber: 'CUST-0003', name: 'Initech Solutions', email: 'support@initech.io', phone: '+1-555-0303', company: 'Initech LLC', address: '789 Tech Blvd, Seattle, WA 98101', createdAt: '2025-01-20T09:15:00Z' },
  { id: 4, customerNumber: 'CUST-0004', name: 'Stark Industries', email: 'ops@stark.io', phone: '+1-555-0404', company: 'Stark Industries', address: '1 Iron Way, Malibu, CA 90265', createdAt: '2025-02-28T16:00:00Z' },
  { id: 5, customerNumber: 'CUST-0005', name: 'Wayne Enterprises', email: 'orders@wayne.com', phone: '+1-555-0505', company: 'Wayne Enterprises', address: '1007 Mountain Dr, Gotham, NJ 07001', createdAt: '2025-03-15T11:45:00Z' },
  { id: 6, customerNumber: 'CUST-0006', name: 'Umbrella Corp', email: 'supply@umbrella.net', phone: '+1-555-0606', company: 'Umbrella Corp', address: '555 Raccoon City Rd, Boston, MA 02101', createdAt: '2025-04-10T08:20:00Z' },
  { id: 7, customerNumber: 'CUST-0007', name: 'Cyberdyne Systems', email: 'tech@cyberdyne.com', phone: '+1-555-0707', company: 'Cyberdyne Systems', address: '18144 El Camino Real, Sunnyvale, CA 94087', createdAt: '2025-05-22T13:00:00Z' },
  { id: 8, customerNumber: 'CUST-0008', name: 'Oscorp Technologies', email: 'billing@oscorp.com', phone: '+1-555-0808', company: 'Oscorp Tech', address: '222 Queens Blvd, New York, NY 10001', createdAt: '2025-06-30T15:30:00Z' }
];

// ─── Products ─────────────────────────────────────────────────────────────────

export interface MockProduct {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  reorderThreshold: number;
  active: boolean;
  attributes?: Record<string, string>;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  { id: 1, sku: 'SRV-RACK-42U', name: 'Enterprise Server Rack 42U', description: 'Premium 42U server rack with integrated cooling, cable management, and UPS mounting. Supports up to 4000W load.', price: 2499.99, category: 'electronics', stockQuantity: 8, reorderThreshold: 5, active: true, attributes: { rackUnits: '42U', maxLoad: '4000W', cooling: 'Integrated 6-fan', color: 'Charcoal Black' } },
  { id: 2, sku: 'NET-SW-48G', name: '48-Port Gigabit Network Switch', description: 'Layer 3 managed switch with 48x 1GbE ports, 4x 10G SFP+ uplinks, and PoE+ support.', price: 1299.99, category: 'electronics', stockQuantity: 22, reorderThreshold: 10, active: true, attributes: { ports: '48x 1GbE + 4x 10G SFP+', poe: 'PoE+ 740W', switching: '176 Gbps' } },
  { id: 3, sku: 'CLD-STO-1TB', name: 'Cloud Storage 1TB SSD', description: 'Enterprise-grade NVMe SSD optimized for cloud workloads. 3.5GB/s read, 3.2GB/s write.', price: 599.99, category: 'electronics', stockQuantity: 45, reorderThreshold: 20, active: true, attributes: { capacity: '1TB', interface: 'NVMe PCIe 4.0', endurance: '1 DWPD' } },
  { id: 4, sku: 'SSL-WILD-1Y', name: 'Wildcard SSL Certificate (1 Year)', description: 'DigiCert wildcard SSL certificate. Covers *.domain.com. Unlimited server licenses.', price: 349.99, category: 'accessories', stockQuantity: 200, reorderThreshold: 50, active: true, attributes: { type: 'Wildcard', validity: '1 Year', issuer: 'DigiCert' } },
  { id: 5, sku: 'FW-APPL-1U', name: 'Next-Gen Firewall Appliance 1U', description: 'High-performance firewall with 20Gbps throughput, IDS/IPS, VPN gateway, and web filtering.', price: 3899.99, category: 'electronics', stockQuantity: 12, reorderThreshold: 3, active: true, attributes: { throughput: '20 Gbps', ports: '12x 10GbE + 4x 25GbE', vpn: 'IPSec/WireGuard' } },
  { id: 6, sku: 'DB-LIC-STD', name: 'Database License — Standard', description: 'Annual standard license for distributed SQL database. Supports up to 3 nodes.', price: 4999.99, category: 'accessories', stockQuantity: 30, reorderThreshold: 10, active: true, attributes: { type: 'Annual License', nodes: 'Up to 3', support: '24/7 Enterprise' } },
  { id: 7, sku: 'FIB-LC10', name: 'Fiber Optic LC-LC Cable 10m', description: 'LC duplex multimode fiber patch cable, OM4, 50/125μm, 10 meters.', price: 29.99, category: 'accessories', stockQuantity: 350, reorderThreshold: 100, active: true, attributes: { length: '10m', type: 'LC-LC Duplex', mode: 'OM4 Multimode' } },
  { id: 8, sku: 'CONS-10HR', name: 'Cloud Consulting — 10 Hours', description: 'Professional cloud architecture consulting. Includes migration planning, security audit, and optimization.', price: 4500.00, category: 'services', stockQuantity: 999, reorderThreshold: 10, active: true, attributes: { type: 'Professional Service', duration: '10 hours', delivery: 'Remote' } },
  { id: 9, sku: 'SRV-BLADE-M7', name: 'Blade Server Module M7', description: 'Half-width blade server with dual Intel Xeon Scalable processors, 256GB DDR5, and dual 480GB SSDs.', price: 8999.99, category: 'electronics', stockQuantity: 6, reorderThreshold: 3, active: true, attributes: { processor: 'Dual Xeon 4416+', memory: '256GB DDR5', storage: '2x 480GB SSD' } },
  { id: 10, sku: 'UPS-3KVA', name: 'Online UPS 3000VA', description: 'Double-conversion online UPS with 2700W capacity, SNMP monitoring, and hot-swappable batteries.', price: 1599.99, category: 'electronics', stockQuantity: 18, reorderThreshold: 5, active: true, attributes: { capacity: '3000VA / 2700W', topology: 'Online Double-Conversion', runtime: '15 min at full load' } },
  { id: 11, sku: 'MON-UWQ-34', name: '34" Ultrawide Monitor', description: '3440x1440 IPS panel, 100Hz, USB-C 90W PD, KVM switch built-in.', price: 699.99, category: 'electronics', stockQuantity: 35, reorderThreshold: 10, active: true, attributes: { resolution: '3440x1440', panel: 'IPS', refreshRate: '100Hz', connectivity: 'USB-C 90W, HDMI 2.1, DP 1.4' } },
  { id: 12, sku: 'KBD-MECH-BT', name: 'Wireless Mechanical Keyboard', description: 'Bluetooth 5.1 mechanical keyboard with hot-swappable switches and RGB backlight.', price: 149.99, category: 'accessories', stockQuantity: 120, reorderThreshold: 30, active: true, attributes: { switches: 'Gateron Pro (hot-swap)', connectivity: 'Bluetooth 5.1 + USB-C', battery: '4000mAh' } }
];

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'ON_HOLD';

export interface MockOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customer: { id: number; customerNumber: string; name: string; email: string; phone: string; };
  status: OrderStatus;
  statusReason?: string;
  totalAmount: number;
  taxAmount: number;
  notes: string;
  lineItems: Array<{
    id: number;
    productId: number;
    product: { id: number; sku: string; name: string; description: string; price: number; category: string; };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

function customerRef(c: MockCustomer) {
  return { id: c.id, customerNumber: c.customerNumber, name: c.name, email: c.email, phone: c.phone };
}
function productRef(p: MockProduct) {
  return { id: p.id, sku: p.sku, name: p.name, description: p.description, price: p.price, category: p.category };
}

const c1 = MOCK_CUSTOMERS[0], c2 = MOCK_CUSTOMERS[1], c3 = MOCK_CUSTOMERS[2];
const c4 = MOCK_CUSTOMERS[3], c5 = MOCK_CUSTOMERS[4], c6 = MOCK_CUSTOMERS[5];
const p1 = MOCK_PRODUCTS[0], p2 = MOCK_PRODUCTS[1], p3 = MOCK_PRODUCTS[2];
const p4 = MOCK_PRODUCTS[3], p5 = MOCK_PRODUCTS[4], p6 = MOCK_PRODUCTS[5];
const p7 = MOCK_PRODUCTS[6], p8 = MOCK_PRODUCTS[7], p9 = MOCK_PRODUCTS[8];
const p10 = MOCK_PRODUCTS[9], p11 = MOCK_PRODUCTS[10], p12 = MOCK_PRODUCTS[11];

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: 1, orderNumber: 'ORD-1001', customerId: 1, customer: customerRef(c1),
    status: 'ON_HOLD', statusReason: 'STOCK_HOLD',
    totalAmount: 6803.97, taxAmount: 503.98,
    notes: 'Held: SRV-RACK-42U below committed stock. Restock expected next week.',
    lineItems: [
      { id: 1, productId: 1, product: productRef(p1), quantity: 2, unitPrice: 2499.99, subtotal: 4999.98 },
      { id: 2, productId: 2, product: productRef(p2), quantity: 1, unitPrice: 1299.99, subtotal: 1299.99 }
    ],
    createdAt: '2025-08-18T10:00:00Z', updatedAt: '2025-08-20T14:30:00Z'
  },
  {
    id: 2, orderNumber: 'ORD-1002', customerId: 2, customer: customerRef(c2),
    status: 'SHIPPED',
    totalAmount: 7235.87, taxAmount: 535.99,
    notes: 'In transit via Express carrier. ETA: Aug 23.',
    lineItems: [
      { id: 3, productId: 3, product: productRef(p3), quantity: 10, unitPrice: 599.99, subtotal: 5999.90 },
      { id: 4, productId: 4, product: productRef(p4), quantity: 2, unitPrice: 349.99, subtotal: 699.98 }
    ],
    createdAt: '2025-08-16T08:15:00Z', updatedAt: '2025-08-21T06:00:00Z'
  },
  {
    id: 3, orderNumber: 'ORD-1003', customerId: 3, customer: customerRef(c3),
    status: 'DELIVERED',
    totalAmount: 1619.46, taxAmount: 119.96,
    notes: 'Delivered. Customer confirmed receipt.',
    lineItems: [
      { id: 5, productId: 7, product: productRef(p7), quantity: 50, unitPrice: 29.99, subtotal: 1499.50 }
    ],
    createdAt: '2025-08-11T11:00:00Z', updatedAt: '2025-08-19T16:00:00Z'
  },
  {
    id: 4, orderNumber: 'ORD-1004', customerId: 1, customer: customerRef(c1),
    status: 'PROCESSING',
    totalAmount: 9611.98, taxAmount: 712.00,
    notes: 'Being prepared for shipment at WH-NORTH-A12.',
    lineItems: [
      { id: 6, productId: 5, product: productRef(p5), quantity: 1, unitPrice: 3899.99, subtotal: 3899.99 },
      { id: 7, productId: 6, product: productRef(p6), quantity: 1, unitPrice: 4999.99, subtotal: 4999.99 }
    ],
    createdAt: '2025-08-19T09:30:00Z', updatedAt: '2025-08-21T03:00:00Z'
  },
  {
    id: 5, orderNumber: 'ORD-1005', customerId: 2, customer: customerRef(c2),
    status: 'PENDING', statusReason: 'PAYMENT_PENDING',
    totalAmount: 9720.00, taxAmount: 720.00,
    notes: 'Awaiting payment confirmation from finance gateway.',
    lineItems: [
      { id: 8, productId: 8, product: productRef(p8), quantity: 2, unitPrice: 4500.00, subtotal: 9000.00 }
    ],
    createdAt: '2025-08-20T14:00:00Z', updatedAt: '2025-08-20T14:00:00Z'
  },
  {
    id: 6, orderNumber: 'ORD-1006', customerId: 3, customer: customerRef(c3),
    status: 'CANCELLED', statusReason: 'PAYMENT_FAILED',
    totalAmount: 377.99, taxAmount: 28.00,
    notes: 'Cancelled after 3 failed payment attempts.',
    lineItems: [
      { id: 9, productId: 4, product: productRef(p4), quantity: 1, unitPrice: 349.99, subtotal: 349.99 }
    ],
    createdAt: '2025-08-14T17:45:00Z', updatedAt: '2025-08-17T09:20:00Z'
  },
  {
    id: 7, orderNumber: 'ORD-1007', customerId: 4, customer: customerRef(c4),
    status: 'CONFIRMED',
    totalAmount: 18249.97, taxAmount: 1351.85,
    notes: 'Large infrastructure upgrade. Priority shipping requested.',
    lineItems: [
      { id: 10, productId: 9, product: productRef(p9), quantity: 2, unitPrice: 8999.99, subtotal: 17999.98 },
      { id: 11, productId: 10, product: productRef(p10), quantity: 0.16, unitPrice: 1599.99, subtotal: 250 }
    ],
    createdAt: '2025-08-20T11:30:00Z', updatedAt: '2025-08-21T08:00:00Z'
  },
  {
    id: 8, orderNumber: 'ORD-1008', customerId: 5, customer: customerRef(c5),
    status: 'PENDING',
    totalAmount: 849.98, taxAmount: 62.96,
    notes: 'New office setup.',
    lineItems: [
      { id: 12, productId: 11, product: productRef(p11), quantity: 1, unitPrice: 699.99, subtotal: 699.99 },
      { id: 13, productId: 12, product: productRef(p12), quantity: 1, unitPrice: 149.99, subtotal: 149.99 }
    ],
    createdAt: '2025-08-21T07:00:00Z', updatedAt: '2025-08-21T07:00:00Z'
  },
  {
    id: 9, orderNumber: 'ORD-1009', customerId: 6, customer: customerRef(c6),
    status: 'SHIPPED',
    totalAmount: 5349.97, taxAmount: 396.30,
    notes: 'Renewal order — SSL certs and DB license.',
    lineItems: [
      { id: 14, productId: 4, product: productRef(p4), quantity: 5, unitPrice: 349.99, subtotal: 1749.95 },
      { id: 15, productId: 6, product: productRef(p6), quantity: 0.72, unitPrice: 4999.99, subtotal: 3600 }
    ],
    createdAt: '2025-08-17T13:00:00Z', updatedAt: '2025-08-21T04:30:00Z'
  },
  {
    id: 10, orderNumber: 'ORD-1010', customerId: 7, customer: customerRef(MOCK_CUSTOMERS[6]),
    status: 'DELIVERED',
    totalAmount: 2749.98, taxAmount: 203.70,
    notes: 'Completed. Client satisfaction survey sent.',
    lineItems: [
      { id: 16, productId: 2, product: productRef(p2), quantity: 2, unitPrice: 1299.99, subtotal: 2599.98 }
    ],
    createdAt: '2025-08-05T10:00:00Z', updatedAt: '2025-08-12T15:00:00Z'
  },
  {
    id: 11, orderNumber: 'ORD-1011', customerId: 8, customer: customerRef(MOCK_CUSTOMERS[7]),
    status: 'PROCESSING',
    totalAmount: 4349.97, taxAmount: 322.22,
    notes: 'Bulk keyboard order for new office.',
    lineItems: [
      { id: 17, productId: 12, product: productRef(p12), quantity: 29, unitPrice: 149.99, subtotal: 4349.71 }
    ],
    createdAt: '2025-08-19T15:30:00Z', updatedAt: '2025-08-21T02:00:00Z'
  },
  {
    id: 12, orderNumber: 'ORD-1012', customerId: 4, customer: customerRef(c4),
    status: 'DELIVERED',
    totalAmount: 2499.99, taxAmount: 185.00,
    notes: 'Rack delivered and installed.',
    lineItems: [
      { id: 18, productId: 1, product: productRef(p1), quantity: 1, unitPrice: 2499.99, subtotal: 2499.99 }
    ],
    createdAt: '2025-07-28T09:00:00Z', updatedAt: '2025-08-08T12:00:00Z'
  }
];

// ─── Invoices ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'PARTIAL';

export interface MockInvoice {
  id: number;
  invoiceNumber: string;
  orderNumber: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  taxAmount: number;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

export const MOCK_INVOICES: MockInvoice[] = [
  { id: 1, invoiceNumber: 'INV-2001', orderNumber: 'ORD-1001', customerId: 1, customerName: 'Acme Corporation', totalAmount: 6803.97, taxAmount: 503.98, status: 'PENDING', paymentStatus: 'UNPAID', issueDate: '2025-08-18', dueDate: '2025-09-17' },
  { id: 2, invoiceNumber: 'INV-2002', orderNumber: 'ORD-1002', customerId: 2, customerName: 'Globex Industries', totalAmount: 7235.87, taxAmount: 535.99, status: 'PAID', paymentStatus: 'PAID', paymentMethod: 'Wire Transfer', transactionId: 'TXN-WT-98234', issueDate: '2025-08-16', dueDate: '2025-09-15', paidDate: '2025-08-19' },
  { id: 3, invoiceNumber: 'INV-2003', orderNumber: 'ORD-1003', customerId: 3, customerName: 'Initech Solutions', totalAmount: 1619.46, taxAmount: 119.96, status: 'PAID', paymentStatus: 'PAID', paymentMethod: 'Credit Card', transactionId: 'TXN-CC-45192', issueDate: '2025-08-11', dueDate: '2025-09-10', paidDate: '2025-08-13' },
  { id: 4, invoiceNumber: 'INV-2004', orderNumber: 'ORD-1004', customerId: 1, customerName: 'Acme Corporation', totalAmount: 9611.98, taxAmount: 712.00, status: 'PENDING', paymentStatus: 'UNPAID', issueDate: '2025-08-19', dueDate: '2025-09-18' },
  { id: 5, invoiceNumber: 'INV-2005', orderNumber: 'ORD-1005', customerId: 2, customerName: 'Globex Industries', totalAmount: 9720.00, taxAmount: 720.00, status: 'PENDING', paymentStatus: 'UNPAID', issueDate: '2025-08-20', dueDate: '2025-09-19' },
  { id: 6, invoiceNumber: 'INV-2006', orderNumber: 'ORD-1006', customerId: 3, customerName: 'Initech Solutions', totalAmount: 377.99, taxAmount: 28.00, status: 'CANCELLED', paymentStatus: 'FAILED', issueDate: '2025-08-14', dueDate: '2025-09-13' },
  { id: 7, invoiceNumber: 'INV-2007', orderNumber: 'ORD-1007', customerId: 4, customerName: 'Stark Industries', totalAmount: 18249.97, taxAmount: 1351.85, status: 'PENDING', paymentStatus: 'UNPAID', issueDate: '2025-08-20', dueDate: '2025-09-19' },
  { id: 8, invoiceNumber: 'INV-2008', orderNumber: 'ORD-1008', customerId: 5, customerName: 'Wayne Enterprises', totalAmount: 849.98, taxAmount: 62.96, status: 'PENDING', paymentStatus: 'UNPAID', issueDate: '2025-08-21', dueDate: '2025-09-20' },
  { id: 9, invoiceNumber: 'INV-2009', orderNumber: 'ORD-1009', customerId: 6, customerName: 'Umbrella Corp', totalAmount: 5349.97, taxAmount: 396.30, status: 'OVERDUE', paymentStatus: 'PARTIAL', issueDate: '2025-07-17', dueDate: '2025-08-16', paidDate: undefined },
  { id: 10, invoiceNumber: 'INV-2010', orderNumber: 'ORD-1010', customerId: 7, customerName: 'Cyberdyne Systems', totalAmount: 2749.98, taxAmount: 203.70, status: 'PAID', paymentStatus: 'PAID', paymentMethod: 'ACH', transactionId: 'TXN-ACH-11045', issueDate: '2025-08-05', dueDate: '2025-09-04', paidDate: '2025-08-10' },
  { id: 11, invoiceNumber: 'INV-2011', orderNumber: 'ORD-1011', customerId: 8, customerName: 'Oscorp Technologies', totalAmount: 4349.97, taxAmount: 322.22, status: 'PENDING', paymentStatus: 'UNPAID', issueDate: '2025-08-19', dueDate: '2025-09-18' },
  { id: 12, invoiceNumber: 'INV-2012', orderNumber: 'ORD-1012', customerId: 4, customerName: 'Stark Industries', totalAmount: 2499.99, taxAmount: 185.00, status: 'PAID', paymentStatus: 'PAID', paymentMethod: 'Credit Card', transactionId: 'TXN-CC-88123', issueDate: '2025-07-28', dueDate: '2025-08-27', paidDate: '2025-07-30' }
];

// ─── Activity Feed ────────────────────────────────────────────────────────────

export interface MockActivityEntry {
  id: string;
  eventType: string;
  source: string;
  entityId: string;
  entityType: string;
  details: Record<string, string>;
  timestamp: string;
}

function daysAgo(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

function hoursAgo(h: number): string {
  const date = new Date();
  date.setHours(date.getHours() - h);
  return date.toISOString();
}

export const MOCK_ACTIVITIES: MockActivityEntry[] = [
  { id: 'a1', eventType: 'ORDER_CREATED', source: 'order-service', entityId: 'ORD-1001', entityType: 'ORDER', details: { orderNumber: 'ORD-1001', customerEmail: 'orders@acme.com', totalAmount: '6803.97', status: 'PENDING' }, timestamp: daysAgo(3) },
  { id: 'a2', eventType: 'ORDER_STATUS_CHANGED', source: 'order-service', entityId: 'ORD-1001', entityType: 'ORDER', details: { fromStatus: 'PENDING', toStatus: 'ON_HOLD', reason: 'STOCK_HOLD' }, timestamp: daysAgo(2) },
  { id: 'a3', eventType: 'INVOICE_CREATED', source: 'billing-service', entityId: 'INV-2001', entityType: 'INVOICE', details: { invoiceNumber: 'INV-2001', orderNumber: 'ORD-1001', amount: '6803.97' }, timestamp: daysAgo(2) },
  { id: 'a4', eventType: 'ORDER_CREATED', source: 'order-service', entityId: 'ORD-1002', entityType: 'ORDER', details: { orderNumber: 'ORD-1002', customerEmail: 'procurement@globex.com', totalAmount: '7235.87', status: 'PENDING' }, timestamp: daysAgo(5) },
  { id: 'a5', eventType: 'ORDER_STATUS_CHANGED', source: 'order-service', entityId: 'ORD-1002', entityType: 'ORDER', details: { fromStatus: 'PENDING', toStatus: 'PROCESSING' }, timestamp: daysAgo(4) },
  { id: 'a6', eventType: 'INVOICE_CREATED', source: 'billing-service', entityId: 'INV-2002', entityType: 'INVOICE', details: { invoiceNumber: 'INV-2002', orderNumber: 'ORD-1002', amount: '7235.87' }, timestamp: daysAgo(4) },
  { id: 'a7', eventType: 'INVOICE_PAID', source: 'billing-service', entityId: 'INV-2002', entityType: 'INVOICE', details: { amount: '7235.87', method: 'Wire Transfer' }, timestamp: daysAgo(3) },
  { id: 'a8', eventType: 'PAYMENT_RECEIVED', source: 'billing-service', entityId: 'PAY-2002', entityType: 'PAYMENT', details: { paymentRef: 'PAY-2002', invoiceNumber: 'INV-2002', amount: '7235.87' }, timestamp: daysAgo(3) },
  { id: 'a9', eventType: 'ORDER_STATUS_CHANGED', source: 'order-service', entityId: 'ORD-1002', entityType: 'ORDER', details: { fromStatus: 'PROCESSING', toStatus: 'SHIPPED', carrier: 'Express' }, timestamp: daysAgo(3) },
  { id: 'a10', eventType: 'ORDER_CREATED', source: 'order-service', entityId: 'ORD-1003', entityType: 'ORDER', details: { orderNumber: 'ORD-1003', customerEmail: 'support@initech.io', totalAmount: '1619.46', status: 'PENDING' }, timestamp: daysAgo(10) },
  { id: 'a11', eventType: 'ORDER_STATUS_CHANGED', source: 'order-service', entityId: 'ORD-1003', entityType: 'ORDER', details: { fromStatus: 'PENDING', toStatus: 'SHIPPED' }, timestamp: daysAgo(9) },
  { id: 'a12', eventType: 'INVOICE_CREATED', source: 'billing-service', entityId: 'INV-2003', entityType: 'INVOICE', details: { invoiceNumber: 'INV-2003', orderNumber: 'ORD-1003', amount: '1619.46' }, timestamp: daysAgo(9) },
  { id: 'a13', eventType: 'INVOICE_PAID', source: 'billing-service', entityId: 'INV-2003', entityType: 'INVOICE', details: { amount: '1619.46', method: 'Credit Card' }, timestamp: daysAgo(8) },
  { id: 'a14', eventType: 'PAYMENT_RECEIVED', source: 'billing-service', entityId: 'PAY-2003', entityType: 'PAYMENT', details: { paymentRef: 'PAY-2003', invoiceNumber: 'INV-2003', amount: '1619.46' }, timestamp: daysAgo(8) },
  { id: 'a15', eventType: 'ORDER_STATUS_CHANGED', source: 'order-service', entityId: 'ORD-1003', entityType: 'ORDER', details: { fromStatus: 'SHIPPED', toStatus: 'DELIVERED' }, timestamp: daysAgo(8) },
  { id: 'a16', eventType: 'ORDER_CREATED', source: 'order-service', entityId: 'ORD-1004', entityType: 'ORDER', details: { orderNumber: 'ORD-1004', customerEmail: 'orders@acme.com', totalAmount: '9611.98', status: 'PENDING' }, timestamp: daysAgo(2) },
  { id: 'a17', eventType: 'ORDER_STATUS_CHANGED', source: 'order-service', entityId: 'ORD-1004', entityType: 'ORDER', details: { fromStatus: 'PENDING', toStatus: 'PROCESSING', warehouse: 'WH-NORTH-A12' }, timestamp: hoursAgo(3) },
  { id: 'a18', eventType: 'ORDER_CREATED', source: 'order-service', entityId: 'ORD-1005', entityType: 'ORDER', details: { orderNumber: 'ORD-1005', customerEmail: 'procurement@globex.com', totalAmount: '9720.00', status: 'PENDING', statusReason: 'PAYMENT_PENDING' }, timestamp: daysAgo(1) },
  { id: 'a19', eventType: 'INVOICE_CREATED', source: 'billing-service', entityId: 'INV-2005', entityType: 'INVOICE', details: { invoiceNumber: 'INV-2005', orderNumber: 'ORD-1005', amount: '9720.00' }, timestamp: daysAgo(1) },
  { id: 'a20', eventType: 'ORDER_CREATED', source: 'order-service', entityId: 'ORD-1006', entityType: 'ORDER', details: { orderNumber: 'ORD-1006', customerEmail: 'support@initech.io', totalAmount: '377.99', status: 'PENDING' }, timestamp: daysAgo(7) },
  { id: 'a21', eventType: 'INVOICE_CREATED', source: 'billing-service', entityId: 'INV-2006', entityType: 'INVOICE', details: { invoiceNumber: 'INV-2006', orderNumber: 'ORD-1006', amount: '377.99' }, timestamp: daysAgo(6) },
  { id: 'a22', eventType: 'PAYMENT_FAILED', source: 'billing-service', entityId: 'PAY-2006', entityType: 'PAYMENT', details: { paymentRef: 'PAY-2006', invoiceNumber: 'INV-2006', reason: 'card_declined' }, timestamp: daysAgo(6) },
  { id: 'a23', eventType: 'ORDER_STATUS_CHANGED', source: 'order-service', entityId: 'ORD-1006', entityType: 'ORDER', details: { fromStatus: 'PENDING', toStatus: 'CANCELLED', reason: 'PAYMENT_FAILED' }, timestamp: daysAgo(6) },
  { id: 'a24', eventType: 'BILLING_ACCOUNT_CHANGED', source: 'billing-service', entityId: 'ACC-0001', entityType: 'ACCOUNT', details: { accountNumber: 'ACC-0001', customerEmail: 'orders@acme.com', change: 'payment method updated' }, timestamp: daysAgo(2) },
  { id: 'a25', eventType: 'BILLING_ACCOUNT_CHANGED', source: 'billing-service', entityId: 'ACC-0002', entityType: 'ACCOUNT', details: { accountNumber: 'ACC-0002', customerEmail: 'procurement@globex.com', change: 'shipping address updated' }, timestamp: daysAgo(1) },
  { id: 'a26', eventType: 'ORDER_CREATED', source: 'order-service', entityId: 'ORD-1007', entityType: 'ORDER', details: { orderNumber: 'ORD-1007', customerEmail: 'ops@stark.io', totalAmount: '18249.97', status: 'PENDING' }, timestamp: daysAgo(1) },
  { id: 'a27', eventType: 'ORDER_STATUS_CHANGED', source: 'order-service', entityId: 'ORD-1007', entityType: 'ORDER', details: { fromStatus: 'PENDING', toStatus: 'CONFIRMED' }, timestamp: hoursAgo(8) },
  { id: 'a28', eventType: 'ORDER_CREATED', source: 'order-service', entityId: 'ORD-1008', entityType: 'ORDER', details: { orderNumber: 'ORD-1008', customerEmail: 'orders@wayne.com', totalAmount: '849.98', status: 'PENDING' }, timestamp: hoursAgo(5) },
  { id: 'a29', eventType: 'INVOICE_OVERDUE', source: 'billing-service', entityId: 'INV-2009', entityType: 'INVOICE', details: { invoiceNumber: 'INV-2009', orderNumber: 'ORD-1009', daysOverdue: '5', amount: '5349.97' }, timestamp: hoursAgo(2) }
];

// ─── Chat / Copilot ───────────────────────────────────────────────────────────

export interface MockConversation {
  id: string;
  userId: string;
  title: string;
  messages: Array<{ role: string; content: string; timestamp: string; }>;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'conv-1', userId: 'web-user', title: 'Order ORD-1001 stock hold inquiry',
    messages: [
      { role: 'user', content: 'Why is order ORD-1001 on hold?', timestamp: daysAgo(2) },
      { role: 'assistant', content: 'Order ORD-1001 (Acme Corporation, $6,803.97) is currently on **STOCK_HOLD**. The reason is that SKU **SRV-RACK-42U** (Enterprise Server Rack 42U) is below committed stock levels. The current inventory shows only 8 units available, but this order requires 2 units and there are likely other pending orders consuming available stock.\n\n**Recommended actions:**\n1. Check with the procurement team for the expected restock date\n2. Notify the customer (Acme Corp) about the expected delay\n3. Consider partial shipment if other items are available\n\nWould you like me to check the current stock levels or draft a customer notification?', timestamp: daysAgo(2) }
    ],
    createdAt: daysAgo(2), updatedAt: daysAgo(2)
  },
  {
    id: 'conv-2', userId: 'web-user', title: 'Inventory status check',
    messages: [
      { role: 'user', content: 'Show me low stock items', timestamp: daysAgo(1) },
      { role: 'assistant', content: 'Here are the items currently at or below their reorder threshold:\n\n| SKU | Product | Stock | Reorder At | Status |\n|-----|---------|-------|------------|--------|\n| SRV-RACK-42U | Enterprise Server Rack 42U | 8 | 5 | ⚠️ Low |\n| FW-APPL-1U | Next-Gen Firewall Appliance | 12 | 3 | ⚠️ Watch |\n| SRV-BLADE-M7 | Blade Server Module M7 | 6 | 3 | ⚠️ Watch |\n| UPS-3KVA | Online UPS 3000VA | 18 | 5 | ⚠️ Watch |\n\nThe most critical item is **SRV-RACK-42U** with only 8 units, which is causing the stock hold on ORD-1001. Would you like me to check the procurement status or create a restock order?', timestamp: daysAgo(1) }
    ],
    createdAt: daysAgo(1), updatedAt: daysAgo(1)
  },
  {
    id: 'conv-3', userId: 'web-user', title: 'Payment failure investigation',
    messages: [
      { role: 'user', content: 'What happened with ORD-1006?', timestamp: daysAgo(5) },
      { role: 'assistant', content: 'Order ORD-1006 (Initech Solutions, $377.99) was **cancelled** due to a **payment failure**. Here\'s the timeline:\n\n1. **Aug 14** — Order created for 1x Wildcard SSL Certificate ($349.99 + $28.00 tax)\n2. **Aug 14** — Invoice INV-2006 generated\n3. **Aug 15** — First payment attempt failed (card_declined)\n4. **Aug 16** — Two additional retry attempts also failed\n5. **Aug 17** — Order automatically cancelled after 3 failed payment attempts\n\n**Root cause:** Payment was declined by the issuing bank. No fraud flags were raised.\n\n**Suggested next steps:**\n1. Contact the customer to verify their payment method\n2. Offer alternative payment options (ACH, wire transfer)\n3. Check if the SSL certificate can still be provisioned once payment is resolved', timestamp: daysAgo(5) }
    ],
    createdAt: daysAgo(5), updatedAt: daysAgo(5)
  }
];

// ─── System Health ────────────────────────────────────────────────────────────

export interface MockServiceHealth {
  name: string;
  port: number;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  uptime: string;
  version: string;
  lastCheck: string;
}

export const MOCK_SERVICE_HEALTH: MockServiceHealth[] = [
  { name: 'Auth Service', port: 8080, status: 'UP', uptime: '99.98%', version: '1.0.0', lastCheck: hoursAgo(0) },
  { name: 'Order Service', port: 8081, status: 'UP', uptime: '99.95%', version: '1.0.0', lastCheck: hoursAgo(0) },
  { name: 'Inventory Service', port: 8082, status: 'UP', uptime: '99.99%', version: '1.0.0', lastCheck: hoursAgo(0) },
  { name: 'AI Co-Pilot', port: 8083, status: 'UP', uptime: '99.90%', version: '1.0.0', lastCheck: hoursAgo(0) },
  { name: 'Billing Service', port: 8084, status: 'DEGRADED', uptime: '98.50%', version: '1.0.0', lastCheck: hoursAgo(0) },
  { name: 'Notification Service', port: 8085, status: 'UP', uptime: '99.97%', version: '1.0.0', lastCheck: hoursAgo(0) }
];
