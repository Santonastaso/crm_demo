-- Add stage_entered_at to deals for time-in-stage tracking
alter table public.deals
  add column if not exists stage_entered_at timestamptz default now();

comment on column public.deals.stage_entered_at is
  'Timestamp when the deal entered its current stage. Used for stall detection.';
