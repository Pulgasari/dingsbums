# dingsbums

```javascript
// =====================================================================
// USAGE DEMO
// =====================================================================

import { match, isBlank, isNumber, isEven, and, is, pipe, trim, toUpperCase, map, filter, isEmail, curry } from './fp-lib.js';

// 1. PATTERN MATCHING WITH OBJECT SYNTAX & FUNCTION KEYS
const classify = match({
  isBlank:                 'leer',
  [and(isNumber, isEven)]: value => value * 100,
  String:                  value => value.trim().toUpperCase(),
  Array:                   value => `array mit ${value.length}`
}, () => 'unbekannt');

console.log(classify(null));       // 'leer'
console.log(classify(4));          // 400
console.log(classify('  hi '));    // 'HI'
console.log(classify([1, 2, 3]));  // 'array mit 3'
console.log(classify(true));       // 'unbekannt'

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

# fp

```md

Ziel

1. einzelne "is`-Funktionen

2. is-proxy

3. match, die nice objekt-shaped body haben kann

const classify = match({
  isBlank:                 'leer',
  [and(isNumber, isEven)]: value => value * 100,
  String:                  value => value.trim().toUpperCase(),
  Array:                   value => `array mit ${value.length}`
}, () => 'unbekannt');

classify(null);       // 'leer'
classify(4);          // 400
classify('  hi ');    // 'HI'
classify([1, 2, 3]);  // 'array mit 3'
classify(true);       // 'unbekannt'

4. auch direkt möglichkeit via "String", "Array" usw checken zu können

```

```javascript
// =====================================================================
// 1. PIPE & COMPOSE CORE
// =====================================================================

// executes functions left-to-right
// pipe (f,g,h)(x) => h(g(f(x)))
export const pipe = (...fns) => (initialValue) =>
  fns.reduce((acc, fn) => fn(acc), initialValue);

// executes functions right-to-left
// compose (f,g,h)(x) => f(g(h(x)))
export const compose = (...fns) => (initialValue) =>
  fns.reduceRight((acc, fn) => fn(acc), initialValue);

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

export const curry = (fn) => curried(...args) => (args.length >= fn.length) ?  fn(...args) : (...nextArgs) => curried(...args, ...nextArgs);
  
// =====================================================================
// 2. CURRIED FP UTILITIES (Reusable Pipeline Building Blocks)
// =====================================================================

// :::::: INTERNAL HELPERS

const upperFirst = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const toWords = (value) => String(value)
  .replace(/([a-z\d])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .replace(/[\s\-_.]+/g, ' ')
  .trim()
  .toLowerCase()
  .split(' ')
  .filter(Boolean);

// :::::: UNARY TRANSFORMS

export const // curried array transformers
map    = fn         => arr => arr.map(fn),
filter = predicate  => arr => arr.filter(predicate),
reduce = (fn, init) => arr => arr.reduce(fn, init);

export const // curried string transformers
capitalize     = str  => String(str).charAt(0).toUpperCase() + String(str).slice(1),
join           = char => arr => arr.join(char),
split          = char => str => str.split(char),
toLowerCase    = str  => str.toLowerCase (),
toUpperCase    = str  => str.toUpperCase (),
toCamelCase    = str  => toWords(str).map((word, index) => index ? upperFirst(word) : word).join(''),    
toConstantCase = str  => toWords(str).join('_').toUpperCase(),
toKebabCase    = str  => toWords(str).join('-'),
toPascalCase   = str  => toWords(str).map(upperFirst).join(''),
toSnakeCase    = str  => toWords(str).join('_'),
toTitleCase    = str  => toWords(str).map(upperFirst).join(' '),
trim           = str  => str.trim      (),
trimEnd        = str  => str.trimEnd   (),
trimStart      = str  => str.trimStart (),
unquote        = str  => String(str).replace(/^(['"`])([\s\S]*)\1$/, '$2');

// Curried object getters
export const prop    = key => obj => obj?.[key];

```

```javascript
// =====================================================================
// 1. COMBINATORS & CORE HELPERS
// =====================================================================

// Type and Instance Check Factories
const isInstanceOf = ctor => v => typeof ctor !== 'undefined' && ctor !== null && v instanceof ctor;
const isTypeOf     = type => v => typeof v    === type;
const matches      = re   => v => typeof v    === 'string' && re.test(v);

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

// :::::: BASE PREDICATES

export const isBlank  = createPredicate((v) => v == null || v === '', 'isBlank');
export const isNumber = createPredicate((v) => typeof v === 'number' && !Number.isNaN(v), 'isNumber');
export const isEven   = createPredicate((v) => Number.isInteger(v) && v % 2 === 0, 'isEven');
export const isString = createPredicate((v) => typeof v === 'string', 'isString');
export const isArray  = createPredicate(Array.isArray, 'isArray');

// Alias mapping for standard constructor names like String, Array, etc.
registry.set('String', isString);
registry.set('Array', isArray);
registry.set('blank', isBlank);

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

// =====================================================================
// BASE PREDICATES (All auto-register their 'String', 'string', etc. keys)
// =====================================================================

export const isString   = createPredicate(v => typeof v === 'string', 'isString');
export const isArray    = createPredicate(Array.isArray, 'isArray');
export const isNumber   = createPredicate(v => typeof v === 'number' && !Number.isNaN(v), 'isNumber');
export const isBoolean  = createPredicate(v => typeof v === 'boolean', 'isBoolean');
export const isObject   = createPredicate(v => Boolean(v) && typeof v === 'object' && !Array.isArray(v), 'isObject');
export const isFunction = createPredicate(v => typeof v === 'function', 'isFunction');
export const isBlank    = createPredicate(v => v == null || v === '', 'isBlank');
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
