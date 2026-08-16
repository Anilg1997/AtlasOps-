// IntelliOps Platform - MongoDB Initialization
// Creates collections for Inventory Service and AI Co-Pilot Service

db = db.getSiblingDB('intellops_inventory');

// Product Catalog Collection
db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sku', 'name', 'price', 'category'],
      properties: {
        sku: { bsonType: 'string', description: 'Stock Keeping Unit' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        price: { bsonType: 'double' },
        category: { bsonType: 'string' },
        attributes: { bsonType: 'object' },
        stockQuantity: { bsonType: 'int' },
        reorderThreshold: { bsonType: 'int' },
        active: { bsonType: 'bool' }
      }
    }
  }
});

db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ category: 1 });
db.products.createIndex({ name: 'text', description: 'text' });

// Stock Reservations Collection
db.createCollection('stock_reservations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['orderId', 'productId', 'quantity', 'status'],
      properties: {
        orderId: { bsonType: 'string' },
        productId: { bsonType: 'string' },
        quantity: { bsonType: 'int' },
        status: { bsonType: 'string', enum: ['RESERVED', 'RELEASED', 'FULFILLED'] },
        reservedAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' }
      }
    }
  }
});

db.stock_reservations.createIndex({ orderId: 1 });
db.stock_reservations.createIndex({ productId: 1 });
db.stock_reservations.createIndex({ status: 1 });

// Seed some sample products
db.products.insertMany([
  {
    sku: 'ELEC-LAPTOP-001',
    name: 'Enterprise Laptop Pro 15',
    description: 'High-performance business laptop with 16GB RAM and 512GB SSD',
    price: 1299.99,
    category: 'electronics',
    attributes: { ram: '16GB', storage: '512GB SSD', processor: 'Intel i7-13700H', display: '15.6" FHD' },
    stockQuantity: 150,
    reorderThreshold: 30,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    sku: 'ELEC-MONITOR-002',
    name: 'UltraSharp 27" 4K Monitor',
    description: 'Professional 4K UHD monitor with USB-C connectivity',
    price: 549.99,
    category: 'electronics',
    attributes: { resolution: '3840x2160', size: '27 inch', panel: 'IPS', connectivity: 'USB-C, HDMI, DisplayPort' },
    stockQuantity: 85,
    reorderThreshold: 20,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    sku: 'ELEC-KEYBOARD-003',
    name: 'Mechanical Keyboard RGB',
    description: 'Full-size mechanical keyboard with Cherry MX switches',
    price: 149.99,
    category: 'electronics',
    attributes: { switches: 'Cherry MX Brown', layout: 'Full-size', backlight: 'RGB', connectivity: 'USB-C, Wireless' },
    stockQuantity: 200,
    reorderThreshold: 50,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    sku: 'OFFICE-DESK-001',
    name: 'Standing Desk Electric',
    description: 'Height-adjustable electric standing desk with memory presets',
    price: 699.99,
    category: 'furniture',
    attributes: { height: '27.5" to 47"', surface: '60x30 inches', material: 'Bamboo', motor: 'Dual Motor' },
    stockQuantity: 40,
    reorderThreshold: 10,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    sku: 'OFFICE-CHAIR-002',
    name: 'Ergonomic Executive Chair',
    description: 'Premium ergonomic office chair with lumbar support',
    price: 449.99,
    category: 'furniture',
    attributes: { material: 'Mesh', adjustments: '8-way', armrests: '4D', weight_capacity: '300 lbs' },
    stockQuantity: 60,
    reorderThreshold: 15,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    sku: 'CABLE-HDMI-001',
    name: 'HDMI 2.1 Cable 6ft',
    description: 'Ultra high-speed HDMI 2.1 certified cable',
    price: 19.99,
    category: 'accessories',
    attributes: { version: 'HDMI 2.1', length: '6ft', bandwidth: '48Gbps', certification: 'Ultra High Speed' },
    stockQuantity: 500,
    reorderThreshold: 100,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// AI Co-Pilot Conversation Memory
db = db.getSiblingDB('intellops_copilot');

db.createCollection('conversations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'messages'],
      properties: {
        userId: { bsonType: 'string' },
        title: { bsonType: 'string' },
        messages: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['role', 'content'],
            properties: {
              role: { bsonType: 'string', enum: ['user', 'assistant', 'system', 'tool'] },
              content: { bsonType: 'string' },
              toolCalls: { bsonType: 'array' },
              toolResult: { bsonType: 'string' },
              timestamp: { bsonType: 'date' }
            }
          }
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.conversations.createIndex({ userId: 1 });
db.conversations.createIndex({ updatedAt: -1 });

// Notification / Activity Service — cross-service activity timeline
db = db.getSiblingDB('intellops_notification');

db.createCollection('activity_log', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['eventType', 'timestamp'],
      properties: {
        eventType: { bsonType: 'string' },
        source: { bsonType: 'string' },
        entityId: { bsonType: 'string' },
        entityType: { bsonType: 'string' },
        details: { bsonType: 'object' },
        timestamp: { bsonType: 'date' }
      }
    }
  }
});

db.activity_log.createIndex({ entityId: 1 });
db.activity_log.createIndex({ entityType: 1 });
db.activity_log.createIndex({ eventType: 1 });
db.activity_log.createIndex({ timestamp: -1 });

print('MongoDB initialization complete.');
