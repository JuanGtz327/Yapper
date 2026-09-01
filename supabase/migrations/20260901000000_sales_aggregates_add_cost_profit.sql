-- Extend sales_aggregates to return cost and profit alongside revenue

DROP FUNCTION IF EXISTS public.sales_aggregates(text);

CREATE OR REPLACE FUNCTION public.sales_aggregates(p_period text default '7d')
RETURNS TABLE(label text, total numeric, cost numeric, profit numeric, orders bigint)
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
  order_costs AS (
    SELECT
      o.id AS order_id,
      o.total AS order_total,
      o.payment_status,
      o.created_at,
      COALESCE(SUM(oi.unit_cost_snapshot * oi.quantity), 0) AS order_cost
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = auth.uid()
      AND o.status <> 'cancelled'
      AND o.payment_status IN ('paid', 'partial')
    GROUP BY o.id, o.total, o.payment_status, o.created_at
  ),
  payment_events AS (
    SELECT
      op.created_at::date AS event_date,
      op.amount AS revenue,
      CASE
        WHEN oc.order_total > 0
        THEN (op.amount / oc.order_total) * oc.order_cost
        ELSE 0
      END AS allocated_cost
    FROM order_payments op
    JOIN order_costs oc ON oc.order_id = op.order_id
    WHERE oc.payment_status = 'partial'

    UNION ALL

    SELECT
      COALESCE(MAX(op.created_at), oc.created_at)::date AS event_date,
      oc.order_total AS revenue,
      oc.order_cost AS allocated_cost
    FROM order_costs oc
    LEFT JOIN order_payments op ON op.order_id = oc.order_id
    WHERE oc.payment_status = 'paid'
    GROUP BY oc.order_id, oc.order_total, oc.order_cost, oc.created_at
  ),
  daily AS (
    SELECT
      ds.day,
      COALESCE(SUM(pe.revenue), 0) AS day_total,
      COALESCE(SUM(pe.allocated_cost), 0) AS day_cost,
      COUNT(pe.event_date) AS day_orders
    FROM date_series ds
    LEFT JOIN payment_events pe ON pe.event_date = ds.day
    GROUP BY ds.day
  )
  SELECT
    TO_CHAR(daily.day, 'DD Mon') AS label,
    daily.day_total AS total,
    daily.day_cost AS cost,
    (daily.day_total - daily.day_cost) AS profit,
    daily.day_orders AS orders
  FROM daily
  ORDER BY daily.day;
END;
$$;

REVOKE ALL ON FUNCTION public.sales_aggregates(text) FROM public;
GRANT EXECUTE ON FUNCTION public.sales_aggregates(text) TO authenticated;
