-- CRITICAL SECURITY FIX: Implement proper authentication and RLS policies

-- First, create a profiles table to link authenticated users to businesses
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'staff')),
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles  
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a security definer function to get user's business_id
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create a security definer function to check if user belongs to business
CREATE OR REPLACE FUNCTION public.user_belongs_to_business(target_business_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE  
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND business_id = target_business_id
  );
$$;

-- UPDATE CUSTOMERS TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;

CREATE POLICY "Users can view customers from their business" ON public.customers
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can insert customers to their business" ON public.customers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can update customers from their business" ON public.customers
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can delete customers from their business" ON public.customers
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

-- UPDATE BILLS TABLE RLS POLICIES  
DROP POLICY IF EXISTS "Allow all operations on bills" ON public.bills;

CREATE POLICY "Users can view bills from their business" ON public.bills
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can insert bills to their business" ON public.bills
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can update bills from their business" ON public.bills
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can delete bills from their business" ON public.bills
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

-- UPDATE PRODUCTS TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;

CREATE POLICY "Users can view products from their business" ON public.products
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can insert products to their business" ON public.products
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can update products from their business" ON public.products
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can delete products from their business" ON public.products
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

-- UPDATE INVENTORY TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow all operations on inventory" ON public.inventory;

CREATE POLICY "Users can view inventory from their business" ON public.inventory
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can insert inventory to their business" ON public.inventory
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can update inventory from their business" ON public.inventory
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can delete inventory from their business" ON public.inventory
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

-- UPDATE LOAD_ENTRIES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow all operations on load_entries" ON public.load_entries;

CREATE POLICY "Users can view load_entries from their business" ON public.load_entries
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can insert load_entries to their business" ON public.load_entries
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can update load_entries from their business" ON public.load_entries
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can delete load_entries from their business" ON public.load_entries
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

-- UPDATE PURCHASES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Allow all operations on purchases" ON public.purchases;

CREATE POLICY "Users can view purchases from their business" ON public.purchases
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can insert purchases to their business" ON public.purchases
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can update purchases from their business" ON public.purchases
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

CREATE POLICY "Users can delete purchases from their business" ON public.purchases
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    public.user_belongs_to_business(business_id)
  );

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, business_id, user_type, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'business_id', 'default_business'),
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'owner'),
    COALESCE(new.raw_user_meta_data ->> 'username', new.email)
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();