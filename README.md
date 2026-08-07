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

// curried array transformers
export const map    = fn         => arr => arr.map(fn);
export const filter = predicate  => arr => arr.filter(predicate);
export const reduce = (fn, init) => arr => arr.reduce(fn, init);


export const // curried string transformers
join           = char => arr => arr.join(char),
split          = char => str => str.split(char),
trim           = str  => str.trim(),
toLowerCase    = str  => value.toLowerCase (),
toUpperCase    = str  => value.toUpperCase (),
toCamelCase    = str  => toWords(value).map((word, index) => index ? upperFirst(word) : word).join(''),    
toConstantCase = str  => toWords(value).join('_').toUpperCase(),
toKebabCase    = str  => toWords(value).join('-'),
toPascalCase   = str  => toWords(value).map(upperFirst).join(''),
toSnakeCase    = str  => toWords(value).join('_'),
toTitleCase    = str  => toWords(value).map(upperFirst).join(' ');

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

```javascript


// :::::: UNARY TRANSFORMS

export const
capitalize     = value => String(value).charAt(0).toUpperCase() + String(value).slice(1),

trim           = value => value.trim      (),
trimEnd        = value => value.trimEnd   (),
trimStart      = value => value.trimStart (),
unquote        = value => String(value).replace(/^(['"`])([\s\S]*)\1$/, '$2');
```
