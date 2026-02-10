-- ============================================
-- DUAL BUSINESS MODEL: Haulage & Cement Trading
-- Migration Date: 2026-02-09
-- ============================================

-- ============================================
-- 1. CEMENT PAYMENTS TO DANGOTE/SUPPLIERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.cement_payments_to_dangote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id),
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(15,2) NOT NULL,
  payment_reference VARCHAR(100),
  period_covered VARCHAR(50),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cement_payments_to_dangote ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cement_payments_to_dangote' 
    AND policyname = 'Allow all operations on cement_payments_to_dangote'
  ) THEN
    CREATE POLICY "Allow all operations on cement_payments_to_dangote" 
    ON public.cement_payments_to_dangote FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.cement_payments_to_dangote IS 'Track payments made to cement suppliers (Dangote, BUA, etc.)';

-- ============================================
-- 2. CUSTOMER PAYMENTS WITH TRIP LINKAGE
-- ============================================

CREATE TABLE IF NOT EXISTS public.customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  payment_date DATE NOT NULL,
  amount_received DECIMAL(15,2) NOT NULL,
  order_ids TEXT, -- Comma-separated order IDs this payment covers
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_payments' 
    AND policyname = 'Allow all operations on customer_payments'
  ) THEN
    CREATE POLICY "Allow all operations on customer_payments" 
    ON public.customer_payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.customer_payments IS 'Track customer payments linked to specific orders/trips';

-- ============================================
-- 3. ENHANCE ORDERS TABLE FOR CEMENT TRADING
-- ============================================

-- Add cement pricing fields
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS cement_purchase_price DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS cement_sale_price DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'COD';

-- Add computed columns for cement profit
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS total_cement_purchase DECIMAL(15,2) 
    GENERATED ALWAYS AS (quantity * COALESCE(cement_purchase_price, 0)) STORED,
  ADD COLUMN IF NOT EXISTS total_cement_sale DECIMAL(15,2) 
    GENERATED ALWAYS AS (quantity * COALESCE(cement_sale_price, 0)) STORED,
  ADD COLUMN IF NOT EXISTS cement_profit DECIMAL(15,2) 
    GENERATED ALWAYS AS (
      (quantity * COALESCE(cement_sale_price, 0)) - (quantity * COALESCE(cement_purchase_price, 0))
    ) STORED,
  ADD COLUMN IF NOT EXISTS cement_margin_percent DECIMAL(5,2) 
    GENERATED ALWAYS AS (
      CASE 
        WHEN (quantity * COALESCE(cement_sale_price, 0)) > 0 
        THEN (((quantity * COALESCE(cement_sale_price, 0)) - (quantity * COALESCE(cement_purchase_price, 0))) / 
              (quantity * COALESCE(cement_sale_price, 0))) * 100
        ELSE 0 
      END
    ) STORED;

-- Add trip cost fields (if not already present)
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS total_trip_cost DECIMAL(15,2) 
    GENERATED ALWAYS AS (
      COALESCE(fuel_cost, 0) + COALESCE(driver_allowance, 0) + COALESCE(other_trip_costs, 0)
    ) STORED;

COMMENT ON COLUMN public.orders.cement_purchase_price IS 'Price per unit paid to supplier';
COMMENT ON COLUMN public.orders.cement_sale_price IS 'Price per unit sold to customer';
COMMENT ON COLUMN public.orders.payment_terms IS 'Payment terms: COD, 7 days, 30 days, etc.';

-- ============================================
-- 4. EXPENSE CATEGORIZATION
-- ============================================

-- Add category enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE expense_category AS ENUM (
      'fuel', 
      'driver_allowance', 
      'toll', 
      'salary', 
      'maintenance', 
      'insurance', 
      'license', 
      'office', 
      'other'
    );
  END IF;
END $$;

-- Update expenses table if needed
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS category expense_category,
  ADD COLUMN IF NOT EXISTS truck_id UUID REFERENCES public.trucks(id);

-- ============================================
-- 5. MONTHLY PROFIT & LOSS VIEW
-- ============================================

CREATE OR REPLACE VIEW public.monthly_profit_loss AS
WITH monthly_trips AS (
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    SUM(total_cement_sale) as cement_sales,
    SUM(total_cement_purchase) as cement_purchases,
    SUM(total_trip_cost) as trip_costs,
    COUNT(*) as trip_count,
    SUM(quantity) as total_quantity
  FROM orders
  WHERE status = 'delivered'
  GROUP BY DATE_TRUNC('month', created_at)
),
monthly_haulage AS (
  SELECT 
    DATE_TRUNC('month', payment_date) as month,
    SUM(amount_received) as haulage_revenue
  FROM haulage_payments
  GROUP BY DATE_TRUNC('month', payment_date)
),
monthly_expenses AS (
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    SUM(amount) as other_expenses
  FROM expenses
  WHERE order_id IS NULL -- Only non-trip expenses
  GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
  COALESCE(mt.month, mh.month, me.month) as month,
  COALESCE(mh.haulage_revenue, 0) as haulage_revenue,
  COALESCE(mt.cement_sales, 0) as cement_sales,
  COALESCE(mt.cement_purchases, 0) as cement_purchases,
  COALESCE(mt.trip_costs, 0) as trip_costs,
  COALESCE(me.other_expenses, 0) as other_expenses,
  (COALESCE(mh.haulage_revenue, 0) + COALESCE(mt.cement_sales, 0)) as total_revenue,
  (COALESCE(mt.cement_purchases, 0) + COALESCE(mt.trip_costs, 0) + COALESCE(me.other_expenses, 0)) as total_costs,
  (COALESCE(mh.haulage_revenue, 0) + COALESCE(mt.cement_sales, 0) - 
   COALESCE(mt.cement_purchases, 0) - COALESCE(mt.trip_costs, 0) - COALESCE(me.other_expenses, 0)) as net_profit,
  COALESCE(mt.trip_count, 0) as trip_count,
  COALESCE(mt.total_quantity, 0) as total_quantity
FROM monthly_trips mt
FULL OUTER JOIN monthly_haulage mh ON mt.month = mh.month
FULL OUTER JOIN monthly_expenses me ON mt.month = me.month
ORDER BY month DESC;

COMMENT ON VIEW public.monthly_profit_loss IS 'Monthly P&L showing dual revenue streams (haulage + cement trading)';

-- ============================================
-- 6. RECEIVABLES AGING VIEW
-- ============================================

CREATE OR REPLACE VIEW public.receivables_aging AS
SELECT 
  c.name as customer_name,
  c.id as customer_id,
  SUM(o.total_cement_sale) as total_owed,
  MIN(o.created_at) as oldest_invoice_date,
  CASE 
    WHEN CURRENT_DATE - MIN(o.created_at::date) <= 30 THEN 'Current'
    WHEN CURRENT_DATE - MIN(o.created_at::date) <= 60 THEN '31-60 days'
    WHEN CURRENT_DATE - MIN(o.created_at::date) <= 90 THEN '61-90 days'
    ELSE '90+ days'
  END as aging_bucket,
  CURRENT_DATE - MIN(o.created_at::date) as days_outstanding
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE (o.payment_status IS NULL OR o.payment_status = 'Pending')
  AND o.status = 'delivered'
  AND o.total_cement_sale > 0
GROUP BY c.id, c.name
ORDER BY days_outstanding DESC;

COMMENT ON VIEW public.receivables_aging IS 'Accounts receivable aging report for credit management';

-- ============================================
-- 7. TRIP PROFITABILITY VIEW (Enhanced)
-- ============================================

CREATE OR REPLACE VIEW public.trip_profitability_detailed AS
SELECT 
  o.id,
  o.order_number,
  o.created_at,
  o.status,
  c.name as customer_name,
  o.cement_type,
  o.quantity,
  o.unit,
  
  -- Revenue
  o.cement_sale_price,
  o.total_cement_sale,
  
  -- Costs
  o.cement_purchase_price,
  o.total_cement_purchase,
  o.fuel_cost,
  o.driver_allowance,
  o.other_trip_costs,
  o.total_trip_cost,
  
  -- Profit Metrics
  o.cement_profit,
  o.cement_margin_percent,
  (o.total_cement_sale - o.total_cement_purchase - o.total_trip_cost) as total_trip_profit,
  
  -- Payment Info
  o.payment_status,
  o.payment_terms
  
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.status IN ('dispatched', 'delivered')
ORDER BY o.created_at DESC;

COMMENT ON VIEW public.trip_profitability_detailed IS 'Detailed trip profitability analysis including cement margins and trip costs';

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_haulage_payments_date ON public.haulage_payments(payment_date);

-- ============================================
-- 9. UPDATE TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to new tables
DROP TRIGGER IF EXISTS update_cement_payments_updated_at ON public.cement_payments_to_dangote;
CREATE TRIGGER update_cement_payments_updated_at 
  BEFORE UPDATE ON public.cement_payments_to_dangote 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON public.customer_payments;
CREATE TRIGGER update_customer_payments_updated_at 
  BEFORE UPDATE ON public.customer_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
