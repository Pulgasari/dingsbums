// core.js

export const
// compose (f,g,h)(x) => f(g(h(x))) ... executes functions right-to-left
// pipe    (f,g,h)(x) => h(g(f(x))) ... executes functions left-to-right
compose = (...fns) => (value) => fns.reduceRight ((acc, fn) => fn(acc), value),   
pipe    = (...fns) => (value) => fns.reduce      ((acc, fn) => fn(acc), value);

// =====================================================================
// AUTO-CURRY IMPLEMENTATION
// =====================================================================

// wraps a multi-argument function to support step-by-step argument passing
export const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...nextArgs) => curried(...args, ...nextArgs);
  };
};

// :::::: Logic Combinators

export const not = fn => (...args) => !fn(...args);
export const and = (...fns) => v => fns.every (fn => (typeof fn === 'function' ? fn(v) : fn));        
export const or  = (...fns) => v => fns.some  (fn => (typeof fn === 'function' ? fn(v) : fn));

// Pattern Matcher (R.cond / switch-case replacement)
const testRule = (rule, val) => {
  if (typeof rule === 'function') return rule(val);
  if (typeof rule === 'boolean') return rule;
  if (Array.isArray(rule)) return rule.every(r => testRule(r, val));
  return false;
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
