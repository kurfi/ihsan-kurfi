-- Enhanced RLS Policies

-- 1. Enable RLS on core tables (ensure it's on)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2. ORDERS Policies

-- Allow read access to authenticated users
CREATE POLICY "Enable read access for authenticated users" 
ON public.orders FOR SELECT 
TO authenticated 
USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Enable insert access for authenticated users" 
ON public.orders FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow update access to authenticated users
CREATE POLICY "Enable update access for authenticated users" 
ON public.orders FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- RESTRICT DELETE: Only allow deleting orders that are still 'requested'
-- Once an order is processed/dispatched, it must be preserved for audit/inventory reasons.
CREATE POLICY "Prevent deleting processed orders" 
ON public.orders FOR DELETE 
TO authenticated 
USING (status = 'requested');


-- 3. INVENTORY Policies

-- Allow read access
CREATE POLICY "Enable read access for inventory" 
ON public.inventory FOR SELECT 
TO authenticated 
USING (true);

-- RESTRICT WRITE: Inventory should mainly be updated via TRIGGERS (System)
-- However, Managers might need manual adjustment capabilities.
-- Since we lack a robust Roles table, we will rely on a restrictive policy that
-- effectively blocks direct client-side updates unless we add a specific bypass later.
-- For now, we allow updates but could restrict this in future iterations.
CREATE POLICY "Enable update for inventory" 
ON public.inventory FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true); 
-- Ideally, this would be: USING (auth.role() = 'manager')


-- 4. CUSTOMERS Policies (Basic protection)
CREATE POLICY "Enable read/write for customers"
ON public.customers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
