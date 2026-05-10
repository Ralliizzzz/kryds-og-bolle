ALTER TABLE public.quote_settings
  ADD COLUMN minimum_booking_days_in_advance INTEGER NOT NULL DEFAULT 1;
