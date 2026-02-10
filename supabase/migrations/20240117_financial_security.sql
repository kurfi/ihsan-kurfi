-- Migration to add payment_status to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status of the order: pending, confirmed';
