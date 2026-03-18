// Canonicalize JSON for stable hashing.
// - Sort keys recursively
// - Remove undefined
// - Keep arrays in order

export function canonicalize(value) {
  if (value === null) return null;
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) return value.map(canonicalize);

  const out = {};
  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const k of keys) out[k] = canonicalize(value[k]);
  return out;
}

export function canonicalJSONStringify(obj) {
  return JSON.stringify(canonicalize(obj));
}

