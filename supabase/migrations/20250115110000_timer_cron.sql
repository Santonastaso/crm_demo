-- Enable pg_cron extension if available
-- Note: pg_cron is only available on certain Supabase plans
-- For development, timers can be triggered manually or via scheduled tasks

-- This is a placeholder for production setup
-- The actual cron job needs to be configured in Supabase dashboard or via CLI

-- Example of what would be set up in production:
-- select cron.schedule(
--   'process-timers',
--   '*/5 * * * *',  -- Every 5 minutes
--   $$select net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-timers',
--     headers := jsonb_build_object('Authorization', 'Bearer YOUR_ANON_KEY')
--   )$$
-- );

-- For now, we'll add a comment with instructions
COMMENT ON TABLE timers IS 
'Timer processing: Configure pg_cron or external scheduler to call process-timers edge function every 5 minutes';


