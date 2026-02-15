-- Add 'other' to transaction_type enum
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'other';
