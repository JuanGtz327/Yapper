-- Variant price history: capture price/cost changes per variant

CREATE TABLE public.variant_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id uuid,
  product_id uuid,
  sku text NOT NULL DEFAULT '',
  variant_name text NOT NULL DEFAULT '',
  sale_price numeric(10,2) NOT NULL CHECK (sale_price >= 0),
  inventory_cost numeric(10,2) NOT NULL CHECK (inventory_cost >= 0),
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX variant_price_history_variant_idx ON public.variant_price_history (variant_id);
CREATE INDEX variant_price_history_product_idx ON public.variant_price_history (product_id);
CREATE INDEX variant_price_history_user_changed_idx ON public.variant_price_history (user_id, changed_at DESC);

ALTER TABLE public.variant_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their variant price history"
  ON public.variant_price_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their variant price history"
  ON public.variant_price_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their variant price history"
  ON public.variant_price_history FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.variant_price_history TO authenticated;

-- Insert initial snapshots for existing variants
INSERT INTO public.variant_price_history (user_id, variant_id, product_id, sku, variant_name, sale_price, inventory_cost, changed_at)
SELECT
  pv.user_id,
  pv.id,
  pv.product_id,
  pv.sku,
  coalesce(pv.name, ''),
  pv.sale_price,
  pv.inventory_cost,
  coalesce(pv.created_at, now())
FROM public.product_variants pv
WHERE NOT EXISTS (
  SELECT 1
  FROM public.variant_price_history vph
  WHERE vph.variant_id = pv.id
);

CREATE OR REPLACE FUNCTION public.log_variant_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (
    NEW.sale_price IS DISTINCT FROM OLD.sale_price OR
    NEW.inventory_cost IS DISTINCT FROM OLD.inventory_cost
  ) THEN
    INSERT INTO public.variant_price_history (
      user_id,
      variant_id,
      product_id,
      sku,
      variant_name,
      sale_price,
      inventory_cost,
      changed_at
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      NEW.product_id,
      NEW.sku,
      coalesce(NEW.name, ''),
      NEW.sale_price,
      NEW.inventory_cost,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_variant_price_change ON public.product_variants;

CREATE TRIGGER log_variant_price_change
AFTER UPDATE OF sale_price, inventory_cost
ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.log_variant_price_change();
