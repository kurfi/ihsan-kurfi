-- 1. Migrate existing transport_cost data to expenses table
INSERT INTO expenses (id, created_at, expense_type, amount, order_id, description)
SELECT 
  gen_random_uuid(), 
  created_at, 
  'transport', 
  transport_cost, 
  id, 
  'Transport cost for order ' || order_number 
FROM orders 
WHERE transport_cost IS NOT NULL AND transport_cost > 0;

-- 2. Drop the transport_cost column from orders
DROP VIEW IF EXISTS trip_profitability;
ALTER TABLE orders DROP COLUMN transport_cost;

-- 3. Recreate the trip_profitability view using the expenses table
CREATE OR REPLACE VIEW trip_profitability AS
SELECT 
    o.id,
    o.order_number,
    o.created_at,
    o.total_amount as revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE order_id = o.id) as total_expenses,
    (o.total_amount - (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE order_id = o.id)) as net_profit,
    CASE 
        WHEN o.total_amount IS NULL OR o.total_amount = 0 THEN 0 
        ELSE ((o.total_amount - (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE order_id = o.id)) / o.total_amount) * 100 
    END as profit_margin_percent,
    o.truck_id,
    t.plate_number,
    o.driver_id,
    d.name as driver_name
FROM orders o
LEFT JOIN trucks t ON o.truck_id = t.id
LEFT JOIN drivers d ON o.driver_id = d.id
WHERE o.status = 'delivered';
