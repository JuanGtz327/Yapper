-- Fix: simplify update_order_payment to always sync paid_amount

CREATE OR REPLACE FUNCTION public.update_order_payment(p_order_id uuid, p_payment_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_payment_status NOT IN ('pending', 'paid') THEN
    RAISE EXCEPTION 'Invalid payment status';
  END IF;

  UPDATE public.orders
  SET payment_status = p_payment_status,
      paid_amount = CASE
        WHEN p_payment_status = 'paid' THEN total
        WHEN p_payment_status = 'pending' THEN 0
        ELSE paid_amount
      END
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND status <> 'cancelled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
END;
$$;
