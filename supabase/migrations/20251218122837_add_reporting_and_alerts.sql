-- Create views for reporting and analytics

-- View: Expiring Documents (documents expiring in next 30 days or already expired)
CREATE OR REPLACE VIEW expiring_documents AS
SELECT 
  d.*,
  CASE 
    WHEN d.entity_type = 'driver' THEN dr.name
    WHEN d.entity_type = 'truck' THEN t.plate_number
  END as entity_name,
  (d.expiry_date - CURRENT_DATE) as days_until_expiry,
  CASE 
    WHEN d.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN d.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
    WHEN d.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
    ELSE 'ok'
  END as status
FROM documents d
LEFT JOIN drivers dr ON d.entity_type = 'driver' AND d.entity_id = dr.id
LEFT JOIN trucks t ON d.entity_type = 'truck' AND d.entity_id = t.id
WHERE d.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY d.expiry_date ASC;

-- View: Trip Profitability
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

-- View: Customer Aging Analysis
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

-- View: Fleet Availability
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

-- Function: Check if entity can be dispatched
CREATE OR REPLACE FUNCTION can_dispatch(
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO expired_count
  FROM documents
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND expiry_date < CURRENT_DATE;
  
  RETURN expired_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Get upcoming expiries for alerts
CREATE OR REPLACE FUNCTION get_upcoming_expiries(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  document_type document_type,
  expiry_date DATE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.entity_type,
    d.entity_id,
    CASE 
      WHEN d.entity_type = 'driver' THEN dr.name
      WHEN d.entity_type = 'truck' THEN t.plate_number
    END as entity_name,
    d.document_type,
    d.expiry_date,
    (d.expiry_date - CURRENT_DATE) as days_remaining
  FROM documents d
  LEFT JOIN drivers dr ON d.entity_type = 'driver' AND d.entity_id = dr.id
  LEFT JOIN trucks t ON d.entity_type = 'truck' AND d.entity_id = t.id
  WHERE d.expiry_date <= CURRENT_DATE + (days_ahead || ' days')::INTERVAL
    AND d.expiry_date >= CURRENT_DATE
  ORDER BY d.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Create table for tracking alert notifications
CREATE TABLE IF NOT EXISTS document_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- '30_day', '15_day', '5_day', 'expired'
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE document_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on document_alerts" 
ON document_alerts FOR ALL USING (true) WITH CHECK (true);

-- Trigger to prevent order assignment to entities with expired documents
CREATE OR REPLACE FUNCTION check_entity_documents_before_assignment()
RETURNS TRIGGER AS $$
DECLARE
  has_expired BOOLEAN;
BEGIN
  -- Check driver documents if driver_id is being set
  IF NEW.driver_id IS NOT NULL THEN
    SELECT NOT can_dispatch('driver', NEW.driver_id) INTO has_expired;
    IF has_expired THEN
      RAISE EXCEPTION 'Cannot assign driver: has expired documents';
    END IF;
  END IF;
  
  -- Check truck documents if truck_id is being set
  IF NEW.truck_id IS NOT NULL THEN
    SELECT NOT can_dispatch('truck', NEW.truck_id) INTO has_expired;
    IF has_expired THEN
      RAISE EXCEPTION 'Cannot assign truck: has expired documents';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Uncomment this trigger if you want to enforce dispatch lock
-- DROP TRIGGER IF EXISTS enforce_document_validity ON orders;
-- CREATE TRIGGER enforce_document_validity
--   BEFORE INSERT OR UPDATE OF driver_id, truck_id ON orders
--   FOR EACH ROW
--   EXECUTE FUNCTION check_entity_documents_before_assignment();

-- Grant permissions on views
GRANT SELECT ON expiring_documents TO anon, authenticated;
GRANT SELECT ON trip_profitability TO anon, authenticated;
GRANT SELECT ON customer_aging TO anon, authenticated;
GRANT SELECT ON fleet_availability TO anon, authenticated;
