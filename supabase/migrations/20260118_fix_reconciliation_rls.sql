-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON shortages;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON driver_transactions;
DROP POLICY IF EXISTS "Public access to credit_notes" ON credit_notes;

-- Create permissive policies matching other tables
CREATE POLICY "Allow all operations on shortages" ON shortages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on driver_transactions" ON driver_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on credit_notes" ON credit_notes FOR ALL USING (true) WITH CHECK (true);
