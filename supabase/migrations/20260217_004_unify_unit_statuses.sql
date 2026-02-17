-- Unify property_units.status vocabulary with deal stage names.
-- "opzionato" -> "proposta" (matches the deal stage that implies commitment)
-- "rogitato"  -> "rogito"  (matches the deal stage for deed signing)

UPDATE public.property_units
  SET status = 'proposta'
WHERE status = 'opzionato';

UPDATE public.property_units
  SET status = 'rogito'
WHERE status = 'rogitato';
