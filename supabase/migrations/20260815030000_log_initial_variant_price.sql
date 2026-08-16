-- Record the base price when a variant is created.
-- The original history trigger only handled price updates.

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
SELECT
  pv.user_id,
  pv.id,
  pv.product_id,
  pv.sku,
  coalesce(pv.name, ''),
  pv.sale_price,
  pv.inventory_cost,
  pv.created_at
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
  IF TG_OP = 'INSERT' THEN
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
      coalesce(NEW.created_at, now())
    );
  ELSIF NEW.sale_price IS DISTINCT FROM OLD.sale_price
     OR NEW.inventory_cost IS DISTINCT FROM OLD.inventory_cost THEN
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
AFTER INSERT OR UPDATE OF sale_price, inventory_cost
ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.log_variant_price_change();
