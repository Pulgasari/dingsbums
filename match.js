// match.js

// :::::: REGISTRY

const registry = new Map;
let predIdCounter = 0;

export const createPredicate = (fn, name) => {
  const id = name || fn.name || `__pred_${++predIdCounter}__`;
  fn.toString = () => id;
  registry.set(id, fn);
  return fn;
};

// :::::: PREDICATES AUTO-REGISTER

import * as preds from './predicates.js';

for (const [name, fn] of Object.entries(preds)) {
  if (typeof fn === 'function') createPredicate(fn, name);
}



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

 

// -----

// =====================================================================
// REGISTRY & AUTO-REGISTRATION FROM MODULE
// =====================================================================



// Dynamischer Konstruktor-Resolver & Rest wie gehabt...
export const resolveRule = (key) => {
  if (typeof key === 'function') return key;

  if (typeof key === 'string') {
    if (registry.has(key)) return registry.get(key);

    const withIs = 'is' + key.charAt(0).toUpperCase() + key.slice(1);
    if (registry.has(withIs)) return registry.get(withIs);

    const TargetCtor = typeof globalThis !== 'undefined' ? globalThis[key] : null;
    if (typeof TargetCtor === 'function') {
      return (v) => v != null && (v.constructor === TargetCtor || v instanceof TargetCtor);
    }

    return (v) => String(v) === key;
  }

  return () => false;
};

// :::::: PATTERN MATCHER
// supports: object syntax, predicate keys, string key lookup, and constructor names

export const match = (rulesObject, fallback = (v) => v) => {
  const compiledRules = Object.entries(rulesObject).map(
    ([key, handler]) => [ resolveRule(key), handler ]
  );

  return (value) => {
    for (let index = 0; index < compiledRules.length; index++) {
      const [testFn, handler] = compiledRules[index];
      if (testFn(value)) return typeof handler === 'function' ? handler(value) : handler;
    }
    return typeof fallback === 'function' ? fallback(value) : fallback;
  };
};

// :::::: IS-PROXY

const createChecker = (rule) => (val) => resolveRule(rule)(val);

export const is = new Proxy(createChecker, {
  get(target, prop) {
    if (typeof prop === 'string') 
    return (val) => resolveRule(prop)(val);
    return target[prop];
  }
});

