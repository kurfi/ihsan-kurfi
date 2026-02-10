-- Add missing driver fields
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS next_of_kin TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS guarantor_name TEXT,
ADD COLUMN IF NOT EXISTS guarantor_phone TEXT,
ADD COLUMN IF NOT EXISTS guarantor_address TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_class TEXT,
ADD COLUMN IF NOT EXISTS accident_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0;

-- Add missing truck fields
ALTER TABLE public.trucks 
ADD COLUMN IF NOT EXISTS chassis_number TEXT,
ADD COLUMN IF NOT EXISTS truck_type TEXT,
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS next_service_date DATE,
ADD COLUMN IF NOT EXISTS current_mileage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_interval_km NUMERIC DEFAULT 10000;

-- Add missing order fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cap_number TEXT,
ADD COLUMN IF NOT EXISTS gate_pass_number TEXT,
ADD COLUMN IF NOT EXISTS waybill_url TEXT,
ADD COLUMN IF NOT EXISTS loading_manifest_number TEXT;

-- Create expenses table for trip cost tracking
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  expense_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on expenses" ON public.expenses
FOR ALL USING (true) WITH CHECK (true);

-- Create payments table for payment ledger
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  customer_id UUID REFERENCES public.customers(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on payments" ON public.payments
FOR ALL USING (true) WITH CHECK (true);

-- Add customer category for pricing tiers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'retailer',
ADD COLUMN IF NOT EXISTS price_per_bag NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Add document types enum values (hackney_permit, heavy_duty_permit, vehicle_registration)
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'hackney_permit';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'heavy_duty_permit';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'vehicle_registration';