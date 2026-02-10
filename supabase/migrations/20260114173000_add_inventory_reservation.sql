ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS quantity_reserved NUMERIC DEFAULT 0;

-- Link purchases to sales orders for Direct Delivery
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES public.orders(id);

-- Function to check and reserve stock atomically
CREATE OR REPLACE FUNCTION check_and_reserve_stock(
  p_depot_id UUID,
  p_cement_type TEXT,
  p_quantity NUMERIC,
  p_unit public.product_unit
) RETURNS JSONB AS $$
DECLARE
  v_inventory_id UUID;
  v_current_quantity NUMERIC;
  v_current_reserved NUMERIC;
BEGIN
  -- Select the inventory item for update to lock the row
  SELECT id, quantity, quantity_reserved 
  INTO v_inventory_id, v_current_quantity, v_current_reserved
  FROM public.inventory
  WHERE depot_id = p_depot_id 
    AND cement_type = p_cement_type
    AND unit = p_unit
  FOR UPDATE;

  IF v_inventory_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Inventory item not found');
  END IF;

  -- Check if enough stock is available (On Hand - Reserved)
  IF (v_current_quantity - v_current_reserved) >= p_quantity THEN
    -- Update reservation
    UPDATE public.inventory
    SET quantity_reserved = quantity_reserved + p_quantity,
        last_updated = NOW()
    WHERE id = v_inventory_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Stock reserved');
  ELSE
    RETURN jsonb_build_object(
      'success', false, 
      'message', format('Insufficient stock. Available: %s, Requested: %s', (v_current_quantity - v_current_reserved), p_quantity)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to release reservation (rollback)
CREATE OR REPLACE FUNCTION release_reservation(
  p_depot_id UUID,
  p_cement_type TEXT,
  p_quantity NUMERIC,
  p_unit public.product_unit
) RETURNS JSONB AS $$
BEGIN
  UPDATE public.inventory
  SET quantity_reserved = quantity_reserved - p_quantity,
      last_updated = NOW()
  WHERE depot_id = p_depot_id 
    AND cement_type = p_cement_type
    AND unit = p_unit;
    
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Function to confirm dispatch (deduct stock)
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

  -- Only for depot sales
  IF v_order.order_type = 'depot_dispatch' THEN
      -- Find inventory item
      SELECT id INTO v_inventory_id
      FROM public.inventory
      WHERE depot_id = v_order.depot_id
        AND cement_type = v_order.cement_type
        AND unit = v_order.unit;
        
      IF v_inventory_id IS NOT NULL THEN
        -- Deduct from Quantity AND Reserved
        UPDATE public.inventory
        SET quantity = quantity - v_order.quantity,
            quantity_reserved = quantity_reserved - v_order.quantity,
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
