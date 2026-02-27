-- Add payment_type and cement_type to cement_payments_to_dangote
ALTER TABLE public.cement_payments_to_dangote 
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'postpayment',
  ADD COLUMN IF NOT EXISTS cement_type VARCHAR(100);

-- Update existing records to have 'postpayment' if they are null
UPDATE public.cement_payments_to_dangote 
SET payment_type = 'postpayment' 
WHERE payment_type IS NULL;

-- Add comment
COMMENT ON COLUMN public.cement_payments_to_dangote.payment_type IS 'Type of payment: prepayment or postpayment';
COMMENT ON COLUMN public.cement_payments_to_dangote.cement_type IS 'Type of cement for prepayments (e.g. 42.5R, 32.5N)';
