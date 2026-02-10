-- Enable RLS on payment_accounts
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

-- 1. Allow read access for authenticated users
CREATE POLICY "Enable read access for authenticated users" 
ON public.payment_accounts FOR SELECT 
TO authenticated 
USING (true);

-- 2. Allow insert access for authenticated users
CREATE POLICY "Enable insert access for authenticated users" 
ON public.payment_accounts FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Allow update access for authenticated users
CREATE POLICY "Enable update access for authenticated users" 
ON public.payment_accounts FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Allow delete access for authenticated users
CREATE POLICY "Enable delete access for authenticated users" 
ON public.payment_accounts FOR DELETE 
TO authenticated 
USING (true);

-- Also ensure anon access IF the application currently relies on it
-- (Uncomment these if you want to allow unauthenticated access)
-- CREATE POLICY "Enable read access for anon" ON public.payment_accounts FOR SELECT TO anon USING (true);
