-- Create credit_notes table
CREATE TABLE IF NOT EXISTS public.credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    quantity_damaged DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit public.product_unit NOT NULL DEFAULT 'tons',
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'applied', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

-- Add RLS policy (simple public access for now as per project pattern)
CREATE POLICY "Public access to credit_notes" ON public.credit_notes FOR ALL USING (true);
