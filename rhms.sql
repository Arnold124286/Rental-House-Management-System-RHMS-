-- ============================================================
--  RHMS - Rental House Management System
--  PostgreSQL Database Schema
--  Generated from: backend/src/config/migrate.js
--  Database: rhms_db
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP EXISTING TABLES (safe reset order)
-- ============================================================
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS relocation_requests CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS lease_requests CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS leases CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS landlords CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'landlord', 'tenant')),
  first_name    VARCHAR(50),
  last_name     VARCHAR(50),
  worker_id     VARCHAR(50),          -- Only for admins
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. LANDLORDS TABLE
-- ============================================================
CREATE TABLE landlords (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(100),
  phone         VARCHAR(20),
  address       TEXT,
  national_id   VARCHAR(30),
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'blacklisted')),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. TENANTS TABLE
-- ============================================================
CREATE TABLE tenants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone             VARCHAR(20),
  national_id       VARCHAR(30),
  emergency_contact VARCHAR(100),
  emergency_phone   VARCHAR(20),
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. PROPERTIES TABLE
-- ============================================================
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id     UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  address         TEXT NOT NULL,
  city            VARCHAR(50),
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  category        VARCHAR(50) DEFAULT 'rental' CHECK (category IN ('rental', 'bnb', 'lease', 'boardroom')),
  is_blacklisted  BOOLEAN DEFAULT FALSE,
  total_units     INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. UNITS TABLE
-- ============================================================
CREATE TABLE units (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number  VARCHAR(20) NOT NULL,
  floor_number INT,
  bedrooms     INT DEFAULT 1,
  bathrooms    INT DEFAULT 1,
  rent_amount  DECIMAL(10,2) NOT NULL,
  status       VARCHAR(20) DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance')),
  video_url    TEXT,                             -- Link or file path
  video_type   VARCHAR(20) DEFAULT 'youtube',    -- 'youtube', 'tiktok', 'local'
  description  TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE (property_id, unit_number)
);

-- ============================================================
-- 6. LEASES TABLE
-- ============================================================
CREATE TABLE leases (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id        UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  start_date     DATE NOT NULL,
  end_date       DATE,
  rent_amount    DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  status         VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id        UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  amount          DECIMAL(10,2) NOT NULL,
  method          VARCHAR(30) DEFAULT 'cash' CHECK (method IN ('cash', 'paystack', 'bank_transfer', 'cheque', 'card')),
  transaction_ref VARCHAR(100),
  payment_month   VARCHAR(7) NOT NULL,   -- Format: YYYY-MM
  status          VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed', 'reversed')),
  notes           TEXT,
  paid_at         TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. MAINTENANCE REQUESTS TABLE
-- ============================================================
CREATE TABLE maintenance_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id     UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,
  title       VARCHAR(100) NOT NULL,
  description TEXT,
  category    VARCHAR(50) DEFAULT 'general' CHECK (category IN ('plumbing', 'electrical', 'structural', 'appliances', 'cleaning', 'general')),
  priority    VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status      VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  assigned_to VARCHAR(100),
  resolved_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 9. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  details     JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 10. LEASE REQUESTS TABLE
-- ============================================================
CREATE TABLE lease_requests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id    UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status     VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  message    TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 11. RELOCATION REQUESTS TABLE
-- ============================================================
CREATE TABLE relocation_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  current_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  target_unit_id  UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason          TEXT,
  admin_notes     TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 12. REVIEWS TABLE
-- ============================================================
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE SET NULL,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  is_visible  BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 13. COMPLAINTS TABLE
-- ============================================================
CREATE TABLE complaints (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id     UUID REFERENCES units(id) ON DELETE SET NULL,
  subject     VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolution  TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES (for query performance)
-- ============================================================
CREATE INDEX idx_units_property       ON units(property_id);
CREATE INDEX idx_units_status         ON units(status);
CREATE INDEX idx_leases_tenant        ON leases(tenant_id);
CREATE INDEX idx_leases_unit          ON leases(unit_id);
CREATE INDEX idx_leases_status        ON leases(status);
CREATE INDEX idx_payments_lease       ON payments(lease_id);
CREATE INDEX idx_payments_month       ON payments(payment_month);
CREATE INDEX idx_maintenance_unit     ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_status   ON maintenance_requests(status);
CREATE INDEX idx_audit_user           ON audit_logs(user_id);
CREATE INDEX idx_lease_requests_unit  ON lease_requests(unit_id);
CREATE INDEX idx_lease_requests_tenant ON lease_requests(tenant_id);
CREATE INDEX idx_reviews_property     ON reviews(property_id);
