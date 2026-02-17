// Native replacement for lodash/get
// deno-lint-ignore no-explicit-any
export function get(obj: any, path: string | string[], fallback?: any): any {
  const keys = Array.isArray(path) ? path : path.split(".");
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) return fallback;
  }
  return result ?? fallback;
}

export default get;
