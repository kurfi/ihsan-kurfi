-- Schema Normalization: Pricing Strategy

-- 1. Deprecate `customers.price_per_bag`
-- We are moving towards a Price Tier system (dynamic pricing).
-- This column is kept for backward compatibility but should not be used for new logic.
COMMENT ON COLUMN public.customers.price_per_bag IS 'DEPRECATED: Use price_tier logic instead. Kept for legacy records.';

-- 2. Ensure Orders have a valid snapshot of value
-- `total_amount` represents the final agreed value at the time of creation.
-- This constraint ensures we don't have "free" orders by accident, unless explicitly 0 (promo).
-- Using a check constraint that respects NULL if the order is still being drafted (if application logic allows).
-- Based on current logic, total_amount should be >= 0.

ALTER TABLE public.orders
ADD CONSTRAINT chk_orders_total_amount_valid 
CHECK (total_amount IS NULL OR total_amount >= 0);

COMMENT ON COLUMN public.orders.total_amount IS 'Snapshot of total order value at creation. Immutable for financial records.';
