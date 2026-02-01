-- 1) create a new view that contains user_id and aggregated items
CREATE OR REPLACE VIEW public.user_orders_view_v2 AS
SELECT
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  o.customer_name,
  o.customer_phone,
  o.customer_address,
  o.notes,
  o.created_at,
  o.updated_at,
  o.user_id,   -- NEW
  json_agg(
    json_build_object(
      'id', oi.id,
      'product_name', COALESCE(oi.product_name, p.name),
      'quantity', oi.quantity,
      'price', oi.price,
      'subtotal', COALESCE(oi.subtotal, oi.quantity * oi.price)
    )
  ) FILTER (WHERE oi.id IS NOT NULL) AS items
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.products p ON p.id = oi.product_id
GROUP BY
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  o.customer_name,
  o.customer_phone,
  o.customer_address,
  o.notes,
  o.created_at,
  o.updated_at,
  o.user_id
;
