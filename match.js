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

// :::::: Dynamischer Konstruktor-Resolver & Rest wie gehabt...

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

