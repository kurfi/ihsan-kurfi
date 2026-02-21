-- 1. Drop dependent view
DROP VIEW IF EXISTS public.transit_shipments;

-- 2. Drop supplier_id from orders
ALTER TABLE orders DROP COLUMN IF EXISTS supplier_id CASCADE;

-- 3. Drop order_type from orders
ALTER TABLE orders DROP COLUMN IF EXISTS order_type CASCADE;

-- 4. Drop the order_type ENUM since it's no longer used
DROP TYPE IF EXISTS order_type CASCADE;

-- 5. Recreate transit_shipments view
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
  dep.address as depot_location,
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

-- Grant permissions
GRANT SELECT ON transit_shipments TO anon, authenticated;
