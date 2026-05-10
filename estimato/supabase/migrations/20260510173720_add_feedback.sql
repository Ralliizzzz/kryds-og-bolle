CREATE TABLE public.feedback (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_own" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = company_id);
