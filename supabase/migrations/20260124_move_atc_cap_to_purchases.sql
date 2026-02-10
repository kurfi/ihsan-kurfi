-- Add atc_number and cap_number to purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS atc_number TEXT,
ADD COLUMN IF NOT EXISTS cap_number TEXT;

-- Migrate existing cap_number data from orders to purchases
-- This assumes that for plant_direct orders, there is a 1:1 relationship via sales_order_id
UPDATE public.purchases p
SET cap_number = o.cap_number
FROM public.orders o
WHERE p.sales_order_id = o.id
AND o.cap_number IS NOT NULL
AND p.cap_number IS NULL;

-- Note: We are keeping orders.cap_number for now to avoid breaking existing queries 
-- until the code is fully updated, but it will be logically moved.
