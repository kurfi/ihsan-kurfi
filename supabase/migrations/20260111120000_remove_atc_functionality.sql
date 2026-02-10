-- Remove ATC functionality

-- 1. Drop dependent views
DROP VIEW IF EXISTS public.transit_shipments;
DROP VIEW IF EXISTS public.customer_aging;
DROP VIEW IF EXISTS public.trip_profitability;
DROP VIEW IF EXISTS public.fleet_availability;

-- 2. Update status and recreate order_status enum
-- Update any orders with 'atc_received' to 'requested'
UPDATE public.orders SET status = 'requested' WHERE status::text = 'atc_received';

-- Rename old enum
ALTER TYPE public.order_status RENAME TO order_status_old;

-- Create new enum without 'atc_received'
CREATE TYPE public.order_status AS ENUM (
  'requested',
  'in_gate',
  'loaded',
  'dispatched',
  'delivered'
);

-- Update status column to use new enum
ALTER TABLE public.orders 
  ALTER COLUMN status TYPE public.order_status 
  USING (
    CASE 
      WHEN status::text = 'atc_received' THEN 'requested'::public.order_status
      ELSE status::text::public.order_status
    END
  );

-- Drop old enum
DROP TYPE public.order_status_old;

-- 3. Remove atc_number column from orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS atc_number;

-- 4. Recreate views (without atc_number where applicable)

-- View: transit_shipments
CREATE OR REPLACE VIEW transit_shipments AS
SELECT 
  o.*,
  c.name as customer_name,
  c.phone as customer_phone,
  c.address as customer_address,
  t.plate_number,
  t.model as truck_model,
  d.name as driver_name,
  d.phone as driver_phone,
  dep.name as depot_name,
  dep.location as depot_location,
  EXTRACT(EPOCH FROM (COALESCE(o.estimated_delivery_date, o.dispatch_date + INTERVAL '24 hours') - o.dispatch_date)) / 3600 as estimated_hours,
  EXTRACT(EPOCH FROM (NOW() - o.dispatch_date)) / 3600 as hours_in_transit,
  CASE 
    WHEN o.estimated_delivery_date IS NOT NULL AND NOW() > o.estimated_delivery_date THEN 'delayed'
    WHEN o.estimated_delivery_date IS NOT NULL AND NOW() > (o.estimated_delivery_date - INTERVAL '2 hours') THEN 'due_soon'
    ELSE 'on_time'
  END as transit_status
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN trucks t ON o.truck_id = t.id
LEFT JOIN drivers d ON o.driver_id = d.id
LEFT JOIN depots dep ON o.depot_id = dep.id
WHERE o.status = 'dispatched' 
  AND o.dispatch_date IS NOT NULL 
  AND o.delivery_date IS NULL
ORDER BY o.dispatch_date DESC;

-- View: trip_profitability
CREATE OR REPLACE VIEW trip_profitability AS
SELECT 
  o.id,
  o.order_number,
  o.created_at,
  o.total_amount as revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  o.total_amount - COALESCE(SUM(e.amount), 0) as net_profit,
  CASE 
    WHEN o.total_amount > 0 THEN 
      ((o.total_amount - COALESCE(SUM(e.amount), 0)) / o.total_amount * 100)
    ELSE 0
  END as profit_margin_percent
FROM orders o
LEFT JOIN expenses e ON e.order_id = o.id
WHERE o.status = 'delivered'
GROUP BY o.id, o.order_number, o.created_at, o.total_amount;

-- View: customer_aging
CREATE OR REPLACE VIEW customer_aging AS
SELECT 
  c.id,
  c.name,
  c.current_balance,
  c.credit_limit,
  COALESCE(SUM(CASE 
    WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' 
    AND o.status = 'delivered'
    THEN o.total_amount - COALESCE(paid.total_paid, 0)
    ELSE 0 
  END), 0) as current_0_30,
  COALESCE(SUM(CASE 
    WHEN o.created_at < CURRENT_DATE - INTERVAL '30 days' 
    AND o.created_at >= CURRENT_DATE - INTERVAL '60 days'
    AND o.status = 'delivered'
    THEN o.total_amount - COALESCE(paid.total_paid, 0)
    ELSE 0 
  END), 0) as days_31_60,
  COALESCE(SUM(CASE 
    WHEN o.created_at < CURRENT_DATE - INTERVAL '60 days' 
    AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND o.status = 'delivered'
    THEN o.total_amount - COALESCE(paid.total_paid, 0)
    ELSE 0 
  END), 0) as days_61_90,
  COALESCE(SUM(CASE 
    WHEN o.created_at < CURRENT_DATE - INTERVAL '90 days'
    AND o.status = 'delivered'
    THEN o.total_amount - COALESCE(paid.total_paid, 0)
    ELSE 0 
  END), 0) as over_90_days
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
LEFT JOIN (
  SELECT order_id, SUM(amount) as total_paid
  FROM payments
  GROUP BY order_id
) paid ON paid.order_id = o.id
GROUP BY c.id, c.name, c.current_balance, c.credit_limit;

-- View: fleet_availability
CREATE OR REPLACE VIEW fleet_availability AS
SELECT 
  t.id,
  t.plate_number,
  t.model,
  t.capacity_tons,
  t.is_active,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.entity_id = t.id 
      AND d.entity_type = 'truck' 
      AND d.expiry_date < CURRENT_DATE
    ) THEN 'expired_docs'
    WHEN EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.truck_id = t.id 
      AND o.status IN ('loaded', 'dispatched')
    ) THEN 'in_use'
    WHEN t.is_active = false THEN 'inactive'
    WHEN t.next_service_date IS NOT NULL AND t.next_service_date < CURRENT_DATE THEN 'maintenance_due'
    ELSE 'available'
  END as availability_status,
  (SELECT COUNT(*) FROM documents d 
   WHERE d.entity_id = t.id 
   AND d.entity_type = 'truck' 
   AND d.expiry_date < CURRENT_DATE) as expired_doc_count
FROM trucks t;

-- Grant permissions
GRANT SELECT ON transit_shipments TO anon, authenticated;
GRANT SELECT ON trip_profitability TO anon, authenticated;
GRANT SELECT ON customer_aging TO anon, authenticated;
GRANT SELECT ON fleet_availability TO anon, authenticated;
