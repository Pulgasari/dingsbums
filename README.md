# fp

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

// =====================================================================
// 2. BASE PREDICATES (Clean names without 'is')
// =====================================================================

export const // Primitives & Types
isString      = isTypeOf('string'),
isBigInt      = isTypeOf('bigint'),
isBoole       = isTypeOf('boolean'),
isBoolean     = isTypeOf('boolean'),
isFn          = isTypeOf('function'),
isFunction    = isTypeOf('function'),
isSymbol      = isTypeOf('symbol'),
isUndefined_  = isTypeOf('undefined'),
isNull        = v => v === null,
isNullish     = v => v == null,
isDefined     = v => v !== undefined,
isPrimitive   = v => v !== Object(v);

export const // numbers
nan           = Number.isNaN,
isNumber      = and(isTypeOf('number'), not(nan)),
isInteger     = Number.isInteger,
isFinite      = Number.isFinite,
isFloat       = and(isTypeOf('number'), not(nan), not(isInteger)),
isEven        = and(isInteger, v => v % 2 === 0),
isOdd         = and(isInteger, v => Math.abs(v % 2) === 1),
isPositive    = and(isNumber, v => v > 0),
isNegative    = and(isNumber, v => v < 0),
isZero        = v => v === 0;

export const numericString = v => string(v) && v.trim() !== '' && !nan(Number(v));
export const numeric       = or(number, numericString);
export const year          = v => (number(v) || numericString(v)) && /^\d{4}$/.test(String(v)) && +v >= 0 && +v <= 9999;

// Objects & Data Structures
export const array        = Array.isArray;
export const object       = v => Boolean(v) && typeof v === 'object' && !array(v);
export const plainObject  = v => v !== null && typeof v === 'object' && v.constructor === Object;
export const realObject   = v => v?.constructor === Object;
export const strictObject = v => Object.prototype.toString.call(v) === '[object Object]';
export const map          = instanceOf(typeof Map !== 'undefined' ? Map : null);
export const set          = instanceOf(typeof Set !== 'undefined' ? Set : null);
export const date         = v => instanceOf(Date)(v) && !nan(v.getTime());
export const date2        = v => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(v) || (!nan(Date.parse(v)) && nan(Number(v)));
export const regExp       = instanceOf(RegExp);
export const promise      = instanceOf(Promise);
export const error        = instanceOf(Error);
export const buffer       = v => typeof Buffer !== 'undefined' && Buffer.isBuffer(v);

export const iterable       = v => v != null && typeof v[Symbol.iterator] === 'function';
export const asyncIterable  = v => v != null && typeof v[Symbol.asyncIterator] === 'function';

// DOM & Environment (SSR-Safe)
export const node         = instanceOf(typeof Node !== 'undefined' ? Node : null);
export const domNode      = node;
export const element      = instanceOf(typeof Element !== 'undefined' ? Element : null);
export const fragment     = instanceOf(typeof DocumentFragment !== 'undefined' ? DoumentFragment : null);
export const canvas       = instanceOf(typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement : null);
export const elementish   = or(element, fragment, instanceOf(typeof Document !== 'undefined' ? Document : null));
export const realNodeList = instanceOf(typeof NodeList !== 'undefined' ? NodeList : null);
export const nodeList     = v => (realNodeList(v) || array(v)) && [...v].every(node);

export const internalUrl  = v => string(v) && typeof window !== 'undefined' && v.startsWith(window.location.origin);
export const externalUrl  = v => string(v) && typeof window !== 'undefined' && !v.startsWith(window.location.origin);

export const // Emptiness & Logic
isBlank       = v => v === null || v === undefined || v === '',
isEmptyString = v => !v || v.length === 0,
isEmptyArray  = and(array, v => v.length === 0),
isEmptyMap    = and(map, v => v.size === 0),
isEmptySet    = and(set, v => v.size === 0),
isEmptyObject = and(plainObject, v => Object.keys(v).length === 0),
isEmpty       = or(v => v === '', v => v?.length === 0, emptyMap, emptySet, emptyObject),
isFalsy       = v => !v && v !== 0 && v !== false,
isFilled      = and(not(blank), not(empty), not(emptyObject));

export const // Formats & Parsing
isAlphaNumeric = matches(/^[a-z0-9]+$/i),
isBase64       = matches(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
isEmail        = matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
isHexColor     = matches(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i),
isUUID         = matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
isJSON         = v => { if (!string(v)) return false; try { JSON.parse(v); return true; } catch { return false; } },
isURL          = v => { try { new URL(v); return true; } catch { return false; } },
isHTML         = v => string(v) && /^<([a-z]+)(\s[^>]*)?>.*<\/\1>$|^<([a-z]+)(\s[^>]*)?\/?>$/i.test(v.trim());

export const // String Cases
isLowerCase    = and(string, v => v === v.toLowerCase()),
isUpperCase    = and(string, v => v === v.toUpperCase()),
isCamelCase    = and(matches(/^[a-z][a-zA-Z0-9]*$/), not(upperCase)),
isConstantCase = matches(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/),
isKebabCase    = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
isPascalCase   = matches(/^[A-Z][a-zA-Z0-9]*$/),
isSnakeCase    = matches(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);

// Lists
export const entriesList  = v => array(v) && v.every(item => array(item) && item.length === 2);
export const objectList   = v => array(v) && v.every(object);
export const stringList   = v => array(v) && v.every(string);

// =====================================================================
// 3. PREDICATE REGISTRY & DYNAMIC IS PROXY
// =====================================================================

const predicates = {
  alphaNumeric, array, asyncIterable, base64, bigInt, blank, boolean, buffer,
  canvas, date, date2, defined, domNode, element, elementish, email, empty,
  emptyArray, emptyMap, emptyObject, emptySet, emptyString, error, even,
  externalUrl, falsy, filled, finite, float, fragment, function: func, hexColor,
  integer, internalUrl, iterable, json, map, nan, negative, node, null: null_,
  nullish, number, numeric, numericString, object, plainObject, realObject,
  strictObject, odd, positive, primitive, promise, regExp, set, string, symbol,
  undefined: undefined_, url, uuid, year, zero, html, camelCase, constantCase,
  kebabCase, lowerCase, pascalCase, snakeCase, upperCase, entriesList, nodeList,
  realNodeList, objectList, stringList
};

// Evaluator for single/multiple rules () and []
const evalRule = (rule, val) => {
  if (typeof rule === 'string')   return predicates[rule]?.(val) ?? false;
  if (typeof rule === 'function') return rule(val);
  if (Array.isArray(rule))        return rule.every(r => evalRule(r, val));
  return false;
};

// Curried syntax creator: is('string')(val) or is([number, even])(val)
const createChecker = rule => val => evalRule(rule, val);

// The `is` Proxy: supports is.string(v), is('string')(v), is([p1, p2])(v)
export const is = new Proxy(createChecker, {
  get(target, prop) {
    if (prop in predicates) return predicates[prop];
    return target[prop];
  }
});
```

```javascript
// @aufbau/js/is.js

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

