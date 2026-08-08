// predicates.js

// =====================================================================
// 1. COMBINATORS & CORE HELPERS
// =====================================================================



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

isNumericString = v => isString(v) && v.trim() !== '' && !nan(Number(v)),
isNumeric       = or(isNumber, isNumericString),
isYear          = v => (isNumber(v) || isNumericString(v)) && /^\d{4}$/.test(String(v)) && +v >= 0 && +v <= 9999;

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
export const regExp       = isInstanceOf(RegExp);
export const promise      = isInstanceOf(Promise);
export const error        = isInstanceOf(Error);
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
isHTML         = v => isString(v) && /^<([a-z]+)(\s[^>]*)?>.*<\/\1>$|^<([a-z]+)(\s[^>]*)?\/?>$/i.test(v.trim());

export const // String Cases
isLowerCase    = and(string, v => v === v.toLowerCase()),
isUpperCase    = and(string, v => v === v.toUpperCase()),
isCamelCase    = and(matches(/^[a-z][a-zA-Z0-9]*$/), not(upperCase)),
isConstantCase = matches(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/),
isKebabCase    = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
isPascalCase   = matches(/^[A-Z][a-zA-Z0-9]*$/),
isSnakeCase    = matches(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);

export const // Lists
isEntriesList = v => isArray(v) && v.every(item => isArray(item) && item.length === 2);
isObjectList  = v => isArray(v) && v.every(object);
isStringList  = v => isArray(v) && v.every(string);

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
