//Enable RLS on orders


ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;


//Remove old policy

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;


//Create the correct RLS policy on the base table

CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR is_admin()
  );



//Create the order summary view

CREATE OR REPLACE VIEW public.order_summary AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  o.customer_name,
  o.customer_phone,
  o.created_at,
  COUNT(oi.id) AS item_count,
  p.full_name AS user_name
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.profiles p ON o.user_id = p.id
GROUP BY
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  o.customer_name,
  o.customer_phone,
  o.created_at,
  p.full_name;




//Grant access to the view

GRANT SELECT ON public.order_summary TO authenticated;
