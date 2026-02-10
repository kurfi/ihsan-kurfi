-- Migration for Direct-to-Site (Dropshipping) Financial Logic
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS transport_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS trip_profit NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_direct_drop BOOLEAN DEFAULT FALSE;

-- Function to calculate direct drop profit
CREATE OR REPLACE FUNCTION public.calculate_direct_drop_profit()
RETURNS TRIGGER AS $$
DECLARE
    v_purchase_cost NUMERIC;
    v_purchase_qty NUMERIC;
    v_total_purchase_cost NUMERIC;
    v_revenue NUMERIC;
BEGIN
    -- Only trigger for Direct Drop orders that are marked as delivered
    IF NEW.is_direct_drop = TRUE AND NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        
        -- Find the linked purchase order cost
        -- Linking is done via purchases.sales_order_id = orders.id
        SELECT cost_per_unit, quantity INTO v_purchase_cost, v_purchase_qty
        FROM public.purchases
        WHERE sales_order_id = NEW.id
        LIMIT 1;

        IF v_purchase_cost IS NOT NULL AND v_purchase_qty IS NOT NULL THEN
            v_total_purchase_cost := v_purchase_cost * v_purchase_qty;
            v_revenue := NEW.total_amount;
            
            -- Profit = Revenue - Purchase Cost - Transport Cost
            NEW.trip_profit := v_revenue - v_total_purchase_cost - COALESCE(NEW.transport_cost, 0);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run profit calculation
DROP TRIGGER IF EXISTS trg_calculate_direct_drop_profit ON public.orders;
CREATE TRIGGER trg_calculate_direct_drop_profit
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_direct_drop_profit();

-- Sync purchase cost to order
CREATE OR REPLACE FUNCTION public.sync_purchase_cost_to_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sales_order_id IS NOT NULL THEN
        UPDATE public.orders
        SET cost_price = NEW.cost_per_unit
        WHERE id = NEW.sales_order_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_purchase_cost_to_order ON public.purchases;
CREATE TRIGGER trg_sync_purchase_cost_to_order
AFTER INSERT OR UPDATE OF cost_per_unit ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.sync_purchase_cost_to_order();
