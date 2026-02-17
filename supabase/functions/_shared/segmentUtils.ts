export interface SegmentCriterion {
  field: string;
  operator: string;
  value: string | number | boolean | string[];
}

const ARRAY_COLUMNS = new Set(["tags"]);

export function parseIds(value: string | number | boolean | string[]): number[] {
  if (Array.isArray(value)) return value.map(Number).filter((n) => !isNaN(n));
  const str = String(value);
  return str
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n));
}

// deno-lint-ignore no-explicit-any
export function buildFilter(query: any, criteria: SegmentCriterion[]) {
  let q = query;
  for (const rule of criteria) {
    // Array columns (e.g. tags bigint[]) need special PostgREST operators
    if (ARRAY_COLUMNS.has(rule.field)) {
      const ids = parseIds(rule.value);
      if (ids.length === 0) continue;
      switch (rule.operator) {
        case "eq":
        case "contains":
          q = q.contains(rule.field, ids);
          break;
        case "in":
          q = q.overlaps(rule.field, ids);
          break;
        case "neq":
        case "not_in":
          q = q.not(rule.field, "ov", `{${ids.join(",")}}`);
          break;
        default:
          break;
      }
      continue;
    }

    switch (rule.operator) {
      case "eq":
        q = q.eq(rule.field, rule.value);
        break;
      case "neq":
        q = q.neq(rule.field, rule.value);
        break;
      case "gt":
        q = q.gt(rule.field, rule.value);
        break;
      case "lt":
        q = q.lt(rule.field, rule.value);
        break;
      case "gte":
        q = q.gte(rule.field, rule.value);
        break;
      case "lte":
        q = q.lte(rule.field, rule.value);
        break;
      case "contains":
        q = q.ilike(rule.field, `%${rule.value}%`);
        break;
      case "in":
        q = q.in(
          rule.field,
          Array.isArray(rule.value) ? rule.value : [rule.value],
        );
        break;
      case "not_in": {
        const values = Array.isArray(rule.value) ? rule.value : [rule.value];
        const quoted = values.map((v) =>
          typeof v === "string" ? `"${v.replace(/"/g, '\\"')}"` : String(v),
        );
        q = q.not(rule.field, "in", `(${quoted.join(",")})`);
        break;
      }
    }
  }
  return q;
}
