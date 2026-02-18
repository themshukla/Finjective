
-- Budget data table to persist monthly budget entries
CREATE TABLE public.budget_months (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  income JSONB NOT NULL DEFAULT '[]',
  expenses JSONB NOT NULL DEFAULT '[]',
  custom_sections JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_key)
);

ALTER TABLE public.budget_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget data"
ON public.budget_months FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget data"
ON public.budget_months FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget data"
ON public.budget_months FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget data"
ON public.budget_months FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_budget_months_updated_at
  BEFORE UPDATE ON public.budget_months
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
