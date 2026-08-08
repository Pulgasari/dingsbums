// index.js

export * from './core.js';
export * from './transform.js';


// =====================================================================
// 3. PREDICATE REGISTRY & CREATOR
// =====================================================================

const registry = new Map();
let predIdCounter = 0;

// Wraps a predicate function, overrides toString() for object key matching,
// and registers both 'isName' and 'name' (without 'is') in the lookup registry.
export const createPredicate = (fn, name) => {
  const id = name || `__pred_${++predIdCounter}__`;
  fn.toString = () => id;
  registry.set(id, fn);

  // Auto-register alias without 'is' prefix (e.g., 'isBlank' -> 'blank')
  if (id.startsWith('is') && id.length > 2) {
    const withoutIs = id.slice(2, 3).toLowerCase() + id.slice(3);
    if (!registry.has(withoutIs)) {
      registry.set(withoutIs, fn);
    }
  }

  return fn;
};

// =====================================================================
// 4. COMBINATORS & PATTERN MATCHING
// =====================================================================

export const not = (fn) => {
  const pred = (v) => !(typeof fn === 'function' ? fn(v) : fn);
  return createPredicate(pred, `not(${fn.name || fn})`);
};

export const and = (...fns) => {
  const pred = (v) => fns.every((fn) => (typeof fn === 'function' ? fn(v) : fn));
  return createPredicate(pred, `and(${fns.map((f) => f.name || f).join(',')})`);
};

export const or = (...fns) => {
  const pred = (v) => fns.some((fn) => (typeof fn === 'function' ? fn(v) : fn));
  return createPredicate(pred, `or(${fns.map((f) => f.name || f).join(',')})`);
};

// Pattern Matcher supporting object syntax, predicate keys, string key lookup, and constructor names
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

// =====================================================================
// 5. BASE PREDICATES
// =====================================================================

const isInstanceOf = (ctor) => (v) => typeof ctor !== 'undefined' && ctor !== null && v instanceof ctor;
const isTypeOf     = (type) => (v) => typeof v === type;
const matches      = (re)   => (v) => typeof v === 'string' && re.test(v);

// Primitives & Types
export const isString      = createPredicate(isTypeOf('string'), 'isString');
export const isBigInt      = createPredicate(isTypeOf('bigint'), 'isBigInt');
export const isBoolean     = createPredicate(isTypeOf('boolean'), 'isBoolean');
export const isBoole       = isBoolean;
export const isFunction    = createPredicate(isTypeOf('function'), 'isFunction');
export const isFn          = isFunction;
export const isSymbol      = createPredicate(isTypeOf('symbol'), 'isSymbol');
export const isUndefined   = createPredicate(isTypeOf('undefined'), 'isUndefined');
export const isNull        = createPredicate((v) => v === null, 'isNull');
export const isNullish     = createPredicate((v) => v == null, 'isNullish');
export const isDefined     = createPredicate((v) => v !== undefined, 'isDefined');
export const isPrimitive   = createPredicate((v) => v !== Object(v), 'isPrimitive');

// Numbers
export const nan           = Number.isNaN;
export const isNumber      = createPredicate((v) => typeof v === 'number' && !nan(v), 'isNumber');
export const isInteger     = createPredicate(Number.isInteger, 'isInteger');
export const isFinite      = createPredicate(Number.isFinite, 'isFinite');
export const isFloat       = createPredicate((v) => typeof v === 'number' && !nan(v) && !Number.isInteger(v), 'isFloat');
export const isEven        = createPredicate((v) => Number.isInteger(v) && v % 2 === 0, 'isEven');
export const isOdd         = createPredicate((v) => Number.isInteger(v) && Math.abs(v % 2) === 1, 'isOdd');
export const isPositive    = createPredicate((v) => typeof v === 'number' && !nan(v) && v > 0, 'isPositive');
export const isNegative    = createPredicate((v) => typeof v === 'number' && !nan(v) && v < 0, 'isNegative');
export const isZero        = createPredicate((v) => v === 0, 'isZero');

export const isNumericString = createPredicate((v) => isString(v) && v.trim() !== '' && !nan(Number(v)), 'isNumericString');
export const isNumeric       = createPredicate((v) => isNumber(v) || isNumericString(v), 'isNumeric');
export const isYear          = createPredicate((v) => (isNumber(v) || isNumericString(v)) && /^\d{4}$/.test(String(v)) && +v >= 0 && +v <= 9999, 'isYear');

// Objects & Data Structures
export const isArray        = createPredicate(Array.isArray, 'isArray');
export const isObject       = createPredicate((v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v), 'isObject');
export const isPlainObject  = createPredicate((v) => v !== null && typeof v === 'object' && v.constructor === Object, 'isPlainObject');
export const isRealObject   = createPredicate((v) => v?.constructor === Object, 'isRealObject');
export const isStrictObject = createPredicate((v) => Object.prototype.toString.call(v) === '[object Object]', 'isStrictObject');
export const isMap          = createPredicate(isInstanceOf(typeof Map !== 'undefined' ? Map : null), 'isMap');
export const isSet          = createPredicate(isInstanceOf(typeof Set !== 'undefined' ? Set : null), 'isSet');
export const isDate         = createPredicate((v) => isInstanceOf(typeof Date !== 'undefined' ? Date : null)(v) && !nan(v.getTime()), 'isDate');
export const isRegExp       = createPredicate(isInstanceOf(RegExp), 'isRegExp');
export const isPromise      = createPredicate(isInstanceOf(Promise), 'isPromise');
export const isError        = createPredicate(isInstanceOf(Error), 'isError');
export const isBuffer       = createPredicate((v) => typeof Buffer !== 'undefined' && Buffer.isBuffer(v), 'isBuffer');

export const isIterable     = createPredicate((v) => v != null && typeof v[Symbol.iterator] === 'function', 'isIterable');
export const isAsyncIterable= createPredicate((v) => v != null && typeof v[Symbol.asyncIterator] === 'function', 'isAsyncIterable');

// DOM & Environment (SSR-Safe)
export const isNode         = createPredicate(isInstanceOf(typeof Node !== 'undefined' ? Node : null), 'isNode');
export const isDomNode      = isNode;
export const isElement     = createPredicate(isInstanceOf(typeof Element !== 'undefined' ? Element : null), 'isElement');
export const isFragment    = createPredicate(isInstanceOf(typeof DocumentFragment !== 'undefined' ? DocumentFragment : null), 'isFragment');
export const isCanvas      = createPredicate(isInstanceOf(typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement : null), 'isCanvas');
export const isElementish  = createPredicate((v) => isElement(v) || isFragment(v) || isInstanceOf(typeof Document !== 'undefined' ? Document : null)(v), 'isElementish');
export const isRealNodeList= createPredicate(isInstanceOf(typeof NodeList !== 'undefined' ? NodeList : null), 'isRealNodeList');
export const isNodeList    = createPredicate((v) => (isRealNodeList(v) || Array.isArray(v)) && [...v].every(isNode), 'isNodeList');

export const isInternalUrl = createPredicate((v) => isString(v) && typeof window !== 'undefined' && v.startsWith(window.location.origin), 'isInternalUrl');
export const isExternalUrl = createPredicate((v) => isString(v) && typeof window !== 'undefined' && !v.startsWith(window.location.origin), 'isExternalUrl');

// Emptiness & Logic
export const isBlank       = createPredicate((v) => v === null || v === undefined || v === '', 'isBlank');
export const isEmptyString = createPredicate((v) => !v || v.length === 0, 'isEmptyString');
export const isEmptyArray  = createPredicate((v) => Array.isArray(v) && v.length === 0, 'isEmptyArray');
export const isEmptyMap    = createPredicate((v) => isMap(v) && v.size === 0, 'isEmptyMap');
export const isEmptySet    = createPredicate((v) => isSet(v) && v.size === 0, 'isEmptySet');
export const isEmptyObject = createPredicate((v) => isPlainObject(v) && Object.keys(v).length === 0, 'isEmptyObject');
export const isEmpty       = createPredicate((v) => v === '' || v?.length === 0 || isEmptyMap(v) || isEmptySet(v) || isEmptyObject(v), 'isEmpty');
export const isFalsy       = createPredicate((v) => !v && v !== 0 && v !== false, 'isFalsy');
export const isFilled      = createPredicate((v) => !isBlank(v) && !isEmpty(v), 'isFilled');

// Formats & Parsing
export const isAlphaNumeric = createPredicate(matches(/^[a-z0-9]+$/i), 'isAlphaNumeric');
export const isBase64       = createPredicate(matches(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/), 'isBase64');
export const isEmail        = createPredicate(matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), 'isEmail');
export const isHexColor     = createPredicate(matches(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i), 'isHexColor');
export const isUUID         = createPredicate(matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i), 'isUUID');
export const isJSON         = createPredicate((v) => { if (!isString(v)) return false; try { JSON.parse(v); return true; } catch { return false; } }, 'isJSON');
export const isURL          = createPredicate((v) => { try { new URL(v); return true; } catch { return false; } }, 'isURL');
export const isHTML         = createPredicate((v) => isString(v) && /^<([a-z]+)(\s[^>]*)?>.*<\/\1>$|^<([a-z]+)(\s[^>]*)?\/?>$/i.test(v.trim()), 'isHTML');

// Cases
export const isLowerCase    = createPredicate((v) => isString(v) && v === v.toLowerCase(), 'isLowerCase');
export const isUpperCase    = createPredicate((v) => isString(v) && v === v.toUpperCase(), 'isUpperCase');
export const isCamelCase    = createPredicate((v) => isString(v) && matches(/^[a-z][a-zA-Z0-9]*$/)(v) && !isUpperCase(v), 'isCamelCase');
export const isConstantCase = createPredicate(matches(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/), 'isConstantCase');
export const isKebabCase    = createPredicate(matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), 'isKebabCase');
export const isPascalCase   = createPredicate(matches(/^[A-Z][a-zA-Z0-9]*$/), 'isPascalCase');
export const isSnakeCase    = createPredicate(matches(/^[a-z0-9]+(?:_[a-z0-9]+)*$/), 'isSnakeCase');

// Lists
export const isEntriesList = createPredicate((v) => isArray(v) && v.every((item) => isArray(item) && item.length === 2), 'isEntriesList');
export const isObjectList  = createPredicate((v) => isArray(v) && v.every(isObject), 'isObjectList');
export const isStringList  = createPredicate((v) => isArray(v) && v.every(isString), 'isStringList');

// Standard Object Constructor Name Registry Aliases
registry.set('String', isString);
registry.set('Array', isArray);
registry.set('Number', isNumber);
registry.set('Boolean', isBoolean);
registry.set('Object', isObject);
registry.set('Function', isFunction);

// =====================================================================
// 6. DYNAMIC `is` PROXY
// =====================================================================

// Rule Evaluator for string keys, predicate functions, and arrays
const evalRule = (rule, val) => {
  if (typeof rule === 'function') return rule(val);
  if (typeof rule === 'string') {
    const testFn = registry.get(rule) 
      ?? registry.get('is' + rule.charAt(0).toUpperCase() + rule.slice(1));
    return testFn ? testFn(val) : false;
  }
  if (Array.isArray(rule)) return rule.every((r) => evalRule(r, val));
  return false;
};

// Curried syntax creator: is('string')(val) or is([isNumber, isEven])(val)
const createChecker = (rule) => (val) => evalRule(rule, val);

// The `is` Proxy: supports is.string(v), is.isBlank(v), is('string')(v), is([p1, p2])(v)
export const is = new Proxy(createChecker, {
  get(target, prop) {
    if (typeof prop === 'string') {
      // 1. Direct registry lookup (e.g., 'isBlank' or 'blank')
      if (registry.has(prop)) return registry.get(prop);

      // 2. Lookup with 'is' prefix (e.g., is.string -> tries 'isString')
      const withIs = 'is' + prop.charAt(0).toUpperCase() + prop.slice(1);
      if (registry.has(withIs)) return registry.get(withIs);

      // 3. Lookup without 'is' prefix if property starts with 'is'
      if (prop.startsWith('is') && prop.length > 2) {
        const withoutIs = prop.slice(2, 3).toLowerCase() + prop.slice(3);
        if (registry.has(withoutIs)) return registry.get(withoutIs);
      }
    }
    return target[prop];
  }
});
