ALTER TABLE trucks ADD COLUMN driver_id UUID REFERENCES drivers(id);
