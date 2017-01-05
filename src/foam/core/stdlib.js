/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
  Rather than extending built-in prototypes, we create flyweight versions.

  This has a number of advantages:
  1. It avoids conflicts with other libraries which might also extend built-in
     types with methods with the same names but different semantics.
  2. It is >10X faster (in V8) to call a flyweight method than a Method added
     to the prototypes of String or Number. This is because calling an added
     method on those types promotes the object from a primitive string or number
     to a String or Number object.  Creating the object takes time and creates a
     new object that will need to be GC'ed.
  3. It lets us effectively add methods to built-in special values like
     true, false, null, and undefined. This avoids the need for null-pointer
     checks.
  4. It avoids the proliferation of large ===/typeof/isInstance/instanceof blocks
     throughout the rest of the code.
  5. It provides a consistent method for checking an object's type, since each
     type flyweight has an .isInstance() method which abstracts the underlying detection
     mechanism.
  6. It makes the future implementation of multi-methods much easier.
*/

/**
 * Each of these flyweight types follows a standard interface.
 *
 * <pre>
 * interface Type {
 *   // Returns true if the given object is of this type.
 *   // example: foam.String.isInstance('hello') -> true
 *   isInstance(o) -> Boolean
 *
 *   // Returns a deep clone of o, if the type supports it.
 *   clone(o);
 *
 *   // Returns true if a and b are equivalent.
 *   equals(a, b) -> Boolean
 *
 *   // Returns -1, 0 or 1 as a comparsion of the two types.
 *   // -1 means that 'a' is considered smaller that 'b'
 *   // 0 means that and 'a' and 'b' are considered equivalent
 *   // 1 means that 'a' is considered larger than 'b'
 *   compare(a, b) -> Int
 *
 *   // Returns a hash of 'a' useful for hash tables
 *   hashCode(a) -> Int
 * }
 */

foam.LIB({
  name: 'foam.Undefined',
  methods: [
    function isInstance(o) { return o === undefined; },
    function clone(o) { return o; },
    function equals(_, b) { return b === undefined; },
    function compare(_, b) { return b === undefined ? 0 : 1; },
    function hashCode() { return -1; }
  ]
});


foam.LIB({
  name: 'foam.Null',
  methods: [
    function isInstance(o) { return o === null; },
    function clone(o) { return o; },
    function equals(_, b) { return b === null; },
    function compare(_, b) {
      return b === null ? 0 : b === undefined ? -1 : 1;
    },
    function hashCode() { return -2; }
  ]
});


foam.LIB({
  name: 'foam.Boolean',
  methods: [
    function isInstance(o) { return typeof o === 'boolean'; },
    function clone(o) { return o; },
    function equals(a, b) { return a === b; },
    function compare(a, b) { return a ? (b ? 0 : 1) : (b ? -1 : 0); },
    function hashCode(o) { return o ? 1 : 0; }
  ]
});


foam.LIB({
  name: 'foam.Function',
  methods: [
    function isInstance(o) { return typeof o === 'function'; },
    function clone(o) { return o; },
    function equals(a, b) { return b ? a.toString() === b.toString() : false; },
    function compare(a, b) {
      return b ? foam.String.compare(a.toString(), b.toString()) :  1;
    },
    function hashCode(o) { return foam.String.hashCode(o.toString()); },

    /* istanbul ignore next */
    function bind(f, that, a1, a2, a3, a4) {
      /**
       * Faster than Function.prototype.bind
       */
      switch ( arguments.length ) {
        case 1:
          console.error('No arguments given to bind to.');
          break;
        case 2: return function() { return f.apply(that, arguments); };
        case 3: return function(b1, b2, b3, b4) {
          switch ( arguments.length ) {
            case 0: return f.call(that, a1);
            case 1: return f.call(that, a1, b1);
            case 2: return f.call(that, a1, b1, b2);
            case 3: return f.call(that, a1, b1, b2, b3);
            case 4: return f.call(that, a1, b1, b2, b3, b4);
          }
        };
        case 4: return function(b1, b2, b3, b4) {
          switch ( arguments.length ) {
            case 0: return f.call(that, a1, a2);
            case 1: return f.call(that, a1, a2, b1);
            case 2: return f.call(that, a1, a2, b1, b2);
            case 3: return f.call(that, a1, a2, b1, b2, b3);
            case 4: return f.call(that, a1, a2, b1, b2, b3, b4);
          }
        };
        case 5: return function(b1, b2, b3, b4) {
          switch ( arguments.length ) {
            case 0: return f.call(that, a1, a2, a3);
            case 1: return f.call(that, a1, a2, a3, b1);
            case 2: return f.call(that, a1, a2, a3, b1, b2);
            case 3: return f.call(that, a1, a2, a3, b1, b2, b3);
            case 4: return f.call(that, a1, a2, a3, b1, b2, b3, b4);
          }
        };
        case 6: return function(b1, b2, b3, b4) {
          switch ( arguments.length ) {
            case 0: return f.call(that, a1, a2, a3, a4);
            case 1: return f.call(that, a1, a2, a3, a4, b1);
            case 2: return f.call(that, a1, a2, a3, a4, b1, b2);
            case 3: return f.call(that, a1, a2, a3, a4, b1, b2, b3);
            case 4: return f.call(that, a1, a2, a3, a4, b1, b2, b3, b4);
          }
        };
      }

      console.error('Attempt to foam.Function.bind more than 4 arguments.');
    },

    /**
     * Decorates the function 'f' to cache the return value of 'f' when
     * called in the future. Also known as a 'thunk'.
     */
    function memoize0(/* foam.Function */ f) {
      var set = false, cache;
      var ret = foam.Function.setName(
          function() {
            if ( ! set ) {
              set = true;
              cache = f();
            }
            return cache;
          },
          'memoize0(' + f.name + ')');
        ret.toString = function() { return f.toString(); };
        return ret;

    },

    /**
     * Decorates the function 'f' to cache the return value of 'f' when called
     * with a particular value for its first argument.
     */
    function memoize1(/* foam.Function */ f) {
      var cache = {}, nullCache, undefinedCache;
      var ret = foam.Function.setName(
          function(key) {
            foam.assert(
                arguments.length === 1,
                'Memoize1\'ed functions must take exactly one argument.');

            var mKey =
                key === null      ? '___null___'      :
                key === undefined ? '___undefined___' :
                key ;

            if ( ! cache.hasOwnProperty(mKey) ) cache[mKey] = f.call(this, key);

            return cache[mKey];
          },
          'memoize1(' + f.name + ')');
        ret.toString = function() { return f.toString(); };
        return ret;
    },

    /**
     * Set a function's name for improved debugging and profiling
     *
     * Returns the given function.
     */
    function setName(f, name) {
      Object.defineProperty(f, 'name', { value: name, configurable: true });
      return f;
    },

    /** Convenience method to append 'arguments' onto a real array **/
    function appendArguments(a, args, start) {
      start = start || 0;
      for ( var i = start ; i < args.length ; i++ ) a.push(args[i]);
      return a;
    },

    /** Finds the function(...) declaration arguments part. Strips newlines. */
    function argsStr(f) {
      var match = f.
          toString().
          replace(/(\r\n|\n|\r)/gm,'').
          match(/^function(\s+[_$\w]+|\s*)\((.*?)\)/);

      if ( ! match ) {
        /* istanbul ignore next */
        throw new TypeError("foam.Function.argsStr could not parse input function:\n" + ( f ? f.toString() : 'undefined' ) );
      }

      return match[2] || '';
    },

    function argNames(f) {
      /**
       * Return a function's arguments as an array.
       * Ex. argNames(function(a,b) {...}) === ['a', 'b']
       **/
      var args = foam.Function.argsStr(f);
      args += ',';

      var ret = [];
      // [ ws /* anything */ ] ws [...]arg_name ws [ /* anything */ ],
      var argMatcher = /(\s*\/\*.*?\*\/)?\s*((?:\.\.\.)?[\w_$]+)\s*(\/\*.*?\*\/)?\s*\,+/g;
      var typeMatch;
      while ( ( typeMatch = argMatcher.exec(args) ) !== null ) {
        ret.push(typeMatch[2]);
      }
      return ret;
    },

    /** Finds the function(...) declaration and finds the first block comment
      in the function body. */
    function functionComment(f) {
      var match = f.
          toString().
          replace(/\n/g, '_#_%_%_'). // fake newlines
          match(/^function(\s+[_$\w]+|\s*)\(.*?\)(?:\_\#\_\%\_\%\_|\s)*\{(?:\_\#\_\%\_\%\_|\s)*\/\*\*?\s*(.*?)\*?\*\/.*\}/);
      if ( ! match ) {
        return '';
      } else {
        return match[2] && match[2].replace(/_#_%_%_/g, '\n') || '';
      }
    },

    /**
     * Calls fn, and provides the arguments to fn by looking
     * up their names on source. The 'this' context is either
     * source, or opt_self if provided.
     *
     * If the argument maps to a function on source, it is bound to source.
     *
     * Ex.
     * var a = {
     *   name: 'adam',
     *   hello: function() {
     *     console.blog('Hello ' + this.name);
     *   }
     * };
     * function foo(name, hello) {
     *   console.log('Name is ' + name);
     *   hello();
     * }
     * foam.Function.withArgs(foo, a);
     *
     * Outputs:
     * Name is adam
     * Hello adam
     *
     **/
    function withArgs(fn, source, opt_self) {
      var argNames = foam.Function.argNames(fn);
      var args = [];
      for ( var i = 0 ; i < argNames.length ; i++ ) {
        var a = source[argNames[i]];
        if ( typeof a === 'function' ) a = a.bind(source);
        args.push(a);
      }
      return fn.apply(opt_self || source, args);
    }
  ]
});


/* istanbul ignore next */
(function() {
  // Disable setName if not supported on this platform.
  try {
    foam.Function.setName(function() {}, '');
  } catch (x) {
    console.warn('foam.Function.setName is not supported on your platform. ' +
                 'Stack traces will be harder to decipher, but no ' +
                 'functionality will be lost');
    foam.LIB({
      name: 'foam.Function',
      methods: [
        function setName(f) { return f; }
      ]
    });
  }
})();


foam.LIB({
  name: 'foam.Number',
  methods: [
    function isInstance(o) { return typeof o === 'number'; },
    function clone(o) { return o; },
    function equals(a, b) { return a === b; },
    function compare(a, b) {
      return ( b === null || b === undefined ) ? 1 :
        a < b ? -1 : a > b ? 1 : 0;
    },
    function hashCode(n) { return n & n; }
  ]
});


foam.LIB({
  name: 'foam.String',
  methods: [
    function isInstance(o) { return typeof o === 'string'; },
    function clone(o) { return o; },
    function equals(a, b) { return a === b; },
    function compare(a, b) { return b != null ? a.localeCompare(b) : 1 ; },
    function hashCode(s) {
      var hash = 0;

      for ( var i = 0 ; i < s.length ; i++ ) {
        var code = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + code;
        hash &= hash;
      }

      return hash;
    },
    {
      name: 'constantize',
      code: foam.Function.memoize1(function(/* foam.String */ str) {
        // switches from from camelCase to CAMEL_CASE
        return str.replace(/([a-z])([^0-9a-z_])/g, '$1_$2').toUpperCase();
      })
    },

    {
      name: 'labelize',
      code: foam.Function.memoize1(function(/* foam.String= */ str) {
        if ( str === '' || str === null || foam.Undefined.isInstance(str) ) return '';

        return this.capitalize(str.replace(/[a-z][A-Z]/g, function(a) {
          return a.charAt(0) + ' ' + a.charAt(1);
        }));
      })
    },

    {
      name: 'capitalize',
      code: foam.Function.memoize1(function(str) {
        foam.assert(typeof str === 'string',
            'Cannot capitalize non-string values.');
        // switchFromProperyName to //SwitchFromPropertyName
        return str[0].toUpperCase() + str.substring(1);
      })
    },
    {
      /**
       * Takes a key and creates a slot name for it.  Generally key -> key + '$'.
       *
       * For example, if an object has a property called myProperty, the slot
       * name for that will be myProperty$.
       */
      name: 'toSlotName',
      code: foam.Function.memoize1(function toSlotName(key) {
        foam.assert(
            typeof key === 'string',
            'Cannot toSlotName non-string values.');

        return key + '$';
      })
    },
    {
      name: 'toUpperCase',
      code: foam.Function.memoize1(function(str) {
        foam.assert(
            typeof str === 'string',
            'Cannot toUpperCase non-string values.');

        return str.toUpperCase();
      })
    },

    {
      name: 'cssClassize',
      code: foam.Function.memoize1(function(str) {
        foam.assert(typeof str === 'string',
            'Cannot cssClassize non-string values.');
        // Turns foam.u2.Foo into foam-u2-Foo
        return str.replace(/\./g, '-');
      })
    },

    function pad(obj, size) {
      // Right pads to size if size > 0, Left pads to -size if size < 0
      return size < 0 ?
        (new Array(-size).join(' ') + obj).slice(size)       :
        (obj + new Array(size).join(' ')).substring(0, size) ;
    },

    function multiline(f) {
      // Function for returning multi-line strings from commented functions.
      // Ex. var str = multiline(function() { /* multi-line string here */ });
      if ( typeof f === 'string' ) return f;
      var s     = f.toString();
      var start = s.indexOf('/*');
      var end   = s.lastIndexOf('*/');
      return ( start >= 0 && end >= 0 ) ? s.substring(start + 2, end) : '';
    },
    function startsWithIC(a, b) {
      foam.assert(typeof a === 'string' && typeof b === 'string',
          'Cannot startsWithIC non-string values.');

      return a.toUpperCase().startsWith(b.toUpperCase());
    },
    (function() {
      var map = {};

      return function intern(val) {
        /** Convert a string to an internal canonical copy. **/
        return map[val] || (map[val] = val.toString());
      };
    })(),
  ]
});


foam.LIB({
  name: 'foam.Array',
  methods: [
    function isInstance(o) { return Array.isArray(o); },
    function clone(o) {
      /** Returns a deep copy of this array and its contents. */
      var ret = new Array(o.length);
      for ( var i = 0 ; i < o.length ; i++ ) {
        ret[i] = foam.util.clone(o[i]);
      }
      return ret;
    },
    function diff(a, b) {
      /** Finds elements added (found in other, not in this) and removed
          (found in this, not in other). Repeated values are treated
          as separate elements, but ordering changes are ignored. */
      var added = b.slice(0);
      var removed = [];
      for ( var i = 0 ; i < a.length ; i++ ) {
        for ( var j = 0 ; j < added.length ; j++ ) {
          if ( foam.util.equals(a[i], added[j]) ) {
            added.splice(j, 1);
            j--;
            break;
          }
        }
        if ( j === added.length ) removed.push(a[i]);
      }
      return { added: added, removed: removed };
    },
    function equals(a, b) {
      if ( ! b || ! Array.isArray(b) || a.length !== b.length ) return false;
      for ( var i = 0 ; i < a.length ; i++ ) {
        if ( ! foam.util.equals(a[i], b[i]) ) return false;
      }
      return true;
    },
    function compare(a, b) {
      if ( ! b || ! Array.isArray(b) ) return 1;
      var l = Math.min(a.length, b.length);
      for ( var i = 0 ; i < l ; i++ ) {
        var c = foam.util.compare(a[i], b[i]);
        if ( c ) return c;
      }
      return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
    },
    function hashCode(a) {
      var hash = 0;

      for ( var i = 0 ; i < a.length ; i++ ) {
        hash = ((hash << 5) - hash) + foam.util.hashCode(a[i]);
      }

      return hash;
    },
    function remove(a, o) {
      for ( var i = 0 ; i < a.length ; i++ ) {
        if ( o === a[i] ) {
          a.splice(i, 1);
        }
      }
    }
  ]
});


foam.LIB({
  name: 'foam.Date',
  methods: [
    function isInstance(o) { return o instanceof Date; },
    function clone(o) { return new Date(o); },
    function getTime(d) { return ! d ? 0 : d.getTime ? d.getTime() : d ; },
    function equals(a, b) { return this.getTime(a) === this.getTime(b); },
    function compare(a, b) {
      a = this.getTime(a);
      b = this.getTime(b);
      return a < b ? -1 : a > b ? 1 : 0;
    },
    function hashCode(d) { var n = d.getTime(); return n & n; },
    function relativeDateString(date) {
      // FUTURE: make this translatable for i18n, including plurals
      //   "hours" vs. "hour"
      var seconds = Math.trunc( ( Date.now() - date.getTime() ) / 1000 );

      if ( seconds >= 0 && seconds < 60 ) return 'moments ago';
      if ( seconds < 0  && seconds > -60 ) return 'in moments';

      var minutes = Math.trunc((seconds) / 60);

      if ( minutes === 1 ) return '1 minute ago';
      if ( minutes === -1 ) return 'in 1 minute';

      if ( minutes >= 0 && minutes < 60 ) return minutes + ' minutes ago';
      if ( minutes < 0  && minutes > -60 ) return 'in ' + -minutes + ' minutes';

      var hours = Math.trunc(minutes / 60);
      if ( hours === 1 ) return '1 hour ago';
      if ( hours === -1 ) return 'in 1 hour';

      if ( hours >= 0 && hours < 24 ) return hours + ' hours ago';
      if ( hours <  0 && hours > -24 ) return 'in ' + -hours + ' hours';

      var days = Math.trunc(hours / 24);
      if ( days === 1 ) return '1 day ago';
      if ( days === -1 ) return 'in 1 day';

      if ( days >= 0 && days < 7 ) return days + ' days ago';
      if ( days <  0 && days > -7 ) return 'in ' + -days + ' days';

      if ( days >= 0 && days < 365 || days < 0 && days > -365 ) {
        var year = 1900 + date.getYear();
        var noyear = date.toDateString().replace(' ' + year, '');
        return noyear.substring(4);
      }

      return date.toDateString().substring(4);
    }
  ]
});


// An FObject is a FOAM-Object, the root class for all modeled classes.
foam.LIB({
  name: 'foam.core.FObject',
  methods: [
    // Can't be an FObject yet because we haven't built the class system yet
    /* istanbul ignore next */
    function isInstance(o) { return false; },
    function clone(o)      { return o ? o.clone() : this; },
    function diff(a, b)    { return a.diff(b); },
    function equals(a, b)  { return a.equals(b); },
    function compare(a, b) { return a.compareTo(b); },
    function hashCode(o)   { return o.hashCode(); }
  ]
});


// AN Object is a Javascript Object which is neither an FObject nor an Array.
foam.LIB({
  name: 'foam.Object',
  methods: [
    function forEach(obj, f) {
      for ( var key in obj ) {
        if ( obj.hasOwnProperty(key) ) f(obj[key], key);
      }
    },
    function isInstance(o) {
      return typeof o === 'object' && ! Array.isArray(o);
    },
    function clone(o) { return o; },
    function equals(a, b) { return a === b; },
    function compare(a, b) {
      return foam.Number.compare(a.$UID, b ? b.$UID : -1);
    },
    function hashCode(o) { return 0; },
    function freeze(o) {
      // Force $UID creation before freezing because it can't
      // be added to the object after it's frozen.
      o.$UID__ = foam.next$UID();
      Object.freeze(o);
    }
  ]
});


/**
  Return the flyweight 'type object' for the provided object.
  Any value is a valid argument, including null and undefined.
*/
foam.typeOf = (function() {
  var tNumber    = foam.Number;
  var tString    = foam.String;
  var tUndefined = foam.Undefined;
  var tNull      = foam.Null;
  var tBoolean   = foam.Boolean;
  var tArray     = foam.Array;
  var tDate      = foam.Date;
  var tFObject   = foam.core.FObject;
  var tFunction  = foam.Function;
  var tObject    = foam.Object;

  return function typeOf(o) {
    if ( tNumber.isInstance(o) )    return tNumber;
    if ( tString.isInstance(o) )    return tString;
    if ( tUndefined.isInstance(o) ) return tUndefined;
    if ( tNull.isInstance(o) )      return tNull;
    if ( tBoolean.isInstance(o) )   return tBoolean;
    if ( tArray.isInstance(o) )     return tArray;
    if ( tDate.isInstance(o) )      return tDate;
    if ( tFunction.isInstance(o) )  return tFunction;
    if ( tFObject.isInstance(o) )   return tFObject;
    return tObject;
  };
})();


foam.LIB({
  name: 'foam',

  methods: [
    function mmethod(map, opt_defaultMethod) {
      var uid = '__mmethod__' + foam.next$UID() + '__';

      var first = true;
      return function(arg1) {
        if ( first ) {
          for ( var key in map ) {
            var type = key === 'FObject' ?
                foam.core.FObject :
                foam[key] || foam.lookup(key);

            type[uid] = map[key];
          }
          first = false;
        }

        var type = arg1 && arg1.cls_ && arg1.cls_[uid] ?
            arg1.cls_ :
            foam.typeOf(arg1) ;

        if ( ! opt_defaultMethod ) {
          foam.assert(type, 'Unknown type: ', arg1,
              'and no default method provided');
          foam.assert(
              type[uid],
              'Missing multi-method for type ', arg1, ' map: ', map,
              'and no deafult method provided');
        }
        return ( type[uid] || opt_defaultMethod ).apply(this, arguments);
      };
    }
  ]
});


(function() {
  var typeOf = foam.typeOf;

  foam.LIB({
    name: 'foam.util',

    methods: [
      function clone(o)      { return typeOf(o).clone(o); },
      function equals(a, b)  { return typeOf(a).equals(a, b); },
      function compare(a, b) { return typeOf(a).compare(a, b); },
      function hashCode(o)   { return typeOf(o).hashCode(o); },
      function diff(a, b)    {
        var t = typeOf(a);
        return t.diff ? t.diff(a, b) : undefined;
      },
    ]
  });
})();


foam.LIB({
  name: 'foam.package',
  methods: [
    /**
     * Registers the given class in the global namespace.
     * If the given class has an id of 'some.package.MyClass'
     * then the class object will be made available globally at
     * global.some.package.MyClass.
     */
    function registerClass(cls) {
      foam.assert(typeof cls === 'object',
          'cls must be an object');
      foam.assert(typeof cls.name === 'string' && cls.name !== '',
          'cls must have a non-empty string name');

      var pkg = foam.package.ensurePackage(global, cls.package);
      pkg[cls.name] = cls;
    },

    /**
     * Register a class lazily in the global namespace.
     * The class is not created until accessed the first time.
     * The provided factory function creates the class.
     */
    function registerClassFactory(m, thunk) {
      var pkg = foam.package.ensurePackage(global, m.package);
      Object.defineProperty(pkg, m.name, {get: thunk, configurable: true});
    },

    /**
     * Walk a dot separated path starting at root, creating empty
     * objects if necessary.
     *
     * ensurePackage(global, 'some.dot.separated.path');
     * will ensure that global.some.dot.separated.path exists with
     * each part being a JS object.
     *
     * Returns root if path is null or undefined.
     */
    function ensurePackage(root, path) {
      if ( path === null ||
           path === undefined ||
           path === '' ) {
        return root;
      }

      foam.assert(typeof path === 'string',
          'Cannot make a package path of a non-string');

      path = path.split('.');
      var node = root;

      for ( var i = 0 ; i < path.length ; i++ ) {
        node = node[path[i]] || ( node[path[i]] = {} );
      }

      return node;
    }
  ]
});


foam.LIB({
  name: 'foam.uuid',
  methods: [
    function randomGUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : ( r & 0x3 | 0x8 );
        return v.toString(16);
      });
    }
  ]
});


foam.LIB({
  name: 'foam.compare',
  methods: [
    function toCompare(c) {
      return foam.Array.isInstance(c)    ? foam.compare.compound(c) :
             foam.Function.isInstance(c) ? { compare: c} :
             c ;
    },

    function compound(args) {
      var cs = args.map(foam.compare.toCompare);

      if ( cs.lengh === 1 ) return cs[0];

      var f = {
        compare: function(o1, o2) {
          for ( var i = 0 ; i < cs.length ; i++ ) {
            var r = cs[i].compare(o1, o2);
            if ( r != 0 ) return r;
          }
          return 0;
        }
      };

      return f;
    }
  ]
});
