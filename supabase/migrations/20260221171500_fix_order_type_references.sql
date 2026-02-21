-- Fix database functions that were broken by the removal of the order_type column.
-- These functions now use the is_direct_drop flag (boolean) instead.

-- 1. Fix handle_inventory_deduction trigger function
CREATE OR REPLACE FUNCTION public.handle_inventory_deduction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if status changed to 'dispatched'
  IF NEW.status = 'dispatched' AND (OLD.status IS DISTINCT FROM 'dispatched') THEN
    -- Check if it's NOT a direct drop (i.e., it comes from local inventory)
    IF NEW.is_direct_drop = false THEN
      UPDATE public.inventory
      SET quantity = quantity - NEW.quantity,
          last_updated = NOW()
      WHERE depot_id = NEW.depot_id 
        AND cement_type = NEW.cement_type;
    END IF;
  END IF;

  -- Handle Rollback (if moved FROM dispatched back to requested/pending)
  IF OLD.status = 'dispatched' AND NEW.status != 'dispatched' AND NEW.status != 'delivered' THEN
     IF NEW.is_direct_drop = false THEN
      UPDATE public.inventory
      SET quantity = quantity + OLD.quantity,
          last_updated = NOW()
      WHERE depot_id = OLD.depot_id 
        AND cement_type = OLD.cement_type;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix confirm_dispatch_deduction function
CREATE OR REPLACE FUNCTION confirm_dispatch_deduction(
  p_order_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_inventory_id UUID;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
     RETURN jsonb_build_object('success', false, 'message', 'Order not found');
  END IF;
  
  IF v_order.status = 'dispatched' THEN
     RETURN jsonb_build_object('success', false, 'message', 'Order already dispatched');
  END IF;

  -- Only for depot sales (NOT direct drop)
  IF v_order.is_direct_drop = false THEN
      -- Find inventory item
      SELECT id INTO v_inventory_id
      FROM public.inventory
      WHERE depot_id = v_order.depot_id
        AND cement_type = v_order.cement_type
        AND unit = v_order.unit;
        
      IF v_inventory_id IS NOT NULL THEN
        -- Deduct from Quantity AND Reserved (if quantity_reserved column exists)
        UPDATE public.inventory
        SET quantity = quantity - v_order.quantity,
            quantity_reserved = CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='quantity_reserved') 
                THEN quantity_reserved - v_order.quantity 
                ELSE 0 
            END,
            last_updated = NOW()
        WHERE id = v_inventory_id;
      END IF;
  END IF;

  -- Update order status
  UPDATE public.orders 
  SET status = 'dispatched',
      dispatch_date = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- 3. Fix set_dispatch_date trigger function
CREATE OR REPLACE FUNCTION set_dispatch_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'dispatched' AND OLD.status != 'dispatched' AND NEW.dispatch_date IS NULL THEN
    NEW.dispatch_date := NOW();
    
    -- Set default estimated delivery date if not provided
    IF NEW.estimated_delivery_date IS NULL THEN
      -- If it's a direct drop (plant direct), use 24 hours interval
      IF NEW.is_direct_drop = true THEN
        NEW.estimated_delivery_date := NOW() + INTERVAL '24 hours';
      ELSE
        NEW.estimated_delivery_date := NOW() + INTERVAL '12 hours';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
