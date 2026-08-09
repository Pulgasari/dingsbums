// predicates.js

import { and, not, or, testRule } from './core.js';

// :::::: HELPERS

const // Type and Instance Check Factories
isInstanceOf = ctor   => v => typeof ctor !== 'undefined' && ctor !== null && v instanceof ctor,
isTypeOf     = type   => v => typeof v    === type,
isMatchOf    = regexp => v => typeof v    === 'string' && regexp.test(v);

// Pattern Matcher (R.cond / switch-case replacement)
const testRule = (rule, val) => {
  if (typeof rule === 'function') return rule(val);
  if (typeof rule === 'boolean')  return rule;
  if (Array.isArray(rule))        return rule.every(r => testRule(r, val));
  return false;
};

// :::::: BASE PREDICATES (Clean names without 'is')

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

isNumericString = v => isString(v) && v.trim() !== '' && !nan(Number(v)),
isNumeric       = or(isNumber, isNumericString),
isYear          = v => (isNumber(v) || isNumericString(v)) && /^\d{4}$/.test(String(v)) && +v >= 0 && +v <= 9999;

export const // Objects & Data Structures
isArray        = Array.isArray,
isObject       = v => Boolean(v) && typeof v === 'object' && !isArray(v),
isPlainObject  = v => v !== null && typeof v === 'object' && v.constructor === Object,
isRealObject   = v => v?.constructor === Object,
isStrictObject = v => Object.prototype.toString.call(v) === '[object Object]',
isMap          = isInstanceOf(typeof Map !== 'undefined' ? Map : null),
isSet          = isInstanceOf(typeof Set !== 'undefined' ? Set : null),
isDate         = v => instanceOf(Date)(v) && !nan(v.getTime()),
isDate2        = v => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(v) || (!nan(Date.parse(v)) && nan(Number(v))),
isRegExp       = isInstanceOf(RegExp),
isPromise      = isInstanceOf(Promise),
isError        = isInstanceOf(Error),
isBuffer       = v => typeof Buffer !== 'undefined' && Buffer.isBuffer(v);

export const iterable       = v => v != null && typeof v[Symbol.iterator]      === 'function';
export const asyncIterable  = v => v != null && typeof v[Symbol.asyncIterator] === 'function';

export const // DOM & Environment (SSR-Safe)
isNode         = isInstanceOf(typeof Node              !== 'undefined' ? Node              : null),
isElement      = isInstanceOf(typeof Element           !== 'undefined' ? Element           : null),
isFragment     = isInstanceOf(typeof DocumentFragment  !== 'undefined' ? DoumentFragment   : null),
isCanvas       = isInstanceOf(typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement : null),
isElementish   = or(isElement, isFragment, isInstanceOf(typeof Document !== 'undefined' ? Document : null)),
isRealNodeList = isInstanceOf(typeof NodeList !== 'undefined' ? NodeList : null),
isNodeList     = v => (isRealNodeList(v) || isArray(v)) && [...v].every(node);

export const internalUrl  = v => isString(v) && typeof window !== 'undefined' &&  v.startsWith(window.location.origin);
export const externalUrl  = v => isString(v) && typeof window !== 'undefined' && !v.startsWith(window.location.origin);

export const // Emptiness & Logic
isBlank       = v => v == null || v === '',
isEmptyString = v => !v || v.length === 0,
isEmptyArray  = and(isArray, v => v.length === 0),
isEmptyMap    = and(isMap, v => v.size === 0),
isEmptySet    = and(isSet, v => v.size === 0),
isEmptyObject = and(isPlainObject, v => Object.keys(v).length === 0),
isEmpty       = or(v => v === '', v => v?.length === 0, isEmptyMap, isEmptySet, isEmptyObject),
isFalsy       = v => !v && v !== 0 && v !== false,
isFilled      = and(not(isBlank), not(isEmpty), not(isEmptyObject));

export const // Formats & Parsing
isAlphaNumeric = matches(/^[a-z0-9]+$/i),
isBase64       = matches(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
isEmail        = matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
isHexColor     = matches(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i),
isUUID         = matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
isJSON         = v => { if (!isString(v)) return false; try { JSON.parse(v); return true; } catch { return false; } },
isURL          = v => { try { new URL(v); return true; } catch { return false; } },
isHTML         = v => isString(v) && /^<([a-z]+)(\s[^>]*)?>.*<\/\1>$|^<([a-z]+)(\s[^>]*)?\/?>$/i.test(v.trim());

export const // String Cases
isLowerCase    = and(isString, v => v === v.toLowerCase()),
isUpperCase    = and(isString, v => v === v.toUpperCase()),
isCamelCase    = and(matches(/^[a-z][a-zA-Z0-9]*$/), not(isUpperCase)),
isConstantCase = matches(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/),
isKebabCase    = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
isPascalCase   = matches(/^[A-Z][a-zA-Z0-9]*$/),
isSnakeCase    = matches(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);

export const // Lists
isEntriesList = v => isArray(v) && v.every(item => isArray(item) && item.length === 2);
isObjectList  = v => isArray(v) && v.every(isObject);
isStringList  = v => isArray(v) && v.every(isString);



