-- IntelliOps Platform - PostgreSQL Initialization
-- Creates separate databases for Auth and Order services.
-- Auth schema is created here; order/copilot tables are managed by Flyway migrations.

-- Auth Database
CREATE DATABASE intellops_auth;
\c intellops_auth;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Order Database (schema managed by Flyway: order-service + ai-copilot-service)
CREATE DATABASE intellops_order;
\c intellops_order;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector extension for RAG (AI Co-Pilot)
CREATE EXTENSION IF NOT EXISTS vector;
