-- Trigger: Update Inventory on Dispatch
CREATE OR REPLACE FUNCTION public.handle_inventory_deduction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if status changed to 'dispatched'
  IF NEW.status = 'dispatched' AND (OLD.status IS DISTINCT FROM 'dispatched') THEN
    -- Check if it's a depot order
    IF NEW.order_type = 'depot_dispatch' THEN
      UPDATE public.inventory
      SET quantity = quantity - NEW.quantity,
          last_updated = NOW()
      WHERE depot_id = NEW.depot_id 
        AND cement_type = NEW.cement_type;
        
      -- Optional: Raise error if inventory not found or insufficient? 
      -- For now, we assume pre-checks passed, but silent fail is risky.
      -- Ideally, we'd check FOUND.
    END IF;
  END IF;

  -- Handle Rollback (if moved FROM dispatched back to requested/pending)
  IF OLD.status = 'dispatched' AND NEW.status != 'dispatched' AND NEW.status != 'delivered' THEN
     IF NEW.order_type = 'depot_dispatch' THEN
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

CREATE TRIGGER tr_inventory_on_dispatch
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_inventory_deduction();


-- Trigger: Update Customer Balance on Order
CREATE OR REPLACE FUNCTION public.handle_customer_balance_order()
RETURNS TRIGGER AS $$
BEGIN
  -- ON INSERT
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.customers
    SET current_balance = current_balance + COALESCE(NEW.total_amount, 0)
    WHERE id = NEW.customer_id;
    RETURN NEW;
  
  -- ON UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only adjust if total_amount changed
    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
      UPDATE public.customers
      SET current_balance = current_balance - COALESCE(OLD.total_amount, 0) + COALESCE(NEW.total_amount, 0)
      WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;

  -- ON DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.customers
    SET current_balance = current_balance - COALESCE(OLD.total_amount, 0)
    WHERE id = OLD.customer_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_balance_on_order
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_customer_balance_order();


-- Trigger: Update Customer Balance on Payment
CREATE OR REPLACE FUNCTION public.handle_customer_balance_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- ON INSERT (Verified payment reduces debt)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'verified' THEN
      UPDATE public.customers
      SET current_balance = current_balance - COALESCE(NEW.amount, 0)
      WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;

  -- ON UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Case 1: Status changed TO verified
    IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
      UPDATE public.customers
      SET current_balance = current_balance - COALESCE(NEW.amount, 0)
      WHERE id = NEW.customer_id;
    
    -- Case 2: Status changed FROM verified (Reversal/Reject)
    ELSIF NEW.status != 'verified' AND OLD.status = 'verified' THEN
      UPDATE public.customers
      SET current_balance = current_balance + COALESCE(OLD.amount, 0)
      WHERE id = OLD.customer_id;

    -- Case 3: Verified Amount changed (Correction)
    ELSIF NEW.status = 'verified' AND OLD.status = 'verified' AND NEW.amount != OLD.amount THEN
      UPDATE public.customers
      SET current_balance = current_balance + COALESCE(OLD.amount, 0) - COALESCE(NEW.amount, 0)
      WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;

  -- ON DELETE (If verified payment is deleted, debt goes back up)
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.status = 'verified' THEN
      UPDATE public.customers
      SET current_balance = current_balance + COALESCE(OLD.amount, 0)
      WHERE id = OLD.customer_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_balance_on_payment
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_customer_balance_payment();
