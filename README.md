# dingsbums

## examples

### pattern matching with object syntax and function keys

```javascript
import { match, isBlank, isNumber, isEven, and, is, pipe, trim, toUpperCase, map, filter, isEmail, curry } from './fp-lib.js';

const isEvenNumber = and(isNumber, isEven);

// 1. PATTERN MATCHING WITH OBJECT SYNTAX & FUNCTION KEYS
const classify = match({
  isBlank      : 'leer',
  isEvenNumber : value => value * 100,
  String       : value => value.trim().toUpperCase(),
  Array        : value => `array mit ${value.length}`
}, () => 'unbekannt');

console.log(classify(null));       // 'leer'
console.log(classify(4));          // 400
console.log(classify('  hi '));    // 'HI'
console.log(classify([1, 2, 3]));  // 'array mit 3'
console.log(classify(true));       // 'unbekannt'
```

```javascript
// 2. USING THE `is` PROXY (Supports both 'is'-prefixed and non-'is' forms)
console.log(is.string('test'));         // true
console.log(is.blank(''));              // true  (auto-aliased from isBlank)
console.log(is.even(4));                // true  (auto-aliased from isEven)
console.log(is('number')(42));          // true
console.log(is([isNumber, isEven])(8)); // true

// 3. PIPELINES WITH CURRIED UTILITIES
const sanitizeEmail = pipe(trim, toUpperCase);
const processEmailList = pipe(
  map(sanitizeEmail),
  filter(isEmail)
);

console.log(processEmailList([
  "  alice@test.com  ",
  "invalid-email",
  "   bob@web.de "
])); 
// Output: ["ALICE@TEST.COM", "BOB@WEB.DE"]
```

## function calls as keys

```javascript
const registry = new Map();
let idCounter = 0;

// Wraps a predicate function and registers a unique key for object property access
export const createPredicate = (fn, name) => {
  const id = name || `__pred_${++idCounter}__`;
  fn.toString = () => id;
  registry.set(id, fn);
  return fn;
};

// :::::: COMBINATORS

// Returns a new registered predicate function for AND logic
export const and = (...preds) => {
  return createPredicate((value) => preds.every((p) => p(value)));
};

// Returns a new registered predicate function for OR logic
export const or = (...preds) => {
  return createPredicate((value) => preds.some((p) => p(value)));
};

// :::::: PATTERN MATCHING

export const match = (rulesObject, fallback = (v) => v) => {
  const compiledRules = Object.entries(rulesObject).map(([key, handler]) => {
    const testFn = registry.get(key) ?? ((v) => String(v) === key);
    return [testFn, handler];
  });

  return (value) => {
    for (let index = 0; index < compiledRules.length; index++) {
      const [testFn, handler] = compiledRules[index];
      if (testFn(value)) {
        return typeof handler === 'function' ? handler(value) : handler;
      }
    }
    return typeof fallback === 'function' ? fallback(value) : fallback;
  };
};
```

usage 

```javascript
import { match, isBlank, isNumber, isEven, and } from './is.js';

const classify = match({
  isBlank                 : 'leer',
  [and(isNumber, isEven)] : value => value * 100,
  String                  : value => value.trim().toUpperCase(),
  Array                   : value => `array mit ${value.length}`
}, () => 'unbekannt');

classify(null);       // 'leer'
classify(4);          // 400
classify('  hi ');    // 'HI'
classify([1, 2, 3]);  // 'array mit 3'
classify(true);       // 'unbekannt'
```


## usage examples

```javascript
import { isEmail } from './lib.js';

// pure single-value pipeline
const sanitizeEmail = pipe (trim, toLower);

// array-processing pipeline with point-free style
const processEmailList = pipe(
  map (sanitizeEmail),
  filter (isEmail)
);

const rawEmails = [
  "  ALICE@TEST.COM  ",
  "invalid-email",
  "   BOB@WEB.DE "
];

processEmailList(rawEmails); 
// Output: ["alice@test.com", "bob@web.de"]

```

```javascript
import { pipe } from './lib.js';

// 1. Standard JS functions (Data-Last parameter order)
const rawAdd      = (a, b) => a + b;
const rawMultiply = (a, b) => a * b;
const rawReplace  = (searchValue, replaceValue, str) => str.replace(searchValue, replaceValue);
const rawSlice    = (start, end, arr) => arr.slice(start, end);

// 2. Currying the functions
export const add      = curry(rawAdd);
export const multiply = curry(rawMultiply);
export const replace  = curry(rawReplace);
export const slice    = curry(rawSlice);

// Usage outside pipelines (both syntaxes work seamlessly!)
add(5, 10);    // 15 (Standard call)
add(5)(10);    // 15 (Curried call)

// 3. Building a pipeline with pre-configured functions
const processPrices = pipe(
  add(10),                 // Configured: adds 10 to whatever comes in
  multiply(1.19),          // Configured: applies 19% VAT
  val => val.toFixed(2)    // Final formatting
);

processPrices(100); 
// Calculation: (100 + 10) * 1.19 => "130.85"

// 4. String-Manipulation Pipeline Example

const slugify = pipe(
  replace(/\s+/g, '-'),     // Replaces spaces with hyphens
  replace(/[^a-z0-9-]/g, ''),// Removes invalid characters
  slice(0, 15)              // Truncates to max 15 chars
);

slugify(" Functional Programming JS! "); 
// Output: "functional-prog"

```

# additionals

```javascript
// =====================================================================
// AUTOMATED PREDICATE CREATOR & REGISTRY
// =====================================================================

const registry = new Map();
let predIdCounter = 0;

export const createPredicate = (fn, name) => {
  const id = name || `__pred_${++predIdCounter}__`;
  fn.toString = () => id;

  // 1. Register full name (e.g. 'isString', 'isBlank')
  registry.set(id, fn);

  // 2. Auto-derive and register aliases for 'is'-prefixed names
  if (id.startsWith('is') && id.length > 2) {
    const rawName = id.slice(2); // 'String', 'Array', 'Blank'
    const lowerName = rawName.charAt(0).toLowerCase() + rawName.slice(1); // 'string', 'array', 'blank'

    if (!registry.has(rawName)) registry.set(rawName, fn);     // Enables: 'String', 'Array', 'Object'
    if (!registry.has(lowerName)) registry.set(lowerName, fn); // Enables: 'string', 'array', 'blank'
  }

  return fn;
};
```

```javascript
// =====================================================================
// DYNAMIC PREDICATE & CONSTRUCTOR RESOLVER
// =====================================================================

const registry = new Map();
let predIdCounter = 0;

export const createPredicate = (fn, name) => {
  const id = name || `__pred_${++predIdCounter}__`;
  fn.toString = () => id;
  registry.set(id, fn);
  return fn;
};

// Resolves a key to a predicate test function
export const resolveRule = (key) => {
  // 1. Direct function / predicate reference
  if (typeof key === 'function') return key;

  if (typeof key === 'string') {
    // 2. Registered predicate (e.g. 'isBlank')
    if (registry.has(key)) return registry.get(key);

    // 3. Registered predicate with 'is' prefix (e.g. 'string' -> 'isString')
    const withIs = 'is' + key.charAt(0).toUpperCase() + key.slice(1);
    if (registry.has(withIs)) return registry.get(withIs);

    // 4. Automatic Constructor Detection (String, Array, Date, Map, RegExp, Error, etc.)
    const TargetCtor = typeof globalThis !== 'undefined' ? globalThis[key] : null;
    if (typeof TargetCtor === 'function') {
      return (v) => v != null && (v.constructor === TargetCtor || v instanceof TargetCtor);
    }

    // 5. Fallback: string matching
    return (v) => String(v) === key;
  }

  return () => false;
};

// =====================================================================
// PATTERN MATCHER & IS PROXY
// =====================================================================

export const match = (rulesObject, fallback = (v) => v) => {
  const compiledRules = Object.entries(rulesObject).map(([key, handler]) => [
    resolveRule(key),
    handler
  ]);

  return (value) => {
    for (let index = 0; index < compiledRules.length; index++) {
      const [testFn, handler] = compiledRules[index];
      if (testFn(value)) {
        return typeof handler === 'function' ? handler(value) : handler;
      }
    }
    return typeof fallback === 'function' ? fallback(value) : fallback;
  };
};

const createChecker = (rule) => (val) => resolveRule(rule)(val);

export const is = new Proxy(createChecker, {
  get(target, prop) {
    if (typeof prop === 'string') {
      return (val) => resolveRule(prop)(val);
    }
    return target[prop];
  }
});
```

```javascript
// =====================================================================
// REGISTRY & AUTO-REGISTRATION FROM MODULE
// =====================================================================

import * as predicatesModule from './predicates.js';

const registry = new Map();
let predIdCounter = 0;

export const createPredicate = (fn, name) => {
  const id = name || fn.name || `__pred_${++predIdCounter}__`;
  fn.toString = () => id;
  registry.set(id, fn);
  return fn;
};

// Auto-register all imported predicates from the extra file
for (const [exportName, fn] of Object.entries(predicatesModule)) {
  if (typeof fn === 'function') {
    // Falls sie noch nicht registriert sind, nimm den Export-Namen (z.B. 'isBlank', 'isNumber')
    createPredicate(fn, exportName);
  }
}

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
```
