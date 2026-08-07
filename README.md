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
