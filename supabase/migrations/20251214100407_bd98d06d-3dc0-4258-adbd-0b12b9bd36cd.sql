-- Enums for order types and statuses
CREATE TYPE order_type AS ENUM ('plant_direct', 'depot_dispatch');
CREATE TYPE order_status AS ENUM ('requested', 'atc_received', 'in_gate', 'loaded', 'dispatched', 'delivered');
CREATE TYPE document_type AS ENUM ('license', 'insurance', 'road_worthiness');

-- Depots table
CREATE TABLE public.depots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers table with credit limit
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trucks table
CREATE TABLE public.trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  model TEXT,
  capacity_tons DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents table for tracking expiry
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type document_type NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('truck', 'driver')),
  entity_id UUID NOT NULL,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id UUID REFERENCES public.depots(id) ON DELETE CASCADE,
  cement_type TEXT NOT NULL,
  quantity_tons DECIMAL(12,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  order_type order_type NOT NULL,
  depot_id UUID REFERENCES public.depots(id),
  truck_id UUID REFERENCES public.trucks(id),
  driver_id UUID REFERENCES public.drivers(id),
  cement_type TEXT NOT NULL,
  quantity_tons DECIMAL(10,2) NOT NULL,
  atc_number TEXT,
  status order_status DEFAULT 'requested',
  total_amount DECIMAL(12,2) DEFAULT 0,
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (for demo - in production you'd use auth)
CREATE POLICY "Allow all operations on depots" ON public.depots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trucks" ON public.trucks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert sample data
INSERT INTO public.depots (name, location) VALUES 
  ('Main Depot', 'Lagos'),
  ('Northern Depot', 'Kano'),
  ('Eastern Depot', 'Enugu');

INSERT INTO public.customers (name, email, phone, credit_limit, current_balance) VALUES
  ('BuildRight Construction', 'info@buildright.com', '+234801234567', 5000000, 1200000),
  ('Quality Blocks Ltd', 'sales@qualityblocks.ng', '+234802345678', 3000000, 2800000),
  ('Mega Builders Inc', 'contact@megabuilders.com', '+234803456789', 10000000, 500000);

INSERT INTO public.trucks (plate_number, model, capacity_tons) VALUES
  ('LAG-123-XY', 'Mercedes Actros', 30),
  ('KAN-456-AB', 'Volvo FH16', 35),
  ('ABJ-789-CD', 'MAN TGS', 28);

INSERT INTO public.drivers (name, phone, email) VALUES
  ('Adamu Ibrahim', '+234804567890', 'adamu@example.com'),
  ('Chidi Okonkwo', '+234805678901', 'chidi@example.com'),
  ('Musa Yusuf', '+234806789012', 'musa@example.com');

-- Insert documents with varying expiry dates
INSERT INTO public.documents (document_type, entity_type, entity_id, expiry_date) 
SELECT 'license', 'driver', id, NOW() + INTERVAL '15 days' FROM public.drivers WHERE name = 'Adamu Ibrahim';
INSERT INTO public.documents (document_type, entity_type, entity_id, expiry_date) 
SELECT 'license', 'driver', id, NOW() + INTERVAL '90 days' FROM public.drivers WHERE name = 'Chidi Okonkwo';
INSERT INTO public.documents (document_type, entity_type, entity_id, expiry_date) 
SELECT 'license', 'driver', id, NOW() - INTERVAL '5 days' FROM public.drivers WHERE name = 'Musa Yusuf';

INSERT INTO public.documents (document_type, entity_type, entity_id, expiry_date) 
SELECT 'insurance', 'truck', id, NOW() + INTERVAL '20 days' FROM public.trucks WHERE plate_number = 'LAG-123-XY';
INSERT INTO public.documents (document_type, entity_type, entity_id, expiry_date) 
SELECT 'road_worthiness', 'truck', id, NOW() + INTERVAL '180 days' FROM public.trucks WHERE plate_number = 'KAN-456-AB';

INSERT INTO public.inventory (depot_id, cement_type, quantity_tons)
SELECT id, 'Portland Cement', 500 FROM public.depots WHERE name = 'Main Depot'
UNION ALL
SELECT id, 'White Cement', 200 FROM public.depots WHERE name = 'Main Depot'
UNION ALL
SELECT id, 'Portland Cement', 350 FROM public.depots WHERE name = 'Northern Depot';