-- Complete fix for views and permissions
-- Run this in your Supabase SQL editor

-- First, drop and recreate the views with proper permissions
DROP VIEW IF EXISTS public.contacts_summary CASCADE;
DROP VIEW IF EXISTS public.companies_summary CASCADE;
DROP VIEW IF EXISTS public.init_state CASCADE;

-- Recreate contacts_summary view
CREATE VIEW public.contacts_summary
    WITH (security_invoker=on)
    AS
SELECT 
    co.id,
    co.first_name,
    co.last_name,
    co.gender,
    co.title,
    co.email_jsonb,
    jsonb_path_query_array(co.email_jsonb, '$[*].email')::text as email_fts,
    co.phone_jsonb,
    jsonb_path_query_array(co.phone_jsonb, '$[*].number')::text as phone_fts,
    co.background,
    co.avatar,
    co.first_seen,
    co.last_seen,
    co.has_newsletter,
    co.status,
    co.tags,
    co.company_id,
    co.sales_id,
    co.linkedin_url,
    c.name as company_name,
    count(distinct t.id) as nb_tasks
FROM
    contacts co
LEFT JOIN
    tasks t on co.id = t.contact_id
LEFT JOIN
    companies c on co.company_id = c.id
GROUP BY
    co.id, c.name;

-- Recreate companies_summary view
CREATE VIEW public.companies_summary
    WITH (security_invoker=on)
    AS
SELECT 
    c.*,
    count(distinct d.id) as nb_deals,
    count(distinct co.id) as nb_contacts
FROM 
    public.companies c
LEFT JOIN 
    public.deals d on c.id = d.company_id
LEFT JOIN 
    public.contacts co on c.id = co.company_id
GROUP BY 
    c.id;

-- Recreate init_state view
CREATE VIEW public.init_state
    WITH (security_invoker=off)
    AS
SELECT count(id) as is_initialized
FROM (
  SELECT id 
  FROM public.sales
  LIMIT 1
) AS sub;

-- Grant permissions for all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions for all views
GRANT SELECT ON public.contacts_summary TO authenticated;
GRANT SELECT ON public.contacts_summary TO anon;

GRANT SELECT ON public.companies_summary TO authenticated;
GRANT SELECT ON public.companies_summary TO anon;

GRANT SELECT ON public.init_state TO authenticated;
GRANT SELECT ON public.init_state TO anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure RLS policies are working
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contactNotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."dealNotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
