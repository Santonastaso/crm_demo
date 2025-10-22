-- Fix permissions for all views and tables
-- Run this in your Supabase SQL editor

-- Grant permissions for all tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions for all views to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Specifically grant permissions for the views that are causing issues
GRANT SELECT ON public.contacts_summary TO authenticated;
GRANT SELECT ON public.contacts_summary TO anon;

GRANT SELECT ON public.companies_summary TO authenticated;
GRANT SELECT ON public.companies_summary TO anon;

GRANT SELECT ON public.init_state TO authenticated;
GRANT SELECT ON public.init_state TO anon;

-- Grant permissions for all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public."contactNotes" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."contactNotes" TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public."dealNotes" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."dealNotes" TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

