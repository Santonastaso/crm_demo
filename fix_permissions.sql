-- Fix permissions for init_state view and sales table
-- Run this in your Supabase SQL editor

-- Grant permissions for the init_state view to anonymous users
GRANT SELECT ON public.init_state TO anon;
GRANT SELECT ON public.init_state TO authenticated;

-- Grant permissions for the sales table to anonymous users (needed for init_state)
GRANT SELECT ON public.sales TO anon;
GRANT SELECT ON public.sales TO authenticated;

-- Also ensure the view is properly accessible
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

