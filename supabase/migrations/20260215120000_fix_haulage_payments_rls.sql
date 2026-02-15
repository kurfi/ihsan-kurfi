-- Enable RLS on haulage_payments if not already enabled
ALTER TABLE IF EXISTS public.haulage_payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'haulage_payments' 
    AND policyname = 'Allow all operations on haulage_payments'
  ) THEN
    CREATE POLICY "Allow all operations on haulage_payments" 
    ON public.haulage_payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
