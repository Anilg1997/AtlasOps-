-- IntelliOps - Seed Data
-- Flyway migration V2: Sample customers and products for development/testing

-- Sample Customers
INSERT INTO customers (customer_number, name, email, phone, address, created_at)
VALUES
    ('CUST-0001', 'Acme Corp', 'admin@acmecorp.com', '+1-555-0100', '123 Main Street, Springfield, IL 62701', NOW()),
    ('CUST-0002', 'TechGlobal Inc.', 'orders@techglobal.io', '+1-555-0200', '456 Innovation Drive, San Francisco, CA 94105', NOW()),
    ('CUST-0003', 'RetailMax Solutions', 'procurement@retailmax.com', '+1-555-0300', '789 Commerce Blvd, New York, NY 10001', NOW());

-- Sample Products
INSERT INTO products (name, description, sku, price, category, created_at)
VALUES
    ('Enterprise Server Rack', '42U standard server rack with cooling', 'SRV-RACK-42U', 2499.99, 'Hardware', NOW()),
    ('Cloud Storage License (1TB)', 'Annual subscription for 1TB cloud storage', 'CLD-STO-1TB', 599.99, 'Software', NOW()),
    ('Network Switch 48-Port', 'Gigabit managed network switch, 48 ports', 'NET-SW-48G', 1299.99, 'Hardware', NOW()),
    ('SSL Certificate - Wildcard', '1-year wildcard SSL certificate', 'SSL-WILD-1Y', 349.99, 'Security', NOW()),
    ('Database License - Standard', 'Perpetual database license, standard edition', 'DB-LIC-STD', 4999.99, 'Software', NOW()),
    ('Fiber Optic Cable (10m)', 'LC-LC duplex fiber optic patch cable, 10 meters', 'FIB-LC10', 29.99, 'Hardware', NOW()),
    ('Firewall Appliance', 'Next-gen firewall, 1U form factor', 'FW-APPL-1U', 3899.99, 'Security', NOW()),
    ('Consulting Hours (10-pack)', 'Block of 10 hours enterprise architecture consulting', 'CONS-10HR', 4500.00, 'Services', NOW());
