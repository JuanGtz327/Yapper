-- Fix sales_aggregates: group revenue by payment date instead of order creation date
-- Partial payments: each payment counts on its payment date
-- Paid orders: total counts on the date of the last payment (or created_at for legacy)

DROP FUNCTION IF EXISTS public.sales_aggregates(text);

CREATE OR REPLACE FUNCTION public.sales_aggregates(p_period text default '7d')
RETURNS TABLE(label text, total numeric, orders bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interval interval;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_period = '7d' THEN
    v_interval := interval '7 days';
  ELSE
    v_interval := interval '6 months';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      (v_now - v_interval)::date,
      v_now::date,
      CASE WHEN p_period = '7d' THEN interval '1 day' ELSE interval '1 month' END
    )::date AS day
  ),
  payment_events AS (
    SELECT
      op.created_at::date AS event_date,
      op.amount AS revenue
    FROM order_payments op
    JOIN orders o ON o.id = op.order_id
    WHERE o.user_id = auth.uid()
      AND o.status <> 'cancelled'
      AND o.payment_status = 'partial'

    UNION ALL

    SELECT
      COALESCE(MAX(op.created_at), o.created_at)::date AS event_date,
      o.total AS revenue
    FROM orders o
    LEFT JOIN order_payments op ON op.order_id = o.id
    WHERE o.user_id = auth.uid()
      AND o.status <> 'cancelled'
      AND o.payment_status = 'paid'
    GROUP BY o.id, o.total, o.created_at
  ),
  daily AS (
    SELECT
      ds.day,
      COALESCE(SUM(pe.revenue), 0) AS day_total,
      COUNT(pe.event_date) AS day_orders
    FROM date_series ds
    LEFT JOIN payment_events pe ON pe.event_date = ds.day
    GROUP BY ds.day
  )
  SELECT
    TO_CHAR(daily.day, 'DD Mon') AS label,
    daily.day_total AS total,
    daily.day_orders AS orders
  FROM daily
  ORDER BY daily.day;
END;
$$;

REVOKE ALL ON FUNCTION public.sales_aggregates(text) FROM public;
GRANT EXECUTE ON FUNCTION public.sales_aggregates(text) TO authenticated;
