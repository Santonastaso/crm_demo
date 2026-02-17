/**
 * Strips the internal `id` that react-hook-form's useFieldArray injects
 * into each criteria item, so the JSONB sent to Supabase is clean.
 */
export const stripCriteriaIds = (data: Record<string, unknown>) => ({
  ...data,
  criteria: ((data.criteria ?? []) as Record<string, unknown>[]).map(
    ({ id: _id, ...rest }) => rest,
  ),
});
