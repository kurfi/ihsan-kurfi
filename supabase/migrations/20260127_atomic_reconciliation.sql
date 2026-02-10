-- Atomic Reconciliation RPC
-- This function handles the entire reconciliation process in a single transaction

CREATE OR REPLACE FUNCTION public.process_delivery_reconciliation(
  p_order_id UUID,
  p_otp TEXT,
  p_qty_good INT,
  p_qty_missing INT,
  p_qty_damaged INT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_debit_amount NUMERIC;
  v_credit_amount NUMERIC;
BEGIN
  -- 1. Fetch and validate order
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Order not found');
  END IF;

  -- 2. Validate OTP
  IF v_order.delivery_otp IS DISTINCT FROM p_otp THEN
    RETURN json_build_object('success', false, 'message', 'Invalid OTP');
  END IF;

  -- 3. Create Shortage Record (if applicable)
  IF p_qty_missing > 0 OR p_qty_damaged > 0 THEN
    INSERT INTO public.shortages (
      order_id, driver_id, truck_id, dispatched_quantity, unit,
      received_quantity, reason, liability, deduction_amount, status
    ) VALUES (
      v_order.id, v_order.driver_id, v_order.truck_id, v_order.quantity, v_order.unit,
      p_qty_good, p_reason, 
      'driver'::public.shortage_liability,
      (p_qty_missing + p_qty_damaged) * COALESCE(v_order.cost_price, 0),
      'approved'::public.shortage_status
    );

    -- 4. Create Driver Transaction for missing/damaged items
    v_debit_amount := (p_qty_missing + p_qty_damaged) * COALESCE(v_order.cost_price, 0);
    IF v_debit_amount > 0 THEN
      INSERT INTO public.driver_transactions (
        driver_id, order_id, type, amount, description, transaction_date
      ) VALUES (
        v_order.driver_id, v_order.id, 'shortage_deduction'::public.transaction_type, -v_debit_amount,
        'Shortage/Damage deduction for Order #' || v_order.order_number || ': ' || 
        CASE 
          WHEN p_qty_missing > 0 AND p_qty_damaged > 0 THEN p_qty_missing || ' missing, ' || p_qty_damaged || ' damaged.'
          WHEN p_qty_missing > 0 THEN p_qty_missing || ' missing.'
          ELSE p_qty_damaged || ' damaged.'
        END,
        NOW()
      );
    END IF;

    -- 5. Create Draft Credit Note for shortages/damages (to credit the customer)
    v_credit_amount := (p_qty_missing + p_qty_damaged) * (COALESCE(v_order.total_amount, 0) / NULLIF(v_order.quantity, 0));
    IF v_credit_amount > 0 THEN
      INSERT INTO public.credit_notes (
        order_id, customer_id, amount, quantity_damaged, unit, reason, status
      ) VALUES (
        v_order.id, v_order.customer_id, v_credit_amount, (p_qty_missing + p_qty_damaged), 
        v_order.unit, COALESCE(p_reason, 'Shortage/Damage during delivery'), 'draft'
      );
    END IF;
  END IF;

  -- 6. Update Order Status to Delivered
  UPDATE public.orders SET status = 'delivered' WHERE id = p_order_id;

  RETURN json_build_object('success', true, 'message', 'Reconciliation completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
