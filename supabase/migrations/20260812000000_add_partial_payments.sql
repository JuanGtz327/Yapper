-- Partial payments support: order_payments table + paid_amount column + register_payment RPC

-- 1. Add paid_amount column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_amount numeric(10,2) NOT NULL DEFAULT 0;

-- 2. Update payment_status check constraint to include 'partial'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'partial', 'paid'));

-- 2. Create order_payments table
CREATE TABLE order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('Efectivo', 'Transferencia', 'Tarjeta', 'Otro')),
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS policies for order_payments
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order payments"
  ON order_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order payments"
  ON order_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 4. Index for faster lookups
CREATE INDEX order_payments_order_id_idx ON order_payments(order_id, created_at);

-- 5. RPC function to register a partial payment
CREATE OR REPLACE FUNCTION register_payment(
  p_order_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_new_paid numeric;
  v_new_status text;
  v_payment_id uuid;
BEGIN
  -- Authenticate
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Load order with lock
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Validate order is not cancelled
  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot register payment for cancelled order';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- Calculate new paid amount
  v_new_paid := COALESCE(v_order.paid_amount, 0) + p_amount;

  -- Validate does not exceed total
  IF v_new_paid > v_order.total THEN
    RAISE EXCEPTION 'Payment amount exceeds remaining balance';
  END IF;

  -- Determine new payment status
  IF v_new_paid >= v_order.total THEN
    v_new_status := 'paid';
  ELSIF v_new_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Insert payment record
  INSERT INTO order_payments (order_id, amount, payment_method, reference, notes)
  VALUES (p_order_id, p_amount, p_payment_method, p_reference, p_notes)
  RETURNING id INTO v_payment_id;

  -- Update order
  UPDATE orders
  SET paid_amount = v_new_paid,
      payment_status = v_new_status
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'id', v_payment_id,
    'paid_amount', v_new_paid,
    'payment_status', v_new_status
  );
END;
$$;

-- 6. Update sales_aggregates to use paid_amount for partial payments
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
  daily_orders AS (
    SELECT
      ds.day,
      COALESCE(SUM(
        CASE
          WHEN o.payment_status = 'paid' THEN o.total
          WHEN o.payment_status = 'partial' THEN COALESCE(o.paid_amount, 0)
          ELSE 0
        END
      ), 0) AS day_total,
      COUNT(o.id) FILTER (WHERE o.payment_status IN ('paid', 'partial')) AS day_orders
    FROM date_series ds
    LEFT JOIN orders o
      ON o.created_at::date = ds.day
      AND o.user_id = auth.uid()
      AND o.status <> 'cancelled'
      AND o.payment_status IN ('paid', 'partial')
    GROUP BY ds.day
  )
  SELECT
    TO_CHAR(daily.day, 'DD Mon') AS label,
    daily.day_total AS total,
    daily.day_orders AS orders
  FROM daily_orders daily
  ORDER BY daily.day;
END;
$$;

REVOKE ALL ON FUNCTION public.sales_aggregates(text) FROM public;
GRANT EXECUTE ON FUNCTION public.sales_aggregates(text) TO authenticated;
