DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;


CREATE POLICY "Admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);


DROP POLICY IF EXISTS "Warehouse can manage products" ON profiles;


CREATE POLICY "Warehouse can manage products"
ON profiles
FOR ALL
USING (
  role = 'warehouse'
)
WITH CHECK (
  role = 'warehouse'
);


DROP POLICY IF EXISTS "Warehouse can manage products" ON products;

CREATE POLICY "Warehouse can manage products"
ON products
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('warehouse', 'admin')
);



DROP POLICY IF EXISTS "Home tailors can view assigned requests" ON home_service_requests;


CREATE POLICY "Home tailors can view assigned requests"
ON home_service_requests
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'hometailor'
);



DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());
