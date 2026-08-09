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

##

```javascript
import { createPredicate } from './core.js';

// =====================================================================
// 1. LENGTH PREDICATES (Works for Arrays, Strings, Sets, Maps)
// =====================================================================

export const hasLength = (len) =>
  createPredicate(
    (v) => v != null && (v.length === len || v.size === len),
    `hasLength_${len}`
  );

export const minLength = (min) =>
  createPredicate(
    (v) => v != null && ((v.length ?? v.size ?? -1) >= min),
    `minLength_${min}`
  );

// =====================================================================
// 2. ARRAY & CONTENT PREDICATES
// =====================================================================

// Checks if all items in array satisfy a predicate or match a value
export const every = (pred) =>
  createPredicate(
    (v) => Array.isArray(v) && v.every(typeof pred === 'function' ? pred : (x) => x === pred),
    'every'
  );

// Checks if at least one item satisfies a predicate
export const some = (pred) =>
  createPredicate(
    (v) => Array.isArray(v) && v.some(typeof pred === 'function' ? pred : (x) => x === pred),
    'some'
  );

// Matches array positional structure (e.g., [isString, isNumber])
export const tuple = (...preds) =>
  createPredicate(
    (v) =>
      Array.isArray(v) &&
      v.length === preds.length &&
      preds.every((p, i) => (typeof p === 'function' ? p(v[i]) : v[i] === p)),
    'tuple'
  );

// =====================================================================
// 3. OBJECT SHAPE & PROPERTY PREDICATES
// =====================================================================

// Matches specific property value or predicate
export const propEq = (key, expected) =>
  createPredicate((v) => {
    if (v == null) return false;
    const val = v[key];
    return typeof expected === 'function' ? expected(val) : val === expected;
  }, `propEq_${key}`);

// Matches object shape/schema against predicates or explicit values
export const shape = (schema) =>
  createPredicate((v) => {
    if (v == null || typeof v !== 'object' || Array.isArray(v)) return false;
    return Object.entries(schema).every(([key, pred]) => {
      const val = v[key];
      return typeof pred === 'function' ? pred(val) : val === pred;
    });
  }, 'shape');
```

```javascript
import { match, isNumber, isString, isEven } from './core.js';
import { hasLength, minLength, every, tuple, shape, propEq } from './predicates.js';

const processData = match({
  // 1. Array length matching
  [hasLength(0)]:               () => 'Empty list',
  [tuple(isString, isNumber)]:  ([name, age]) => `Tuple match: ${name} is${age}`,
  [every(isNumber)]:            (arr) => `Array of numbers with sum ${arr.reduce((a, b) => a + b, 0)}`,
  [minLength(5)]:               (arr) => `Large collection with ${arr.length} items`,

  // 2. Object shape & property matching
  [propEq('type', 'admin')]:    (user) => `Admin: ${user.name}`,
  [shape({
    role: 'user',
    age:  isNumber,
    active: true
  })]:                          (user) => `Active user ${user.name}`,

  // 3. Fallback for strings by length
  [hasLength(3)]:               (str) => `3-char string: ${str}`
}, () => 'Unknown shape');

// Tests:
processData([]);                        // "Empty list"
processData(['Alice', 30]);             // "Tuple match: Alice is 30"
processData([10, 20, 30]);              // "Array of numbers with sum 60"
processData([1, 2, 3, 4, 5, 6]);        // "Large collection with 6 items"
processData({ type: 'admin', name: 'Bob' }); // "Admin: Bob"
processData({ role: 'user', name: 'Eve', age: 25, active: true }); // "Active user Eve"
processData('cat');                     // "3-char string: cat"
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

```javascript
// Universal helpers supporting both curried each(obj)(fn) and direct each(obj, fn) call styles
export const each = (obj, fn) => {
  const run = cb => Object.entries(obj).forEach(cb);
  return fn ? run(fn) : run;
};

export const eachKeys = (obj, fn) => {
  const run = cb => Object.keys(obj).forEach(cb);
  return fn ? run(fn) : run;
};

export const eachValues = (obj, fn) => {
  const run = cb => Object.values(obj).forEach(cb);
  return fn ? run(fn) : run;
};


// Helper for curried object iteration
const each = obj => fn => Object.entries(obj).forEach(fn);

// Populate the API object from API2 definition
each(API2)(
  ([kind, methods]) => each(methods)(
    ([name, fn]) => API[name] = [fn, kind];
  )
);

   each (API2) (([kind, methods])
=> each (methods) (([name, fn]) 
=> API[name] = [fn, kind]));

each (API2) (a => each (a[1]) (b => API[b[0]] = [b[1], a[0] ));

// Helper to flatten a 2-level object structure into tuples
const flatEntries = obj =>
  Object.entries(obj).flatMap(([kind, methods]) =>
  Object.entries(methods).map(([name, fn]) => [kind, name, fn])
  );

// Single clean loop
for (const [kind, name, fn] of flatEntries(API2)) API[name] = [fn, kind];
eachFlat (API2) (([kind, name, fn]) => API[name] = [fn, kind] );
eachFlat (API2, ([kind, name, fn]) => API[name] = [fn, kind] );

const { entries } = Object;

for (const [kind, fns] of entries(API2))
for (const [name, fn]  of entries(fns))
API[name] = [fn, kind];

for (const [kind, fns] of Object.entries(API2))
for (const [name, fn]  of Object.entries(fns))
API[name] = [fn, kind];

for (const [kind, fns] of API2.entries)
for (const [name, fn]  of  fns.entries)
API[name] = [fn, kind];

const proto = { [NODE]: true, node: null };

const API = mapAssign (API2);

// Yields [groupKey, itemKey, value] for 2-level nested objects
function* deepEntries(obj) {
  for (const [group, items] of Object.entries(obj)) {
    for (const [key, val] of Object.entries(items)) {
      yield [group, key, val];
    }
  }
}

// Single clean loop
for (const [kind, name, fn] of deepEntries(API2))
API[name] = [fn, kind];

API = deepEntries(API2).map( ([kind, name, fn]) => { [name]: [fn, kind] };   
// Add an entries getter to Object.prototype
Object.defineProperty(Object.prototype, 'entries', {
  get() { return Object.entries(this); },
  configurable: true,
  enumerable: false,
});

// Now this syntax works as intended
for (const [kind, fns] of API2.entries)
for (const [name, fn]  of fns.entries)
API[name] = [fn, kind];

```

```javascript
const $E = Object.entries;
const $K = Object.keys;
const $V = Object.values;

for (const [kind, fns] of $(API2))
for (const [name, fn]  of $(fns))
API[name] = [fn, kind];
```
