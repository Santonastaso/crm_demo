// Native replacement for lodash/set
// deno-lint-ignore no-explicit-any
export function set(obj: any, path: string | string[], value: any): any {
  const keys = Array.isArray(path) ? path : path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] == null || typeof current[key] !== "object") {
      current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return obj;
}

export default set;
