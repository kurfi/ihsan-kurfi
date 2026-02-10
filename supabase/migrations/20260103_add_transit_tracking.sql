-- Add transit tracking fields to orders table
ALTER TABLE public.orders
ADD COLUMN dispatch_date TIMESTAMPTZ,
ADD COLUMN delivery_date TIMESTAMPTZ,
ADD COLUMN estimated_delivery_date TIMESTAMPTZ,
ADD COLUMN carrier_name TEXT,
ADD COLUMN carrier_contact TEXT,
ADD COLUMN tracking_number TEXT;



-- Create view for transit shipments (dispatched but not delivered)
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

-- Grant permissions on view
GRANT SELECT ON transit_shipments TO anon, authenticated;

-- Function to calculate transit duration in hours
CREATE OR REPLACE FUNCTION get_transit_duration_hours(
  p_dispatch_date TIMESTAMPTZ,
  p_delivery_date TIMESTAMPTZ
) RETURNS DECIMAL AS $$
BEGIN
  IF p_dispatch_date IS NULL OR p_delivery_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(EPOCH FROM (p_delivery_date - p_dispatch_date)) / 3600;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set dispatch_date when status changes to 'dispatched'
CREATE OR REPLACE FUNCTION set_dispatch_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'dispatched' AND OLD.status != 'dispatched' AND NEW.dispatch_date IS NULL THEN
    NEW.dispatch_date := NOW();
    
    -- Set default estimated delivery date if not provided
    IF NEW.estimated_delivery_date IS NULL THEN
      IF NEW.order_type = 'plant_direct' THEN
        NEW.estimated_delivery_date := NOW() + INTERVAL '24 hours';
      ELSE
        NEW.estimated_delivery_date := NOW() + INTERVAL '12 hours';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_dispatch_date
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_dispatch_date();

-- Trigger to automatically set delivery_date when status changes to 'delivered'
CREATE OR REPLACE FUNCTION set_delivery_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.delivery_date IS NULL THEN
    NEW.delivery_date := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_delivery_date
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_delivery_date();

-- Comment on new columns
COMMENT ON COLUMN public.orders.dispatch_date IS 'Timestamp when order was dispatched from plant/depot';
COMMENT ON COLUMN public.orders.delivery_date IS 'Timestamp when order was delivered to customer';
COMMENT ON COLUMN public.orders.estimated_delivery_date IS 'Expected delivery timestamp (can be updated by carrier)';
COMMENT ON COLUMN public.orders.carrier_name IS 'Name of the carrier/logistics company';
COMMENT ON COLUMN public.orders.carrier_contact IS 'Contact number for the carrier';
COMMENT ON COLUMN public.orders.tracking_number IS 'Carrier tracking/waybill number';
