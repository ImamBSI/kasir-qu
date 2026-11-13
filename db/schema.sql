-- Skema database KasirQu (Neon Postgres).
-- Aman dijalankan berulang kali (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(10)  NOT NULL CHECK (role IN ('SADM', 'ADM', 'STF')),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  session_version INTEGER    NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS categories (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  category_id BIGINT       REFERENCES categories(id) ON DELETE SET NULL,
  sku         VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  image       TEXT,
  stock_pcs   INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_units (
  id                BIGSERIAL PRIMARY KEY,
  product_id        BIGINT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  satuan            VARCHAR(20)   NOT NULL,
  isi_dalam_satuan  INTEGER       NOT NULL DEFAULT 1,
  harga             NUMERIC(14,2) NOT NULL,
  modal             NUMERIC(14,2) NOT NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (product_id, satuan)
);

CREATE TABLE IF NOT EXISTS sales (
  id            BIGSERIAL PRIMARY KEY,
  sold_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  customer_name VARCHAR(100),
  total_amount  NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_by    BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS sales_sold_at_idx ON sales (sold_at);

CREATE TABLE IF NOT EXISTS sale_items (
  id             BIGSERIAL PRIMARY KEY,
  sale_id        BIGINT        NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id     BIGINT        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_sku    VARCHAR(50)   NOT NULL,
  product_name   VARCHAR(150)  NOT NULL,
  unit_name      VARCHAR(20)   NOT NULL,
  quantity       INTEGER       NOT NULL CHECK (quantity > 0),
  quantity_pcs   INTEGER       NOT NULL CHECK (quantity_pcs > 0),
  unit_price     NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  unit_cost      NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
  subtotal       NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
  gross_profit   NUMERIC(14,2) NOT NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON sale_items (product_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id             BIGSERIAL PRIMARY KEY,
  product_id     BIGINT      NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type  VARCHAR(3)  NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  quantity_pcs   INTEGER     NOT NULL CHECK (quantity_pcs > 0),
  sale_id        BIGINT REFERENCES sales(id) ON DELETE SET NULL,
  created_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx
  ON stock_movements (created_at);
