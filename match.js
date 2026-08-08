// match.js

// =====================================================================
// 3. PREDICATE REGISTRY & CREATOR
// =====================================================================

const registry = new Map();
let predIdCounter = 0;

// Wraps a predicate function, overrides toString() for object key matching,
// and registers both 'isName' and 'name' (without 'is') in the lookup registry.
export const createPredicate = (fn, name) => {
  const id = name || `__pred_${++predIdCounter}__`;
  fn.toString = () => id;
  registry.set(id, fn);

  // Auto-register alias without 'is' prefix (e.g., 'isBlank' -> 'blank')
  if (id.startsWith('is') && id.length > 2) {
    const withoutIs = id.slice(2, 3).toLowerCase() + id.slice(3);
    if (!registry.has(withoutIs)) {
      registry.set(withoutIs, fn);
    }
  }

  return fn;
};

// ----

// Logic Combinators
export const not = fn => (...args) => !fn(...args);
export const and = (...fns) => v => fns.every(fn => (typeof fn === 'function' ? fn(v) : fn));
export const or  = (...fns) => v => fns.some(fn => (typeof fn === 'function' ? fn(v) : fn));

// Pattern Matcher (R.cond / switch-case replacement)
const testRule = (rule, val) => {
  if (typeof rule === 'function') return rule(val);
  if (typeof rule === 'boolean') return rule;
  if (Array.isArray(rule)) return rule.every(r => testRule(r, val));
  return false;
};

export const match = (rules, fallback = v => v) => (val) => {
  for (const [predicate, handler] of rules) {
    if (testRule(predicate, val)) {
      return typeof handler === 'function' ? handler(val) : handler;
    }
  }
  return typeof fallback === 'function' ? fallback(val) : fallback;
};

// -----

export const and = (...fns) => {
  const pred = (v) => fns.every((fn) => (typeof fn === 'function' ? fn(v) : fn));
  return createPredicate(pred, `and(${fns.map((f) => f.name || f).join(',')})`);
};

export const not = (fn) => {
  const pred = (v) => !(typeof fn === 'function' ? fn(v) : fn);
  return createPredicate(pred, `not(${fn.name || fn})`);
};

export const or = (...fns) => {
  const pred = (v) => fns.some((fn) => (typeof fn === 'function' ? fn(v) : fn));
  return createPredicate(pred, `or(${fns.map((f) => f.name || f).join(',')})`);
};

// Pattern Matcher supporting object syntax, predicate keys, string key lookup, and constructor names
export const match = (rulesObject, fallback = (v) => v) => {
  const compiledRules = Object.entries(rulesObject).map(([key, handler]) => {
    const testFn = registry.get(key) ?? ((v) => String(v) === key);
    return [testFn, handler];
  });

  return (value) => {
    for (let index = 0; index < compiledRules.length; index++) {
      const [testFn, handler] = compiledRules[index];
      if (testFn(value)) return typeof handler === 'function' ? handler(value) : handler;
    }
    return typeof fallback === 'function' ? fallback(value) : fallback;
  };
};
