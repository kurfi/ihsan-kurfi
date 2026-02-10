-- Create storage bucket for waybills/delivery proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('waybills', 'waybills', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for waybill uploads
CREATE POLICY "Anyone can upload waybills" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'waybills');

CREATE POLICY "Anyone can view waybills" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'waybills');

CREATE POLICY "Anyone can update waybills" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'waybills');

CREATE POLICY "Anyone can delete waybills" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'waybills');