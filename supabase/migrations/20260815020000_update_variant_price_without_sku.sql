-- Update a variant price without rewriting its SKU.
-- This avoids unrelated SKU uniqueness checks when only the price changes.

CREATE OR REPLACE FUNCTION public.update_variant_price(
  p_variant_id uuid,
  p_sale_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_sale_price IS NULL OR p_sale_price < 0 THEN
    RAISE EXCEPTION 'Invalid sale price';
  END IF;

  UPDATE public.product_variants
  SET sale_price = p_sale_price,
      updated_at = now()
  WHERE id = p_variant_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_variant_price(uuid, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.update_variant_price(uuid, numeric) TO authenticated;
