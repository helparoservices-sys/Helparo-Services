-- Update handle_new_user function to include location data during signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    full_name, 
    phone, 
    country_code,
    state,
    city,
    address,
    pincode
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+91'),
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'pincode'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
