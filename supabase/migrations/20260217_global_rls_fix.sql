-- Global RLS Fix: Add authenticated access policies to all key tables

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'cement_payments_to_dangote',
        'credit_notes',
        'customer_payments',
        'document_alerts',
        'documents',
        'driver_transactions',
        'drivers',
        'expenses',
        'manufacturer_wallets',
        'payment_accounts',
        'payments',
        'purchases',
        'shortages',
        'suppliers',
        'trucks',
        'wallet_transactions'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- 1. Ensure RLS is enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- 2. Create "Enable all for authenticated users" policy if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = t 
            AND policyname = 'Enable all for authenticated users'
        ) THEN
            EXECUTE format('
                CREATE POLICY "Enable all for authenticated users" 
                ON public.%I 
                FOR ALL 
                TO authenticated 
                USING (true) 
                WITH CHECK (true)', t);
            
            RAISE NOTICE 'Added authenticated policy for table: %', t;
        ELSE
            RAISE NOTICE 'Policy already exists for table: %', t;
        END IF;
    END LOOP;
END $$;
