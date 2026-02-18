-- Fix RLS Policies for Products & Pricing

-- Depots Table: Add explicit policies for authenticated users
ALTER TABLE public.depots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for depots" ON public.depots
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for depots" ON public.depots
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for depots" ON public.depots
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for depots" ON public.depots
    FOR DELETE TO authenticated USING (true);


-- Inventory Table: Add missing INSERT and DELETE policies for authenticated users
-- (Read and Update policies were added in 20260127_enhanced_rls.sql)

CREATE POLICY "Enable insert access for inventory" ON public.inventory
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable delete access for inventory" ON public.inventory
    FOR DELETE TO authenticated USING (true);
