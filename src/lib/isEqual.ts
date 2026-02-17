// Native replacement for lodash/isEqual
// Sufficient for shallow filter/sort objects used in this codebase
// deno-lint-ignore no-explicit-any
export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a !== "object") return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key]),
  );
}

export default isEqual;
