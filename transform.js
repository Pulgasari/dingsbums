// transform.js

import { compose, curry, pipe } from './core.js';

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
