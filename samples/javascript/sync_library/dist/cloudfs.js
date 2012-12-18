
//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, val, context) {
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      if (a === void 0) return 1;
      if (b === void 0) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj)                                     return [];
    if (_.isArray(obj))                           return slice.call(obj);
    if (_.isArguments(obj))                       return slice.call(obj);
    if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.isArray(obj) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    // The `isSorted` flag is irrelevant if the array only contains two elements.
    if (array.length < 3) isSorted = true;
    _.reduce(initial, function (memo, value, index) {
      if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1), true);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var result = {};
    each(_.flatten(slice.call(arguments, 1)), function(key) {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    '\\': '\\',
    "'": "'",
    'r': '\r',
    'n': '\n',
    't': '\t',
    'u2028': '\u2028',
    'u2029': '\u2029'
  };

  for (var p in escapes) escapes[escapes[p]] = p;
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(unescaper, function(match, escape) {
      return escapes[escape];
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults(settings || {}, _.templateSettings);

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text
      .replace(escaper, function(match) {
        return '\\' + escapes[match];
      })
      .replace(settings.escape || noMatch, function(match, code) {
        return "'+\n_.escape(" + unescape(code) + ")+\n'";
      })
      .replace(settings.interpolate || noMatch, function(match, code) {
        return "'+\n(" + unescape(code) + ")+\n'";
      })
      .replace(settings.evaluate || noMatch, function(match, code) {
        return "';\n" + unescape(code) + "\n;__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __p='';" +
      "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" +
      source + "return __p;\n";

    var render = new Function(settings.variable || 'obj', '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for build time
    // precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
      source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };
 // AMD Define
define('underscore',[],function(){
    return _;
});

})();
//}).call(this);


define('diffScanner',[
    'underscore'
    ], function(_) {
      
  var DiffScanner=function(options){
    this._configure(options || {});
    //if (this.options) {
    //this.leftSide=[];
    //this.rightSide=[];

    //_.extend({leftSide:[],rightSide:[]},  options);
  //}
   this.options = options;
  };
  _.extend(DiffScanner.prototype,
    {
    _configure: function(options) {
      this.options={leftSide:[],rightSide:[]};
      if (this.options) options = _.extend({}, this.options, options);
            this.options = options;
            this.leftSide = this.options.leftSide;
            this.rightSide = this.options.rightSide;

    },
 
  process: function() {
      var errors=[];
      var writables=[];
      var removables=[];
      var ignored=[];
      var self=this;
      _.each(self.leftSide,function(lfile){
        var found=null;  
        _.each(self.rightSide,function(rfile){
          if (self._sanitize(lfile.relativePath) === self._sanitize(rfile.relativePath))
          {
            found=rfile;
            if(lfile.size===0 ){ignored.push(rfile); return; }


            if (lfile.lastTimestamp > rfile.lastTimestamp) //source is newer => to be act on
            {
              if(lfile.isDir){ignored.push(rfile);}
              else if (lfile.size === rfile.size && lfile.createTimestamp === lfile.lastTimestamp){ignored.push(rfile);} // never modified since check out as copy doesn't preserve timestamp.
              else{writables.push(lfile);}
              return;
            }
            if (lfile.lastTimestamp === rfile.lastTimestamp) // source is same => to be ignored
            {
              if (lfile.size === rfile.size){ignored.push(rfile); return;}
              else{errors.push({ref:rfile.name, msg:"size differ for same timestamp",right: rfile,left:lfile});return;} // size differ. it shouldn't!
            }
            if (lfile.lastTimestamp < rfile.lastTimestamp ) 
            {
              //if (lfile.size === rfile.size && rfile.createTimestamp === rfile.lastTimestamp){ignored.push(rfile); return;} // never modified since check out.
              if (lfile.size === rfile.size){ignored.push(rfile); return;} // never modified since check out.
              else{errors.push({ref:rfile.name, msg:"destination newer",right: rfile,left:lfile});return;}// source is older => dest as been modified already. 
            }
          }
        });
         
        if(!found){writables.push(lfile);}
        else{
          // found from the list is removed (splice) so iteration get quicker
          var index=self.rightSide.indexOf(found);
          self.rightSide.splice(index,1);
          found=null; //reset for next iteration;
        }
      });
      removables=this._reduceRemovables(this.rightSide);

      return {writables:writables,removables:removables,ignored:ignored,errors:errors};
    },

    _sanitize:function(path){
    	return  path.replace(/\//g,Titanium.Filesystem.getSeparator());
    },

     // when removables contains [{path:level1/level2/},{path:level1/level2/level3/}
     // it should contains only  [{path:level1/level2/}] when return from this method
     // because remove is recursive and removing level1/level2 will remove in the same time level1/level2/level3
    _reduceRemovables:function(allRemovables){
      var removables=[];
      _.each(allRemovables,function(item){                  
        var isFound=false;
        //if item.path is contained in any of the previously parsed and it's longer then it should not be added, if it's shorter, it should replace the current item
        var i=0;
        for ( i; i < removables.length; i++) {
          // item is a parent element of an already present element, so it should replace it!
          if (removables[i].path.indexOf(item.path) ===0) {
            removables.splice(i,1,item);
            isFound=true;
            break;
          }
          // item is a child element of an already present element, so nothing to do
          if (item.path.indexOf(removables[i].path) ===0) {
            isFound=true;
            break;
          }
        }
        //not already present so it can be added
        if(!isFound){removables.push(item);}
      });
      return removables;
    }
  });
  return DiffScanner;
});

//-----------------------------------------------------------------------------
// FileSync
//-----------------------------------------------------------------------------
define('fileSync',[
    'underscore',
    'diffScanner'

    ], function(_,DiffScanner) {
  
  var FileSync = function() {
  /* High level implementation of a DavFs client wrapper */
    console.log('FileSync');
  };
 _.extend(FileSync.prototype,
  {
    initialize:function(local,remote,shipper,logger) {
      this.local = local;
      this.remote= remote;
      this.shipper= shipper;
      this.logger=logger;
      this.forceSync=false;//if destination is newer than source sync stop, if set to true sync continue no matter what.
    },
    
    //from server to localfile 
    checkOut: function(paths,forceSync,callbacks){  //source = remote; destination= local
      this._log("checkOut in: " + paths.source);
      this._prepareSync(paths,true,forceSync,callbacks);
    },
    //from localfile to server  
    checkIn: function(paths,forceSync,callbacks){  //source = remote; destination= local
      this._log("checkIn in: " + paths.destination);
      this._prepareSync(paths,false,forceSync,callbacks);
    },

    _log: function(msg){
      this.logger.writeln(msg);
    },

    _prepareSync:function(paths,toLocal,forceSync,callbacks) {
      this.forceSync=forceSync;
      this.syncPaths=paths;
      this.source= (toLocal)?this.remote:this.local;
      this.destination=(toLocal)?this.local:this.remote;
      this._initCallbacks(callbacks);
      var self=this;
      this.source.readdir(paths.source,
           function(error,content){
             if (error){
               self._onError("fileSync._prepareSync","error reading source path: " + paths.source + " " +  error);
               return;
             }
             self.sourceTree= content;
             self.destination.readdir(paths.destination,
                  function(error,content){
                    // Not found is ok -- path may not exist on destination
                    if (error && error !=="Not Found"){self._onError("fileSync._prepareSync","error reading local path: " + paths.destination +" " + error);return;}
                    self.destinationTree= content ||[];
                    self.diffFileSet=self._scan(self.sourceTree,self.destinationTree);
                    self._sync(self.diffFileSet,self._syncCallback);
                  });
           });
    },
    _scan: function(leftSide,rightSide){
      var diffScanner = new DiffScanner({leftSide:leftSide,rightSide:rightSide});
      return diffScanner.process();
     },
  
    _sync: function(syncReports,callback) {
      //this.read_errors=[];
      //this.write_errors=[];
      this.transfer_errors=[];
      this.remove_errors=[];
      this.addedCount=0;
      this.removedCount=0;
      if (syncReports.errors.length >0){
        if(this.forceSync) {
          this._onError('sync forced',this._scanErrorToString(syncReports.errors));
          var toAdd= _.pluck(syncReports.errors, 'left');
          syncReports.writables=syncReports.writables.concat(toAdd);
        }
        else{
           this._onError('sync aborted',this._scanErrorToString(syncReports.errors));
           this._onComplete('_sync','sync aborted on scan error see log for details');
           return; // sync is aborted 
        }
      }
      this.actions=[{run:this._syncWriteNext,items:syncReports.writables},{run:this._syncRemoveNext,items:syncReports.removables}];
      
      this._syncActionNext();
     },
    _syncActionNext:function() {
      if (this.actions.length===0){this._syncCallback();return;}
      var current = this.actions.shift();
      this.actionables=current.items;
      current.run.apply(this);
    },

    _syncWriteNext: function() {
       if (this.actionables.length===0){this._syncActionNext();return;}
       var item= this.actionables.shift();
       var self=this;
       this._onProgress('write',item.path + "(" + item.readSize() + ")");
       if (item.isDir){
         var destinationDir=(self.syncPaths.destination +item.relativePath);
         self.destination.mkdir(destinationDir,
              function(error){
                if (error){ self.transfer_errors.push({item:destinationDir,msg:error});}
                self._syncWriteNext();
              });
       } else {
        
         var destinationPath= this.destination.getFullPath(self.syncPaths.destination +item.relativePath);
         this._checkDestinationPath(destinationPath, function(error){
              if(error){self.transfer_errors.push({item:item.path,msg:error});self._syncWriteNext();return;}
              self.shipper.transfer({origin:self.source.getFullPath(item.path),destination: destinationPath},
                                    {onError:function(error){self.transfer_errors.push({item:item.path,msg:error});self._syncWriteNext();},
                                     onComplete:function(){self.addedCount++;self._syncWriteNext();}                 
             });
         });
        //
        /* 
        self.source.read(item.path,
              function(error, content){
                if (error){self.read_errors.push(error);}
                else{
                  self.destination.write(item.path,content,
                       function(error, content){
                         if (error){self.write_errors.push(error);}
                         self._syncWriteNext();
                       }
                    );
                }
              });
        */
       }
    },
    _checkDestinationPath: function(path,callback){
      var self=this;
      this.destination.isDir(path,function(result){
        if(!result){
          self.destination.mkdir(path,function(error){
            callback(error);});
        }
        else{callback();}
      });
    },

    _syncRemoveNext: function() {
       if (this.actionables.length===0){this._syncActionNext();return;}
       var item= this.actionables.shift();
       var self=this;
       this._onProgress("remove" , item.path);
       if (item.isDir){
         self.destination.rmdir(item.path,
              function(error){
                if (error){ self.remove_errors.push({item:item.path,msg:error});}
                self._syncRemoveNext();
              });
       }
       else{
         self.destination.rm(item.path,
              function(error){
                if (error){ self.remove_errors.push({item:item.path,msg:error});}
                else{self.removedCount++;}
                self._syncRemoveNext();
              });
       }
    },

   _syncCallback:function() {
      var errors=[];
      var errorCount=0;
      //if (this.read_errors.length >0){errors.push(this.read_errors); alert(this.read_errors.length + " reading errors, check logs");}
      //if (this.write_errors.length >0){errors.push(this.write_errors); alert(this.write_errors.length + " writing errors, check logs");}
      if (this.transfer_errors.length >0){this._log(this._writeErrorToString(this.transfer_errors)); errorCount+= this.transfer_errors.length;}
      if (this.remove_errors.length >0){this._log(this._removeErrorToString(this.remove_errors)); errorCount+=this.remove_errors.length;}
      //if (errors.length===0){errors=null;}
      
      this._onComplete('complete',"added: "+ this.addedCount+ ", removed: " +  this.removedCount + ", errors: " + errorCount ,{added:this.addedCount,removed:this.removedCount,errors:errorCount});//callback(errors);
    },
   
    _initCallbacks:function(callbacks) {
      var onProgressCallback = callbacks.onProgress || function(){};
      var onErrorCallback = callbacks.onError || function(){};
      var onCompleteCallback = callbacks.onComplete || function(){};
      var self=this;
      this._onProgress= function(method,msg){self._onActionLog(method,msg); onProgressCallback(msg);}; 
      this._onError= function(method,msg){self._onActionLog(method,msg); onErrorCallback(msg);}; 
      this._onComplete= function(method,msg,info){self._onActionLog(method,msg); onCompleteCallback(info);}; 
    },


    _scanErrorToString:function(errors) {
      var report="SCAN ERROR BEGIN ===\n";
      _.each(errors, function(error){
        report+="  " + error.ref +": " + error.msg +"\n";// + "(" + error.right.lastTimestamp + ") :" + error.right.size + " != " + error.left.size +"\n"; 
      });
      report +="=== SCAN ERROR END ===\n";
      return report;
    },

    _writeErrorToString:function(errors) {
      var report="WRITE ERROR BEGIN ===\n";
      _.each(errors, function(error){
        report+="  " + error.item +": " + error.msg  +"\n"; 
      });
      report +="=== WRITE ERROR END ===\n";
      return report;
    },

  _removeErrorToString:function(errors) {
      var report="REMOVE ERROR BEGIN ===\n";
      _.each(errors, function(error){
        report+="  " + error.item +": " + error.msg  +"\n"; 
      });
      report +="=== REMOVE ERROR END ===\n";
      return report;
    },

    _onActionLog: function(method,msg) {
       this._log(method + ": " + msg);
    }

  });

  return FileSync;
});


/*****************************************************************************
 *
 * Copyright (c) 2004-2007 Guido Wesdorp. All rights reserved.
 *
 * This software is distributed under the terms of the JSBase
 * License. See LICENSE.txt for license text.
 *
 *****************************************************************************/

var global = this;
global.exception = new function() {
    /* Exception handling in a somewhat coherent manner */

    var exception = this;

    this.Exception = function(message) {
        /* base class of exceptions */
        if (message !== undefined) {
            this._initialize('Exception', message);
        };
    };

    this.Exception.prototype._initialize = function(name, message) {
        this.name = name;
        this.message = message;
        var stack = this.stack = exception._createStack();
        this.lineNo = exception._getLineNo(stack);
        this.fileName = exception._getFileName(stack);
    };

    this.Exception.prototype.toString = function() {
        var lineNo = this.lineNo;
        var fileName = this.fileName;
        var stack = this.stack;
        var exc = this.name + ': ' + this.message + '\n';
        if (lineNo || fileName || stack) {
            exc += '\n';
        };
        if (fileName) {
            exc += 'file: ' + fileName;
            if (lineNo) {
                exc += ', ';
            } else {
                exc += '\n';
            };
        };
        if (lineNo) {
            exc += 'line: ' + lineNo + '\n';
        };
        if (stack) {
            exc += '\n';
            var lines = stack.split('\n');
            for (var i=0; i < lines.length; i++) {
                var line = lines[i];
                if (line.charAt(0) == '(') {
                    line = 'function' + line;
                };
                exc += line + '\n';
            };
        };
        return exc;
    };

    this.ValueError = function(message) {
        /* raised on providing invalid values */
        if (message !== undefined) {
            this._initialize('ValueError', message);
        };
    };

    this.ValueError.prototype = new this.Exception;

    this.AssertionError = function(message) {
        /* raised when an assertion fails */
        if (message !== undefined) {
            this._initialize('AssertionError', message);
        };
    };

    this.AssertionError.prototype = new this.Exception;

    // XXX need to define a load of useful exceptions here
    this.NotSupported = function(message) {
        /* raised when a feature is not supported on the running platform */
        if (message !== undefined) {
            this._initialize('NotSupported', message);
        };
    };

    this.NotSupported.prototype = new this.Exception;
    
    this.NotFound = function(message) {
        /* raised when something is not found */
        if (message !== undefined) {
            this._initialize('NotFound', message);
        };
    };

    this.NotFound.prototype = new this.Exception;

    this.HTTPError = function(status) {
        if (status !== undefined) {
            // XXX need to get the message for the error here...
            this._initialize('HTTPError', status);
        };
    };

    this.HTTPError.prototype = new this.Exception;

    this.MissingDependency = function(missing, from) {
        /* raised when some dependency can not be resolved */
        if (missing !== undefined) {
            var message = missing;
            if (from) {
                message += ' (from ' + from + ')';
            };
            this._initialize('MissingDependency', message);
        };
    };

    this.NotFound.prototype = new this.Exception;

    this._createStack = function() {
        /* somewhat nasty trick to get a stack trace in (works only in Moz) */
        var stack = undefined;
        try {notdefined()} catch(e) {stack = e.stack};
        if (stack) {
            stack = stack.split('\n');
            stack.shift();
            stack.shift();
        };
        return stack ? stack.join('\n') : '';
    };

    this._getLineNo = function(stack) {
        /* tries to get the line no in (works only in Moz) */
        if (!stack) {
            return;
        };
        stack = stack.toString().split('\n');
        var chunks = stack[0].split(':');
        var lineno = chunks[chunks.length - 1];
        if (lineno != '0') {
            return lineno;
        };
    };

    this._getFileName = function(stack) {
        /* tries to get the filename in (works only in Moz) */
        if (!stack) {
            return;
        };
        stack = stack.toString().split('\n');
        var chunks = stack[0].split(':');
        var filename = chunks[chunks.length - 2];
        return filename;
    };
}();

define("davException", function(){});

/*****************************************************************************
 *
 * Copyright (c) 2004-2007 Guido Wesdorp. All rights reserved.
 *
 * This software is distributed under the terms of the JSBase
 * License. See LICENSE.txt for license text.
 *
 *****************************************************************************/

/* Additions to the core String API */

var global = this;
global.string = new function() {
    var string = this;

    this.strip = function(s) {
        /* returns a string with all leading and trailing whitespace removed */
        var stripspace = /^\s*([\s\S]*?)\s*$/;
        return stripspace.exec(s)[1];
    };

    this.reduceWhitespace = function(s) {
        /* returns a string in which all whitespace is reduced 
            to a single, plain space */
        s = s.replace(/\r/g, ' ');
        s = s.replace(/\t/g, ' ');
        s = s.replace(/\n/g, ' ');
        while (s.indexOf('  ') > -1) {
            s = s.replace('  ', ' ');
        };
        return s;
    };

    this.entitize = function(s) {
        /* replace all standard XML entities */
        var ret = s.replace(/&/g, '&amp;');
        ret = ret.replace(/"/g, '&quot;');
        //ret = ret.replace(/'/g, '&apos;');
        ret = ret.replace(/</g, '&lt;');
        ret = ret.replace(/>/g, '&gt;');
        return ret;
    };

    this.deentitize = function(s) {
        /* convert all standard XML entities to the corresponding characters */
        var ret = s.replace(/&gt;/g, '>');
        ret = ret.replace(/&lt;/g, '<');
        //ret = ret.replace(/&apos;/g, "'");
        ret = ret.replace(/&quot;/g, '"');
        ret = ret.replace(/&amp;/g, '&');
        return ret;
    };

    this.urldecode = function(s) {
        /* decode an URL-encoded string 
        
            reverts the effect of calling 'escape' on a string (see 
            'String.urlencode' below)
        */
        var reg = /%([a-fA-F0-9]{2})/g;
        var str = s;
        while (true) {
            var match = reg.exec(str);
            if (!match || !match.length) {
                break;
            };
            var repl = new RegExp(match[0], 'g');
            str = str.replace(repl, 
                    String.fromCharCode(parseInt(match[1], 16)));
        };
        // XXX should we indeed replace these?
        str = str.replace(/\+/g, ' ');
        return str;
    };

    this.urlencode = function(s) {
        /* wrapper around the 'escape' core function

            provided for consistency, since I also have a string.urldecode()
            defined
        */
        return escape(s);
    };

    this.escape = function(s) {
        /* escapes quotes and special chars (\n, \a, \r, \t, etc.) 
        
            adds double slashes
        */
        // XXX any more that need escaping?
        s = s.replace(/\\/g, '\\\\');
        s = s.replace(/\n/g, '\\\n');
        s = s.replace(/\r/g, '\\\r');
        s = s.replace(/\t/g, '\\\t');
        s = s.replace(/'/g, "\\'");
        s = s.replace(/"/g, '\\"');
        return s;
    };

    this.unescape = function(s) {
        /* remove double slashes */
        s = s.replace(/\\\n/g, '\n');
        s = s.replace(/\\\r/g, '\r');
        s = s.replace(/\\\t/g, '\t');
        s = s.replace(/\\'/g, '\'');
        s = s.replace(/\\"/g, '"');
        s = s.replace(/\\\\/g, '\\');
        return s;
    };

    this.centerTruncate = function(s, maxlength) {
        if (s.length <= maxlength) {
            return s;
        };
        var chunklength = maxlength / 2 - 3;
        var start = s.substr(0, chunklength);
        var end = s.substr(s.length - chunklength);
        return start + ' ... ' + end;
    };

    this.startsWith = function(s, start) {
        return s.substr(0, start.length) == start;
    };

    this.endsWith = function(s, end) {
        return s.substr(s.length - end.length) == end;
    };
    
    this.format = function(s, indent, maxwidth) {
        /* perform simple formatting on the string */
        if (indent.length > maxwidth) {
            throw('Size of indent must be smaller than maxwidth');
        };
        s = string.reduceWhitespace(s);
        var words = s.split(' ');
        var lines = [];
        while (words.length) {
            var currline = indent;
            while (1) {
                var word = words.shift();
                if (!word || 
                        (currline.length > indent.length && 
                            currline.length + word.length > maxwidth)) {
                    break;
                };
                currline += word + ' ';
            };
            lines.push(currline);
        };
        return lines.join('\r\n');
    };
}();

define("davString", function(){});

/*****************************************************************************
 *
 * Copyright (c) 2004-2007 Guido Wesdorp. All rights reserved.
 *
 * This software is distributed under the terms of the JSBase
 * License. See LICENSE.txt for license text.
 *
 *****************************************************************************/

var global = this;
global.array = new function() {
    var array = this;
    
    this.contains = function(a, element, objectequality) {
        /* see if some value is in a */
        // DEPRECATED!!! use array.indexOf instead
        return (this.indexOf(a, element, !objectequality) > -1);
    };

    this.indexOf = function(a, element, compareValues) {
        for (var i=0; i < a.length; i++) {
            if (!compareValues) {
                if (element === a[i]) {
                    return i;
                };
            } else {
                if (element == a[i]) {
                    return i;
                };
            };
        };
        return -1;
    };

    this.removeDoubles = function(a) {
        var ret = [];
        for (var i=0; i < a.length; i++) {
            if (!this.contains(ret, a[i])) {
                ret.push(a[i]);
            };
        };
        return ret;
    };

    this.map = function(a, func) {
        /* apply 'func' to each element in the array (in-place!!) */
        for (var i=0; i < a.length; i++) {
            a[i] = func(a[i]);
        };
        return this;
    };

    this.reversed = function(a) {
        var ret = [];
        for (var i = a.length; i > 0; i--) {
            ret.push(a[i - 1]);
        };
        return ret;
    };

    this.StopIteration = function(message) {
        if (message !== undefined) {
            this._initialize('StopIteration', message);
        };
    };

    if (global.exception) {
        this.StopIteration.prototype = global.exception.Exception;
    };

    var Iterator = this.Iterator = function(a) {
        if (a) {
            this._initialize(a);
        };
    };

    Iterator._initialize = function(a) {
        this._array = a;
        this._i = 0;
    };

    Iterator.next = function() {
        if (this._i >= this._array.length) {
            this._i = 0;
            throw(StopIteration('no more items'));
        };
        return this._i++;
    };

    this.iterate = function(a) {
        /*  iterate through array 'a'

            this returns the n-th item of array 'a', where n is the number of
            times this function has been called on 'a' before

            when the items are all visited, the function resets the counter and
            starts from the start

            note that this annotates the array with information about iteration
            using the attribute '__iter_index__', remove this or set to 0 to
            reset

            this does not work well with arrays that have 'undefined' as one of
            their values!!
        */
        if (!a.__iter_index__) {
            a.__iter_index__ = 0;
        } else if (a.__iter_index__ >= a.length) {
            a.__iter_index__ = undefined;
            return undefined;
        };
        return a[a.__iter_index__++];
    };
}();

define("davArray", function(){});

/*
    minisax.js - Simple API for XML (SAX) library for JavaScript
    Copyright (C) 2004-2007 Guido Wesdorp
    email johnny@johnnydebris.net

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

    $Id: minisax.js,v 1.5 2004/07/31 00:10:15 johnny Exp $

*/

function SAXParser() {
    /* Simple SAX library

        Uses a couple of regular expressions to parse XML, supports only
        a subset of XML (no DTDs and CDATA sections, no entities) but it's
        fast and has proper support for namespaces.
    */
};

SAXParser.prototype.initialize = function(xml, handler) {
    /* initialization

        this method *must* be called directly after initialization,
        and can be used afterwards to re-use the parser object for
        parsing a new stream
    */
    this.xml = xml;
    this.handler = handler;
    this.handler.namespaceToPrefix = {};

    this.starttagreg = /\<([^: \t\n]+:)?([a-zA-Z0-9\-_]+)([^\>]*?)(\/?)\>/m;
    this.endtagreg = /\<\/([^: \t\n]+:)?([a-zA-Z0-9\-_]+)[^\>]*\>/m;
    this.attrstringreg = /(([^:=]+:)?[^=]+=\"[^\"]*\")/m;
    this.attrreg = /([^=]*)=\"([^\"]*)\"/m;

    // this is a bit nasty: we need to record a stack of namespace
    // mappings, each level can override existing namespace ids 
    // so we create a new copy of all existing namespaces first, then
    // we can override prefixes on that level downward, popping when
    // moving up a level
    this._namespace_stack = [];

    this._current_nodename_stack = [];
    this._current_namespace_stack = [];
};

SAXParser.prototype.parse = function() {
    /* parses the XML and generates SAX events */
    var xml = this._removeXMLdeclaration(this.xml);
    this.handler.startDocument();
    while (1) {
        var chunk = this._getNextChunk(xml);
        if (chunk == '') {
            break;
        };
        xml = xml.substr(chunk.length);
        if (chunk.charAt(0) == '<') {
            if (chunk.charAt(1) == '/') {
                // end tag
                this.handleEndTag(chunk);
                this._namespace_stack.pop();
            } else if (chunk.charAt(1) == '!') {
                // XXX note that we don't support DTDs and CDATA yet
                chunk = string.deentitize(chunk);
                if (!chunk.indexOf('-->') == chunk.length - 3) {
                    var more = xml.substr(0, xml.indexOf('-->'));
                    xml = xml.substr(more.length);
                    chunk += more;
                };
                chunk = chunk.substr(4, chunk.length - 7);
                this.handler.comment(chunk);
            } else {
                // start tag
                var singleton = false;
                if (chunk.charAt(chunk.length - 2) == '/') {
                    singleton = true;
                };
                this._pushNamespacesToStack();
                this.handleStartTag(chunk, singleton);
                if (singleton) {
                    this._namespace_stack.pop();
                };
            };
        } else {
            chunk = string.deentitize(chunk);
            this.handler.characters(chunk);
        };
    };
    this.handler.endDocument();
};

SAXParser.prototype.handleStartTag = function(tag, is_singleton) {
    /* parse the starttag and send events */
    
    // parse the tag into chunks
    var match = this.starttagreg.exec(tag);
    if (!match) {
        throw('Broken start tag: ' + tag);
    };
    
    // parse the tagname
    var prefix = match[1];
    var nodename = match[2];
    if (prefix) {
        prefix = prefix.substr(0, prefix.length - 1);
    } else {
        prefix = '';
    };
    
    // first split the attributes and check for namespace declarations
    var attrs = this._splitAttributes(match[3]);
    attrs = this._getAndHandleNamespaceDeclarations(attrs);
    
    // now handle the attributes
    var attributes = {};
    for (var i=0; i < attrs.length; i++) {
        this.handleAttribute(attrs[i], attributes);
    };
    
    var namespace = this._namespace_stack[
                    this._namespace_stack.length - 1
                ][prefix];

    this.handler.startElement(namespace, nodename, attributes);
    if (is_singleton) {
        this.handler.endElement(namespace, nodename);
    } else {
        // store the nodename and namespace for validation on close tag
        this._current_nodename_stack.push(nodename);
        this._current_namespace_stack.push(namespace);
    };
};

SAXParser.prototype.handleEndTag = function(tag) {
    /* handle an end tag */
    var match = this.endtagreg.exec(tag);
    if (!match) {
        throw('Broken end tag: ' + tag);
    };
    var prefix = match[1];
    var nodename = match[2];
    if (prefix) {
        prefix = prefix.substr(0, prefix.length - 1);
    } else {
        prefix = '';
    };
    namespace = this._namespace_stack[
                        this._namespace_stack.length - 1
                    ][prefix];

    // validate, if the name or namespace of the end tag do not match
    // the ones of the start tag, throw an exception
    var current_nodename = this._current_nodename_stack.pop();
    var current_namespace = this._current_namespace_stack.pop();
    if (nodename != current_nodename || 
            namespace != current_namespace) {
        var exc = 'Ending ';
        if (namespace != '') {
            exc += namespace + ':';
        };
        exc += nodename + ' doesn\'t match opening ';
        if (current_namespace != '') {
            exc += current_namespace + ':';
        };
        exc += current_nodename;
        throw(exc); 
    }
    this.handler.endElement(namespace, nodename);
};

SAXParser.prototype.handleAttribute = function(attr, attributemapping) {
    /* parse an attribute */
    var match = this.attrreg.exec(attr);
    if (!match) {
        throw('Broken attribute: ' + attr);
    };
    var prefix = '';
    var name = match[1];
    var lname = match[1];
    var value = string.deentitize(match[2]);
    if (name.indexOf(':') > -1) {
        var tuple = name.split(':');
        prefix = tuple[0];
        lname = tuple[1];
    };
    var namespace = '';
    if (prefix == 'xml') {
        namespace = 'http://www.w3.org/XML/1998/namespace';
        if (!this.handler.namespaceToPrefix[namespace]) {
            this.handler.namespaceToPrefix[namespace] = prefix;
        };
    } else if (prefix != '') {
        namespace = this._namespace_stack[
                            this._namespace_stack.length - 1
                        ][prefix];
    };
    // now place the attr in the mapping
    if (!attributemapping[namespace]) {
        attributemapping[namespace] = {};
    };
    attributemapping[namespace][lname] = value;
};

SAXParser.prototype._removeXMLdeclaration = function(xml) {
    /* removes the xml declaration and/or processing instructions */
    var declreg = /\<\?[^>]*\?\>/g;
    xml = xml.replace(declreg, '');
    return xml;
};

SAXParser.prototype._getNextChunk = function(xml) {
    /* get the next chunk 
    
        up to the opening < of the next tag or the < of the current 
    */
    if (xml.charAt(0) == '<') {
        return xml.substr(0, xml.indexOf('>') + 1);
    } else {
        return xml.substr(0, xml.indexOf('<'));
    };
};

SAXParser.prototype._splitAttributes = function(attrstring) {
    /* split the attributes in the end part of an opening tag */
    var attrs = string.strip(attrstring);
    var attrlist = [];
    while (1) {
        var match = this.attrstringreg.exec(attrstring);
        if (!match) {
            break;
        };
        attrlist.push(string.strip(match[1]));
        attrstring = attrstring.replace(match[0], '');
    };
    return attrlist;
};

SAXParser.prototype._getAndHandleNamespaceDeclarations = function(attrarray) {
    /* get namespace declarations (if any) and handle them */
    var leftover = [];
    for (var i=0; i < attrarray.length; i++) {
        var attr = attrarray[i];
        var match = this.attrreg.exec(attr);
        if (!match) {
            throw('Broken attribute: ' + attr);
        };
        if (match[1].indexOf('xmlns') == -1) {
            leftover.push(attr);
            continue;
        };
        var nsname = match[1];
        var value = string.deentitize(match[2]);
        if (nsname.indexOf(':') > -1) {
            nsname = nsname.split(':')[1];
            this._registerNamespace(value, nsname);
        } else {
            this._registerNamespace(value);
        };
    };
    return leftover;
};

SAXParser.prototype._registerNamespace = function(namespace, prefix) {
    /* maintain a namespace to id mapping */
    if (!prefix) {
        prefix = '';
    };
    if (!this.handler.namespaceToPrefix[namespace]) {
        this.handler.namespaceToPrefix[namespace] = prefix;
    };
    this._namespace_stack[this._namespace_stack.length - 1][prefix] = 
                                                            namespace;
};

SAXParser.prototype._pushNamespacesToStack = function() {
    /* maintains a namespace stack */
    var newnss = {};
    for (var prefix in 
            this._namespace_stack[this._namespace_stack.length - 1]) {
        newnss[prefix] = this._namespace_stack[
                                this._namespace_stack.length - 1
                            ][prefix];
    };
    this._namespace_stack.push(newnss);
};

function SAXHandler() {
    /* base-class and 'interface' for SAX handlers

        serves as documentation and base class so subclasses don't need
        to provide all methods themselves, but doesn't do anything
    */
};

SAXHandler.prototype.startDocument = function() {
    /* is called before the tree is parsed */
};

SAXHandler.prototype.startElement = function(namespaceURI, nodeName, 
                                                attributes) {
    /* is called on encountering a new node

        namespace is the namespace of the node (URI, undefined if the node
        is not in a namespace), nodeName is the localName of the node,
        attributes is a mapping from namespace name to a mapping
        {name: value, ...}
    */
};

SAXHandler.prototype.endElement = function(namespaceURI, nodeName) {
    /* is called on leaving a node 
    
        namespace is the namespace of the node (URI, undefined if the node 
        is not defined inside a namespace), nodeName is the localName of 
        the node
    */
};

SAXHandler.prototype.characters = function(chars) {
    /* is called on encountering a textnode

        chars is the node's nodeValue
    */
};

SAXHandler.prototype.comment = function(comment) {
    /* is called when encountering a comment node

        comment is the node's nodeValue
    */
};

SAXHandler.prototype.endDocument = function() {
    /* is called after all nodes were visited */
};


define("davMinisax", function(){});

/*  dommer.js - a (mostly) compliant subset of DOM level 2 for JS
    (c) Guido Wesdorp 2004-2007
    email johnny@debris.demon.nl

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

    dommer.js

    This library provides a mostly compliant subset of the DOM API in core
    JavaScript. A number of methods aren't implemented, and there are a few
    semantic differences between the standard and this implementations, but
    it provides most of DOM level 2's features and is usable in almost all JS
    environments (also stand-alone ones).

    I started writing this mainly because of IE's lack of proper namespace 
    support, and to have a portable, reliable DOM implementation.

    Non-standard are:

    - Whitespace is never ignored.

    - Because of JS doesn't (by default) allow computing attributes on request,
      this API doesn't create Element.nodeName on setting element.prefix, 
      therefore a new method was added: Element.setPrefix (note that this
      is not required if the library is not used on browsers that don't
      support __defineGetter__ and __defineSetter__ (such as IE)).

    $Id: minisax.js,v 1.5 2004/07/31 00:10:15 johnny Exp $

*/

// If the following switch is set to true, setting Element.prefix
// will result in an exception. This serves to make sure scripts work
// cross-browser: IE does not support __defineSetter__, which is used
// to ensure Element.nodeName is updated if Element.prefix
// is changed (and also to ensure Element.nodeName and 
// Element.localName can't be changed directly). The lack of this
// method on IE means that on that platform it is possible to break
// integrity (by setting .prefix directly, .nodeName will be out-of-date).
// Note that this means that if you intend to use this lib only on Mozilla
// (or other browsers that support dynamic properties), you can safely 
// set this to false and set .prefix without breaking integrity.
var WARN_ON_PREFIX = true;

// give this a namespace...
try {
    var global = window;
} catch(e) {
    var global = this;
};
global.dommer = new function() {
    /* Exceptions */
    function DOMException(errorcode, message) {
        this.code = null;
        this.error = null;
        this.message = message
        for (var attr in DOMException) {
            if (DOMException[attr] == errorcode) {
                this.error = attr;
                break;
            };
        };
        this.code = errorcode;
        if (!this.error) {
            this.error = 'Unknown';
        };
        this.stack = stack = createStack();
        this.lineNumber = getLineNo(stack);
        this.fileName = getFileName(stack);
    };

    this.DOMException = DOMException;

    // error codes
    // XXX should we make these global, like in the specs?
    DOMException.INDEX_SIZE_ERR = 1,
    DOMException.DOMSTRING_SIZE_ERR = 2;
    DOMException.HIERARCHY_REQUEST_ERR = 3;
    DOMException.WRONG_DOCUMENT_ERR = 4;
    DOMException.INVALID_CHARACTER_ERR = 5;
    DOMException.NO_DATA_ALLOWED_ERR = 6;
    DOMException.NO_MODIFICATION_ALLOWED_ERR = 7;
    DOMException.NOT_FOUND_ERR = 8;
    DOMException.NOT_SUPPORTED_ERR = 9;
    DOMException.INUSE_ATTRIBUTE_ERR = 10;
    DOMException.INVALID_STATE_ERR = 11;
    DOMException.SYNTAX_ERR = 12;
    DOMException.INVALID_MODIFICATION_ERR = 13;
    DOMException.NAMESPACE_ERR = 14;
    DOMException.INVALID_ACCESS_ERR = 15;

    DOMException.prototype.toString = function() {
        var ret = 'DOMException: ' + this.error + ' (' + this.code + ')';
        if (this.message) {
            ret += ' - ' + this.message;
        };
        return ret;
    };

    /* Node interface */
    function Node() {
        this.ELEMENT_NODE = 1;
        this.ATTRIBUTE_NODE = 2;
        this.TEXT_NODE = 3;
        this.CDATA_SECTION_NODE = 4;
        this.ENTITY_REFERENCE_NODE = 5;
        this.ENTITY_NODE = 6;
        this.PROCESSING_INSTRUCTION_NODE = 7;
        this.COMMENT_NODE = 8;
        this.DOCUMENT_NODE = 9;
        this.DOCUMENT_TYPE_NODE = 10;
        this.DOCUMENT_FRAGMENT_NODE = 11;
        this.NOTATION_NODE = 12;
        
        // These are defined in-line rather than on .prototype to allow using
        // them below, too. This way we don't have to check whether attributes
        // are already protected while this constructor is ran or not (in JS,
        // when you set 'Foo.prototype = new Bar;', the Bar constructor is
        // actually ran, in our case this means that the state of the 
        // superclass changes).
        this._protectAttribute = function(attr) {
            /* make an attribute read-only */
            this.__defineSetter__(attr,
                function(value) {
                    throw(
                        (new DOMException(
                            DOMException.NO_MODIFICATION_ALLOWED_ERR, attr))
                    );
                }
            );
            this.__defineGetter__(attr,
                function() {
                    return this['_' + attr];
                }
            );
        };

        this._setProtected = function(name, value) {
            /* set a read-only attribute

                THIS IS AN INTERNAL METHOD that should not get used as part 
                of the API
            */
            this['_' + name] = value;
            if (!this.__defineSetter__) {
                this[name] = value;
            };
        };

        this.nodeValue = null;
        if (this.__defineSetter__) {
            // on browsers that support __define[GS]etter__, perform integrity
            // checks
            // nodeValue should be settable on certain nodeTypes
            this.__defineSetter__('nodeValue',
                function(nodeValue) {
                    if (this.nodeType != this.TEXT_NODE &&
                            this.nodeType != this.ATTRIBUTE_NODE && 
                            this.nodeType != this.COMMENT_NODE) {
                        throw(
                            (new DOMException(
                                DOMException.NO_DATA_ALLOWED_ERR,
                                'nodeValue'))
                        );
                    };
                    // XXX should check on allowed chars here, but not 
                    // sure which?
                    this._nodeValue = nodeValue;
                }
            );
            // XXX not sure if we should protect reading .nodeValue
            this.__defineGetter__('nodeValue',
                function() {
                    if (this.nodeType != this.TEXT_NODE &&
                            this.nodeType != this.ATTRIBUTE_NODE &&
                            this.nodeType != this.COMMENT_NODE) {
                        throw(
                            (new DOMException(
                                DOMException.NO_DATA_ALLOWED_ERR,
                                'nodeValue'))
                        );
                    };
                    return this._nodeValue;
                }
            );
            var toprotect = ['nodeType', 'nodeName', 'parentNode', 
                                'childNodes', 'firstChild', 'lastChild', 
                                'previousSibling', 'nextSibling', 
                                'attributes', 'ownerDocument', 'namespaceURI', 
                                'localName'];
            for (var i=0; i < toprotect.length; i++) {
                this._protectAttribute(toprotect[i]);
            };
        };
            
        this._setProtected('namespaceURI', null);
        this._setProtected('prefix', null);
        this._setProtected('nodeName', null);
        this._setProtected('localName', null);
        this._setProtected('parentNode', null);
        // note that this is shared between subclass instances, so should be
        // re-set in every .initialize() (so below is just for show)
        this._setProtected('childNodes', []);
        this._setProtected('firstChild', null);
        this._setProtected('lastChild', null);
        this._setProtected('previousSibling', null);
        this._setProtected('nextSibling', null);
        this._setProtected('ownerDocument', null);
    };

    this.Node = Node;

    var thrownotsupported = function() {throw('not supported');};

    // XXX these should be implemented at some point...
    Node.prototype.normalize = thrownotsupported;
    Node.prototype.isSupported = thrownotsupported; // hehehe...

    // non-standard method, use this always instead of setting .prefix 
    // yourself, as this will update the .nodeName property too
    Node.prototype.setPrefix = function(prefix) {
        if (this.__defineSetter__) {
            this._prefix = prefix;
            this._nodeName = prefix + ':' + this.localName;
        } else {
            this.prefix = prefix;
            this.nodeName = prefix + ':' + this.localName;
        };
    };

    Node.prototype.cloneNode = function() {
        throw(
            (new DOMException(DOMException.NOT_SUPPORTED_ERR))
        );
    };

    Node.prototype.hasChildNodes = function() {
        return (this.childNodes && this.childNodes.length > 0);
    };

    Node.prototype.hasAttributes = function() {
        return (this.attributes !== undefined && this.attributes.length);
    };

    Node.prototype.appendChild = function(newChild) {
        this._checkModificationAllowed();
        this._attach(newChild);
    };

    Node.prototype.removeChild = function(oldChild) {
        this._checkModificationAllowed();
        this._checkIsChild(oldChild);
        var newChildren = new NodeList();
        var found = false;
        for (var i=0; i < this.childNodes.length; i++) {
            if (this.childNodes[i] === oldChild) {
                oldChild._setProtected('parentNode', null);
                var previous = oldChild.previousSibling;
                if (previous) {
                    oldChild._setProtected('previousSibling', null);
                    previous._setProtected('nextSibling', 
                        oldChild.nextSibling);
                };
                var next = oldChild.nextSibling;
                if (next) {
                    next._setProtected('previousSibling', previous);
                    oldChild._setProtected('nextSibling', null);
                };
                continue;
            };
            newChildren.push(this.childNodes[i]);
        };
        this._setProtected('childNodes', newChildren);
        this._setProtected('firstChild', 
                (this.childNodes.length > 0 ? this.childNodes[0] : null));
        this._setProtected('lastChild', (
                this.childNodes.length > 0 ? 
                    this.childNodes[this.childNodes.length - 1] : null));
    };

    Node.prototype.replaceChild = function(newChild, refChild) {
        this._checkModificationAllowed();
        this._checkIsChild(refChild);
        this._attach(newChild, refChild, true);
    };

    Node.prototype.insertBefore = function(newChild, refChild) {
        this._checkModificationAllowed();
        this._checkIsChild(refChild);
        this._attach(newChild, refChild);
    };

    Node.prototype._attach = function(newChild, refChild, replace) {
        // see if the child is in the same document
        if (newChild.ownerDocument != this.ownerDocument) {
            throw(
                (new DOMException(DOMException.WRONG_DOCUMENT_ERR))
            );
        };
        // see if the child is of an allowed type
        if (newChild.nodeType != newChild.ELEMENT_NODE && 
                newChild.nodeType != newChild.TEXT_NODE &&
                newChild.nodeType != newChild.CDATA_SECTION_NODE &&
                newChild.nodeType != newChild.COMMENT_NODE) {
            throw(
                (new DOMException(DOMException.HIERARCHY_REQUEST_ERR))
            );
        };
        // see if the child isn't a (grand)parent of ourselves
        var currparent = this;
        while (currparent && currparent.nodeType != newChild.DOCUMENT_NODE) {
            if (currparent === newChild) {
                throw(
                    (new DOMException(DOMException.HIERARCHY_REQUEST_ERR))
                );
            };
            currparent = currparent.parentNode;
        };
        // seems to be okay, add it
        newChild._setProtected('parentNode', this);
        if (!refChild) {
            if (this.childNodes.length) {
                this.childNodes[this.childNodes.length - 1]._setProtected(
                    'nextSibling', newChild);
                newChild._setProtected('previousSibling',
                    this.childNodes[this.childNodes.length - 1]);
            };
            this.childNodes.push(newChild);
        } else {
            var newchildren = [];
            var found = false;
            for (var i=0; i < this.childNodes.length; i++) {
                var currChild = this.childNodes[i];
                if (currChild === refChild) {
                    newchildren.push(newChild);
                    var previous = this.childNodes[i - 1];
                    if (previous) {
                        newChild._setProtected('previousSibling', previous);
                        previous._setProtected('nextSibling', newChild);
                    };
                    if (!replace) {
                        newchildren.push(currChild);
                        currChild._setProtected('previousSibling', newChild);
                        newChild._setProtected('nextSibling', currChild);
                    } else {
                        currChild._setProtected('parentNode', null);
                        currChild._setProtected('previousSibling', null);
                        currChild._setProtected('nextSibling', null);
                        var next = this.childNodes[i + 1];
                        newChild._setProtected('nextSibling', next);
                        next._setProtected('previousSibling', newChild);
                    };
                    found = true;
                } else {
                    newchildren.push(currChild);
                };
            };
            if (!found) {
                throw(
                    (new DOMException(DOMException.NOT_FOUND_ERR))
                );
            };
            this._setProtected('childNodes', newchildren);
        };
        this._setProtected('firstChild', this.childNodes[0]);
        this._setProtected('lastChild', 
            this.childNodes[this.childNodes.length - 1]);
    };

    Node.prototype._checkModificationAllowed = function() {
        if (this.nodeType != this.ELEMENT_NODE &&
                this.nodeType != this.DOCUMENT_NODE &&
                this.nodeType != this.DOCUMENT_FRAGMENT_NODE) {
            throw(
                (new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR))
            );
        };
    };

    Node.prototype._checkIsChild = function(refChild) {
        if (refChild.parentNode !== this) {
            throw(
                (new DOMException(DOMException.NOT_FOUND_ERR))
            );
        };
    };

    function DocumentFragment() {
        this._setProtected('nodeType', 11);
    };

    DocumentFragment.prototype = new Node;
    this.DocumentFragment = DocumentFragment;

    function Element() {
        this._setProtected('nodeType', 1);
    };

    Element.prototype = new Node;
    this.Element = Element;

    Element.prototype.initialize = function(namespaceURI, qname, 
                                                    ownerDocument) {
        // XXX the specs are very vague about an id, it says the DOM 
        // implementation must have info about which attributes are of the id 
        // type, I'll just use the property here for now...
        this.id = ''; // empty string like in Mozilla, seems weird to me though

        this._setProtected('attributes', []);
        this._setProtected('childNodes', []);
        this._setProtected('ownerDocument', ownerDocument);

        // try to ensure integrity by defining getters and setters for certain
        // properties, since this only works in certain browsers it makes sense to 
        // test your applications on one of those platforms, see also 
        // WARN_ON_PREFIX in the top of the document
        if (this.__defineSetter__) {
            this._nodeName = this.nodeName;
            this.__defineSetter__('nodeName', function() {
                            throw(
                                (new DOMException(
                                    DOMException.NO_MODIFICATION_ALLOWED_ERR)))
                            });
            this.__defineGetter__('nodeName', 
                                    function() {return this._nodeName});
            this.__defineSetter__('prefix', 
                                function(value) {
                                    if (WARN_ON_PREFIX) {
                                        throw('Setting prefix directly ' +
                                                'breaks integrity of the ' +
                                                'XML DOM in Internet ' +
                                                'Explorer browsers!');
                                    };
                                    this._prefix = value;
                                    this._nodeName = this._prefix + 
                                                        this._localName;
                                });
            this.__defineGetter__('prefix', function() {return this._prefix});
        };
        // XXX both the ns and qname need integrity checks
        this._setProtected('namespaceURI', namespaceURI);
        if (qname.indexOf(':') > -1) {
            var tup = qname.split(':');
            this.setPrefix(tup.shift());
            this._setProtected('localName', tup.join(':'));
        } else {
            this.setPrefix(null);
            this._setProtected('localName', qname);
        };
        if (this.prefix) {
            this._setProtected('nodeName', this.prefix + ':' + this.localName);
        } else {
            this._setProtected('nodeName', this.localName);
        };
    };

    Element.prototype.toString = function() {
        return '<Element "' + this.nodeName + '" (type ' + 
                    this.nodeType + ')>';
    };

    Element.prototype.toXML = function(context) {
        // context is used when toXML is called recursively
        // marker
        var no_prefix_id = '::no_prefix::';
        if (!context) {
            context = {
                namespace_stack: []
            };
        };
        var new_namespaces = {}; // any namespaces that weren't declared yet
        var current_namespaces = {};
        var last_namespaces = context.namespace_stack[
                                    context.namespace_stack.length - 1];
        context.namespace_stack.push(current_namespaces);
        if (last_namespaces) {
            for (var prefix in last_namespaces) {
                current_namespaces[prefix] = last_namespaces[prefix];
            };
        };
        var xml = '<' + this.nodeName;
        var prefix = this.prefix || no_prefix_id;
        if (this.namespaceURI && 
                (current_namespaces[prefix] != this.namespaceURI)) {
            current_namespaces[prefix] = this.namespaceURI;
            new_namespaces[prefix] = this.namespaceURI;
        };
        for (var i=0; i < this.attributes.length; i++) {
            var attr = this.attributes[i];
            var aprefix = attr.prefix || no_prefix_id;
            if (attr.namespaceURI &&
                    current_namespaces[aprefix] != attr.namespaceURI) {
                current_namespaces[aprefix] = attr.namespaceURI;
                new_namespaces[aprefix] = attr.namespaceURI;
            };
            xml += ' ' + attr.nodeName + '="' + 
                    string.entitize(attr.nodeValue) + '"';
        };

        // take care of any new namespaces
        for (var prefix in new_namespaces) {
            xml += ' xmlns';
            if (prefix != no_prefix_id) {
                xml += ':' + prefix;
            };
            xml += '="' + string.entitize(new_namespaces[prefix]) + '"';
        };
        
        if (this.childNodes.length) {
            xml += '>';
            for (var i=0; i < this.childNodes.length; i++) {
                xml += this.childNodes[i].toXML(context);
            };
            xml += '</' + this.nodeName + '>';
        } else {
            xml += ' />';
        };
        context.namespace_stack.pop();
        return xml;
    };

    Element.prototype.cloneNode = function(deep) {
        var el = new Element();
        el.initialize(this.namespaceURI, this.nodeName, this.ownerDocument);
        for (var i=0; i < this.attributes.length; i++) {
            var clone = this.attributes[i].cloneNode();
            clone._setProtected('ownerElement', el);
            el.attributes.push(clone);
        };
        if (deep) {
            for (var i=0; i < this.childNodes.length; i++) {
                var clone = this.childNodes[i].cloneNode(true);
                clone._setProtected('parentNode', el);
                el.appendChild(clone);
            };
        };
        return el;
    };

    Element.prototype.getAttributeNodeNS = function(namespaceURI, qname) {
        for (var i=0; i < this.attributes.length; i++) {
            var attr = this.attributes[i];
            if (attr.namespaceURI == namespaceURI && attr.nodeName == qname) {
                return attr;
            };
        };
    };

    Element.prototype.getAttributeNode = function(name) {
        return this.getAttributeNodeNS(undefined, name);
    };

    Element.prototype.getAttribute = function(name) {
        var attr = this.getAttributeNode(name)
        return (attr ? attr.nodeValue : null);
    };

    Element.prototype.getAttributeNS = function(namespaceURI, name) {
        var attr = this.getAttributeNodeNS(namespaceURI, name);
        return (attr ? attr.nodeValue : null);
    };

    Element.prototype.hasAttributeNS = function(namespaceURI, name) {
        return !!(this.getAttributeNS(namespaceURI, name));
    };

    Element.prototype.hasAttribute = function(name) {
        return this.hasAttributeNS(this.namespaceURI, name);
    };

    Element.prototype.setAttributeNS = function(namespaceURI, name, value) {
        for (var i=0; i < this.attributes.length; i++) {
            var attr = this.attributes[i];
            if (attr.namespaceURI == namespaceURI && attr.nodeName == name) {
                attr.nodeValue = value;
                return;
            };
        };
        var attr = new Attribute();
        attr.initialize(namespaceURI, name, value, this.ownerDocument);
        attr._setProtected('ownerElement', this);
        this.attributes.push(attr);
    };

    Element.prototype.setAttribute = function(name, value) {
        this.setAttributeNS(undefined, name, value);
    };

    Element.prototype.setAttributeNodeNS = function(newAttr) {
        for (var i=0; i < this.attributes.length; i++) {
            var attr = this.attributes[i];
            if (attr.namespaceURI == newAttr.namespaceURI && 
                    attr.nodeName == newAttr.nodeName) {
                throw(
                    (new DOMException(DOMException.INUSE_ATTRIBUTE_ERR))
                );
            };
        };
        this.attributes.push(newAttr);
    };

    Element.prototype.setAttributeNode = function(newAttr) {
        // XXX should this fail if no namespaceURI is available or something?
        this.setAttributeNodeNS(newAttr);
    };

    Element.prototype.removeAttributeNS = function(namespaceURI, name) {
        for (var i=0; i < this.attributes.length; i++) {
            var attr = this.attributes[i];
            if (attr.namespaceURI == namespaceURI && attr.nodeName == name) {
                delete this.attributes[i];
                return true;
            };
        };
        return false;
    };

    Element.prototype.removeAttribute = function(name) {
        return this.removeAttributeNS(this.namespaceURI, name);
    };

    Element.prototype.getElementsByTagNameNS = function(namespaceURI, 
                                                                name, ret) {
        // XXX *very* slow!!!
        // needs to be optimized later on (probably by using some mapping)
        if (!ret) {
            ret = [];
        };
        for (var i=0; i < this.childNodes.length; i++) {
            var child = this.childNodes[i];
            if (name == child.nodeName || name == '*') {
                if ((!namespaceURI && !child.namespaceURI) || 
                        (namespaceURI == child.namespaceURI)) {
                    ret.push(child);
                };
            };
            if (child.nodeType == 1) {
                child.getElementsByTagNameNS(namespaceURI, name, ret);
            };
        };
        return ret;
    };

    Element.prototype.getElementsByTagName = function(name) {
        return this.getElementsByTagNameNS(this.namespaceURI, name);
    };

    Element.prototype.getElementById = function(id) {
        // XXX *very* slow!!!
        // needs to be optimized later on (probably by using some mapping)
        if (this.id == id) {
            return this;
        };
        for (var i=0; i < this.childNodes.length; i++) {
            var child = this.childNodes[i];
            if (child.id == id) {
                return child;
            };
            if (child.nodeType == 1) {
                var found = this.childNodes[i].getElementById(id);
                if (found) {
                    return found;
                };
            };
        };
    };

    function TextNode() {
        this._setProtected('nodeType', 3);
        this._setProtected('nodeName', '#text');
    };

    TextNode.prototype = new Node;
    this.TextNode = TextNode;

    TextNode.prototype.initialize = function(data, ownerDocument) {
        this._setProtected('ownerDocument', ownerDocument);
        this._setProtected('childNodes', new NodeList());
        // nodeValue is not protected
        this.nodeValue = data;
    };

    TextNode.prototype.toXML = function() {
        return string.entitize(this.nodeValue);
    };

    TextNode.prototype.cloneNode = function() {
        var node = new TextNode();
        node.initialize(this.nodeValue, this.ownerDocument);
        return node;
    };

    function CommentNode() {
        /* a comment node */
        this._setProtected('nodeType', 8);
        this._setProtected('nodeName', '#comment');
    };

    CommentNode.prototype = new TextNode;
    this.CommentNode = CommentNode;

    CommentNode.prototype.initialize = function(data, ownerDocument) {
        this._setProtected('ownerDocument', ownerDocument);
        this._setProtected('childNodes', []);
        this._setProtected('nodeValue', data);
    };

    CommentNode.prototype.toXML = function() {
        return "<!--" + this.nodeValue + "-->";
    };

    // Attribute, subclass of TextNode because of the nice implementation
    function Attribute() {
        /* an attribute node */
        this._setProtected('nodeType', 2);
    };

    Attribute.prototype = new Node;
    this.Attribute = Attribute;

    Attribute.prototype.initialize = function(namespaceURI, qname, value,
                                                    ownerDocument) {
        // XXX some code duplication here...
        if (qname.match(/[^a-zA-Z0-9_\-:]/g)) {
            throw(
                (new DOMException(DOMException.INVALID_CHARACTER_ERR))
            );
        };
        this._setProtected('ownerDocument', ownerDocument);
        this._setProtected('namespaceURI', namespaceURI);
        this._setProtected('nodeValue', value);
        this._setProtected('childNodes', []);

        // try to ensure integrity by defining getters and setters for certain
        // properties, since this only works in certain browsers it makes sense to 
        // test your applications on one of those platforms, see also 
        // WARN_ON_PREFIX in the top of the document
        if (this.__defineSetter__) {
            this._nodeName = this.nodeName;
            this.__defineSetter__('nodeName', function() {
                            throw(
                                (new DOMException(
                                    DOMException.NO_MODIFICATION_ALLOWED_ERR)))
                            });
            this.__defineGetter__('nodeName', 
                                    function() {return this._nodeName});
            this.__defineSetter__('prefix', 
                                function(value) {
                                    if (WARN_ON_PREFIX) {
                                        throw('Setting prefix directly ' +
                                                'breaks integrity of the ' +
                                                'XML DOM in Internet ' +
                                                'Explorer browsers!');
                                    };
                                    this._prefix = value;
                                    this._nodeName = this._prefix + 
                                                        this._localName;
                                });
            this.__defineGetter__('prefix', function() {return this._prefix});
            this._protectAttribute('ownerElement');
        };
        this._setProtected('ownerElement', null);
        if (qname.indexOf(':') > -1) {
            var tup = qname.split(':');
            this.setPrefix(tup.shift());
            this._setProtected('localName', tup.join(':'));
        } else {
            this.setPrefix(null);
            this._setProtected('localName', qname);
        };
        if (this.prefix) {
            this._setProtected('nodeName', this.prefix + ':' + this.localName);
        } else {
            this._setProtected('nodeName', this.localName);
        };
    };

    Attribute.prototype.toXML = function() {
        ret = this.nodeName + '="' + string.entitize(this.nodeValue) + '"';
        return ret;
    };

    Attribute.prototype.cloneNode = function() {
        var attr = new Attribute();
        attr.initialize(this.namespaceURI, this.nodeName, this.nodeValue, 
                        this.ownerDocument);
        return attr;
    };

    Attribute.prototype.toString = function() {
        return this.nodeValue;
    };

    function Document() {
        /* the document node */
        this._setProtected('nodeType', 9);
        this._setProtected('nodeName', '#document');
    };

    Document.prototype = new Node;
    this.Document = Document;

    Document.prototype.initialize = function() {
        this._setProtected('ownerDocument', this);
        this._setProtected('childNodes', []);
        this.documentElement = null;
        this.namespaceToPrefix = {};
    };

    Document.prototype.toXML = function() {
        return this.documentElement.toXML();
    };

    Document.prototype.appendChild = function(newChild) {
        if (this.documentElement) {
            throw(
                (new DOMException(DOMException.HIERARCHY_REQUEST_ERR,
                    'document already has a document element'))
            );
        };
        this._checkModificationAllowed();
        this._attach(newChild);
        this.documentElement = newChild;
    };


    Document.prototype.createElement = function(nodeName) {
        return this.createElementNS(this.namespaceURI, nodeName);
    };

    Document.prototype.createElementNS = function(namespaceURI, nodeName) {
        var el = new Element();
        el.initialize(namespaceURI, nodeName, this);
        return el;
    };

    Document.prototype.createTextNode = function(data) {
        var el = new TextNode();
        el.initialize(string.deentitize(data), this);
        return el;
    };

    Document.prototype.createAttributeNS = function(namespaceURI, nodeName) {
        var el = new Attribute();
        el.initialize(namespaceURI, nodeName, null, this);
        return el;
    };

    Document.prototype.createAttribute = function(nodeName) {
        return this.createAttributeNS(undefined, nodeName);
    };

    Document.prototype.createComment = function(data) {
        var el = new CommentNode();
        el.initialize(data, this);
        return el;
    };

    Document.prototype.importNode = function(node) {
        node._setProtected('ownerDocument', this);
    };

    function DOMHandler() {
        /* SAX handler to convert a piece of XML to a DOM */
    };

    this.DOMHandler = DOMHandler;

    DOMHandler.prototype.startDocument = function() {
        this.document = new Document();
        this.document.initialize();
        this.current = null;
        this.namespaces = new Array();
        this.namespaceToPrefix = {};
    };

    DOMHandler.prototype.startElement = function(namespaceURI, nodename, 
                                                        attrs) {
        if (namespaceURI && !array.contains(this.namespaces, namespaceURI)) {
            this.namespaces.push(namespaceURI);
            // update the mapping on the document just to be sure,
            // that one and the one on this handler should always be in 
            // sync if a start tag is encountered, since instantiating a 
            // Element will set the prefix on that element
            // XXX ??
            this.document.namespaceToPrefix = this.namespaceToPrefix;
        };
        var node = this.document.createElementNS(namespaceURI, nodename);
        var prefix = undefined;
        if (namespaceURI) {
            prefix = this.namespaceToPrefix[namespaceURI];
            if (prefix) {
                node.setPrefix(prefix);
            };
        };
        for (var ans in attrs) {
            // XXX can be optimized by using a dict and just setting the key
            if (ans && ans != '' && !array.contains(this.namespaces, ans)) {
                this.namespaces.push(ans);
            };
            var nsattrs = attrs[ans];
            for (var aname in nsattrs) {
                if (aname == 'prefix') {
                    continue;
                };
                if (ans) {
                    var attr = this.document.createAttributeNS(ans, aname);
                    attr.setPrefix(this.namespaceToPrefix[ans]);
                    attr.nodeValue = nsattrs[aname];
                    node.setAttributeNodeNS(attr);
                } else {
                    var attr = this.document.createAttribute(aname);
                    attr.nodeValue = nsattrs[aname];
                    node.setAttributeNode(attr);
                };
            };
        };
        if (!this.current) {
            this.document.documentElement = node;
            this.document._setProtected('childNodes', [node]);
            this.current = node;
            this.current._setProtected('parentNode', this.document);
            this.current._setProtected('ownerDocument', this.document);
        } else {
            this.current.appendChild(node);
            this.current = node;
        };
    };

    DOMHandler.prototype.characters = function(data) {
        if (!this.current && string.strip(data) == '') {
            return;
        };
        var node = this.document.createTextNode(data);
        this.current.appendChild(node);
    };

    DOMHandler.prototype.comment = function(data) {
        if (!this.current && string.strip(data) == '') {
            return;
        };
        var node = this.document.createComment(data);
        if (this.current) {
            this.current.appendChild(node);
        } else {
            this.document.comment = node;
        };
    };

    DOMHandler.prototype.endElement = function(namespaceURI, nodename) {
        var prefix = this.namespaceToPrefix[namespaceURI];
        if (nodename != this.current.localName || 
                namespaceURI != this.current.namespaceURI) {
            throw('non-matching end tag ' + namespaceURI + ':' + 
                    prefix + ':' + nodename + ' for start tag ' + 
                    this.current.namespaceURI + ':' + this.current.nodeName);
        };
        this.current = this.current.parentNode;
    };

    DOMHandler.prototype.endDocument = function() {
    };

    function DOM() {
        /* The DOM API 

            Uses regular expressions to convert <xml> to a simple DOM
        
            Provides:

                DOM.parseXML(xml)
                - parse the XML, return a document element

                DOM.createDocument()
                - contains the document node of the DOM (which in turn contains
                    the documentElement)

                DOM.toXML()
                - returns a serialized XML string

                DOM.buildFromHandler(handler)
                - build and return a DOM document built from a MiniSAX handler
        */
    };

    this.DOM = DOM;

    DOM.prototype.createDocument = function() {
        var document = new Document();
        document.initialize();
        return document;
    };

    DOM.prototype.toXML = function(docOrEl, encoding) {
        /* serialize to XML */
        var xml = '<?xml version="1.0"';
        if (encoding) {
            xml += ' encoding="' + encoding + '"';
        };
        xml += '?>\n';
        return xml + docOrEl.toXML();
    };

    DOM.prototype.parseXML = function(xml) {
        /* parse XML into a DOM 
        
            returns a Document node
        */
        var handler = new DOMHandler();
        var parser = new SAXParser();
        parser.initialize(xml, handler);
        parser.parse();
        var document = handler.document;
        this._copyNamespaceMapping(document, handler.namespaceToPrefix);
        return document;
    };

    DOM.prototype.buildFromHandler = function(handler) {
        /* create a DOM from a SAX handler */
        var document = handler.document;
        this._copyNamespaceMapping(document, handler.namespaceToPrefix);
        return document;
    };

    DOM.prototype._copyNamespaceMapping = function(document, namespaces) {
        document.namespaceToPrefix = namespaces;
    };

    // an implementation of an array, exactly the same as the one in JS 
    // (although incomplete) itself, this because friggin' IE has problems 
    // using Array as prototype (it won't update .length on mutations)
    function BaseArray() {
        for (var i=0; i < arguments.length; i++) {
            this[i] = arguments[i];
        };
        this.length = arguments.length;
    };

    BaseArray.prototype.concat = function() {
        throw('Not supported');
    };

    BaseArray.prototype.join = function() {
        throw('Not supported');
    };

    BaseArray.prototype.pop = function() {
        var item = this[this.length - 1];
        delete this[this.length - 1];
        this.length = this.length - 1;
        return item;
    };

    BaseArray.prototype.push = function(item) {
        this[this.length] = item;
        this.length = this.length + 1;
        return item;
    };

    BaseArray.prototype.reverse = function() {
        throw('Not supported');
    };

    BaseArray.prototype.shift = function() {
        var item = this[0];
        for (var i=1; i < this.length; i++) {
            this[i-1] = this[i];
        };
        delete this[length - 1];
        this.length = this.length - 1;
        return item;
    };

    BaseArray.prototype.unshift = function(item) {
        for (var i=0; i < this.length; i++ ) {
            this[this.length - i] = this[(this.length - i) - 1];
        };
        this[0] = item;
        this.length = this.length + 1;
        return ;
    };

    BaseArray.prototype.splice = function() {
        // XXX we may want to support this later
        throw('Not supported');
    };

    BaseArray.prototype.toString = function() {
        var ret = [];
        for (var i=1; i < this.length; i++) {
            ret.push(this[i].toString());
        };
        return ret.join(', ');
    };

    // for subclassing and such...
    this.BaseArray = BaseArray;

    function NodeList() {
    };

    NodeList.prototype = new BaseArray;
    this.NodeList = NodeList;

    NodeList.prototype.item = function(index) {
        return this[index];
    };

    function NamedNodeMap() {
    };

    NamedNodeMap.prototype = new BaseArray;
    this.NamedNodeMap = NamedNodeMap;

    NamedNodeMap.prototype.item = function(index) {
        return this[index];
    };

    NamedNodeMap.prototype.getNamedItem = function(name) {
        for (var i=0; i < this.length; i++) {
            if (this[i].nodeName == name) {
                return this[i];
            };
        };
        return undefined;
    };

    NamedNodeMap.prototype.setNamedItem = function(arg) {
        // this should generate exceptions, but I'm not sure when...
        // XXX how 'bout when arg is not the proper type?!?
        for (var i=0; i < this.length; i++) {
            if (this[i].nodeName == arg.nodeName) {
                this[i] = arg;
                return;
            };
        };
        this.push(arg);
    };

    NamedNodeMap.prototype.removeNamedItem = function(name) {
        // a bit nasty: deleting an element from an array will not actually 
        // free the index, instead something like undefined or null will end 
        // up in its place, so we walk the array here, move every element 
        // behind the item to remove one up, and pop the last item when 
        // we're done
        var delete_mode = false;
        for (var i=0; i < this.length; i++) {
            if (this[i] === name) {
                delete_mode = true;
            };
            if (delete_mode) {
                this[i] = this[i + 1];
            };
        };
        if (!delete_mode) {
            throw(
                (new DOMException(DOMException.NOT_FOUND_ERR))
            );
        };
        // the last element is now in the array twice
        this.pop();
    };
}();

// XXX shouldn't we make these local?
function createStack() {
    // somewhat nasty trick to get a stack trace in Moz
    var stack = undefined;
    try {notdefined()} catch(e) {stack = e.stack};
    if (stack) {
        stack = stack.split('\n');
        stack.shift();
        stack.shift();
    };
    return stack ? stack.join('\n') : '';
};

function getLineNo(stack) {
    /* tries to get the line no in Moz */
    if (!stack) {
        return;
    };
    stack = stack.toString().split('\n');
    var chunks = stack[0].split(':');
    var lineno = chunks[chunks.length - 1];
    if (lineno != '0') {
        return lineno;
    };
};

function getFileName(stack) {
    /* tries to get the filename in Moz */
    if (!stack) {
        return;
    };
    stack = stack.toString().split('\n');
    var chunks = stack[0].split(':');
    var filename = chunks[chunks.length - 2];
    return filename;
};


define("davDommer", function(){});

/*
    davclient.js - Low-level JavaScript WebDAV client implementation
    Copyright (C) 2004-2007 Guido Wesdorp
    email johnny@johnnydebris.net

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

*/

var global = this;
// create a namespace for our stuff... notice how we define a class and create
// an instance at the same time
global.davlib = new function() {
    /* WebDAV for JavaScript
    
        This is a library containing a low-level and (if loaded, see 
        'davfs.js') a high-level API for working with WebDAV capable servers
        from JavaScript. 

        Quick example of the low-level interface:

          var client = new davlib.DavClient();
          client.initialize();

          function alertContent(status, statusstring, content) {
            if (status != 200) {
              alert('error: ' + statusstring);
              return;
            };
            alert('content received: ' + content);
          };
          
          client.GET('/foo/bar.txt', alertContent);

        Quick example of the high-level interface:

          var fs = new davlib.DavFS();
          fs.initialize();

          function alertContent(error, content) {
            if (error) {
              alert('error: ' + error);
              return;
            };
            alert('content: ' + content);
          };

          fs.read('/foo/bar.txt', alertContent);

        (Note that since we only read a simple file here, changes between the
        high- and low-level APIs are very small.)

        For more examples and information, see the DavClient and DavFS 
        constructors, and the README.txt file and the tests in the package. 
        For references of single methods, see the comments in the code (sorry 
        folks, but keeping code and documents up-to-date is really a nuisance 
        and I'd like to avoid that until things are stable enough).

    */
    var davlib = this;

    this.DEBUG = 0;

    this.STATUS_CODES = {
        '100': 'Continue',
        '101': 'Switching Protocols',
        '102': 'Processing',
        '200': 'OK',
        '201': 'Created',
        '202': 'Accepted',
        '203': 'None-Authoritive Information',
        '204': 'No Content',
        // seems that there's some bug in IE (or Sarissa?) that 
        // makes it spew out '1223' status codes when '204' is
        // received... needs some investigation later on
        '1223': 'No Content',
        '205': 'Reset Content',
        '206': 'Partial Content',
        '207': 'Multi-Status',
        '300': 'Multiple Choices',
        '301': 'Moved Permanently',
        '302': 'Found',
        '303': 'See Other',
        '304': 'Not Modified',
        '305': 'Use Proxy',
        '307': 'Redirect',
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '402': 'Payment Required',
        '403': 'Forbidden',
        '404': 'Not Found',
        '405': 'Method Not Allowed',
        '406': 'Not Acceptable',
        '407': 'Proxy Authentication Required',
        '408': 'Request Time-out',
        '409': 'Conflict',
        '410': 'Gone',
        '411': 'Length Required',
        '412': 'Precondition Failed',
        '413': 'Request Entity Too Large',
        '414': 'Request-URI Too Large',
        '415': 'Unsupported Media Type',
        '416': 'Requested range not satisfiable',
        '417': 'Expectation Failed',
        '422': 'Unprocessable Entity',
        '423': 'Locked',
        '424': 'Failed Dependency',
        '500': 'Internal Server Error',
        '501': 'Not Implemented',
        '502': 'Bad Gateway',
        '503': 'Service Unavailable',
        '504': 'Gateway Time-out',
        '505': 'HTTP Version not supported',
        '507': 'Insufficient Storage'
        //'0'  : 'Unknown Error'
    };

    this.DavClient = function() {
        /* Low level (subset of) WebDAV client implementation 
        
            Basically what one would expect from a basic DAV client, it
            provides a method for every HTTP method used in basic DAV, it
            parses PROPFIND requests to handy JS structures and accepts 
            similar structures for PROPPATCH.
            
            Requests are handled asynchronously, so instead of waiting until
            the response is sent back from the server and returning the
            value directly, a handler is registered that is called when
            the response is available and the method that sent the request
            is ended. For that reason all request methods accept a 'handler'
            argument, which will be called (with 3 arguments: statuscode,
            statusstring and content (the latter only where appropriate))
            when the request is handled by the browser.
            The reason for this choice is that Mozilla sometimes freezes
            when using XMLHttpRequest for synchronous requests.

            The only 'public' methods on the class are the 'initialize'
            method, that needs to be called first thing after instantiating
            a DavClient object, and the methods that have a name similar to
            an HTTP method (GET, PUT, etc.). The latter all get at least a
            'path' argument, a 'handler' argument and a 'context' argument:

                'path' - an absolute path to the target resource
                'handler' - a function or method that will be called once
                        the request has finished (see below)
                'context' - the context used to call the handler, the
                        'this' variable inside methods, so usually the
                        object (instance) the handler is bound to (ignore 
                        when the handler is a function)

            All handlers are called with the same 3 arguments:
            
                'status' - the HTTP status code
                'statusstring' - a string representation (see STATUS_CODES
                        array above) of the status code
                'content' - can be a number of different things:
                        * when there was an error in a method that targets
                            a single resource, this contains the error body
                        * when there was an error in a method that targets
                            a set of resources (multi-status) it contains
                            a Root object instance (see below) that contains
                            the error messages of all the objects
                        * if the method was GET and there was no error, it
                            will contain the contents of the resource
                        * if the method was PROPFIND and there was no error,
                            it will contain a Root object (see below) that
                            contains the properties of all the resources
                            targeted
                        * if there was no error and there is no content to
                            return, it will contain null
                'headers' - a mapping (associative array) from lowercase header
                            name to value (string)

            Basic usage example:

                function handler(status, statusstring, content, headers) {
                    if (content) {
                        if (status != '200' && status != '204') {
                            if (status == '207') {
                                alert('not going to show multi-status ' +
                                        here...');
                            };
                            alert('Error: ' + statusstring);
                        } else {
                            alert('Content: ' + content);
                        };
                    };
                };

                var dc = new DavClient();
                dc.initialize('localhost');

                // create a directory
                dc.MKCOL('/foo', handler);

                // create a file and save some contents
                dc.PUT('/foo/bar.txt', 'baz?', handler);

                // load and alert it (alert happens in the handler)
                dc.GET('/foo/bar.txt', handler);

                // lock the file, we need to store the lock token from 
                // the result
                function lockhandler(status, statusstring, content, headers) {
                    if (status != '200') {
                        alert('Error unlocking: ' + statusstring);
                    } else {
                        window.CURRENT_LOCKTOKEN = headers.locktoken;
                    };
                };
                dc.LOCK('/foo/bar.txt', 'http://johnnydebris.net/', 
                            lockhandler);

                // run the following bit only if the lock was set properly
                if (window.CURRENT_LOCKTOKEN) {
                    // try to delete it: this will fail
                    dc.DELETE('/foo/bar.txt', handler);
                    
                    // now unlock it using the lock token stored above
                    dc.UNLOCK('/foo/bar.txt', window.CURRENT_LOCKTOKEN,
                              handler);
                };

                // delete the dir
                dc.DELETE('/foo', handler);

            For detailed information about the HTTP methods and how they
            can/should be used in a DAV context, see http://www.webdav.org.

            This library depends on version 0.3 of the 'dommer' package
            and version 0.2 of the 'minisax.js' package, both of which
            should be available from http://johnnydebris.net under the
            same license as this one (GPL).

            If you have questions, bug reports, or patches, please send an 
            email to johnny@johnnydebris.net.
        */
    };

    this.DavClient.prototype.initialize = function(host, port, protocol) {
        /* the 'constructor' (needs to be called explicitly!!) 
        
            host - the host name or IP
            port - HTTP port of the host (optional, defaults to 80)
            protocol - protocol part of URLs (optional, defaults to http)
        */
        this.host = host || location.hostname;
        this.port = port || location.port || 80;
        this.protocol = (protocol || 
                         location.protocol.substr(0, 
                                                  location.protocol.length - 1
                                                  ) ||
                         'http');
        this.request = null;
    };

    this.DavClient.prototype.OPTIONS = function(path, handler, context) {
        /* perform an OPTIONS request

            find out which HTTP methods are understood by the server
        */
        // XXX how does this work with * paths?
        var request = this._getRequest('OPTIONS', path, handler, context);
        request.send('');
    };

    this.DavClient.prototype.GET = function(path, handler, context) {
        /* perform a GET request 
        
            retrieve the contents of a resource
        */
        var request = this._getRequest('GET', path, handler, context);
        request.send('');
    };

    this.DavClient.prototype.PUT = function(path, content, handler, 
                                            context, locktoken) {
        /* perform a PUT request 
        
            save the contents of a resource to the server

            'content' - the contents of the resource
        */
        var request = this._getRequest('PUT', path, handler, context);
        //request.overrideMimeType('text/plain; charset=x-user-defined');
        //request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        //request.setRequestHeader("Expect","100-continue");
        //request.setRequestHeader("Content-type", "text/xml,charset=UTF-8");
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        }
        request.send(content);
    };

    this.DavClient.prototype.DELETE = function(path, handler, 
                                               context, locktoken) {
        /* perform a DELETE request 
        
            remove a resource (recursively)
        */
        var request = this._getRequest('DELETE', path, handler, context);
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        //request.setRequestHeader("Depth", "Infinity");
        request.send('');
    };

    this.DavClient.prototype.MKCOL = function(path, handler, 
                                              context, locktoken) {
        /* perform a MKCOL request

            create a collection
        */
        var request = this._getRequest('MKCOL', path, handler, context);
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        request.send('');
    };

    this.DavClient.prototype.COPY = function(path, topath, handler, 
                                             context, overwrite, locktoken) {
        /* perform a COPY request

            create a copy of a resource

            'topath' - the path to copy the resource to
            'overwrite' - whether or not to fail when the resource 
                    already exists (optional)
        */
        var request = this._getRequest('COPY', path, handler, context);
        var tourl =  this._generateUrl(topath);
        request.setRequestHeader("Destination", tourl);
        if (overwrite) {
            request.setRequestHeader("Overwrite", "F");
        };
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        request.send('');
    };

    this.DavClient.prototype.MOVE = function(path, topath, handler, 
                                             context, overwrite, locktoken) {
        /* perform a MOVE request

            move a resource from location

            'topath' - the path to move the resource to
            'overwrite' - whether or not to fail when the resource
                    already exists (optional)
        */
        var request = this._getRequest('MOVE', path, handler, context);
        var tourl = this._generateUrl(topath);
        request.setRequestHeader("Destination", tourl);
        if (overwrite) {
            request.setRequestHeader("Overwrite", "F");
        };
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        request.send('');
    };

    this.DavClient.prototype.PROPFIND = function(path, handler, 
                                                 context, depth) {
        /* perform a PROPFIND request

            read the metadata of a resource (optionally including its children)

            'depth' - control recursion depth, default 0 (only returning the
                    properties for the resource itself)
        */
        var request = this._getRequest('PROPFIND', path, handler, context);
        depth = depth || 0;
        request.setRequestHeader('Depth', depth.toString());
        request.setRequestHeader('Content-type', 'text/xml; charset=UTF-8');
        //request.setRequestHeader('Access-Control-Allow-Origin','http://mango.dev'); 
        // XXX maybe we want to change this to allow getting selected props
        var xml = '<?xml version="1.0" encoding="UTF-8" ?>' +
                    '<D:propfind xmlns:D="DAV:">' +
                    '<D:allprop />' +
                    '</D:propfind>';
        request.send(xml);
    };

    // XXX not sure about the order of the args here
    this.DavClient.prototype.PROPPATCH = function(path, handler, context, 
                                                  setprops, delprops,
                                                  locktoken) {
        /* perform a PROPPATCH request

            set the metadata of a (single) resource

            'setprops' - a mapping {<namespace>: {<key>: <value>}} of
                    variables to set
            'delprops' - a mapping {<namespace>: [<key>]} of variables
                    to delete
        */
        var request = this._getRequest('PROPPATCH', path, handler, context);
        request.setRequestHeader('Content-type', 'text/xml; charset=UTF-8');
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        var xml = this._getProppatchXml(setprops, delprops);
        request.send(xml);
    };

    this.DavClient.prototype.LOCK = function(path, owner, handler, context, 
                                             scope, type, depth, timeout,
                                             locktoken) {
        /* perform a LOCK request

            set a lock on a resource

            'owner' - a URL to identify the owner of the lock to be set
            'scope' - the scope of the lock, can be 'exclusive' or 'shared'
            'type' - the type of lock, can be 'write' (somewhat strange, eh?)
            'depth' - can be used to lock (part of) a branch (use 'infinity' as
                        value) or just a single target (default)
            'timeout' - set the timeout in seconds
        */
        if (!scope) {
            scope = 'exclusive';
        };
        if (!type) {
            type = 'write';
        };
        var request = this._getRequest('LOCK', path, handler, context);
        if (depth) {
            request.setRequestHeader('Depth', depth);
        };
        if (!timeout) {
            timeout = "Infinite, Second-4100000000";
        } else {
            timeout = 'Second-' + timeout;
        };
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        request.setRequestHeader("Content-Type", "text/xml; charset=UTF-8");
        request.setRequestHeader('Timeout', timeout);
        var xml = this._getLockXml(owner, scope, type);
        request.send(xml);
    };

    this.DavClient.prototype.UNLOCK = function(path, locktoken, 
                                               handler, context) {
        /* perform an UNLOCK request

            unlock a previously locked file

            'token' - the opaque lock token, as can be retrieved from 
                        content.locktoken using a LOCK request.
        */
        var request = this._getRequest('UNLOCK', path, handler, context);
        request.setRequestHeader("Lock-Token", '<' + locktoken + '>');
        request.send('');
    };

    this.DavClient.prototype._getRequest = function(method, path, 
                                                    handler, context) {
        /* prepare a request */
        var request = davlib.getXmlHttpRequest();
        if (method == 'LOCK') {
            // LOCK requires parsing of the body on 200, so has to be treated
            // differently
            request.onreadystatechange = this._wrapLockHandler(handler, 
                                                            request, context);
        } else {
            request.onreadystatechange = this._wrapHandler(handler, 
                                                            request, context);
        };
        var url = this._generateUrl(path);
        request.open(method, url, true);
        // refuse all encoding, since the browsers don't seem to support it...
        //request.setRequestHeader('Accept-Encoding', ' ');
        return request
    };

    this.DavClient.prototype._wrapHandler = function(handler, request,
                                                     context) {
        /* wrap the handler with a callback

            The callback handles multi-status parsing and calls the client's
            handler when done
        */
        var self = this;
        function HandlerWrapper() {
            this.execute = function() {
                if (request.readyState == 4) {
                    var status = request.status.toString();
                    var headersString= request.getResponseHeaders();
                    if (!headersString){headersString= request.getAllResponseHeaders();}
                    else{headersString= headersString.join("\n");}
                    var headers = self._parseHeaders(headersString);

                  
                    
//                    var headers = self._parseHeaders(
  //                                      request.getAllResponseHeaders());
                    var content = request.responseText;
                    if (status == '207') {
                        content = self._parseMultiStatus(content);
                    };
                    var statusstring = davlib.STATUS_CODES[status];
                    handler.call(context, status, statusstring, 
                                    content, headers);
                };
            };
        };
        return (new HandlerWrapper().execute);
    };

    this.DavClient.prototype._wrapLockHandler = function(handler, request, 
                                                         context) {
        /* wrap the handler for a LOCK response

            The callback handles parsing of specific XML for LOCK requests
        */
        var self = this;
        function HandlerWrapper() {
            this.execute = function() {
                if (request.readyState == 4) {
                    var status = request.status.toString();
                    var headers = self._parseHeaders(
                                        request.getAllResponseHeaders());
                    var content = request.responseText;
                    if (status == '200') {
                        content = self._parseLockinfo(content);
                    } else if (status == '207') {
                        content = self._parseMultiStatus(content);
                    };
                    var statusstring = davlib.STATUS_CODES[status];
                    handler.call(context, status, statusstring, 
                                 content, headers);
                };
            };
        };
        return (new HandlerWrapper().execute);
    };

    this.DavClient.prototype._generateUrl = function(path){
        if(path.indexOf("http")===0) {return path;}
        /* convert a url from a path */
        var url = this.protocol + '://' + this.host;
        /*if (this.port) {
            url += ':' + this.port;
        }*/
        url += path;		
        return url;
    };

    this.DavClient.prototype._parseMultiStatus = function(xml) {
        /* parse a multi-status request 
        
            see MultiStatusSaxHandler below
        */
        var handler = new davlib.MultiStatusSAXHandler();
        var parser = new SAXParser();
        parser.initialize(xml, handler);
        parser.parse();
        return handler.root;
    };

    this.DavClient.prototype._parseLockinfo = function(xml) {
        /* parse a multi-status request 
        
            see MultiStatusSaxHandler below
        */
        var handler = new davlib.LockinfoSAXHandler();
        var parser = new SAXParser();
        parser.initialize(xml, handler);
        parser.parse();
        return handler.lockInfo;
    };

    this.DavClient.prototype._getProppatchXml = function(setprops, delprops) {
        /* create the XML for a PROPPATCH request

            setprops is a mapping from namespace to a mapping
            of key/value pairs (where value is an *entitized* XML string), 
            delprops is a mapping from namespace to a list of names
        */
        var xml = '<?xml version="1.0" encoding="UTF-8" ?>\n' +
                    '<D:propertyupdate xmlns:D="DAV:">\n';

        var shouldsetprops = false;
        for (var attr in setprops) {
            shouldsetprops = true;
        };
        if (shouldsetprops) {
            xml += '<D:set>\n';
            for (var ns in setprops) {
                for (var key in setprops[ns]) {
                    xml += '<D:prop>\n' +
                            this._preparePropElement(ns, key,
                                                     setprops[ns][key]) +
                            '</D:prop>\n';
                };
            };
            xml += '</D:set>\n';
        };

        var shoulddelprops = false;
        for (var attr in delprops) {
            shoulddelprops = true;
        };
        if (shoulddelprops) {
            xml += '<D:remove>\n<D:prop>\n';
            for (var ns in delprops) {
                for (var i=0; i < delprops[ns].length; i++) {
                    xml += '<' + delprops[ns][i] + ' xmlns="' + ns + '"/>\n';
                };
            };
            xml += '</D:prop>n</D:remove>\n';
        };

        xml += '</D:propertyupdate>';

        return xml;
    };

    this.DavClient.prototype._getLockXml = function(owner, scope, type) {
        var xml = '<?xml version="1.0" encoding="utf-8"?>\n'+
                    '<D:lockinfo xmlns:D="DAV:">\n' +
                    '<D:lockscope><D:' + scope + ' /></D:lockscope>\n' +
                    '<D:locktype><D:' + type + ' /></D:locktype>\n' +
                    '<D:owner>\n<D:href>' + 
                    string.entitize(owner) + 
                    '</D:href>\n</D:owner>\n' +
                    '</D:lockinfo>\n';
        return xml;
    };

    this.DavClient.prototype._preparePropElement = function(ns, key, value) {
        /* prepare the DOM for a property

            all properties have a DOM value to allow the same structure
            as in WebDAV
        */
        var dom = new dommer.DOM();
        // currently we expect the value to be a well-formed bit of XML that 
        // already contains the ns and key information...
        var doc = dom.parseXML(value);
        // ... so we don't need the following bit
        /*
        doc.documentElement._setProtected('nodeName', key);
        var pl = key.split(':');
        doc.documentElement._setProtected('prefix', pl[0]);
        doc.documentElement._setProtected('localName', pl[1]);
        doc.namespaceURI = ns;
        doc.documentElement._setProtected('namespaceURI', ns);
        */
        return doc.documentElement.toXML();
    };

    this.DavClient.prototype._parseHeaders = function(headerstring) {
        var lines = headerstring.split('\n');
        var headers = {};
        for (var i=0; i < lines.length; i++) {
            var line = string.strip(lines[i]);
            if (!line) {
                continue;
            };
            var chunks = line.split(':');
            var key = string.strip(chunks.shift());
            var value = string.strip(chunks.join(':'));
            var lkey = key.toLowerCase();
            if (headers[lkey] !== undefined) {
                if (!headers[lkey].push) {
                    headers[lkey] = [headers[lkey, value]];
                } else {
                    headers[lkey].push(value);
                };
            } else {
                headers[lkey] = value;
            };
        };
        return headers;
    };

    // MultiStatus parsing stuff

    this.Resource = function(href, props) {
        /* a single resource in a multi-status tree */
        this.items = [];
        this.parent;
        this.properties = {}; // mapping from namespace to key/dom mappings
    };

    this.Root = function() {
        /* although it subclasses from Resource this is merely a container */
    };

    this.Root.prototype = new this.Resource;

    // XXX this whole thing is rather messy...
    this.MultiStatusSAXHandler = function() {
        /* SAX handler to parse a multi-status response */
    };

    this.MultiStatusSAXHandler.prototype = new SAXHandler;

    this.MultiStatusSAXHandler.prototype.startDocument = function() {
        this.resources = [];
        this.depth = 0;
        this.current = null;
        this.current_node = null;
        this.current_prop_namespace = null;
        this.current_prop_name = null;
        this.current_prop_handler = null;
        this.prop_start_depth = null;
        // array with all nodenames to be able to build a path
        // to a node and check for parent and such
        this.elements = [];
    };

    this.MultiStatusSAXHandler.prototype.endDocument = function() {
        this.buildTree();
    };

    this.MultiStatusSAXHandler.prototype.startElement = function(namespace, 
                                                        nodeName, attributes) {
        this.depth++;
        this.elements.push([namespace, nodeName]);
        davlib.debug('start: ' + namespace + ':' + nodeName);
        davlib.debug('parent: ' + (this.elements.length ? 
                                   this.elements[this.elements.length - 2] :
                                   ''));
        if (this.current_node == 'property') {
            this.current_prop_handler.startElement(namespace, nodeName, 
                                                   attributes);
            return;
        };

        if (namespace == 'DAV:' && nodeName == 'response') {
            var resource = new davlib.Resource();
            if (this.current) {
                resource.parent = this.current;
            };
            this.current = resource;
            this.resources.push(resource);
        } else {
            var parent = this.elements[this.elements.length - 2];
            if (!parent) {
                return;
            };
            if (namespace == 'DAV:' && parent[0] == 'DAV:' && 
                    parent[1] == 'response' || parent[1] == 'propstat') {
                // default response vars
                if (nodeName == 'href') {
                    this.current_node = 'href';
                } else if (nodeName == 'status') {
                    this.current_node = 'status';
                };
            } else if (parent[0] == 'DAV:' && parent[1] == 'prop') {
                // properties
                this.current_node = 'property';
                this.current_prop_namespace = namespace;
                this.current_prop_name = nodeName;
                // use a DOMHandler to propagate calls to for props
                this.current_prop_handler = new dommer.DOMHandler();
                this.current_prop_handler.startDocument();
                this.current_prop_handler.startElement(namespace, nodeName, 
                                                       attributes);
                this.start_prop_depth = this.depth;
                davlib.debug('start property');
            };
        };
    };

    this.MultiStatusSAXHandler.prototype.endElement = function(namespace, 
                                                               nodeName) {
        davlib.debug('end: ' + namespace + ':' + nodeName);
        if (namespace == 'DAV:' && nodeName == 'response') {
            if (this.current) {
                this.current = this.current.parent;
            };
        } else if (this.current_node == 'property' && 
                namespace == this.current_prop_namespace && 
                nodeName == this.current_prop_name &&
                this.start_prop_depth == this.depth) {
            davlib.debug('end property');
            this.current_prop_handler.endElement(namespace, nodeName);
            this.current_prop_handler.endDocument();
            var dom = new dommer.DOM();
            var doc = dom.buildFromHandler(this.current_prop_handler);
            if (!this.current.properties[namespace]) {
                this.current.properties[namespace] = {};
            };
            this.current.properties[namespace][this.current_prop_name] = doc;
            this.current_prop_namespace = null;
            this.current_prop_name = null;
            this.current_prop_handler = null;
        } else if (this.current_node == 'property') {
            this.current_prop_handler.endElement(namespace, nodeName);
            this.depth--;
            this.elements.pop();
            return;
        };
        this.current_node = null;
        this.elements.pop();
        this.depth--;
    };

    this.MultiStatusSAXHandler.prototype.characters = function(data) {
        if (this.current_node) {
            if (this.current_node == 'status') {
                this.current[this.current_node] = data.split(' ')[1];
            } else if (this.current_node == 'href') {
                this.current[this.current_node] = data;
            } else if (this.current_node == 'property') {
                this.current_prop_handler.characters(data);
            };
        };
    };

    this.MultiStatusSAXHandler.prototype.buildTree = function() {
        /* builds a tree from the list of elements */
        // XXX Splitting this up wouldn't make it less readable,
        // I'd say...
        
        // first find root element
        var minlen = -1;
        var root;
        var rootpath;
        // var url_reg = /^.*:\/\/[^\/]*(\/.*)$/;
        for (var i=0; i < this.resources.length; i++) {
            var resource = this.resources[i];
            resource.path = resource.href.split('/');
            if (resource.path[resource.path.length - 1] == '') {
                resource.path.pop();
            };
            var len = resource.path.length;
            if (minlen == -1 || len < minlen) {
                minlen = len;
                root = resource;
                root.parent = null;
            };
        };

        // now build the tree
        // first get a list without the root
        var elements = [];
        for (var i=0; i < this.resources.length; i++) {
            var resource = this.resources[i];
            if (resource == root) {
                continue;
            };
            elements.push(resource);
        };
        while (elements.length) {
            var leftovers = [];
            for (var i=0; i < elements.length; i++) {
                var resource = elements[i];
                var path = resource.path;
                var current = root;
                // we want to walk each element on the path to see if there's
                // a corresponding element already available, and if so 
                // continue walking until we find the parent element of the
                // resource
                if (path.length == root.path.length + 1) {
                    root.items.push(resource);
                    resource.parent = root;
                } else {
                    // XXX still untested, and rather, ehrm, messy...
                    for (var j = root.path.length; j < path.length - 1; 
                            j++) {
                        for (var k=0; k < current.items.length; k++) {
                            var item = current.items[k];
                            if (item.path[item.path.length - 1] ==
                                    path[j]) {
                                if (j == path.length - 2) {
                                    // we have a match at the end of the path
                                    // and all elements before that, this is 
                                    // the current resource's parent
                                    item.items.push(resource);
                                    resource.parent = item;
                                } else {
                                    // a match means we this item is one in our
                                    // path to the root, follow it
                                    current = item;
                                };
                                break;
                            };
                        };
                    };
                    leftovers.push(resource);
                };
            };
            elements = leftovers;
        };

        this.root = root;
    };

    this.LockinfoSAXHandler = function() {
        /* SAX handler to parse a LOCK response */
    };

    this.LockinfoSAXHandler.prototype = new SAXHandler;

    this.LockinfoSAXHandler.prototype.startDocument = function() {
        this.lockInfo = {};
        this.currentItem = null;
        this.insideHref = false;
    };

    this.LockinfoSAXHandler.prototype.startElement = function(namespace, 
                                                              nodeName,
                                                              attributes) {
        if (namespace == 'DAV:') {
            if (nodeName == 'locktype' ||
                    nodeName == 'lockscope' ||
                    nodeName == 'depth' ||
                    nodeName == 'timeout' ||
                    nodeName == 'owner' ||
                    nodeName == 'locktoken') {
                this.currentItem = nodeName;
            } else if (nodeName == 'href') {
                this.insideHref = true;
            };
        };
    };

    this.LockinfoSAXHandler.prototype.endElement = function(namespace, 
                                                            nodeName) {
        if (namespace == 'DAV:') {
            if (nodeName == 'href') {
                this.insideHref = false;
            } else {
                this.currentItem = null;
            };
        };
    };

    this.LockinfoSAXHandler.prototype.characters = function(data) {
        if (this.currentItem && 
                (this.currentItem != 'owner' || this.insideHref) &&
                (this.currentItem != 'locktoken' || this.insideHref)) {
            this.lockInfo[this.currentItem] = data;
        };
    };

    // some helper functions
    this.getXmlHttpRequest = function() {
        /* instantiate an XMLHTTPRequest 

            this can be improved by testing the user agent better and, in case 
            of IE, finding out which MSXML is installed and such, but it 
            seems to work just fine for now
        */
        try {
          console.log('Trying Titanium...');
          return Titanium.Network.createHTTPClient();
        } catch(e) {
          // not titanium desktop
          console.log('FAIL!!!');
        }
        try{
            console.log('Trying xhr...');
            return new XMLHttpRequest();
        } catch(e) {
            // not a Mozilla or Konqueror based browser
        };
        try {
            return new ActiveXObject('Microsoft.XMLHTTP');
        } catch(e) {
            // not IE either...
        };
        alert('Your browser does not support XMLHttpRequest, required for ' +
                'WebDAV access.');
        throw('Browser not supported');
    };

    this.debug = function(text) {
        /* simple debug function

            set the DEBUG global to some true value, and messages will appear
            on the bottom of the document
        */
        if (!davlib.DEBUG) {
            return;
        };
        var div = document.createElement('div');
        var text = document.createTextNode(text);
        div.appendChild(text);
        document.getElementsByTagName('body')[0].appendChild(div);
    };
}();

define("davClient", function(){});

/*
    davfs.js - High-level JavaScript WebDAV client implementation
    Copyright (C) 2004-2007 Guido Wesdorp
    email johnny@johnnydebris.net

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

    This is a high-level WebDAV interface, part of the 'davlib' JS package. 
    
    For more details, see davclient.js in the same package, or visit
    http://johnnydebris.net.

*/

//-----------------------------------------------------------------------------
// ResourceCache - simple cache to help with the FS
//-----------------------------------------------------------------------------

var global = this;
if (!global.davlib) {
    alert('Error: davclient.js needs to be loaded before davfs.js');
    try {
        var exc = new exception.MissingDependency('davclient.js', 'davfs.js');
    } catch(e) {
        var exc = 'Missing Dependency: davclient.js (from davfs.js)';
    };
    throw(exc);
};

davlib.ResourceCache = function() {
};

davlib.ResourceCache.prototype.initialize = function() {
    this._cache = {};
};

davlib.ResourceCache.prototype.addResource = function(path, resource) {
    this._cache[path] = resource;
};

davlib.ResourceCache.prototype.getResource = function(path) {
    return this._cache[path];
};

davlib.ResourceCache.prototype.invalidate = function(path) {
    delete this._cache[path];
};

//-----------------------------------------------------------------------------
// DavFS - high-level DAV client library
//-----------------------------------------------------------------------------

davlib.DavFS = function() {
    /* High level implementation of a WebDAV client */
};

davlib.DavFS.prototype.initialize = function(host, port, protocol) {
    this._client = new davlib.DavClient();
    this._client.initialize(host, port, protocol);
    this._cache = new davlib.ResourceCache();
    this._cache.initialize();
};

davlib.DavFS.prototype.read = function(path, handler, context) {
    /* get the contents of a file 
    
        when done, handler is called with 2 arguments, the status code
        and the content, optionally in context <context>
    */
    this._client.GET(path, this._wrapHandler(handler,
                        this._prepareArgsRead, context), this);
};

davlib.DavFS.prototype.write = function(path, content, handler, context,
                                        locktoken) {
    /* write the new contents of an existing or new file

        when done handler will be called with one argument,
        the status code of the response, optionally in context
        <context>
    */
    this._client.PUT(path, content, this._wrapHandler(handler, 
                        this._prepareArgsSimpleError, context), this,
                        locktoken);
};

davlib.DavFS.prototype.remove = function(path, handler, context, locktoken) {
    /* remove a file or directory recursively from the fs

        when done handler will be called with one argument,
        the status code of the response, optionally in context
        <context>

        when the status code is 'Multi-Status', the handler will
        get a second argument passed in, which is a parsed tree of
        the multi-status response body
    */
    this._client.DELETE(path, this._wrapHandler(handler, 
                        this._prepareArgsMultiError, context), this,
                        locktoken);
};

davlib.DavFS.prototype.mkDir = function(path, handler, context, locktoken) {
    /* create a dir (collection)
    
        when done, handler is called with 2 arguments, the status code
        and the content, optionally in context <context>
    */
    this._client.MKCOL(path, this._wrapHandler(handler, 
                        this._prepareArgsSimpleError, context), this,
                        locktoken);
};

davlib.DavFS.prototype.copy = function(path, topath, handler, context, 
                                       overwrite, locktoken) {
    /* copy an item (resource or collection) to another location
    
        when done, handler is called with 1 argument, the status code,
        optionally in context <context>
    */
    // XXX not really sure if we should send the lock token for the from or
    // the to path...
    this._client.COPY(path, topath, this._wrapHandler(handler, 
                        this._prepareArgsMultiError, context), this, 
                        overwrite, locktoken);
};

davlib.DavFS.prototype.move = function(path, topath, handler, context,
                                       locktoken) {
    /* move an item (resource or collection) to another location
    
        when done, handler is called with 1 argument, the status code,
        optionally in context <context>
    */
    this._client.MOVE(path, topath, this._wrapHandler(handler, 
                      this._prepareArgsMultiError, context), this,
                      locktoken);
};

davlib.DavFS.prototype.listDir = function(path, handler, context, cached) {
    /* list the contents of a collection
    
        when done, handler is called with 2 arguments, the status code
        and an array with filenames, optionally in context <context>
    */
    if (cached) {
        var item = this._cache.getResource(path);
        // XXX perhaps we should keep items set to null so we know
        // the difference between an item that isn't scanned and one
        // that just has no children
        if (item && item.items.length > 0) {
            var dir = [];
            for (var i=0; i < item.items.length; i++) {
                dir.push(item.items[i].href);
            };
            handler.apply('200', dir);
            return;
        };
    };
    this._client.PROPFIND(path, this._wrapHandler(handler, 
                          this._prepareArgsListDir, context), this, 1);
};

davlib.DavFS.prototype.getProps = function(path, handler, context, cached) {
    /* get the value of one or more properties */
    if (cached) {
        var item = this._cache.getResource(path);
        // XXX perhaps we should keep items set to null so we know
        // the difference between an item that isn't scanned and one
        // that just has no children
        if (item) {
            timer_instance.registerFunction(context, handler, 0, 
                                            null, item.properties);
            return;
        };
    };
    this._client.PROPFIND(path, this._wrapHandler(handler,
                          this._prepareArgsGetProps, context), this, 0);
};

davlib.DavFS.prototype.setProps = function(path, setprops, delprops, 
                                           handler, context, locktoken) {
    this._client.PROPPATCH(path, 
                           this._wrapHandler(handler, 
                                this._prepareArgsMultiError, context), 
                           this, setprops, delprops, locktoken);
};

davlib.DavFS.prototype.lock = function(path, owner, handler, context, 
                                       scope, type, depth, timeout, 
                                       locktoken) {
    /* Lock an item

        when done, handler is called with 2 arguments, the status code
        and an array with filenames, optionally in context <context>

        optional args:
        
        <owner> is a URL that identifies the owner, <type> can currently 
        only be 'write' (according to the DAV specs), <depth> should be 
        either 1 or 'Infinity' (default), timeout is in seconds and
        locktoken is the result of a previous lock (serves to refresh a 
        lock)
    */
    this._client.LOCK(path, owner, 
                      this._wrapHandlerLock(handler,
                            this._prepareArgsMultiError, context),
                      this, scope, depth, timeout, locktoken);
};

davlib.DavFS.prototype.unlock = function(path, locktoken, handler, context) {
    /* Release a lock from an item

        when done, handler is called with 1 argument, the status code,
        optionally in context <context>

        <locktoken> is a lock token returned by a previous DavFS.lock()
        call
    */
    this._client.UNLOCK(path, locktoken,
                        this._wrapHandler(handler,
                            this._prepareArgsMultiError, context),
                        this);
};

// TODO... :\
/*
davlib.DavFS.prototype.isReadable = function(path, handler, context) {};

davlib.DavFS.prototype.isWritable = function(path, handler, context) {};

davlib.DavFS.prototype.isLockable = function(path, handler, context) {};
*/

davlib.DavFS.prototype.isLocked = function(path, handler, context, cached) {
    function sub(error, content) {
        if (!error) {
            var ns = content['DAV:'];
            if (!ns || !ns['lockdiscovery'] ||
                    !ns['lockdiscovery'].documentElement.getElementsByTagName(
                        'activelock').length) {
                content = false;
            } else {
                content = true;
            };
            handler(error, content);
        };
    };
    this.getProps(path, sub, context, cached);
};

davlib.DavFS.prototype._prepareArgsRead = function(status, statusstring, 
                                                   content) {
    var error;
    if (status != '200' && status != '201' && status != '204') {
        error = statusstring;
    };
    return [error, content];
};

davlib.DavFS.prototype._prepareArgsSimpleError = function(status, statusstring, 
                                                          content) {
    var error;
    // ignore weird IE status code 1223...
    if (status != '200' && status != '201' && 
            status != '204' && status != '1223') {
        error = statusstring;
    };
    return [error];
};

davlib.DavFS.prototype._prepareArgsMultiError = function(status, statusstring, 
                                                         content) {
    var error = null;
    if (status == '207') {
        error = this._getErrorsFromMultiStatusTree(content);
        if (!error.length) {
            error = null;
        };
    } else if (status != '200' && status != '201' && status != '204') {
        error = statusstring;
    };
    return [error];
};

davlib.DavFS.prototype._prepareArgsListDir = function(status, statusstring,
                                                      content) {
    var error;
    if (status == '207') {
        error = this._getErrorsFromMultiStatusTree(content);
        if (error.length == 0) {
            error = undefined;
            // some caching tricks, store the current item and also
            // all its children (can't be deeper in the current setup)
            // in the cache, the children don't contain subchildren yet
            // but they do contain properties
            this._cache.addResource(content.href, content);
            for (var i=0; i < content.items.length; i++) {
                var child = content.items[i];
                this._cache.addResource(child.href, child);
            };
            // the caller is interested only in the filenames
            // (we assume ;)
            // Fix: Olivier => commented out the following line as we need properties to traverse tree. it saves subsequent call to get the properties again.
            //content = this._getDirFromMultiStatusTree(content);
        };
    } else if (status != '200' && status != '201' && status != '204') {
        error = statusstring;
    };
    return [error, content];
};

davlib.DavFS.prototype._prepareArgsGetProps = function(status, statusstring, 
                                                       content) {
    var error;
    if (status == '207') {
        error = this._getErrorsFromMultiStatusTree(content);
        if (error.length == 0) {
            error = undefined;
            this._cache.addResource(content.href, content);
            content = content.properties;
        };
    } else if (status != '200' && status != '201' && status != '204') {
        error = statusstring;
    };
    return [error, content];
};

davlib.DavFS.prototype._wrapHandler = function(handler, prepareargs, context) {
    /* return the handler wrapped in some class that fixes the context
        and arguments
    */
    function sub(status, statusstring, content) {
        var args = prepareargs.call(this, status, statusstring, 
                                        content);
        handler.apply(context, args);
    };
    return sub;
};

davlib.DavFS.prototype._wrapHandlerLock = function(handler, prepareargs,
                                                   context) {
    /* return the handler wrapped in some class that fixes the context
        and arguments
    */
    function sub(status, statusstring, content) {
        var error;
        if (status == '207') {
            error = this._getErrorsFromMultiStatusTree(content);
            if (error.length == 0) {
                error = undefined;
                this._cache.addResource(content.href, content);
                content = content.properties;
            };
        } else if (status != '200') {
            error = statusstring;
        } else {
            content = content.locktoken;
        };
        handler.apply(context, [error, content]);
    };
    return sub;
};

davlib.DavFS.prototype._getErrorsFromMultiStatusTree = function(curritem) {
    var errors = [];
    var status = curritem.status;
    if (status && status != '200' && status != '204') {
        errors.push(STATUS_CODES[status]);
    };
    for (var i=0; i < curritem.items.length; i++) {
        var itemerrors = this._getErrorsFromMultiStatusTree(
                                    curritem.items[i]);
        if (itemerrors) {
            for (var j=0; j < itemerrors.length; j++) {
                errors.push(itemerrors[j]);
            };
        };
    };
    return errors;
};

davlib.DavFS.prototype._getDirFromMultiStatusTree = function(root) {
    var list = [];
    this._cache.addResource(root.href, root);
    for (var i=0; i < root.items.length; i++) {
        var item = root.items[i];
        list.push(item.href);
    };
    list.sort();
    return list;
};

define("davlib", ["davException","davString","davArray","davMinisax","davDommer","davClient"], (function (global) {
    return function () {
        return global.Davlib;
    }
}(this)));

//-----------------------------------------------------------------------------
// FileDescriptor
//-----------------------------------------------------------------------------
define('fileDescriptor',[

    ], function() {
  
  var FileDescriptor = function() {
     this.name =  null;
     this.path = null; 
     this.relativePath = null; 
     this.createTimestamp=null;  
     this.lastTimestamp = null;
     this.size= 0; 
     this.isDir = false;
     var self=this;
     this.readSize = function(size) {
      
       var info= size || self.size;
       info = info || 0; 
       var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
       var i = 0;
         while(info >= 1024) {
          info /= 1024;
          ++i;
       }
       return info.toFixed(1) + ' ' + units[i];
     };
  };
  
  return FileDescriptor;
});


//-----------------------------------------------------------------------------
// DavFSAdapter
//-----------------------------------------------------------------------------
define('davFSAdapter',[
    'underscore',
    'davlib',
    'fileDescriptor'

    ], function(_,Davlib,FileDescriptor) {
  
  var DavFSAdapter = function() {
  /* High level implementation of a DavFs client wrapper */
    console.log('DavFSAdapter');
  };
  _.extend(DavFSAdapter.prototype,
  {
    initialize: function(host, port, protocol) {
       this.fs = new davlib.DavFS();
       this.fs.initialize(host, port, protocol);
       this.basePath= protocol + "://" + host + ":" + port;
       this.sep="/";
    },
    
    getFullPath: function(path)
    {
      return this.basePath + path; 
    },

    readdir : function(path,callback){
      this.recursionDepth=-1;
      this.treeContent=[];
      this.callback=callback;
      this.queryPath=path;
      this._readdir(path);
    },
   
    copy : function(path,topath,callback){
      this.callback=callback;
      this.fs.copy(path,topath,this._actionCallback,this);
      //this.fs.COPY(path,topath,this._actionCallback,this);
    },

    write : function(path,content,callback){
      this.callback=callback;

      this.fs.write(path,content,this._actionCallback,this);
      //this.fs.PUT(path,content,this._actionCallback,this);
    },
    
    read : function(path,callback){
      this.callback=callback;
      this.fs.read(path,this._actionCallback,this);
      //this.fs.GET(path,this._actionCallback,this);
    },

   
    mkdir: function(path,callback){
      this.callback=callback;
      path = this._extractDir(path);
      this.pathToBuild=path;
      this.fs.listDir(path,this._createDir,this);
      //this.fs.PROPFIND(path,this._createDir,this);
    },
    
    isDir:function(path,callback){
     path =this._extractDir(path);       
     this.callback=callback;
     this.fs.listDir(path,this._isDirCallback,this);      
    },

    _isDirCallback:function(error,content)
    {
      this.callback(!error);
    },

    _extractDir: function(path)
    {
      var lastSep = path.lastIndexOf(this.sep);
      if (lastSep < path.length) {
        path = path.substr(0,lastSep+1); //path end with "/"  
      }
      path = path.replace(this.basePath,"");
      return path;
    },


    _createDir:function(error,content){
      if (!error){ this._actionCallback();return;}
      //split in segment
      //
      this.pathSegments = this.pathToBuild.split(this.sep);
      console.log("Path to build: " + this.pathSegments.join());
      this.currentSegment=this.sep;
      this._checkNextSegment();

    },
   
    _checkNextSegment: function(error,content){
       if (error){
         console.log("ERROR creating " + this.currentSegment);
       } 
       else if (this.currentSegment)
       {
         console.log("SUCCESS creating " + this.currentSegment);
       }
       if (this.pathSegments.length===0){this._actionCallback(arguments[0]);return;}
       this.currentSegment+=this.pathSegments.shift()+this.sep;                  
       console.log("segment to check:" + this.currentSegment);
       this.fs.listDir(this.currentSegment,this._createNextSegment,this);                  
       //this.fs.PROPFIND(this.currentSegment,this._createNextSegment,this);                  
    },
    
    _createNextSegment:function(error,content){
       if(error){
         console.log("segment check error: " + this.currentSegment + " =>" + error);  
       }
       if(!error){this._checkNextSegment();return;} 
       console.log("segment to build:" + this.currentSegment);
       var self=this;
       
       this.fs.mkDir(this.currentSegment,this._checkNextSegment,this); 
        },

    rm : function(path, callback){
         this.rmdir(path,callback); 
    },

    rmdir : function(path,callback){
      this.callback=callback;
      this.fs.remove(path,this._rmdirCallback,this);
      //this.fs.DELETE(path,this._rmdirCallback,this);
    },
    // PATCH due to weird error on rmdir => dir is delete but an error is send back to the browse
    // XMLHttpRequest cannot load http://localhost/webdav/test123/. Origin http://mango.dev is not allowed by Access-Control-Allow-Origin.
    // setting if correct in server setting. the folder test123 is deleted. it sounds like an access attempted to the deleted folder
    // in Titanium no error is return so err = null
    _rmdirCallback:function(err) {
     //if(err !== null && err !="Unknown Error"){this.callback(err);}
     if(err){this.callback(err);}
     else{this.callback(null,"OK");}
    },

    _actionCallback:function(err,content) {
     if(err){this.callback(err);}
     else{
       var success =(content)?content:"OK";
       this.callback(null,success);
     }
    },

    _readdir : function(path){
      this.recursionDepth++;      
      this.fs.listDir(path, this._explore,this);
      //this.fs.PROPFIND(path, this._explore,this);
    },

    _explore:function(error, content)
    {
       if (error) {this.callback(error);return;}
       var self=this;
      _.each(content.items,function(data){
          var info =self._parse(data);
          if(!self._filter(info.name)){
            self.treeContent.push(info);
            if(info.isDir) {self._readdir(info.path);}
          }
      });
      if (this.recursionDepth--===0){ 
        this.callback(null,this.treeContent);
      }
    },

    _filter:function(name)
    {
      return (name ===".DS_Store"  || name ===".Thumbs.db"); 
    },


    _parse: function(data)
    {
       var davInfo = data.properties['DAV:'];
       var fd= new FileDescriptor();
       fd.name = data.path.pop();
       fd.path = data.href; 
       fd.relativePath= fd.path.replace(this.queryPath,""); 
       fd.createTimestamp = this._parseCreationDate(davInfo.creationdate.childNodes[0].childNodes[0].nodeValue);
       fd.lastTimestamp = this._parseLastModified(davInfo.getlastmodified.childNodes[0].childNodes[0].nodeValue);
       fd.size=(davInfo.getcontentlength)?  Number(davInfo.getcontentlength.childNodes[0].childNodes[0].nodeValue):null;
       fd.isDir = (davInfo.resourcetype.childNodes[0].childNodes.length!==0)?true:false;
       return fd;
    },
    
    //2012-06-22T16:45:26Z to timestamp
    _parseCreationDate: function(creationDate)
    {
      var d=creationDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z/);
      // d[2] -1 => month in javascript start at 0 to 11 instead of 1 to 12
      var timestamp= new Date(d[1], d[2] - 1, d[3], d[4], d[5], d[6]).getTime();
      return timestamp;
    },
    
    //Fri, 22 Jun 2012 16:45:26 GMT
    _parseLastModified: function(lastModified)
    {
      var month=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var d=lastModified.match(/.+(\d{2}) (\w{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT/);
      var timestamp= new Date(d[3], month.indexOf(d[2]), d[1], d[4], d[5], d[6]).getTime();
      return timestamp;
    }
  });

  return DavFSAdapter;
});

//-----------------------------------------------------------------------------
// LocalFsAdapter
//-----------------------------------------------------------------------------
define('localFSAdapter',[
    'underscore',
    'fileDescriptor'

    ], function(_,FileDescriptor) {
  
  var LocalFsAdapter = function() {
  /* High level implementation of a localFs client wrapper */
      console.log('LocalFsAdapter');
      };
/* 
 LocalFsAdapter.prototype.initialize = function(host, port, protocol) {
   this.fs = new Davlib.DavFs();
   this.fs.initialize(host, port, protocol);
//   this._cache = new davlib.ResourceCache();
//   this._cache.initialize();
 };
*/
  _.extend(LocalFsAdapter.prototype,
  {
    initialize: function(baseDir) {
      this.enabled = ( typeof Titanium !== 'undefined');
      if(!this.enabled) { console.log('error: Titanium is not enabled');return; }
      
      // filesystem paths
      this.baseDir=baseDir ||'';
      this.homeDir = this.getHomeDir();
      this.workingDir = Titanium.Filesystem.getFile(this.homeDir,this.baseDir);
      this.sep = Titanium.Filesystem.getSeparator();
      if(!this.workingDir.exists()) {
        this.workingDir.createDirectory();
      }
    },
   
    getHomeDir:function(){
      if (Titanium.Platform.getName()=="Darwin") {
       return   Titanium.Filesystem.getDocumentsDirectory();
      }
      //patch for windows bug
      else
      {
        var tmp =  Titanium.Filesystem.getDocumentsDirectory();
        tmp = tmp.nativePath();
        //tmp =tmp.replace("Documents","My Documents");
        return Titanium.Filesystem.getFile(tmp);
      }
    },

    getFullPath: function(path)
    {
      return (path);//this.workingDir.nativePath() + this.sep + path; 
    },
    
    isDir: function(path,callback)
    {
         path=this._extractDir(this._normalizePath(path));
         var dir = Titanium.Filesystem.getFile(this.workingDir,path);
         callback(dir.isDirectory()); 
    },

    readdir : function(path,callback){
      this.callback=callback;
      this.queryPath=this._normalizePath(path);
      this.treeContent=[];
      this.recursionDepth=-1;
      readpath = Titanium.Filesystem.getFile(this.homeDir,path|| this.baseDir);
      if (!readpath.isDirectory){console.log(readpath.toString() + " not a directory");this.callback("Not Found");return;}
      this._readdir(path);
    },
   
    copy : function(path,topath,callback){
      this.callback=callback;
      try
      { 
        this.callback=callback;
        var src= Titanium.Filesystem.getFile(this.workingDir,path);
        var dest= Titanium.Filesystem.getFile(this.workingDir,topath);
        src.copy(dest);
        this._actionCallback();
      }
      catch(err)
      {
        this._actionCallback("cannot copy " + path +  "to " + topath + ". err: " +  err);
      }
    },

    append: function(path,content,callback)
    {
      this._write(path,content,callback,Titanium.Filesystem.MODE_APPEND);
    },

    write: function(path,content,callback)
    {
      this._write(path,content,callback,Titanium.Filesystem.MODE_WRITE);
    },

    _extractDir: function(path)
    {
      var lastSep = path.lastIndexOf(this.sep);
      if (lastSep < path.length) {
        path = path.substr(0,lastSep+1); //path end with "/"  
      }
      return path;
    },


    _write : function(path,content,callback,mode){
      this.callback=callback;
      try
      {
        var file = Titanium.Filesystem.getFile(this.workingDir,path);
         if(!file.parent().isDirectory()){
           var self=this;
           this.mkdir(this._extractDir(path),function(){
             self.callback=callback;//reset callback => mkdir override it
             return;});
         }

        var fileStream = file.open(mode);
        fileStream.write(content);
        fileStream.close();
        this._actionCallback();
      }
      catch(err)
      {
        this._actionCallback("cannot write. err: " +  err);
      }
    },

    read: function(path,callback){
      this.callback=callback;
      try
      {
        var fileStream = Titanium.Filesystem.getFileStream(this.workingDir,path);
        fileStream.open(Titanium.Filesystem.MODE_READ);
        var content = fileStream.read();
        fileStream.close();
        this.callback(null,content);
      }
      catch(err)
      {
        this._actionCallback("cannot read " + path +  ". err: " +  err.message);
      }
    },

    _normalizePath:function(path){
     if (Titanium.Platform.getName()!=="Darwin") {
        path=path.replace(/\//g,Titanium.Filesystem.getSeparator());
      }
     return path;
                  
    },


    mkdir : function(path,callback){
      this.callback=callback;
      path=this._extractDir(this._normalizePath(path));
      try
      { 
        var dir = Titanium.Filesystem.getFile(this.workingDir, path);
        if(!dir.exists())  {
          var dir_path = this.workingDir.toString();
          var path_arr = _.compact(path.toString().split(this.sep));
          var sep=this.sep;
          _.each(path_arr, function(p) {
            var d = Titanium.Filesystem.getFile(dir_path + sep + p);
            if(!d.exists()) {
              d.createDirectory();
            }
            dir_path = d.toString();
          });
        }
        this._actionCallback();
      }
      catch(err)
      {
        this._actionCallback("cannot create " + path +  ". err: " +  err.message);
      }
    },

    rm: function(path,callback){
      this.callback=callback;
      try
      {
        var file = Titanium.Filesystem.getFile(this.workingDir,path);
        var result=file.deleteFile(); 
        return result? this._actionCallback():this._actionCallback("cannot delete " + path);
      }
      catch(err)
      {
        this._actionCallback("cannot delete " + path +  ". err: " +  err.message);
      }
    },
    
    rmdir: function(path,callback){
      this.callback=callback;
      try
      {
        var file = Titanium.Filesystem.getFile(this.workingDir,path);
        var result=file.deleteDirectory(true);// true = recursive 
        return result? this._actionCallback():this._actionCallback("cannot delete " + path);
      }
      catch(err)
      {
        this._actionCallback("cannot delete " + path +  ". err: " +  err.message);
      }
    },

    _actionCallback:function(err) {
     if(err){this.callback(err);}
     else{this.callback(null,"OK");}
    },

    _readdir : function(path){
      this.recursionDepth++;
      path = Titanium.Filesystem.getFile(this.homeDir,path|| this.baseDir);
      var content=path.getDirectoryListing();
      this._explore(content);
    },

    _explore:function(content)
    {
       if (!content) {this.callback("Not Found");return; }
       var self=this;
       _.each(content,function(data){
         var info=self._parse(data);
         if(!self._filter(info.name)){
           self.treeContent.push(info);
           if(info.isDir){self._readdir(info.path);}
         }
       });
       if (this.recursionDepth--===0){ 
         this.callback(null,this.treeContent);
       }
    },
    _filter:function(name)
    {
      return (name ===".DS_Store" || name ===".Thumbs.db" || name ===".ignore"); 
    },
    _parse: function(data)
    {
       var fd= new FileDescriptor();
       fd.name = data.name();
       fd.path = data.nativePath().replace(this.homeDir.nativePath(),""); 
       fd.createTimestamp =this._parseTimestamp(data.createTimestamp()); 
       fd.lastTimestamp =this._parseTimestamp(data.modificationTimestamp());
       fd.isDir =data.isDirectory();
       fd.size= !fd.isDir? data.size():null;// null the size when dir as webdav doesn't give size info for folder;
       if (fd.isDir){fd.path+=this.sep;}
       fd.relativePath = fd.path.replace(this.queryPath,""); 
       return fd;
     },

    _parseTimestamp:function(timestamp)
    {
      //titanium return timestamp at the microsecond in localtime. we compare at the millisecond in UTC time
     return new Date((timestamp/1000 +(new Date().getTimezoneOffset())*60000)).getTime();
    }

  });

  return LocalFsAdapter;
});


//-----------------------------------------------------------------------------
// Shipper
//-----------------------------------------------------------------------------
define('shipper',["underscore"
    ], function(_) {
      
  var Shipper=function(baseDir,logger){
      this.baseDir=baseDir ||'';
      this.homeDir = Titanium.Filesystem.getDocumentsDirectory();
      this.workingDir = Titanium.Filesystem.getFile(this.homeDir,this.baseDir);
      this.logger=logger;
      };
  _.extend(Shipper.prototype,
  {

    transfer: function(paths,callbacks){
      this.origin= paths.origin;
      this.destination=paths.destination;
      this.callbacks=callbacks;
     /* this._checkDestinationPath();*/
      this._processTransfer();
    },

   _processTransfer:function(error)
   {
    //if (error){this._onError("_processTransfer","path cannot be validated:" + error);return;}
    if (this.origin.indexOf("http")===0) {
        this.download(this.origin,this.destination,this.callbacks);
      } else {
        this.upload(this.origin,this.destination,this.callbacks);
      }
  },

    download: function(src,dest,callbacks){
      this._initCallbacks(callbacks);
      var url=src;
      var filePath= this.workingDir + dest;
      if (Titanium.Platform.getName()!=="Darwin") {
        filePath=filePath.replace(/\//g,Titanium.Filesystem.getSeparator());
      }

      var httpClient = Titanium.Network.createHTTPClient();
      //  httpClient.xWorker = this;
      var self=this;
      //Check for d/l finished event
      httpClient.onreadystatechange = function(e) {
        if (e.readyState == 4) {
           self._onComplete("download","download done");
           //  this.xWorker.postMessage(-2);
           }
         };
      httpClient.ondatastream = function(e) {
        // read the content length
        length = e.getResponseHeader("Content-Length");
        // remove the callback... we'll reestablish it in a moment
        httpClient.ondatastream = null;
        if (length > 0) {
           // updateProgressWidth.call(this, evt);
           // httpClient.ondatastream = updateProgressWidth;
        }
        else {
            // tell the user we don't know the content length
        }


          console.log('#####ONRECEIVESTREAM - PROGRESS: ' + e.dataReceived);
      };

         httpClient.onerror = function(e) {
          self._onError(e);// this.xWorker.postMessage(-1);
         };

         if (httpClient.open('GET', url)) {
           //this.postMessage(0);
           var file = Titanium.Filesystem.createTempFile();
           //var filePath = dest;//  event.message.dir+event.message.filename;
           file.copy(filePath);

           httpClient.xFile = filePath;

           // Handle the received data (Titanium.Filesystem.File can also be used as a handler)
           httpClient.receive(function(data) {
             var file = Titanium.Filesystem.getFile(this.xFile);
             var fileStream = file.open(Titanium.Filesystem.MODE_APPEND);
             fileStream.write(data);
             fileStream.close();
             //this.xWorker.postMessage(data.length);
           });
         } else {
           self._onError(e);
         //  this.postMessage(-1);
         }
         
      }, 

      upload: function(src,dest,callbacks){
      this._initCallbacks(callbacks);
      console.log(src + "=>" + dest);
      var self = this;
      var file = Titanium.Filesystem.getFile(this.workingDir + src);
     
      if(!file.exists()) {
        this._onError("upload", "path not found" + file); 
        console.log('path not found:' + file); 
        return;
      }
      
      var content=Titanium.API.createBytes(); 
      if (file.size() >0){
        var uploadStream = Titanium.Filesystem.getFileStream(file);
        uploadStream.open(Titanium.Filesystem.MODE_READ);
        content = uploadStream.read();
        uploadStream.close();
      }
      //console.log("CONTENT");
      //console.log(content);

      var xhr = Titanium.Network.createHTTPClient();
      xhr.addEventListener(Titanium.HTTP_DONE, function() {
        console.log("TI XHR DONE!");
        console.log(this.responseText);
        //var slot = JSON.parse(this.responseText);
        self._onComplete("upload","upload done");
        // self.importFile(slot, onComplete, onProgress, onError);
      });
      xhr.addEventListener(Titanium.HTTP_STATE_CHANGED, function() {
        console.log("STATE CHANGED");
        console.log(this.responseText);
      });

      xhr.onsendstream = function(e) {
          console.log('#####ONSENDSTREAM - PROGRESS: ' + e.dataSent);//e.progress
      };
      xhr.setTimeout(-1); // no limit
      xhr.setRequestHeader("contentType", "multipart/form-data");
      xhr.open('PUT', dest);
      xhr.send(content);
    }, 
  
    _log: function(msg){
      this.logger.writeln(msg);
    },

    _initCallbacks:function(callbacks)
    {
      var onProgressCallback = callbacks.onProgress || function(){};
      var onErrorCallback = callbacks.onError || function(){};
      var onCompleteCallback = callbacks.onComplete || function(){};
      var self=this;
      this._onProgress= function(method,msg){self._onActionLog(method,msg); onProgressCallback(msg);}; 
      this._onError= function(method,msg){self._onActionLog(method,msg); onErrorCallback(msg);}; 
      this._onComplete= function(method,msg){self._onActionLog(method,msg); onCompleteCallback(msg);}; 
    },


    _onActionLog: function(method,msg)
    {
       this._log(method + ": " + msg);
    }


  });
    return Shipper;
});



//-----------------------------------------------------------------------------
// LocalLogger
//-----------------------------------------------------------------------------
define('localLogger',[
    'underscore'
    ], function(_) {
      
  var LocalLogger=function(options){
    this._configure(options || {});
    this.options = options;
  };
  _.extend(LocalLogger.prototype,
    {
    _configure: function(options) {
      this.options={local:null,path:null};
      if (this.options) options = _.extend({}, this.options, options);
            this.options = options;
            this.local = this.options.local;
            this.path = this.options.path;
            this.local.initialize();
            this.writeln("/************** " + new Date() + " *********/");
    },
  write: function(content){
    this.local.append(this.path,content,function(){return;});       
  }, 
  writeln: function(content){
    this.write(content +  Titanium.Filesystem.getLineEnding());       
  } 
     });
    return LocalLogger;
});
