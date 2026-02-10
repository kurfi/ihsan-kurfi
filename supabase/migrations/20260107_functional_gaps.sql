-- Manufacturer Wallet Tables
CREATE TABLE IF NOT EXISTS public.manufacturer_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
  cement_type TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('tons', 'bags')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id, cement_type)
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.manufacturer_wallets(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'lifting', 'adjustment', 'refund')),
  amount NUMERIC NOT NULL, -- Positive for increase, Negative for decrease
  reference_id UUID,
  reference_type TEXT, -- 'purchase_order', 'sales_order', 'manual'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for Wallets
ALTER TABLE public.manufacturer_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on manufacturer_wallets" ON public.manufacturer_wallets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on wallet_transactions" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);

-- Add COGS and OTP to Orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_otp TEXT;

-- Update Trip Profitability View to include COGS
CREATE OR REPLACE VIEW trip_profitability AS
SELECT 
  o.id,
  o.order_number,
  o.created_at,
  o.total_amount as revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(o.cost_price * o.quantity, 0) as cost_of_goods,
  (o.total_amount - COALESCE(SUM(e.amount), 0) - COALESCE(o.cost_price * o.quantity, 0)) as net_profit,
  CASE 
    WHEN o.total_amount > 0 THEN 
      ((o.total_amount - COALESCE(SUM(e.amount), 0) - COALESCE(o.cost_price * o.quantity, 0)) / o.total_amount * 100)
    ELSE 0
  END as profit_margin_percent
FROM orders o
LEFT JOIN expenses e ON e.order_id = o.id
WHERE o.status = 'delivered'
GROUP BY o.id, o.order_number, o.created_at, o.total_amount, o.cost_price, o.quantity;

-- Grant permissions for new tables and view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturer_wallets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO anon, authenticated;
GRANT SELECT ON public.trip_profitability TO anon, authenticated;

-- Function to update wallet balance on transaction
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.manufacturer_wallets
  SET 
    balance = balance + NEW.amount,
    updated_at = now()
  WHERE id = NEW.wallet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();
