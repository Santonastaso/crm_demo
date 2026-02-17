-- Add source/provenance tracking to contacts
alter table public.contacts
  add column if not exists source text default 'manual';

comment on column public.contacts.source is
  'Lead provenance: manual, website_chat, whatsapp, email_inbound, discovery, import, campaign';

-- Update the contacts_summary view to include source
-- (the view definition depends on the existing view; this is additive)
-- If contacts_summary is a simple view, it will automatically pick up the new column.
-- No action needed if the view uses SELECT *.
