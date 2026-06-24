(function(scope){
'use strict';

function F(arity, fun, wrapper) {
  wrapper.a = arity;
  wrapper.f = fun;
  return wrapper;
}

function F2(fun) {
  return F(2, fun, function(a) { return function(b) { return fun(a,b); }; })
}
function F3(fun) {
  return F(3, fun, function(a) {
    return function(b) { return function(c) { return fun(a, b, c); }; };
  });
}
function F4(fun) {
  return F(4, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return fun(a, b, c, d); }; }; };
  });
}
function F5(fun) {
  return F(5, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
  });
}
function F6(fun) {
  return F(6, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return fun(a, b, c, d, e, f); }; }; }; }; };
  });
}
function F7(fun) {
  return F(7, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
  });
}
function F8(fun) {
  return F(8, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) {
    return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
  });
}
function F9(fun) {
  return F(9, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) { return function(i) {
    return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
  });
}

function A2(fun, a, b) {
  return fun.a === 2 ? fun.f(a, b) : fun(a)(b);
}
function A3(fun, a, b, c) {
  return fun.a === 3 ? fun.f(a, b, c) : fun(a)(b)(c);
}
function A4(fun, a, b, c, d) {
  return fun.a === 4 ? fun.f(a, b, c, d) : fun(a)(b)(c)(d);
}
function A5(fun, a, b, c, d, e) {
  return fun.a === 5 ? fun.f(a, b, c, d, e) : fun(a)(b)(c)(d)(e);
}
function A6(fun, a, b, c, d, e, f) {
  return fun.a === 6 ? fun.f(a, b, c, d, e, f) : fun(a)(b)(c)(d)(e)(f);
}
function A7(fun, a, b, c, d, e, f, g) {
  return fun.a === 7 ? fun.f(a, b, c, d, e, f, g) : fun(a)(b)(c)(d)(e)(f)(g);
}
function A8(fun, a, b, c, d, e, f, g, h) {
  return fun.a === 8 ? fun.f(a, b, c, d, e, f, g, h) : fun(a)(b)(c)(d)(e)(f)(g)(h);
}
function A9(fun, a, b, c, d, e, f, g, h, i) {
  return fun.a === 9 ? fun.f(a, b, c, d, e, f, g, h, i) : fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
}

console.warn('Compiled in DEV mode. Follow the advice at https://elm-lang.org/0.19.2/optimize for better performance and smaller assets.');


// EQUALITY

function _Utils_eq(x, y)
{
	for (
		var pair, stack = [], isEqual = _Utils_eqHelp(x, y, 0, stack);
		isEqual && (pair = stack.pop());
		isEqual = _Utils_eqHelp(pair.a, pair.b, 0, stack)
		)
	{}

	return isEqual;
}

function _Utils_eqHelp(x, y, depth, stack)
{
	if (x === y)
	{
		return true;
	}

	if (typeof x !== 'object' || x === null || y === null)
	{
		typeof x === 'function' && _Debug_crash(5);
		return false;
	}

	if (depth > 100)
	{
		stack.push(_Utils_Tuple2(x,y));
		return true;
	}

	/**/
	if (x.$ === 'Set_elm_builtin')
	{
		x = $elm$core$Set$toList(x);
		y = $elm$core$Set$toList(y);
	}
	if (x.$ === 'RBNode_elm_builtin' || x.$ === 'RBEmpty_elm_builtin')
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	/**_UNUSED/
	if (x.$ < 0)
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	for (var key in x)
	{
		if (!_Utils_eqHelp(x[key], y[key], depth + 1, stack))
		{
			return false;
		}
	}
	return true;
}

var _Utils_equal = F2(_Utils_eq);
var _Utils_notEqual = F2(function(a, b) { return !_Utils_eq(a,b); });



// COMPARISONS

// Code in Generate/JavaScript.hs, Basics.js, and List.js depends on
// the particular integer values assigned to LT, EQ, and GT.

function _Utils_cmp(x, y, ord)
{
	if (typeof x !== 'object')
	{
		return x === y ? /*EQ*/ 0 : x < y ? /*LT*/ -1 : /*GT*/ 1;
	}

	/**/
	if (x instanceof String)
	{
		var a = x.valueOf();
		var b = y.valueOf();
		return a === b ? 0 : a < b ? -1 : 1;
	}
	//*/

	/**_UNUSED/
	if (typeof x.$ === 'undefined')
	//*/
	/**/
	if (x.$[0] === '#')
	//*/
	{
		return (ord = _Utils_cmp(x.a, y.a))
			? ord
			: (ord = _Utils_cmp(x.b, y.b))
				? ord
				: _Utils_cmp(x.c, y.c);
	}

	// traverse conses until end of a list or a mismatch
	for (; x.b && y.b && !(ord = _Utils_cmp(x.a, y.a)); x = x.b, y = y.b) {} // WHILE_CONSES
	return ord || (x.b ? /*GT*/ 1 : y.b ? /*LT*/ -1 : /*EQ*/ 0);
}

var _Utils_lt = F2(function(a, b) { return _Utils_cmp(a, b) < 0; });
var _Utils_le = F2(function(a, b) { return _Utils_cmp(a, b) < 1; });
var _Utils_gt = F2(function(a, b) { return _Utils_cmp(a, b) > 0; });
var _Utils_ge = F2(function(a, b) { return _Utils_cmp(a, b) >= 0; });

var _Utils_compare = F2(function(x, y)
{
	var n = _Utils_cmp(x, y);
	return n < 0 ? $elm$core$Basics$LT : n ? $elm$core$Basics$GT : $elm$core$Basics$EQ;
});


// COMMON VALUES

var _Utils_Tuple0_UNUSED = 0;
var _Utils_Tuple0 = { $: '#0' };

function _Utils_Tuple2_UNUSED(a, b) { return { a: a, b: b }; }
function _Utils_Tuple2(a, b) { return { $: '#2', a: a, b: b }; }

function _Utils_Tuple3_UNUSED(a, b, c) { return { a: a, b: b, c: c }; }
function _Utils_Tuple3(a, b, c) { return { $: '#3', a: a, b: b, c: c }; }

function _Utils_chr_UNUSED(c) { return c; }
function _Utils_chr(c) { return new String(c); }


// RECORDS

function _Utils_update(oldRecord, updatedFields)
{
	var newRecord = {};

	for (var key in oldRecord)
	{
		newRecord[key] = oldRecord[key];
	}

	for (var key in updatedFields)
	{
		newRecord[key] = updatedFields[key];
	}

	return newRecord;
}


// APPEND

var _Utils_append = F2(_Utils_ap);

function _Utils_ap(xs, ys)
{
	// append Strings
	if (typeof xs === 'string')
	{
		return xs + ys;
	}

	// append Lists
	if (!xs.b)
	{
		return ys;
	}
	var root = _List_Cons(xs.a, ys);
	xs = xs.b
	for (var curr = root; xs.b; xs = xs.b) // WHILE_CONS
	{
		curr = curr.b = _List_Cons(xs.a, ys);
	}
	return root;
}



var _List_Nil_UNUSED = { $: 0 };
var _List_Nil = { $: '[]' };

function _List_Cons_UNUSED(hd, tl) { return { $: 1, a: hd, b: tl }; }
function _List_Cons(hd, tl) { return { $: '::', a: hd, b: tl }; }


var _List_cons = F2(_List_Cons);

function _List_fromArray(arr)
{
	var out = _List_Nil;
	for (var i = arr.length; i--; )
	{
		out = _List_Cons(arr[i], out);
	}
	return out;
}

function _List_toArray(xs)
{
	for (var out = []; xs.b; xs = xs.b) // WHILE_CONS
	{
		out.push(xs.a);
	}
	return out;
}

var _List_map2 = F3(function(f, xs, ys)
{
	for (var arr = []; xs.b && ys.b; xs = xs.b, ys = ys.b) // WHILE_CONSES
	{
		arr.push(A2(f, xs.a, ys.a));
	}
	return _List_fromArray(arr);
});

var _List_map3 = F4(function(f, xs, ys, zs)
{
	for (var arr = []; xs.b && ys.b && zs.b; xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A3(f, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map4 = F5(function(f, ws, xs, ys, zs)
{
	for (var arr = []; ws.b && xs.b && ys.b && zs.b; ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A4(f, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map5 = F6(function(f, vs, ws, xs, ys, zs)
{
	for (var arr = []; vs.b && ws.b && xs.b && ys.b && zs.b; vs = vs.b, ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A5(f, vs.a, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_sortBy = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		return _Utils_cmp(f(a), f(b));
	}));
});

var _List_sortWith = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		var ord = A2(f, a, b);
		return ord === $elm$core$Basics$EQ ? 0 : ord === $elm$core$Basics$LT ? -1 : 1;
	}));
});



var _JsArray_empty = [];

function _JsArray_singleton(value)
{
    return [value];
}

function _JsArray_length(array)
{
    return array.length;
}

var _JsArray_initialize = F3(function(size, offset, func)
{
    var result = new Array(size);

    for (var i = 0; i < size; i++)
    {
        result[i] = func(offset + i);
    }

    return result;
});

var _JsArray_initializeFromList = F2(function (max, ls)
{
    var result = new Array(max);

    for (var i = 0; i < max && ls.b; i++)
    {
        result[i] = ls.a;
        ls = ls.b;
    }

    result.length = i;
    return _Utils_Tuple2(result, ls);
});

var _JsArray_unsafeGet = F2(function(index, array)
{
    return array[index];
});

var _JsArray_unsafeSet = F3(function(index, value, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[index] = value;
    return result;
});

var _JsArray_push = F2(function(value, array)
{
    var length = array.length;
    var result = new Array(length + 1);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[length] = value;
    return result;
});

var _JsArray_foldl = F3(function(func, acc, array)
{
    var length = array.length;

    for (var i = 0; i < length; i++)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_foldr = F3(function(func, acc, array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_map = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = func(array[i]);
    }

    return result;
});

var _JsArray_indexedMap = F3(function(func, offset, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = A2(func, offset + i, array[i]);
    }

    return result;
});

var _JsArray_slice = F3(function(from, to, array)
{
    return array.slice(from, to);
});

var _JsArray_appendN = F3(function(n, dest, source)
{
    var destLen = dest.length;
    var itemsToCopy = n - destLen;

    if (itemsToCopy > source.length)
    {
        itemsToCopy = source.length;
    }

    var size = destLen + itemsToCopy;
    var result = new Array(size);

    for (var i = 0; i < destLen; i++)
    {
        result[i] = dest[i];
    }

    for (var i = 0; i < itemsToCopy; i++)
    {
        result[i + destLen] = source[i];
    }

    return result;
});



// LOG

var _Debug_log_UNUSED = F2(function(tag, value)
{
	return value;
});

var _Debug_log = F2(function(tag, value)
{
	console.log(tag + ': ' + _Debug_toString(value));
	return value;
});


// TODOS

function _Debug_todo(moduleName, region)
{
	return function(message) {
		_Debug_crash(8, moduleName, region, message);
	};
}

function _Debug_todoCase(moduleName, region, value)
{
	return function(message) {
		_Debug_crash(9, moduleName, region, value, message);
	};
}


// TO STRING

function _Debug_toString_UNUSED(value)
{
	return '<internals>';
}

function _Debug_toString(value)
{
	return _Debug_toAnsiString(false, value);
}

function _Debug_toAnsiString(ansi, value)
{
	if (typeof value === 'function')
	{
		return _Debug_internalColor(ansi, '<function>');
	}

	if (typeof value === 'boolean')
	{
		return _Debug_ctorColor(ansi, value ? 'True' : 'False');
	}

	if (typeof value === 'number')
	{
		return _Debug_numberColor(ansi, value + '');
	}

	if (value instanceof String)
	{
		return _Debug_charColor(ansi, "'" + _Debug_addSlashes(value, true) + "'");
	}

	if (typeof value === 'string')
	{
		return _Debug_stringColor(ansi, '"' + _Debug_addSlashes(value, false) + '"');
	}

	if (typeof value === 'object' && '$' in value)
	{
		var tag = value.$;

		if (typeof tag === 'number')
		{
			return _Debug_internalColor(ansi, '<internals>');
		}

		if (tag[0] === '#')
		{
			var output = [];
			for (var k in value)
			{
				if (k === '$') continue;
				output.push(_Debug_toAnsiString(ansi, value[k]));
			}
			return '(' + output.join(',') + ')';
		}

		if (tag === 'Set_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Set')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Set$toList(value));
		}

		if (tag === 'RBNode_elm_builtin' || tag === 'RBEmpty_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Dict')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Dict$toList(value));
		}

		if (tag === 'Array_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Array')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Array$toList(value));
		}

		if (tag === '::' || tag === '[]')
		{
			var output = '[';

			value.b && (output += _Debug_toAnsiString(ansi, value.a), value = value.b)

			for (; value.b; value = value.b) // WHILE_CONS
			{
				output += ',' + _Debug_toAnsiString(ansi, value.a);
			}
			return output + ']';
		}

		var output = '';
		for (var i in value)
		{
			if (i === '$') continue;
			var str = _Debug_toAnsiString(ansi, value[i]);
			var c0 = str[0];
			var parenless = c0 === '{' || c0 === '(' || c0 === '[' || c0 === '<' || c0 === '"' || str.indexOf(' ') < 0;
			output += ' ' + (parenless ? str : '(' + str + ')');
		}
		return _Debug_ctorColor(ansi, tag) + output;
	}

	if (typeof DataView === 'function' && value instanceof DataView)
	{
		return _Debug_stringColor(ansi, '<' + value.byteLength + ' bytes>');
	}

	if (typeof File !== 'undefined' && value instanceof File)
	{
		return _Debug_internalColor(ansi, '<' + value.name + '>');
	}

	if (typeof value === 'object')
	{
		var output = [];
		for (var key in value)
		{
			var field = key[0] === '_' ? key.slice(1) : key;
			output.push(_Debug_fadeColor(ansi, field) + ' = ' + _Debug_toAnsiString(ansi, value[key]));
		}
		if (output.length === 0)
		{
			return '{}';
		}
		return '{ ' + output.join(', ') + ' }';
	}

	return _Debug_internalColor(ansi, '<internals>');
}

function _Debug_addSlashes(str, isChar)
{
	var s = str
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r')
		.replace(/\v/g, '\\v')
		.replace(/\0/g, '\\0');

	if (isChar)
	{
		return s.replace(/\'/g, '\\\'');
	}
	else
	{
		return s.replace(/\"/g, '\\"');
	}
}

function _Debug_ctorColor(ansi, string)
{
	return ansi ? '\x1b[96m' + string + '\x1b[0m' : string;
}

function _Debug_numberColor(ansi, string)
{
	return ansi ? '\x1b[95m' + string + '\x1b[0m' : string;
}

function _Debug_stringColor(ansi, string)
{
	return ansi ? '\x1b[93m' + string + '\x1b[0m' : string;
}

function _Debug_charColor(ansi, string)
{
	return ansi ? '\x1b[92m' + string + '\x1b[0m' : string;
}

function _Debug_fadeColor(ansi, string)
{
	return ansi ? '\x1b[37m' + string + '\x1b[0m' : string;
}

function _Debug_internalColor(ansi, string)
{
	return ansi ? '\x1b[36m' + string + '\x1b[0m' : string;
}

function _Debug_toHexDigit(n)
{
	return String.fromCharCode(n < 10 ? 48 + n : 55 + n);
}


// CRASH


function _Debug_crash_UNUSED(identifier)
{
	throw new Error('https://github.com/elm/core/blob/1.0.0/hints/' + identifier + '.md');
}


function _Debug_crash(identifier, fact1, fact2, fact3, fact4)
{
	switch(identifier)
	{
		case 0:
			throw new Error('What node should I take over? In JavaScript I need something like:\n\n    Elm.Main.init({\n        node: document.getElementById("elm-node")\n    })\n\nYou need to do this with any Browser.sandbox or Browser.element program.');

		case 1:
			throw new Error('Browser.application programs cannot handle URLs like this:\n\n    ' + document.location.href + '\n\nWhat is the root? The root of your file system? Try looking at this program with `elm reactor` or some other server.');

		case 2:
			var jsonErrorString = fact1;
			throw new Error('Problem with the flags given to your Elm program on initialization.\n\n' + jsonErrorString);

		case 3:
			var portName = fact1;
			throw new Error('There can only be one port named `' + portName + '`, but your program has multiple.');

		case 4:
			var portName = fact1;
			var problem = fact2;
			throw new Error('Trying to send an unexpected type of value through port `' + portName + '`:\n' + problem);

		case 5:
			throw new Error('Trying to use `(==)` on functions.\nThere is no way to know if functions are "the same" in the Elm sense.\nRead more about this at https://package.elm-lang.org/packages/elm/core/latest/Basics#== which describes why it is this way and what the better version will look like.');

		case 6:
			var moduleName = fact1;
			throw new Error('Your page is loading multiple Elm scripts with a module named ' + moduleName + '. Maybe a duplicate script is getting loaded accidentally? If not, rename one of them so I know which is which!');

		case 8:
			var moduleName = fact1;
			var region = fact2;
			var message = fact3;
			throw new Error('TODO in module `' + moduleName + '` ' + _Debug_regionToString(region) + '\n\n' + message);

		case 9:
			var moduleName = fact1;
			var region = fact2;
			var value = fact3;
			var message = fact4;
			throw new Error(
				'TODO in module `' + moduleName + '` from the `case` expression '
				+ _Debug_regionToString(region) + '\n\nIt received the following value:\n\n    '
				+ _Debug_toString(value).replace('\n', '\n    ')
				+ '\n\nBut the branch that handles it says:\n\n    ' + message.replace('\n', '\n    ')
			);

		case 10:
			throw new Error('Bug in https://github.com/elm/virtual-dom/issues');

		case 11:
			throw new Error('Cannot perform mod 0. Division by zero error.');
	}
}

function _Debug_regionToString(region)
{
	if (region.start.line === region.end.line)
	{
		return 'on line ' + region.start.line;
	}
	return 'on lines ' + region.start.line + ' through ' + region.end.line;
}



// MATH

var _Basics_add = F2(function(a, b) { return a + b; });
var _Basics_sub = F2(function(a, b) { return a - b; });
var _Basics_mul = F2(function(a, b) { return a * b; });
var _Basics_fdiv = F2(function(a, b) { return a / b; });
var _Basics_idiv = F2(function(a, b) { return (a / b) | 0; });
var _Basics_pow = F2(Math.pow);

var _Basics_remainderBy = F2(function(b, a) { return a % b; });

// https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/divmodnote-letter.pdf
var _Basics_modBy = F2(function(modulus, x)
{
	var answer = x % modulus;
	return modulus === 0
		? _Debug_crash(11)
		:
	((answer > 0 && modulus < 0) || (answer < 0 && modulus > 0))
		? answer + modulus
		: answer;
});


// TRIGONOMETRY

var _Basics_pi = Math.PI;
var _Basics_e = Math.E;
var _Basics_cos = Math.cos;
var _Basics_sin = Math.sin;
var _Basics_tan = Math.tan;
var _Basics_acos = Math.acos;
var _Basics_asin = Math.asin;
var _Basics_atan = Math.atan;
var _Basics_atan2 = F2(Math.atan2);


// MORE MATH

function _Basics_toFloat(x) { return x; }
function _Basics_truncate(n) { return n | 0; }
function _Basics_isInfinite(n) { return n === Infinity || n === -Infinity; }

var _Basics_ceiling = Math.ceil;
var _Basics_floor = Math.floor;
var _Basics_round = Math.round;
var _Basics_sqrt = Math.sqrt;
var _Basics_log = Math.log;
var _Basics_isNaN = isNaN;


// BOOLEANS

function _Basics_not(bool) { return !bool; }
var _Basics_and = F2(function(a, b) { return a && b; });
var _Basics_or  = F2(function(a, b) { return a || b; });
var _Basics_xor = F2(function(a, b) { return a !== b; });



var _String_cons = F2(function(chr, str)
{
	return chr + str;
});

function _String_uncons(string)
{
	var word = string.charCodeAt(0);
	return !isNaN(word)
		? $elm$core$Maybe$Just(
			0xD800 <= word && word <= 0xDBFF
				? _Utils_Tuple2(_Utils_chr(string[0] + string[1]), string.slice(2))
				: _Utils_Tuple2(_Utils_chr(string[0]), string.slice(1))
		)
		: $elm$core$Maybe$Nothing;
}

var _String_append = F2(function(a, b)
{
	return a + b;
});

function _String_length(str)
{
	return str.length;
}

var _String_map = F2(function(func, string)
{
	var len = string.length;
	var array = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = string.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			array[i] = func(_Utils_chr(string[i] + string[i+1]));
			i += 2;
			continue;
		}
		array[i] = func(_Utils_chr(string[i]));
		i++;
	}
	return array.join('');
});

var _String_filter = F2(function(isGood, str)
{
	var arr = [];
	var len = str.length;
	var i = 0;
	while (i < len)
	{
		var char = str[i];
		var word = str.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += str[i];
			i++;
		}

		if (isGood(_Utils_chr(char)))
		{
			arr.push(char);
		}
	}
	return arr.join('');
});

function _String_reverse(str)
{
	var len = str.length;
	var arr = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = str.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			arr[len - i] = str[i + 1];
			i++;
			arr[len - i] = str[i - 1];
			i++;
		}
		else
		{
			arr[len - i] = str[i];
			i++;
		}
	}
	return arr.join('');
}

var _String_foldl = F3(function(func, state, string)
{
	var len = string.length;
	var i = 0;
	while (i < len)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += string[i];
			i++;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_foldr = F3(function(func, state, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_split = F2(function(sep, str)
{
	return str.split(sep);
});

var _String_join = F2(function(sep, strs)
{
	return strs.join(sep);
});

var _String_slice = F3(function(start, end, str) {
	return str.slice(start, end);
});

function _String_trim(str)
{
	return str.trim();
}

function _String_trimLeft(str)
{
	return str.replace(/^\s+/, '');
}

function _String_trimRight(str)
{
	return str.replace(/\s+$/, '');
}

function _String_words(str)
{
	return _List_fromArray(str.trim().split(/\s+/g));
}

function _String_lines(str)
{
	return _List_fromArray(str.split(/\r\n|\r|\n/g));
}

function _String_toUpper(str)
{
	return str.toUpperCase();
}

function _String_toLower(str)
{
	return str.toLowerCase();
}

var _String_any = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (isGood(_Utils_chr(char)))
		{
			return true;
		}
	}
	return false;
});

var _String_all = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (!isGood(_Utils_chr(char)))
		{
			return false;
		}
	}
	return true;
});

var _String_contains = F2(function(sub, str)
{
	return str.indexOf(sub) > -1;
});

var _String_startsWith = F2(function(sub, str)
{
	return str.indexOf(sub) === 0;
});

var _String_endsWith = F2(function(sub, str)
{
	return str.length >= sub.length &&
		str.lastIndexOf(sub) === str.length - sub.length;
});

var _String_indexes = F2(function(sub, str)
{
	var subLen = sub.length;

	if (subLen < 1)
	{
		return _List_Nil;
	}

	var i = 0;
	var is = [];

	while ((i = str.indexOf(sub, i)) > -1)
	{
		is.push(i);
		i = i + subLen;
	}

	return _List_fromArray(is);
});


// TO STRING

function _String_fromNumber(number)
{
	return number + '';
}


// INT CONVERSIONS

function _String_toInt(str)
{
	var total = 0;
	var code0 = str.charCodeAt(0);
	var start = code0 == 0x2B /* + */ || code0 == 0x2D /* - */ ? 1 : 0;

	for (var i = start; i < str.length; ++i)
	{
		var code = str.charCodeAt(i);
		if (code < 0x30 || 0x39 < code)
		{
			return $elm$core$Maybe$Nothing;
		}
		total = 10 * total + code - 0x30;
	}

	return i == start
		? $elm$core$Maybe$Nothing
		: $elm$core$Maybe$Just(code0 == 0x2D ? -total : total);
}


// FLOAT CONVERSIONS

function _String_toFloat(s)
{
	// check if it is a hex, octal, or binary number
	if (s.length === 0 || /[\sxbo]/.test(s))
	{
		return $elm$core$Maybe$Nothing;
	}
	var n = +s;
	// faster isNaN check
	return n === n ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
}

function _String_fromList(chars)
{
	return _List_toArray(chars).join('');
}




function _Char_toCode(char)
{
	var code = char.charCodeAt(0);
	if (0xD800 <= code && code <= 0xDBFF)
	{
		return (code - 0xD800) * 0x400 + char.charCodeAt(1) - 0xDC00 + 0x10000
	}
	return code;
}

function _Char_fromCode(code)
{
	return _Utils_chr(
		(code < 0 || 0x10FFFF < code)
			? '\uFFFD'
			:
		(code <= 0xFFFF)
			? String.fromCharCode(code)
			:
		(code -= 0x10000,
			String.fromCharCode(Math.floor(code / 0x400) + 0xD800, code % 0x400 + 0xDC00)
		)
	);
}

function _Char_toUpper(char)
{
	return _Utils_chr(char.toUpperCase());
}

function _Char_toLower(char)
{
	return _Utils_chr(char.toLowerCase());
}

function _Char_toLocaleUpper(char)
{
	return _Utils_chr(char.toLocaleUpperCase());
}

function _Char_toLocaleLower(char)
{
	return _Utils_chr(char.toLocaleLowerCase());
}



/**/
function _Json_errorToString(error)
{
	return $elm$json$Json$Decode$errorToString(error);
}
//*/


// CORE DECODERS

function _Json_succeed(msg)
{
	return {
		$: 0,
		a: msg
	};
}

function _Json_fail(msg)
{
	return {
		$: 1,
		a: msg
	};
}

function _Json_decodePrim(decoder)
{
	return { $: 2, b: decoder };
}

var _Json_decodeInt = _Json_decodePrim(function(value) {
	return (typeof value !== 'number')
		? _Json_expecting('an INT', value)
		:
	(-2147483647 < value && value < 2147483647 && (value | 0) === value)
		? $elm$core$Result$Ok(value)
		:
	(isFinite(value) && !(value % 1))
		? $elm$core$Result$Ok(value)
		: _Json_expecting('an INT', value);
});

var _Json_decodeBool = _Json_decodePrim(function(value) {
	return (typeof value === 'boolean')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a BOOL', value);
});

var _Json_decodeFloat = _Json_decodePrim(function(value) {
	return (typeof value === 'number')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a FLOAT', value);
});

var _Json_decodeValue = _Json_decodePrim(function(value) {
	return $elm$core$Result$Ok(_Json_wrap(value));
});

var _Json_decodeString = _Json_decodePrim(function(value) {
	return (typeof value === 'string')
		? $elm$core$Result$Ok(value)
		: (value instanceof String)
			? $elm$core$Result$Ok(value + '')
			: _Json_expecting('a STRING', value);
});

function _Json_decodeList(decoder) { return { $: 3, b: decoder }; }
function _Json_decodeArray(decoder) { return { $: 4, b: decoder }; }

function _Json_decodeNull(value) { return { $: 5, c: value }; }

var _Json_decodeField = F2(function(field, decoder)
{
	return {
		$: 6,
		d: field,
		b: decoder
	};
});

var _Json_decodeIndex = F2(function(index, decoder)
{
	return {
		$: 7,
		e: index,
		b: decoder
	};
});

function _Json_decodeKeyValuePairs(decoder)
{
	return {
		$: 8,
		b: decoder
	};
}

function _Json_mapMany(f, decoders)
{
	return {
		$: 9,
		f: f,
		g: decoders
	};
}

var _Json_andThen = F2(function(callback, decoder)
{
	return {
		$: 10,
		b: decoder,
		h: callback
	};
});

function _Json_oneOf(decoders)
{
	return {
		$: 11,
		g: decoders
	};
}


// DECODING OBJECTS

var _Json_map1 = F2(function(f, d1)
{
	return _Json_mapMany(f, [d1]);
});

var _Json_map2 = F3(function(f, d1, d2)
{
	return _Json_mapMany(f, [d1, d2]);
});

var _Json_map3 = F4(function(f, d1, d2, d3)
{
	return _Json_mapMany(f, [d1, d2, d3]);
});

var _Json_map4 = F5(function(f, d1, d2, d3, d4)
{
	return _Json_mapMany(f, [d1, d2, d3, d4]);
});

var _Json_map5 = F6(function(f, d1, d2, d3, d4, d5)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5]);
});

var _Json_map6 = F7(function(f, d1, d2, d3, d4, d5, d6)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6]);
});

var _Json_map7 = F8(function(f, d1, d2, d3, d4, d5, d6, d7)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
});

var _Json_map8 = F9(function(f, d1, d2, d3, d4, d5, d6, d7, d8)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
});


// DECODE

var _Json_runOnString = F2(function(decoder, string)
{
	try
	{
		var value = JSON.parse(string);
		return _Json_runHelp(decoder, value);
	}
	catch (e)
	{
		return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'This is not valid JSON! ' + e.message, _Json_wrap(string)));
	}
});

var _Json_run = F2(function(decoder, value)
{
	return _Json_runHelp(decoder, _Json_unwrap(value));
});

function _Json_runHelp(decoder, value)
{
	switch (decoder.$)
	{
		case 2:
			return decoder.b(value);

		case 5:
			return (value === null)
				? $elm$core$Result$Ok(decoder.c)
				: _Json_expecting('null', value);

		case 3:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('a LIST', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _List_fromArray);

		case 4:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _Json_toElmArray);

		case 6:
			var field = decoder.d;
			if (typeof value !== 'object' || value === null || !(field in value))
			{
				return _Json_expecting('an OBJECT with a field named `' + field + '`', value);
			}
			var result = _Json_runHelp(decoder.b, value[field]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, field, result.a));

		case 7:
			var index = decoder.e;
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			if (index >= value.length)
			{
				return _Json_expecting('a LONGER array. Need index ' + index + ' but only see ' + value.length + ' entries', value);
			}
			var result = _Json_runHelp(decoder.b, value[index]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, index, result.a));

		case 8:
			if (typeof value !== 'object' || value === null || _Json_isArray(value))
			{
				return _Json_expecting('an OBJECT', value);
			}

			var keyValuePairs = _List_Nil;
			// TODO test perf of Object.keys and switch when support is good enough
			for (var key in value)
			{
				if (Object.prototype.hasOwnProperty.call(value, key))
				{
					var result = _Json_runHelp(decoder.b, value[key]);
					if (!$elm$core$Result$isOk(result))
					{
						return $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, key, result.a));
					}
					keyValuePairs = _List_Cons(_Utils_Tuple2(key, result.a), keyValuePairs);
				}
			}
			return $elm$core$Result$Ok($elm$core$List$reverse(keyValuePairs));

		case 9:
			var answer = decoder.f;
			var decoders = decoder.g;
			for (var i = 0; i < decoders.length; i++)
			{
				var result = _Json_runHelp(decoders[i], value);
				if (!$elm$core$Result$isOk(result))
				{
					return result;
				}
				answer = answer(result.a);
			}
			return $elm$core$Result$Ok(answer);

		case 10:
			var result = _Json_runHelp(decoder.b, value);
			return (!$elm$core$Result$isOk(result))
				? result
				: _Json_runHelp(decoder.h(result.a), value);

		case 11:
			var errors = _List_Nil;
			for (var temp = decoder.g; temp.b; temp = temp.b) // WHILE_CONS
			{
				var result = _Json_runHelp(temp.a, value);
				if ($elm$core$Result$isOk(result))
				{
					return result;
				}
				errors = _List_Cons(result.a, errors);
			}
			return $elm$core$Result$Err($elm$json$Json$Decode$OneOf($elm$core$List$reverse(errors)));

		case 1:
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, decoder.a, _Json_wrap(value)));

		case 0:
			return $elm$core$Result$Ok(decoder.a);
	}
}

function _Json_runArrayDecoder(decoder, value, toElmValue)
{
	var len = value.length;
	var array = new Array(len);
	for (var i = 0; i < len; i++)
	{
		var result = _Json_runHelp(decoder, value[i]);
		if (!$elm$core$Result$isOk(result))
		{
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, i, result.a));
		}
		array[i] = result.a;
	}
	return $elm$core$Result$Ok(toElmValue(array));
}

function _Json_isArray(value)
{
	return Array.isArray(value) || (typeof FileList !== 'undefined' && value instanceof FileList);
}

function _Json_toElmArray(array)
{
	return A2($elm$core$Array$initialize, array.length, function(i) { return array[i]; });
}

function _Json_expecting(type, value)
{
	return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'Expecting ' + type, _Json_wrap(value)));
}


// EQUALITY

function _Json_equality(x, y)
{
	if (x === y)
	{
		return true;
	}

	if (x.$ !== y.$)
	{
		return false;
	}

	switch (x.$)
	{
		case 0:
		case 1:
			return x.a === y.a;

		case 2:
			return x.b === y.b;

		case 5:
			return x.c === y.c;

		case 3:
		case 4:
		case 8:
			return _Json_equality(x.b, y.b);

		case 6:
			return x.d === y.d && _Json_equality(x.b, y.b);

		case 7:
			return x.e === y.e && _Json_equality(x.b, y.b);

		case 9:
			return x.f === y.f && _Json_listEquality(x.g, y.g);

		case 10:
			return x.h === y.h && _Json_equality(x.b, y.b);

		case 11:
			return _Json_listEquality(x.g, y.g);
	}
}

function _Json_listEquality(aDecoders, bDecoders)
{
	var len = aDecoders.length;
	if (len !== bDecoders.length)
	{
		return false;
	}
	for (var i = 0; i < len; i++)
	{
		if (!_Json_equality(aDecoders[i], bDecoders[i]))
		{
			return false;
		}
	}
	return true;
}


// ENCODE

var _Json_encode = F2(function(indentLevel, value)
{
	return JSON.stringify(_Json_unwrap(value), null, indentLevel) + '';
});

function _Json_wrap(value) { return { $: 0, a: value }; }
function _Json_unwrap(value) { return value.a; }

function _Json_wrap_UNUSED(value) { return value; }
function _Json_unwrap_UNUSED(value) { return value; }

function _Json_emptyArray() { return []; }
function _Json_emptyObject() { return {}; }

var _Json_addField = F3(function(key, value, object)
{
	var unwrapped = _Json_unwrap(value);
	if (!(key === 'toJSON' && typeof unwrapped === 'function'))
	{
		object[key] = unwrapped;
	}
	return object;
});

function _Json_addEntry(func)
{
	return F2(function(entry, array)
	{
		array.push(_Json_unwrap(func(entry)));
		return array;
	});
}

var _Json_encodeNull = _Json_wrap(null);



// TASKS

function _Scheduler_succeed(value)
{
	return {
		$: 0,
		a: value
	};
}

function _Scheduler_fail(error)
{
	return {
		$: 1,
		a: error
	};
}

function _Scheduler_binding(callback)
{
	return {
		$: 2,
		b: callback,
		c: null
	};
}

var _Scheduler_andThen = F2(function(callback, task)
{
	return {
		$: 3,
		b: callback,
		d: task
	};
});

var _Scheduler_onError = F2(function(callback, task)
{
	return {
		$: 4,
		b: callback,
		d: task
	};
});

function _Scheduler_receive(callback)
{
	return {
		$: 5,
		b: callback
	};
}


// PROCESSES

var _Scheduler_guid = 0;

function _Scheduler_rawSpawn(task)
{
	var proc = {
		$: 0,
		e: _Scheduler_guid++,
		f: task,
		g: null,
		h: []
	};

	_Scheduler_enqueue(proc);

	return proc;
}

function _Scheduler_spawn(task)
{
	return _Scheduler_binding(function(callback) {
		callback(_Scheduler_succeed(_Scheduler_rawSpawn(task)));
	});
}

function _Scheduler_rawSend(proc, msg)
{
	proc.h.push(msg);
	_Scheduler_enqueue(proc);
}

var _Scheduler_send = F2(function(proc, msg)
{
	return _Scheduler_binding(function(callback) {
		_Scheduler_rawSend(proc, msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});

function _Scheduler_kill(proc)
{
	return _Scheduler_binding(function(callback) {
		var task = proc.f;
		if (task.$ === 2 && task.c)
		{
			task.c();
		}

		proc.f = null;

		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
}


/* STEP PROCESSES

type alias Process =
  { $ : tag
  , id : unique_id
  , root : Task
  , stack : null | { $: SUCCEED | FAIL, a: callback, b: stack }
  , mailbox : [msg]
  }

*/


var _Scheduler_working = false;
var _Scheduler_queue = [];


function _Scheduler_enqueue(proc)
{
	_Scheduler_queue.push(proc);
	if (_Scheduler_working)
	{
		return;
	}
	_Scheduler_working = true;
	while (proc = _Scheduler_queue.shift())
	{
		_Scheduler_step(proc);
	}
	_Scheduler_working = false;
}


function _Scheduler_step(proc)
{
	while (proc.f)
	{
		var rootTag = proc.f.$;
		if (rootTag === 0 || rootTag === 1)
		{
			while (proc.g && proc.g.$ !== rootTag)
			{
				proc.g = proc.g.i;
			}
			if (!proc.g)
			{
				return;
			}
			proc.f = proc.g.b(proc.f.a);
			proc.g = proc.g.i;
		}
		else if (rootTag === 2)
		{
			proc.f.c = proc.f.b(function(newRoot) {
				proc.f = newRoot;
				_Scheduler_enqueue(proc);
			});
			return;
		}
		else if (rootTag === 5)
		{
			if (proc.h.length === 0)
			{
				return;
			}
			proc.f = proc.f.b(proc.h.shift());
		}
		else // if (rootTag === 3 || rootTag === 4)
		{
			proc.g = {
				$: rootTag === 3 ? 0 : 1,
				b: proc.f.b,
				i: proc.g
			};
			proc.f = proc.f.d;
		}
	}
}



function _Process_sleep(time)
{
	return _Scheduler_binding(function(callback) {
		var id = setTimeout(function() {
			callback(_Scheduler_succeed(_Utils_Tuple0));
		}, time);

		return function() { clearTimeout(id); };
	});
}




// PROGRAMS


var _Platform_worker = F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function() { return function() {} }
	);
});



// INITIALIZE A PROGRAM


function _Platform_initialize(flagDecoder, args, init, update, subscriptions, stepperBuilder)
{
	var result = A2(_Json_run, flagDecoder, _Json_wrap(args ? args['flags'] : undefined));
	$elm$core$Result$isOk(result) || _Debug_crash(2 /**/, _Json_errorToString(result.a) /**/);
	var managers = {};
	var initPair = init(result.a);
	var model = initPair.a;
	var stepper = stepperBuilder(sendToApp, model);
	var ports = _Platform_setupEffects(managers, sendToApp);

	function sendToApp(msg, viewMetadata)
	{
		var pair = A2(update, msg, model);
		stepper(model = pair.a, viewMetadata);
		_Platform_enqueueEffects(managers, pair.b, subscriptions(model));
	}

	_Platform_enqueueEffects(managers, initPair.b, subscriptions(model));

	return ports ? { ports: ports } : {};
}



// TRACK PRELOADS
//
// This is used by code in elm/browser and elm/http
// to register any HTTP requests that are triggered by init.
//


var _Platform_preload;


function _Platform_registerPreload(url)
{
	_Platform_preload.add(url);
}



// EFFECT MANAGERS


var _Platform_effectManagers = {};


function _Platform_setupEffects(managers, sendToApp)
{
	var ports;

	// setup all necessary effect managers
	for (var key in _Platform_effectManagers)
	{
		var manager = _Platform_effectManagers[key];

		if (manager.a)
		{
			ports = ports || {};
			ports[key] = manager.a(key, sendToApp);
		}

		managers[key] = _Platform_instantiateManager(manager, sendToApp);
	}

	return ports;
}


function _Platform_createManager(init, onEffects, onSelfMsg, cmdMap, subMap)
{
	return {
		b: init,
		c: onEffects,
		d: onSelfMsg,
		e: cmdMap,
		f: subMap
	};
}


function _Platform_instantiateManager(info, sendToApp)
{
	var router = {
		g: sendToApp,
		h: undefined
	};

	var onEffects = info.c;
	var onSelfMsg = info.d;
	var cmdMap = info.e;
	var subMap = info.f;

	function loop(state)
	{
		return A2(_Scheduler_andThen, loop, _Scheduler_receive(function(msg)
		{
			var value = msg.a;

			if (msg.$ === 0)
			{
				return A3(onSelfMsg, router, value, state);
			}

			return cmdMap && subMap
				? A4(onEffects, router, value.i, value.j, state)
				: A3(onEffects, router, cmdMap ? value.i : value.j, state);
		}));
	}

	return router.h = _Scheduler_rawSpawn(A2(_Scheduler_andThen, loop, info.b));
}



// ROUTING


var _Platform_sendToApp = F2(function(router, msg)
{
	return _Scheduler_binding(function(callback)
	{
		router.g(msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});


var _Platform_sendToSelf = F2(function(router, msg)
{
	return A2(_Scheduler_send, router.h, {
		$: 0,
		a: msg
	});
});



// BAGS


function _Platform_leaf(home)
{
	return function(value)
	{
		return {
			$: 1,
			k: home,
			l: value
		};
	};
}


function _Platform_batch(list)
{
	return {
		$: 2,
		m: list
	};
}


var _Platform_map = F2(function(tagger, bag)
{
	return {
		$: 3,
		n: tagger,
		o: bag
	}
});



// PIPE BAGS INTO EFFECT MANAGERS
//
// Effects must be queued!
//
// Say your init contains a synchronous command, like Time.now or Time.here
//
//   - This will produce a batch of effects (FX_1)
//   - The synchronous task triggers the subsequent `update` call
//   - This will produce a batch of effects (FX_2)
//
// If we just start dispatching FX_2, subscriptions from FX_2 can be processed
// before subscriptions from FX_1. No good! Earlier versions of this code had
// this problem, leading to these reports:
//
//   https://github.com/elm/core/issues/980
//   https://github.com/elm/core/pull/981
//   https://github.com/elm/compiler/issues/1776
//
// The queue is necessary to avoid ordering issues for synchronous commands.


// Why use true/false here? Why not just check the length of the queue?
// The goal is to detect "are we currently dispatching effects?" If we
// are, we need to bail and let the ongoing while loop handle things.
//
// Now say the queue has 1 element. When we dequeue the final element,
// the queue will be empty, but we are still actively dispatching effects.
// So you could get queue jumping in a really tricky category of cases.
//
var _Platform_effectsQueue = [];
var _Platform_effectsActive = false;


function _Platform_enqueueEffects(managers, cmdBag, subBag)
{
	_Platform_effectsQueue.push({ p: managers, q: cmdBag, r: subBag });

	if (_Platform_effectsActive) return;

	_Platform_effectsActive = true;
	for (var fx; fx = _Platform_effectsQueue.shift(); )
	{
		_Platform_dispatchEffects(fx.p, fx.q, fx.r);
	}
	_Platform_effectsActive = false;
}


function _Platform_dispatchEffects(managers, cmdBag, subBag)
{
	var effectsDict = {};
	_Platform_gatherEffects(true, cmdBag, effectsDict, null);
	_Platform_gatherEffects(false, subBag, effectsDict, null);

	for (var home in managers)
	{
		_Scheduler_rawSend(managers[home], {
			$: 'fx',
			a: effectsDict[home] || { i: _List_Nil, j: _List_Nil }
		});
	}
}


function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers)
{
	switch (bag.$)
	{
		case 1:
			var home = bag.k;
			var effect = _Platform_toEffect(isCmd, home, taggers, bag.l);
			effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
			return;

		case 2:
			for (var list = bag.m; list.b; list = list.b) // WHILE_CONS
			{
				_Platform_gatherEffects(isCmd, list.a, effectsDict, taggers);
			}
			return;

		case 3:
			_Platform_gatherEffects(isCmd, bag.o, effectsDict, {
				s: bag.n,
				t: taggers
			});
			return;
	}
}


function _Platform_toEffect(isCmd, home, taggers, value)
{
	function applyTaggers(x)
	{
		for (var temp = taggers; temp; temp = temp.t)
		{
			x = temp.s(x);
		}
		return x;
	}

	var map = isCmd
		? _Platform_effectManagers[home].e
		: _Platform_effectManagers[home].f;

	return A2(map, applyTaggers, value)
}


function _Platform_insert(isCmd, newEffect, effects)
{
	effects = effects || { i: _List_Nil, j: _List_Nil };

	isCmd
		? (effects.i = _List_Cons(newEffect, effects.i))
		: (effects.j = _List_Cons(newEffect, effects.j));

	return effects;
}



// PORTS


function _Platform_checkPortName(name)
{
	if (_Platform_effectManagers[name])
	{
		_Debug_crash(3, name)
	}
}



// OUTGOING PORTS


function _Platform_outgoingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		e: _Platform_outgoingPortMap,
		u: converter,
		a: _Platform_setupOutgoingPort
	};
	return _Platform_leaf(name);
}


var _Platform_outgoingPortMap = F2(function(tagger, value) { return value; });


function _Platform_setupOutgoingPort(name)
{
	var subs = [];
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Process_sleep(0);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, cmdList, state)
	{
		for ( ; cmdList.b; cmdList = cmdList.b) // WHILE_CONS
		{
			// grab a separate reference to subs in case unsubscribe is called
			var currentSubs = subs;
			var value = _Json_unwrap(converter(cmdList.a));
			for (var i = 0; i < currentSubs.length; i++)
			{
				currentSubs[i](value);
			}
		}
		return init;
	});

	// PUBLIC API

	function subscribe(callback)
	{
		subs.push(callback);
	}

	function unsubscribe(callback)
	{
		// copy subs into a new array in case unsubscribe is called within a
		// subscribed callback
		subs = subs.slice();
		var index = subs.indexOf(callback);
		if (index >= 0)
		{
			subs.splice(index, 1);
		}
	}

	return {
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};
}



// INCOMING PORTS


function _Platform_incomingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		f: _Platform_incomingPortMap,
		u: converter,
		a: _Platform_setupIncomingPort
	};
	return _Platform_leaf(name);
}


var _Platform_incomingPortMap = F2(function(tagger, finalTagger)
{
	return function(value)
	{
		return tagger(finalTagger(value));
	};
});


function _Platform_setupIncomingPort(name, sendToApp)
{
	var subs = _List_Nil;
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Scheduler_succeed(null);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, subList, state)
	{
		subs = subList;
		return init;
	});

	// PUBLIC API

	function send(incomingValue)
	{
		var result = A2(_Json_run, converter, _Json_wrap(incomingValue));

		$elm$core$Result$isOk(result) || _Debug_crash(4, name, result.a);

		var value = result.a;
		for (var temp = subs; temp.b; temp = temp.b) // WHILE_CONS
		{
			sendToApp(temp.a(value));
		}
	}

	return { send: send };
}



// EXPORT ELM MODULES
//
// Have DEBUG and PROD versions so that we can (1) give nicer errors in
// debug mode and (2) not pay for the bits needed for that in prod mode.
//


function _Platform_export_UNUSED(exports)
{
	scope['Elm']
		? _Platform_mergeExportsProd(scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsProd(obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6)
				: _Platform_mergeExportsProd(obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}


function _Platform_export(exports)
{
	scope['Elm']
		? _Platform_mergeExportsDebug('Elm', scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsDebug(moduleName, obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6, moduleName)
				: _Platform_mergeExportsDebug(moduleName + '.' + name, obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}




// HELPERS


var _VirtualDom_divertHrefToApp;

var _VirtualDom_doc = typeof document !== 'undefined' ? document : {};


function _VirtualDom_appendChild(parent, child)
{
	parent.appendChild(child);
}

var _VirtualDom_init = F4(function(virtualNode, flagDecoder, debugMetadata, args)
{
	// NOTE: this function needs _Platform_export available to work

	/**_UNUSED/
	var node = args['node'];
	//*/
	/**/
	var node = args && args['node'] ? args['node'] : _Debug_crash(0);
	//*/

	node.parentNode.replaceChild(
		_VirtualDom_render(virtualNode, function() {}),
		node
	);

	return {};
});



// TEXT


function _VirtualDom_text(string)
{
	return {
		$: 0,
		a: string
	};
}



// NODE


var _VirtualDom_nodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 1,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_node = _VirtualDom_nodeNS(undefined);



// KEYED NODE


var _VirtualDom_keyedNodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 2,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_keyedNode = _VirtualDom_keyedNodeNS(undefined);



// CUSTOM


function _VirtualDom_custom(factList, model, render, diff)
{
	return {
		$: 3,
		d: _VirtualDom_organizeFacts(factList),
		g: model,
		h: render,
		i: diff
	};
}



// MAP


var _VirtualDom_map = F2(function(tagger, node)
{
	return {
		$: 4,
		j: tagger,
		k: node,
		b: 1 + (node.b || 0)
	};
});



// LAZY


function _VirtualDom_thunk(refs, thunk)
{
	return {
		$: 5,
		l: refs,
		m: thunk,
		k: undefined
	};
}

var _VirtualDom_lazy = F2(function(func, a)
{
	return _VirtualDom_thunk([func, a], function() {
		return func(a);
	});
});

var _VirtualDom_lazy2 = F3(function(func, a, b)
{
	return _VirtualDom_thunk([func, a, b], function() {
		return A2(func, a, b);
	});
});

var _VirtualDom_lazy3 = F4(function(func, a, b, c)
{
	return _VirtualDom_thunk([func, a, b, c], function() {
		return A3(func, a, b, c);
	});
});

var _VirtualDom_lazy4 = F5(function(func, a, b, c, d)
{
	return _VirtualDom_thunk([func, a, b, c, d], function() {
		return A4(func, a, b, c, d);
	});
});

var _VirtualDom_lazy5 = F6(function(func, a, b, c, d, e)
{
	return _VirtualDom_thunk([func, a, b, c, d, e], function() {
		return A5(func, a, b, c, d, e);
	});
});

var _VirtualDom_lazy6 = F7(function(func, a, b, c, d, e, f)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f], function() {
		return A6(func, a, b, c, d, e, f);
	});
});

var _VirtualDom_lazy7 = F8(function(func, a, b, c, d, e, f, g)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g], function() {
		return A7(func, a, b, c, d, e, f, g);
	});
});

var _VirtualDom_lazy8 = F9(function(func, a, b, c, d, e, f, g, h)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g, h], function() {
		return A8(func, a, b, c, d, e, f, g, h);
	});
});



// FACTS


var _VirtualDom_on = F2(function(key, handler)
{
	return {
		$: 'a0',
		n: key,
		o: handler
	};
});
var _VirtualDom_style = F2(function(key, value)
{
	return {
		$: 'a1',
		n: key,
		o: value
	};
});
var _VirtualDom_property = F2(function(key, value)
{
	return {
		$: 'a2',
		n: key,
		o: value
	};
});
var _VirtualDom_attribute = F2(function(key, value)
{
	return {
		$: 'a3',
		n: key,
		o: value
	};
});
var _VirtualDom_attributeNS = F3(function(namespace, key, value)
{
	return {
		$: 'a4',
		n: key,
		o: { f: namespace, o: value }
	};
});



// XSS ATTACK VECTOR CHECKS
//
// For some reason, tabs can appear in href protocols and it still works.
// So '\tjava\tSCRIPT:alert("!!!")' and 'javascript:alert("!!!")' are the same
// in practice. That is why _VirtualDom_RE_js and _VirtualDom_RE_js_html look
// so freaky.
//
// Pulling the regular expressions out to the top level gives a slight speed
// boost in small benchmarks (4-10%) but hoisting values to reduce allocation
// can be unpredictable in large programs where JIT may have a harder time with
// functions are not fully self-contained. The benefit is more that the js and
// js_html ones are so weird that I prefer to see them near each other.


var _VirtualDom_RE_script = /^script$/i;
var _VirtualDom_RE_on_formAction = /^(on|formAction$)/i;
var _VirtualDom_RE_js = /^\s*j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i;
var _VirtualDom_RE_js_html = /^\s*(j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:|d\s*a\s*t\s*a\s*:\s*t\s*e\s*x\s*t\s*\/\s*h\s*t\s*m\s*l\s*(,|;))/i;


function _VirtualDom_noScript(tag)
{
	return _VirtualDom_RE_script.test(tag) ? 'p' : tag;
}

function _VirtualDom_noOnOrFormAction(key)
{
	return _VirtualDom_RE_on_formAction.test(key) ? 'data-' + key : key;
}

function _VirtualDom_noInnerHtmlOrFormAction(key)
{
	return key == 'innerHTML' || key == 'outerHTML' || key == 'formAction' ? 'data-' + key : key;
}

function _VirtualDom_noJavaScriptUri(value)
{
	return _VirtualDom_RE_js.test(value)
		? /**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlUri(value)
{
	return _VirtualDom_RE_js_html.test(value)
		? /**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlJson(value)
{
	return (
		(typeof _Json_unwrap(value) === 'string' && _VirtualDom_RE_js_html.test(_Json_unwrap(value)))
		||
		(Array.isArray(_Json_unwrap(value)) && _VirtualDom_RE_js_html.test(String(_Json_unwrap(value))))
	)
		? _Json_wrap(
			/**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		) : value;
}



// MAP FACTS


var _VirtualDom_mapAttribute = F2(function(func, attr)
{
	return (attr.$ === 'a0')
		? A2(_VirtualDom_on, attr.n, _VirtualDom_mapHandler(func, attr.o))
		: attr;
});

function _VirtualDom_mapHandler(func, handler)
{
	var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

	// 0 = Normal
	// 1 = MayStopPropagation
	// 2 = MayPreventDefault
	// 3 = Custom

	return {
		$: handler.$,
		a:
			!tag
				? A2($elm$json$Json$Decode$map, func, handler.a)
				:
			A3($elm$json$Json$Decode$map2,
				tag < 3
					? _VirtualDom_mapEventTuple
					: _VirtualDom_mapEventRecord,
				$elm$json$Json$Decode$succeed(func),
				handler.a
			)
	};
}

var _VirtualDom_mapEventTuple = F2(function(func, tuple)
{
	return _Utils_Tuple2(func(tuple.a), tuple.b);
});

var _VirtualDom_mapEventRecord = F2(function(func, record)
{
	return {
		message: func(record.message),
		stopPropagation: record.stopPropagation,
		preventDefault: record.preventDefault
	}
});



// ORGANIZE FACTS


function _VirtualDom_organizeFacts(factList)
{
	for (var facts = {}; factList.b; factList = factList.b) // WHILE_CONS
	{
		var entry = factList.a;

		var tag = entry.$;
		var key = entry.n;
		var value = entry.o;

		if (tag === 'a2')
		{
			(key === 'className')
				? _VirtualDom_addClass(facts, key, _Json_unwrap(value))
				: facts[key] = _Json_unwrap(value);

			continue;
		}

		var subFacts = facts[tag] || (facts[tag] = {});
		(tag === 'a3' && key === 'class')
			? _VirtualDom_addClass(subFacts, key, value)
			: subFacts[key] = value;
	}

	return facts;
}

function _VirtualDom_addClass(object, key, newClass)
{
	var classes = object[key];
	object[key] = classes ? classes + ' ' + newClass : newClass;
}



// RENDER


function _VirtualDom_render(vNode, eventNode)
{
	var tag = vNode.$;

	if (tag === 5)
	{
		return _VirtualDom_render(vNode.k || (vNode.k = vNode.m()), eventNode);
	}

	if (tag === 0)
	{
		return _VirtualDom_doc.createTextNode(vNode.a);
	}

	if (tag === 4)
	{
		var subNode = vNode.k;
		var tagger = vNode.j;

		while (subNode.$ === 4)
		{
			typeof tagger !== 'object'
				? tagger = [tagger, subNode.j]
				: tagger.push(subNode.j);

			subNode = subNode.k;
		}

		var subEventRoot = { j: tagger, p: eventNode };
		var domNode = _VirtualDom_render(subNode, subEventRoot);
		domNode.elm_event_node_ref = subEventRoot;
		return domNode;
	}

	if (tag === 3)
	{
		var domNode = vNode.h(vNode.g);
		_VirtualDom_applyFacts(domNode, eventNode, vNode.d);
		return domNode;
	}

	// at this point `tag` must be 1 or 2

	var domNode = vNode.f
		? _VirtualDom_doc.createElementNS(vNode.f, vNode.c)
		: _VirtualDom_doc.createElement(vNode.c);

	if (_VirtualDom_divertHrefToApp && vNode.c == 'a')
	{
		domNode.addEventListener('click', _VirtualDom_divertHrefToApp(domNode));
	}

	_VirtualDom_applyFacts(domNode, eventNode, vNode.d);

	for (var kids = vNode.e, i = 0; i < kids.length; i++)
	{
		_VirtualDom_appendChild(domNode, _VirtualDom_render(tag === 1 ? kids[i] : kids[i].b, eventNode));
	}

	return domNode;
}



// APPLY FACTS


function _VirtualDom_applyFacts(domNode, eventNode, facts)
{
	for (var key in facts)
	{
		var value = facts[key];

		key === 'a1'
			? _VirtualDom_applyStyles(domNode, value)
			:
		key === 'a0'
			? _VirtualDom_applyEvents(domNode, eventNode, value)
			:
		key === 'a3'
			? _VirtualDom_applyAttrs(domNode, value)
			:
		key === 'a4'
			? _VirtualDom_applyAttrsNS(domNode, value)
			:
		((key !== 'value' && key !== 'checked') || domNode[key] !== value) && (domNode[key] = value);
	}
}



// APPLY STYLES


function _VirtualDom_applyStyles(domNode, styles)
{
	var domNodeStyle = domNode.style;

	for (var key in styles)
	{
		domNodeStyle[key] = styles[key];
	}
}



// APPLY ATTRS


function _VirtualDom_applyAttrs(domNode, attrs)
{
	for (var key in attrs)
	{
		var value = attrs[key];
		typeof value !== 'undefined'
			? domNode.setAttribute(key, value)
			: domNode.removeAttribute(key);
	}
}



// APPLY NAMESPACED ATTRS


function _VirtualDom_applyAttrsNS(domNode, nsAttrs)
{
	for (var key in nsAttrs)
	{
		var pair = nsAttrs[key];
		var namespace = pair.f;
		var value = pair.o;

		typeof value !== 'undefined'
			? domNode.setAttributeNS(namespace, key, value)
			: domNode.removeAttributeNS(namespace, key);
	}
}



// APPLY EVENTS


function _VirtualDom_applyEvents(domNode, eventNode, events)
{
	var allCallbacks = domNode.elmFs || (domNode.elmFs = {});

	for (var key in events)
	{
		var newHandler = events[key];
		var oldCallback = allCallbacks[key];

		if (!newHandler)
		{
			domNode.removeEventListener(key, oldCallback);
			allCallbacks[key] = undefined;
			continue;
		}

		if (oldCallback)
		{
			var oldHandler = oldCallback.q;
			if (oldHandler.$ === newHandler.$)
			{
				oldCallback.q = newHandler;
				continue;
			}
			domNode.removeEventListener(key, oldCallback);
		}

		oldCallback = _VirtualDom_makeCallback(eventNode, newHandler);
		domNode.addEventListener(key, oldCallback,
			_VirtualDom_passiveSupported
			&& { passive: $elm$virtual_dom$VirtualDom$toHandlerInt(newHandler) < 2 }
		);
		allCallbacks[key] = oldCallback;
	}
}



// PASSIVE EVENTS


var _VirtualDom_passiveSupported;

try
{
	window.addEventListener('t', null, Object.defineProperty({}, 'passive', {
		get: function() { _VirtualDom_passiveSupported = true; }
	}));
}
catch(e) {}



// EVENT HANDLERS


function _VirtualDom_makeCallback(eventNode, initialHandler)
{
	function callback(event)
	{
		var handler = callback.q;
		var result = _Json_runHelp(handler.a, event);

		if (!$elm$core$Result$isOk(result))
		{
			return;
		}

		var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

		// 0 = Normal
		// 1 = MayStopPropagation
		// 2 = MayPreventDefault
		// 3 = Custom

		var value = result.a;
		var message = !tag ? value : tag < 3 ? value.a : value.message;
		var stopPropagation = tag == 1 ? value.b : tag == 3 && value.stopPropagation;
		var currentEventNode = (
			stopPropagation && event.stopPropagation(),
			(tag == 2 ? value.b : tag == 3 && value.preventDefault) && event.preventDefault(),
			eventNode
		);
		var tagger;
		var i;
		while (tagger = currentEventNode.j)
		{
			if (typeof tagger == 'function')
			{
				message = tagger(message);
			}
			else
			{
				for (var i = tagger.length; i--; )
				{
					message = tagger[i](message);
				}
			}
			currentEventNode = currentEventNode.p;
		}
		currentEventNode(message, stopPropagation); // stopPropagation implies isSync
	}

	callback.q = initialHandler;

	return callback;
}

function _VirtualDom_equalEvents(x, y)
{
	return x.$ == y.$ && _Json_equality(x.a, y.a);
}



// DIFF


// TODO: Should we do patches like in iOS?
//
// type Patch
//   = At Int Patch
//   | Batch (List Patch)
//   | Change ...
//
// How could it not be better?
//
function _VirtualDom_diff(x, y)
{
	var patches = [];
	_VirtualDom_diffHelp(x, y, patches, 0);
	return patches;
}


function _VirtualDom_pushPatch(patches, type, index, data)
{
	var patch = {
		$: type,
		r: index,
		s: data,
		t: undefined,
		u: undefined
	};
	patches.push(patch);
	return patch;
}


function _VirtualDom_diffHelp(x, y, patches, index)
{
	if (x === y)
	{
		return;
	}

	var xType = x.$;
	var yType = y.$;

	// Bail if you run into different types of nodes. Implies that the
	// structure has changed significantly and it's not worth a diff.
	if (xType !== yType)
	{
		if (xType === 1 && yType === 2)
		{
			y = _VirtualDom_dekey(y);
			yType = 1;
		}
		else
		{
			_VirtualDom_pushPatch(patches, 0, index, y);
			return;
		}
	}

	// Now we know that both nodes are the same $.
	switch (yType)
	{
		case 5:
			var xRefs = x.l;
			var yRefs = y.l;
			var i = xRefs.length;
			var same = i === yRefs.length;
			while (same && i--)
			{
				same = xRefs[i] === yRefs[i];
			}
			if (same)
			{
				y.k = x.k;
				return;
			}
			y.k = y.m();
			var subPatches = [];
			_VirtualDom_diffHelp(x.k, y.k, subPatches, 0);
			subPatches.length > 0 && _VirtualDom_pushPatch(patches, 1, index, subPatches);
			return;

		case 4:
			// gather nested taggers
			var xTaggers = x.j;
			var yTaggers = y.j;
			var nesting = false;

			var xSubNode = x.k;
			while (xSubNode.$ === 4)
			{
				nesting = true;

				typeof xTaggers !== 'object'
					? xTaggers = [xTaggers, xSubNode.j]
					: xTaggers.push(xSubNode.j);

				xSubNode = xSubNode.k;
			}

			var ySubNode = y.k;
			while (ySubNode.$ === 4)
			{
				nesting = true;

				typeof yTaggers !== 'object'
					? yTaggers = [yTaggers, ySubNode.j]
					: yTaggers.push(ySubNode.j);

				ySubNode = ySubNode.k;
			}

			// Just bail if different numbers of taggers. This implies the
			// structure of the virtual DOM has changed.
			if (nesting && xTaggers.length !== yTaggers.length)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			// check if taggers are "the same"
			if (nesting ? !_VirtualDom_pairwiseRefEqual(xTaggers, yTaggers) : xTaggers !== yTaggers)
			{
				_VirtualDom_pushPatch(patches, 2, index, yTaggers);
			}

			// diff everything below the taggers
			_VirtualDom_diffHelp(xSubNode, ySubNode, patches, index + 1);
			return;

		case 0:
			if (x.a !== y.a)
			{
				_VirtualDom_pushPatch(patches, 3, index, y.a);
			}
			return;

		case 1:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKids);
			return;

		case 2:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKeyedKids);
			return;

		case 3:
			if (x.h !== y.h)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
			factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

			var patch = y.i(x.g, y.g);
			patch && _VirtualDom_pushPatch(patches, 5, index, patch);

			return;
	}
}

// assumes the incoming arrays are the same length
function _VirtualDom_pairwiseRefEqual(as, bs)
{
	for (var i = 0; i < as.length; i++)
	{
		if (as[i] !== bs[i])
		{
			return false;
		}
	}

	return true;
}

function _VirtualDom_diffNodes(x, y, patches, index, diffKids)
{
	// Bail if obvious indicators have changed. Implies more serious
	// structural changes such that it's not worth it to diff.
	if (x.c !== y.c || x.f !== y.f)
	{
		_VirtualDom_pushPatch(patches, 0, index, y);
		return;
	}

	var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
	factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

	diffKids(x, y, patches, index);
}



// DIFF FACTS


// TODO Instead of creating a new diff object, it's possible to just test if
// there *is* a diff. During the actual patch, do the diff again and make the
// modifications directly. This way, there's no new allocations. Worth it?
function _VirtualDom_diffFacts(x, y, category)
{
	var diff;

	// look for changes and removals
	for (var xKey in x)
	{
		if (xKey === 'a1' || xKey === 'a0' || xKey === 'a3' || xKey === 'a4')
		{
			var subDiff = _VirtualDom_diffFacts(x[xKey], y[xKey] || {}, xKey);
			if (subDiff)
			{
				diff = diff || {};
				diff[xKey] = subDiff;
			}
			continue;
		}

		// remove if not in the new facts
		if (!(xKey in y))
		{
			diff = diff || {};
			diff[xKey] =
				!category
					? (typeof x[xKey] === 'string' ? '' : null)
					:
				(category === 'a1')
					? ''
					:
				(category === 'a0' || category === 'a3')
					? undefined
					:
				{ f: x[xKey].f, o: undefined };

			continue;
		}

		var xValue = x[xKey];
		var yValue = y[xKey];

		// reference equal, so don't worry about it
		if (xValue === yValue && xKey !== 'value' && xKey !== 'checked'
			|| category === 'a0' && _VirtualDom_equalEvents(xValue, yValue))
		{
			continue;
		}

		diff = diff || {};
		diff[xKey] = yValue;
	}

	// add new stuff
	for (var yKey in y)
	{
		if (!(yKey in x))
		{
			diff = diff || {};
			diff[yKey] = y[yKey];
		}
	}

	return diff;
}



// DIFF KIDS


function _VirtualDom_diffKids(xParent, yParent, patches, index)
{
	var xKids = xParent.e;
	var yKids = yParent.e;

	var xLen = xKids.length;
	var yLen = yKids.length;

	// FIGURE OUT IF THERE ARE INSERTS OR REMOVALS

	if (xLen > yLen)
	{
		_VirtualDom_pushPatch(patches, 6, index, {
			v: yLen,
			i: xLen - yLen
		});
	}
	else if (xLen < yLen)
	{
		_VirtualDom_pushPatch(patches, 7, index, {
			v: xLen,
			e: yKids
		});
	}

	// PAIRWISE DIFF EVERYTHING ELSE

	for (var minLen = xLen < yLen ? xLen : yLen, i = 0; i < minLen; i++)
	{
		var xKid = xKids[i];
		_VirtualDom_diffHelp(xKid, yKids[i], patches, ++index);
		index += xKid.b || 0;
	}
}



// KEYED DIFF


function _VirtualDom_diffKeyedKids(xParent, yParent, patches, rootIndex)
{
	var localPatches = [];

	var changes = {}; // Dict String Entry
	var inserts = []; // Array { index : Int, entry : Entry }
	// type Entry = { tag : String, vnode : VNode, index : Int, data : _ }

	var xKids = xParent.e;
	var yKids = yParent.e;
	var xLen = xKids.length;
	var yLen = yKids.length;
	var xIndex = 0;
	var yIndex = 0;

	var index = rootIndex;

	while (xIndex < xLen && yIndex < yLen)
	{
		var x = xKids[xIndex];
		var y = yKids[yIndex];

		var xKey = x.a;
		var yKey = y.a;
		var xNode = x.b;
		var yNode = y.b;

		var newMatch = undefined;
		var oldMatch = undefined;

		// check if keys match

		if (xKey === yKey)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNode, localPatches, index);
			index += xNode.b || 0;

			xIndex++;
			yIndex++;
			continue;
		}

		// look ahead 1 to detect insertions and removals.

		var xNext = xKids[xIndex + 1];
		var yNext = yKids[yIndex + 1];

		if (xNext)
		{
			var xNextKey = xNext.a;
			var xNextNode = xNext.b;
			oldMatch = yKey === xNextKey;
		}

		if (yNext)
		{
			var yNextKey = yNext.a;
			var yNextNode = yNext.b;
			newMatch = xKey === yNextKey;
		}


		// swap x and y
		if (newMatch && oldMatch)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			_VirtualDom_insertNode(changes, localPatches, xKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNextNode, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		// insert y
		if (newMatch)
		{
			index++;
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			index += xNode.b || 0;

			xIndex += 1;
			yIndex += 2;
			continue;
		}

		// remove x
		if (oldMatch)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 1;
			continue;
		}

		// remove x, insert y
		if (xNext && xNextKey === yNextKey)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNextNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		break;
	}

	// eat up any remaining nodes with removeNode and insertNode

	while (xIndex < xLen)
	{
		index++;
		var x = xKids[xIndex];
		var xNode = x.b;
		_VirtualDom_removeNode(changes, localPatches, x.a, xNode, index);
		index += xNode.b || 0;
		xIndex++;
	}

	while (yIndex < yLen)
	{
		var endInserts = endInserts || [];
		var y = yKids[yIndex];
		_VirtualDom_insertNode(changes, localPatches, y.a, y.b, undefined, endInserts);
		yIndex++;
	}

	if (localPatches.length > 0 || inserts.length > 0 || endInserts)
	{
		_VirtualDom_pushPatch(patches, 8, rootIndex, {
			w: localPatches,
			x: inserts,
			y: endInserts
		});
	}
}



// CHANGES FROM KEYED DIFF


var _VirtualDom_POSTFIX = '_elmW6BL';


function _VirtualDom_insertNode(changes, localPatches, key, vnode, yIndex, inserts)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		entry = {
			c: 0,
			z: vnode,
			r: yIndex,
			s: undefined
		};

		inserts.push({ r: yIndex, A: entry });
		changes[key] = entry;

		return;
	}

	// this key was removed earlier, a match!
	if (entry.c === 1)
	{
		inserts.push({ r: yIndex, A: entry });

		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(entry.z, vnode, subPatches, entry.r);
		entry.r = yIndex;
		entry.s.s = {
			w: subPatches,
			A: entry
		};

		return;
	}

	// this key has already been inserted or moved, a duplicate!
	_VirtualDom_insertNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, yIndex, inserts);
}


function _VirtualDom_removeNode(changes, localPatches, key, vnode, index)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		var patch = _VirtualDom_pushPatch(localPatches, 9, index, undefined);

		changes[key] = {
			c: 1,
			z: vnode,
			r: index,
			s: patch
		};

		return;
	}

	// this key was inserted earlier, a match!
	if (entry.c === 0)
	{
		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(vnode, entry.z, subPatches, index);

		_VirtualDom_pushPatch(localPatches, 9, index, {
			w: subPatches,
			A: entry
		});

		return;
	}

	// this key has already been removed or moved, a duplicate!
	_VirtualDom_removeNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, index);
}



// ADD DOM NODES
//
// Each DOM node has an "index" assigned in order of traversal. It is important
// to minimize our crawl over the actual DOM, so these indexes (along with the
// descendantsCount of virtual nodes) let us skip touching entire subtrees of
// the DOM if we know there are no patches there.


function _VirtualDom_addDomNodes(domNode, vNode, patches, eventNode)
{
	_VirtualDom_addDomNodesHelp(domNode, vNode, patches, 0, 0, vNode.b, eventNode);
}


// assumes `patches` is non-empty and indexes increase monotonically.
function _VirtualDom_addDomNodesHelp(domNode, vNode, patches, i, low, high, eventNode)
{
	var patch = patches[i];
	var index = patch.r;

	while (index === low)
	{
		var patchType = patch.$;

		if (patchType === 1)
		{
			_VirtualDom_addDomNodes(domNode, vNode.k, patch.s, eventNode);
		}
		else if (patchType === 8)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var subPatches = patch.s.w;
			if (subPatches.length > 0)
			{
				_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
			}
		}
		else if (patchType === 9)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var data = patch.s;
			if (data)
			{
				data.A.s = domNode;
				var subPatches = data.w;
				if (subPatches.length > 0)
				{
					_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
				}
			}
		}
		else
		{
			patch.t = domNode;
			patch.u = eventNode;
		}

		i++;

		if (!(patch = patches[i]) || (index = patch.r) > high)
		{
			return i;
		}
	}

	var tag = vNode.$;

	if (tag === 4)
	{
		var subNode = vNode.k;

		while (subNode.$ === 4)
		{
			subNode = subNode.k;
		}

		return _VirtualDom_addDomNodesHelp(domNode, subNode, patches, i, low + 1, high, domNode.elm_event_node_ref);
	}

	// tag must be 1 or 2 at this point

	var vKids = vNode.e;
	var childNodes = domNode.childNodes;
	for (var j = 0; j < vKids.length; j++)
	{
		low++;
		var vKid = tag === 1 ? vKids[j] : vKids[j].b;
		var nextLow = low + (vKid.b || 0);
		if (low <= index && index <= nextLow)
		{
			i = _VirtualDom_addDomNodesHelp(childNodes[j], vKid, patches, i, low, nextLow, eventNode);
			if (!(patch = patches[i]) || (index = patch.r) > high)
			{
				return i;
			}
		}
		low = nextLow;
	}
	return i;
}



// APPLY PATCHES


function _VirtualDom_applyPatches(rootDomNode, oldVirtualNode, patches, eventNode)
{
	if (patches.length === 0)
	{
		return rootDomNode;
	}

	_VirtualDom_addDomNodes(rootDomNode, oldVirtualNode, patches, eventNode);
	return _VirtualDom_applyPatchesHelp(rootDomNode, patches);
}

function _VirtualDom_applyPatchesHelp(rootDomNode, patches)
{
	for (var i = 0; i < patches.length; i++)
	{
		var patch = patches[i];
		var localDomNode = patch.t
		var newNode = _VirtualDom_applyPatch(localDomNode, patch);
		if (localDomNode === rootDomNode)
		{
			rootDomNode = newNode;
		}
	}
	return rootDomNode;
}

function _VirtualDom_applyPatch(domNode, patch)
{
	switch (patch.$)
	{
		case 0:
			return _VirtualDom_applyPatchRedraw(domNode, patch.s, patch.u);

		case 4:
			_VirtualDom_applyFacts(domNode, patch.u, patch.s);
			return domNode;

		case 3:
			domNode.replaceData(0, domNode.length, patch.s);
			return domNode;

		case 1:
			return _VirtualDom_applyPatchesHelp(domNode, patch.s);

		case 2:
			if (domNode.elm_event_node_ref)
			{
				domNode.elm_event_node_ref.j = patch.s;
			}
			else
			{
				domNode.elm_event_node_ref = { j: patch.s, p: patch.u };
			}
			return domNode;

		case 6:
			var data = patch.s;
			for (var i = 0; i < data.i; i++)
			{
				domNode.removeChild(domNode.childNodes[data.v]);
			}
			return domNode;

		case 7:
			var data = patch.s;
			var kids = data.e;
			var i = data.v;
			var theEnd = domNode.childNodes[i];
			for (; i < kids.length; i++)
			{
				domNode.insertBefore(_VirtualDom_render(kids[i], patch.u), theEnd);
			}
			return domNode;

		case 9:
			var data = patch.s;
			if (!data)
			{
				domNode.parentNode.removeChild(domNode);
				return domNode;
			}
			var entry = data.A;
			if (typeof entry.r !== 'undefined')
			{
				domNode.parentNode.removeChild(domNode);
			}
			entry.s = _VirtualDom_applyPatchesHelp(domNode, data.w);
			return domNode;

		case 8:
			return _VirtualDom_applyPatchReorder(domNode, patch);

		case 5:
			return patch.s(domNode);

		default:
			_Debug_crash(10); // 'Ran into an unknown patch!'
	}
}


function _VirtualDom_applyPatchRedraw(domNode, vNode, eventNode)
{
	var parentNode = domNode.parentNode;
	var newNode = _VirtualDom_render(vNode, eventNode);

	if (!newNode.elm_event_node_ref)
	{
		newNode.elm_event_node_ref = domNode.elm_event_node_ref;
	}

	if (parentNode && newNode !== domNode)
	{
		parentNode.replaceChild(newNode, domNode);
	}
	return newNode;
}


function _VirtualDom_applyPatchReorder(domNode, patch)
{
	var data = patch.s;

	// remove end inserts
	var frag = _VirtualDom_applyPatchReorderEndInsertsHelp(data.y, patch);

	// removals
	domNode = _VirtualDom_applyPatchesHelp(domNode, data.w);

	// inserts
	var inserts = data.x;
	for (var i = 0; i < inserts.length; i++)
	{
		var insert = inserts[i];
		var entry = insert.A;
		var node = entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u);
		domNode.insertBefore(node, domNode.childNodes[insert.r]);
	}

	// add end inserts
	if (frag)
	{
		_VirtualDom_appendChild(domNode, frag);
	}

	return domNode;
}


function _VirtualDom_applyPatchReorderEndInsertsHelp(endInserts, patch)
{
	if (!endInserts)
	{
		return;
	}

	var frag = _VirtualDom_doc.createDocumentFragment();
	for (var i = 0; i < endInserts.length; i++)
	{
		var insert = endInserts[i];
		var entry = insert.A;
		_VirtualDom_appendChild(frag, entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u)
		);
	}
	return frag;
}


function _VirtualDom_virtualize(node)
{
	// TEXT NODES

	if (node.nodeType === 3)
	{
		return _VirtualDom_text(node.textContent);
	}


	// WEIRD NODES

	if (node.nodeType !== 1)
	{
		return _VirtualDom_text('');
	}


	// ELEMENT NODES

	var attrList = _List_Nil;
	var attrs = node.attributes;
	for (var i = attrs.length; i--; )
	{
		var attr = attrs[i];
		var name = attr.name;
		var value = attr.value;
		attrList = _List_Cons( A2(_VirtualDom_attribute, name, value), attrList );
	}

	var tag = node.tagName.toLowerCase();
	var kidList = _List_Nil;
	var kids = node.childNodes;

	for (var i = kids.length; i--; )
	{
		kidList = _List_Cons(_VirtualDom_virtualize(kids[i]), kidList);
	}
	return A3(_VirtualDom_node, tag, attrList, kidList);
}

function _VirtualDom_dekey(keyedNode)
{
	var keyedKids = keyedNode.e;
	var len = keyedKids.length;
	var kids = new Array(len);
	for (var i = 0; i < len; i++)
	{
		kids[i] = keyedKids[i].b;
	}

	return {
		$: 1,
		c: keyedNode.c,
		d: keyedNode.d,
		e: kids,
		f: keyedNode.f,
		b: keyedNode.b
	};
}




// ELEMENT


var _Debugger_element;

var _Browser_element = _Debugger_element || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function(sendToApp, initialModel) {
			var view = impl.view;
			/**_UNUSED/
			var domNode = args['node'];
			//*/
			/**/
			var domNode = args && args['node'] ? args['node'] : _Debug_crash(0);
			//*/
			var currNode = _VirtualDom_virtualize(domNode);

			return _Browser_makeAnimator(initialModel, function(model)
			{
				var nextNode = view(model);
				var patches = _VirtualDom_diff(currNode, nextNode);
				domNode = _VirtualDom_applyPatches(domNode, currNode, patches, sendToApp);
				currNode = nextNode;
			});
		}
	);
});



// DOCUMENT


var _Debugger_document;

var _Browser_document = _Debugger_document || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function(sendToApp, initialModel) {
			var divertHrefToApp = impl.setup && impl.setup(sendToApp)
			var view = impl.view;
			var title = _VirtualDom_doc.title;
			var bodyNode = _VirtualDom_doc.body;
			var currNode = _VirtualDom_virtualize(bodyNode);
			return _Browser_makeAnimator(initialModel, function(model)
			{
				_VirtualDom_divertHrefToApp = divertHrefToApp;
				var doc = view(model);
				var nextNode = _VirtualDom_node('body')(_List_Nil)(doc.body);
				var patches = _VirtualDom_diff(currNode, nextNode);
				bodyNode = _VirtualDom_applyPatches(bodyNode, currNode, patches, sendToApp);
				currNode = nextNode;
				_VirtualDom_divertHrefToApp = 0;
				(title !== doc.title) && (_VirtualDom_doc.title = title = doc.title);
			});
		}
	);
});



// ANIMATION


var _Browser_cancelAnimationFrame =
	typeof cancelAnimationFrame !== 'undefined'
		? cancelAnimationFrame
		: function(id) { clearTimeout(id); };

var _Browser_requestAnimationFrame =
	typeof requestAnimationFrame !== 'undefined'
		? requestAnimationFrame
		: function(callback) { return setTimeout(callback, 1000 / 60); };


function _Browser_makeAnimator(model, draw)
{
	draw(model);

	var state = 0;

	function updateIfNeeded()
	{
		state = state === 1
			? 0
			: ( _Browser_requestAnimationFrame(updateIfNeeded), draw(model), 1 );
	}

	return function(nextModel, isSync)
	{
		model = nextModel;

		isSync
			? ( draw(model),
				state === 2 && (state = 1)
				)
			: ( state === 0 && _Browser_requestAnimationFrame(updateIfNeeded),
				state = 2
				);
	};
}



// APPLICATION


function _Browser_application(impl)
{
	var onUrlChange = impl.onUrlChange;
	var onUrlRequest = impl.onUrlRequest;
	var key = function() { key.a(onUrlChange(_Browser_getUrl())); };

	return _Browser_document({
		setup: function(sendToApp)
		{
			key.a = sendToApp;
			_Browser_window.addEventListener('popstate', key);
			_Browser_window.navigator.userAgent.indexOf('Trident') < 0 || _Browser_window.addEventListener('hashchange', key);

			return F2(function(domNode, event)
			{
				if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button < 1 && !domNode.target && !domNode.hasAttribute('download'))
				{
					event.preventDefault();
					var href = domNode.href;
					var curr = _Browser_getUrl();
					var next = $elm$url$Url$fromString(href).a;
					sendToApp(onUrlRequest(
						(next
							&& curr.protocol === next.protocol
							&& curr.host === next.host
							&& curr.port_.a === next.port_.a
						)
							? $elm$browser$Browser$Internal(next)
							: $elm$browser$Browser$External(href)
					));
				}
			});
		},
		init: function(flags)
		{
			return A3(impl.init, flags, _Browser_getUrl(), key);
		},
		view: impl.view,
		update: impl.update,
		subscriptions: impl.subscriptions
	});
}

function _Browser_getUrl()
{
	return $elm$url$Url$fromString(_VirtualDom_doc.location.href).a || _Debug_crash(1);
}

var _Browser_go = F2(function(key, n)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		n && history.go(n);
		key();
	}));
});

var _Browser_pushUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.pushState({}, '', url);
		key();
	}));
});

var _Browser_replaceUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.replaceState({}, '', url);
		key();
	}));
});



// GLOBAL EVENTS


var _Browser_fakeNode = { addEventListener: function() {}, removeEventListener: function() {} };
var _Browser_doc = typeof document !== 'undefined' ? document : _Browser_fakeNode;
var _Browser_window = typeof window !== 'undefined' ? window : _Browser_fakeNode;

var _Browser_on = F3(function(node, eventName, sendToSelf)
{
	return _Scheduler_spawn(_Scheduler_binding(function(callback)
	{
		function handler(event)	{ _Scheduler_rawSpawn(sendToSelf(event)); }
		node.addEventListener(eventName, handler, _VirtualDom_passiveSupported && { passive: true });
		return function() { node.removeEventListener(eventName, handler); };
	}));
});

var _Browser_decodeEvent = F2(function(decoder, event)
{
	var result = _Json_runHelp(decoder, event);
	return $elm$core$Result$isOk(result) ? $elm$core$Maybe$Just(result.a) : $elm$core$Maybe$Nothing;
});



// PAGE VISIBILITY


function _Browser_visibilityInfo()
{
	return (typeof _VirtualDom_doc.hidden !== 'undefined')
		? { hidden: 'hidden', change: 'visibilitychange' }
		:
	(typeof _VirtualDom_doc.mozHidden !== 'undefined')
		? { hidden: 'mozHidden', change: 'mozvisibilitychange' }
		:
	(typeof _VirtualDom_doc.msHidden !== 'undefined')
		? { hidden: 'msHidden', change: 'msvisibilitychange' }
		:
	(typeof _VirtualDom_doc.webkitHidden !== 'undefined')
		? { hidden: 'webkitHidden', change: 'webkitvisibilitychange' }
		: { hidden: 'hidden', change: 'visibilitychange' };
}



// ANIMATION FRAMES


function _Browser_rAF()
{
	return _Scheduler_binding(function(callback)
	{
		var id = _Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(Date.now()));
		});

		return function() {
			_Browser_cancelAnimationFrame(id);
		};
	});
}


function _Browser_now()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(Date.now()));
	});
}



// DOM STUFF


function _Browser_withNode(id, doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			var node = document.getElementById(id);
			callback(node
				? _Scheduler_succeed(doStuff(node))
				: _Scheduler_fail($elm$browser$Browser$Dom$NotFound(id))
			);
		});
	});
}


function _Browser_withWindow(doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(doStuff()));
		});
	});
}


// FOCUS and BLUR


var _Browser_call = F2(function(functionName, id)
{
	return _Browser_withNode(id, function(node) {
		node[functionName]();
		return _Utils_Tuple0;
	});
});



// WINDOW VIEWPORT


function _Browser_getViewport()
{
	return {
		scene: _Browser_getScene(),
		viewport: {
			x: _Browser_window.pageXOffset,
			y: _Browser_window.pageYOffset,
			width: _Browser_doc.documentElement.clientWidth,
			height: _Browser_doc.documentElement.clientHeight
		}
	};
}

function _Browser_getScene()
{
	var body = _Browser_doc.body;
	var elem = _Browser_doc.documentElement;
	return {
		width: Math.max(body.scrollWidth, body.offsetWidth, elem.scrollWidth, elem.offsetWidth, elem.clientWidth),
		height: Math.max(body.scrollHeight, body.offsetHeight, elem.scrollHeight, elem.offsetHeight, elem.clientHeight)
	};
}

var _Browser_setViewport = F2(function(x, y)
{
	return _Browser_withWindow(function()
	{
		_Browser_window.scroll(x, y);
		return _Utils_Tuple0;
	});
});



// ELEMENT VIEWPORT


function _Browser_getViewportOf(id)
{
	return _Browser_withNode(id, function(node)
	{
		return {
			scene: {
				width: node.scrollWidth,
				height: node.scrollHeight
			},
			viewport: {
				x: node.scrollLeft,
				y: node.scrollTop,
				width: node.clientWidth,
				height: node.clientHeight
			}
		};
	});
}


var _Browser_setViewportOf = F3(function(id, x, y)
{
	return _Browser_withNode(id, function(node)
	{
		node.scrollLeft = x;
		node.scrollTop = y;
		return _Utils_Tuple0;
	});
});



// ELEMENT


function _Browser_getElement(id)
{
	return _Browser_withNode(id, function(node)
	{
		var rect = node.getBoundingClientRect();
		var x = _Browser_window.pageXOffset;
		var y = _Browser_window.pageYOffset;
		return {
			scene: _Browser_getScene(),
			viewport: {
				x: x,
				y: y,
				width: _Browser_doc.documentElement.clientWidth,
				height: _Browser_doc.documentElement.clientHeight
			},
			element: {
				x: x + rect.left,
				y: y + rect.top,
				width: rect.width,
				height: rect.height
			}
		};
	});
}



// LOAD and RELOAD


function _Browser_reload(skipCache)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		_VirtualDom_doc.location.reload(skipCache);
	}));
}

function _Browser_load(url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		try
		{
			_Browser_window.location = url;
		}
		catch(err)
		{
			// Only Firefox can throw a NS_ERROR_MALFORMED_URI exception here.
			// Other browsers reload the page, so let's be consistent about that.
			_VirtualDom_doc.location.reload(false);
		}
	}));
}




// STRINGS


var _Parser_isSubString = F5(function(smallString, offset, row, col, bigString)
{
	var smallLength = smallString.length;
	var isGood = offset + smallLength <= bigString.length;

	for (var i = 0; isGood && i < smallLength; )
	{
		var code = bigString.charCodeAt(offset);
		isGood =
			smallString[i++] === bigString[offset++]
			&& (
				code === 0x000A /* \n */
					? ( row++, col=1 )
					: ( col++, (code & 0xF800) === 0xD800 ? smallString[i++] === bigString[offset++] : 1 )
			)
	}

	return _Utils_Tuple3(isGood ? offset : -1, row, col);
});



// CHARS


var _Parser_isSubChar = F3(function(predicate, offset, string)
{
	return (
		string.length <= offset
			? -1
			:
		(string.charCodeAt(offset) & 0xF800) === 0xD800
			? (predicate(_Utils_chr(string.substr(offset, 2))) ? offset + 2 : -1)
			:
		(predicate(_Utils_chr(string[offset]))
			? ((string[offset] === '\n') ? -2 : (offset + 1))
			: -1
		)
	);
});


var _Parser_isAsciiCode = F3(function(code, offset, string)
{
	return string.charCodeAt(offset) === code;
});



// NUMBERS


var _Parser_chompBase10 = F2(function(offset, string)
{
	for (; offset < string.length; offset++)
	{
		var code = string.charCodeAt(offset);
		if (code < 0x30 || 0x39 < code)
		{
			return offset;
		}
	}
	return offset;
});


var _Parser_consumeBase = F3(function(base, offset, string)
{
	for (var total = 0; offset < string.length; offset++)
	{
		var digit = string.charCodeAt(offset) - 0x30;
		if (digit < 0 || base <= digit) break;
		total = base * total + digit;
	}
	return _Utils_Tuple2(offset, total);
});


var _Parser_consumeBase16 = F2(function(offset, string)
{
	for (var total = 0; offset < string.length; offset++)
	{
		var code = string.charCodeAt(offset);
		if (0x30 <= code && code <= 0x39)
		{
			total = 16 * total + code - 0x30;
		}
		else if (0x41 <= code && code <= 0x46)
		{
			total = 16 * total + code - 55;
		}
		else if (0x61 <= code && code <= 0x66)
		{
			total = 16 * total + code - 87;
		}
		else
		{
			break;
		}
	}
	return _Utils_Tuple2(offset, total);
});



// FIND STRING


var _Parser_findSubString = F5(function(smallString, offset, row, col, bigString)
{
	var newOffset = bigString.indexOf(smallString, offset);
	var target = newOffset < 0 ? bigString.length : newOffset + smallString.length;

	while (offset < target)
	{
		var code = bigString.charCodeAt(offset++);
		code === 0x000A /* \n */
			? ( col=1, row++ )
			: ( col++, (code & 0xF800) === 0xD800 && offset++ )
	}

	return _Utils_Tuple3(newOffset, row, col);
});



// SEND REQUEST

var _Http_toTask = F3(function(router, toTask, request)
{
	return _Scheduler_binding(function(callback)
	{
		function done(response) {
			callback(toTask(request.expect.a(response)));
		}

		var xhr = new XMLHttpRequest();
		xhr.addEventListener('error', function() { done($elm$http$Http$NetworkError_); });
		xhr.addEventListener('timeout', function() { done($elm$http$Http$Timeout_); });
		xhr.addEventListener('load', function() { done(_Http_toResponse(request.expect.b, xhr)); });
		$elm$core$Maybe$isJust(request.tracker) && _Http_track(router, xhr, request.tracker.a);

		try {
			xhr.open(request.method, request.url, true);
		} catch (e) {
			return done($elm$http$Http$BadUrl_(request.url));
		}

		_Http_configureRequest(xhr, request);

		request.body.a && xhr.setRequestHeader('Content-Type', request.body.a);
		xhr.send(request.body.b);

		return function() { xhr.c = true; xhr.abort(); };
	});
});


// CONFIGURE

function _Http_configureRequest(xhr, request)
{
	for (var headers = request.headers; headers.b; headers = headers.b) // WHILE_CONS
	{
		xhr.setRequestHeader(headers.a.a, headers.a.b);
	}
	xhr.timeout = request.timeout.a || 0;
	xhr.responseType = request.expect.d;
	xhr.withCredentials = request.allowCookiesFromOtherDomains;
}


// RESPONSES

function _Http_toResponse(toBody, xhr)
{
	return A2(
		200 <= xhr.status && xhr.status < 300 ? $elm$http$Http$GoodStatus_ : $elm$http$Http$BadStatus_,
		_Http_toMetadata(xhr),
		toBody(xhr.response)
	);
}


// METADATA

function _Http_toMetadata(xhr)
{
	return {
		url: xhr.responseURL,
		statusCode: xhr.status,
		statusText: xhr.statusText,
		headers: _Http_parseHeaders(xhr.getAllResponseHeaders())
	};
}


// HEADERS

function _Http_parseHeaders(rawHeaders)
{
	if (!rawHeaders)
	{
		return $elm$core$Dict$empty;
	}

	var headers = $elm$core$Dict$empty;
	var headerPairs = rawHeaders.split('\r\n');
	for (var i = headerPairs.length; i--; )
	{
		var headerPair = headerPairs[i];
		var index = headerPair.indexOf(': ');
		if (index > 0)
		{
			var key = headerPair.substring(0, index);
			var value = headerPair.substring(index + 2);

			headers = A3($elm$core$Dict$update, key, function(oldValue) {
				return $elm$core$Maybe$Just($elm$core$Maybe$isJust(oldValue)
					? value + ', ' + oldValue.a
					: value
				);
			}, headers);
		}
	}
	return headers;
}


// EXPECT

var _Http_expect = F3(function(type, toBody, toValue)
{
	return {
		$: 0,
		d: type,
		b: toBody,
		a: toValue
	};
});

var _Http_mapExpect = F2(function(func, expect)
{
	return {
		$: 0,
		d: expect.d,
		b: expect.b,
		a: function(x) { return func(expect.a(x)); }
	};
});

function _Http_toDataView(arrayBuffer)
{
	return new DataView(arrayBuffer);
}


// BODY and PARTS

var _Http_emptyBody = { $: 0 };
var _Http_pair = F2(function(a, b) { return { $: 0, a: a, b: b }; });

function _Http_toFormData(parts)
{
	for (var formData = new FormData(); parts.b; parts = parts.b) // WHILE_CONS
	{
		var part = parts.a;
		formData.append(part.a, part.b);
	}
	return formData;
}

var _Http_bytesToBlob = F2(function(mime, bytes)
{
	return new Blob([bytes], { type: mime });
});


// PROGRESS

function _Http_track(router, xhr, tracker)
{
	// TODO check out lengthComputable on loadstart event

	xhr.upload.addEventListener('progress', function(event) {
		if (xhr.c) { return; }
		_Scheduler_rawSpawn(A2($elm$core$Platform$sendToSelf, router, _Utils_Tuple2(tracker, $elm$http$Http$Sending({
			sent: event.loaded,
			size: event.total
		}))));
	});
	xhr.addEventListener('progress', function(event) {
		if (xhr.c) { return; }
		_Scheduler_rawSpawn(A2($elm$core$Platform$sendToSelf, router, _Utils_Tuple2(tracker, $elm$http$Http$Receiving({
			received: event.loaded,
			size: event.lengthComputable ? $elm$core$Maybe$Just(event.total) : $elm$core$Maybe$Nothing
		}))));
	});
}var $elm$core$Basics$EQ = {$: 'EQ'};
var $elm$core$Basics$GT = {$: 'GT'};
var $elm$core$Basics$LT = {$: 'LT'};
var $elm$core$List$cons = _List_cons;
var $elm$core$Dict$foldr = F3(
	function (func, acc, t) {
		foldr:
		while (true) {
			if (t.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = t.b;
				var value = t.c;
				var left = t.d;
				var right = t.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldr, func, acc, right)),
					$temp$t = left;
				func = $temp$func;
				acc = $temp$acc;
				t = $temp$t;
				continue foldr;
			}
		}
	});
var $elm$core$Dict$toList = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, list) {
				return A2(
					$elm$core$List$cons,
					_Utils_Tuple2(key, value),
					list);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Dict$keys = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, keyList) {
				return A2($elm$core$List$cons, key, keyList);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Set$toList = function (_v0) {
	var dict = _v0.a;
	return $elm$core$Dict$keys(dict);
};
var $elm$core$Elm$JsArray$foldr = _JsArray_foldr;
var $elm$core$Array$foldr = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (node.$ === 'SubTree') {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldr, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldr, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldr,
			helper,
			A3($elm$core$Elm$JsArray$foldr, func, baseCase, tail),
			tree);
	});
var $elm$core$Array$toList = function (array) {
	return A3($elm$core$Array$foldr, $elm$core$List$cons, _List_Nil, array);
};
var $elm$core$Result$Err = function (a) {
	return {$: 'Err', a: a};
};
var $elm$json$Json$Decode$Failure = F2(
	function (a, b) {
		return {$: 'Failure', a: a, b: b};
	});
var $elm$json$Json$Decode$Field = F2(
	function (a, b) {
		return {$: 'Field', a: a, b: b};
	});
var $elm$json$Json$Decode$Index = F2(
	function (a, b) {
		return {$: 'Index', a: a, b: b};
	});
var $elm$core$Result$Ok = function (a) {
	return {$: 'Ok', a: a};
};
var $elm$json$Json$Decode$OneOf = function (a) {
	return {$: 'OneOf', a: a};
};
var $elm$core$Basics$False = {$: 'False'};
var $elm$core$Basics$add = _Basics_add;
var $elm$core$Maybe$Just = function (a) {
	return {$: 'Just', a: a};
};
var $elm$core$Maybe$Nothing = {$: 'Nothing'};
var $elm$core$String$all = _String_all;
var $elm$core$Basics$and = _Basics_and;
var $elm$core$Basics$append = _Utils_append;
var $elm$json$Json$Encode$encode = _Json_encode;
var $elm$core$String$fromInt = _String_fromNumber;
var $elm$core$String$join = F2(
	function (sep, chunks) {
		return A2(
			_String_join,
			sep,
			_List_toArray(chunks));
	});
var $elm$core$String$split = F2(
	function (sep, string) {
		return _List_fromArray(
			A2(_String_split, sep, string));
	});
var $elm$json$Json$Decode$indent = function (str) {
	return A2(
		$elm$core$String$join,
		'\u000A    ',
		A2($elm$core$String$split, '\u000A', str));
};
var $elm$core$List$foldl = F3(
	function (func, acc, list) {
		foldl:
		while (true) {
			if (!list.b) {
				return acc;
			} else {
				var x = list.a;
				var xs = list.b;
				var $temp$func = func,
					$temp$acc = A2(func, x, acc),
					$temp$list = xs;
				func = $temp$func;
				acc = $temp$acc;
				list = $temp$list;
				continue foldl;
			}
		}
	});
var $elm$core$List$length = function (xs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, i) {
				return i + 1;
			}),
		0,
		xs);
};
var $elm$core$List$map2 = _List_map2;
var $elm$core$Basics$le = _Utils_le;
var $elm$core$Basics$sub = _Basics_sub;
var $elm$core$List$rangeHelp = F3(
	function (lo, hi, list) {
		rangeHelp:
		while (true) {
			if (_Utils_cmp(lo, hi) < 1) {
				var $temp$lo = lo,
					$temp$hi = hi - 1,
					$temp$list = A2($elm$core$List$cons, hi, list);
				lo = $temp$lo;
				hi = $temp$hi;
				list = $temp$list;
				continue rangeHelp;
			} else {
				return list;
			}
		}
	});
var $elm$core$List$range = F2(
	function (lo, hi) {
		return A3($elm$core$List$rangeHelp, lo, hi, _List_Nil);
	});
var $elm$core$List$indexedMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$map2,
			f,
			A2(
				$elm$core$List$range,
				0,
				$elm$core$List$length(xs) - 1),
			xs);
	});
var $elm$core$Char$toCode = _Char_toCode;
var $elm$core$Char$isLower = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (97 <= code) && (code <= 122);
};
var $elm$core$Char$isUpper = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 90) && (65 <= code);
};
var $elm$core$Basics$or = _Basics_or;
var $elm$core$Char$isAlpha = function (_char) {
	return $elm$core$Char$isLower(_char) || $elm$core$Char$isUpper(_char);
};
var $elm$core$Char$isDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 57) && (48 <= code);
};
var $elm$core$Char$isAlphaNum = function (_char) {
	return $elm$core$Char$isLower(_char) || ($elm$core$Char$isUpper(_char) || $elm$core$Char$isDigit(_char));
};
var $elm$core$List$reverse = function (list) {
	return A3($elm$core$List$foldl, $elm$core$List$cons, _List_Nil, list);
};
var $elm$core$String$uncons = _String_uncons;
var $elm$json$Json$Decode$errorOneOf = F2(
	function (i, error) {
		return '\u000A\u000A(' + ($elm$core$String$fromInt(i + 1) + (') ' + $elm$json$Json$Decode$indent(
			$elm$json$Json$Decode$errorToString(error))));
	});
var $elm$json$Json$Decode$errorToString = function (error) {
	return A2($elm$json$Json$Decode$errorToStringHelp, error, _List_Nil);
};
var $elm$json$Json$Decode$errorToStringHelp = F2(
	function (error, context) {
		errorToStringHelp:
		while (true) {
			switch (error.$) {
				case 'Field':
					var f = error.a;
					var err = error.b;
					var isSimple = function () {
						var _v1 = $elm$core$String$uncons(f);
						if (_v1.$ === 'Nothing') {
							return false;
						} else {
							var _v2 = _v1.a;
							var _char = _v2.a;
							var rest = _v2.b;
							return $elm$core$Char$isAlpha(_char) && A2($elm$core$String$all, $elm$core$Char$isAlphaNum, rest);
						}
					}();
					var fieldName = isSimple ? ('.' + f) : ('[\u0027' + (f + '\u0027]'));
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, fieldName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'Index':
					var i = error.a;
					var err = error.b;
					var indexName = '[' + ($elm$core$String$fromInt(i) + ']');
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, indexName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'OneOf':
					var errors = error.a;
					if (!errors.b) {
						return 'Ran into a Json.Decode.oneOf with no possibilities' + function () {
							if (!context.b) {
								return '!';
							} else {
								return ' at json' + A2(
									$elm$core$String$join,
									'',
									$elm$core$List$reverse(context));
							}
						}();
					} else {
						if (!errors.b.b) {
							var err = errors.a;
							var $temp$error = err,
								$temp$context = context;
							error = $temp$error;
							context = $temp$context;
							continue errorToStringHelp;
						} else {
							var starter = function () {
								if (!context.b) {
									return 'Json.Decode.oneOf';
								} else {
									return 'The Json.Decode.oneOf at json' + A2(
										$elm$core$String$join,
										'',
										$elm$core$List$reverse(context));
								}
							}();
							var introduction = starter + (' failed in the following ' + ($elm$core$String$fromInt(
								$elm$core$List$length(errors)) + ' ways:'));
							return A2(
								$elm$core$String$join,
								'\u000A\u000A',
								A2(
									$elm$core$List$cons,
									introduction,
									A2($elm$core$List$indexedMap, $elm$json$Json$Decode$errorOneOf, errors)));
						}
					}
				default:
					var msg = error.a;
					var json = error.b;
					var introduction = function () {
						if (!context.b) {
							return 'Problem with the given value:\u000A\u000A';
						} else {
							return 'Problem with the value at json' + (A2(
								$elm$core$String$join,
								'',
								$elm$core$List$reverse(context)) + ':\u000A\u000A    ');
						}
					}();
					return introduction + ($elm$json$Json$Decode$indent(
						A2($elm$json$Json$Encode$encode, 4, json)) + ('\u000A\u000A' + msg));
			}
		}
	});
var $elm$core$Array$branchFactor = 32;
var $elm$core$Array$Array_elm_builtin = F4(
	function (a, b, c, d) {
		return {$: 'Array_elm_builtin', a: a, b: b, c: c, d: d};
	});
var $elm$core$Elm$JsArray$empty = _JsArray_empty;
var $elm$core$Basics$ceiling = _Basics_ceiling;
var $elm$core$Basics$fdiv = _Basics_fdiv;
var $elm$core$Basics$logBase = F2(
	function (base, number) {
		return _Basics_log(number) / _Basics_log(base);
	});
var $elm$core$Basics$toFloat = _Basics_toFloat;
var $elm$core$Array$shiftStep = $elm$core$Basics$ceiling(
	A2($elm$core$Basics$logBase, 2, $elm$core$Array$branchFactor));
var $elm$core$Array$empty = A4($elm$core$Array$Array_elm_builtin, 0, $elm$core$Array$shiftStep, $elm$core$Elm$JsArray$empty, $elm$core$Elm$JsArray$empty);
var $elm$core$Elm$JsArray$initialize = _JsArray_initialize;
var $elm$core$Array$Leaf = function (a) {
	return {$: 'Leaf', a: a};
};
var $elm$core$Basics$apL = F2(
	function (f, x) {
		return f(x);
	});
var $elm$core$Basics$apR = F2(
	function (x, f) {
		return f(x);
	});
var $elm$core$Basics$eq = _Utils_equal;
var $elm$core$Basics$floor = _Basics_floor;
var $elm$core$Elm$JsArray$length = _JsArray_length;
var $elm$core$Basics$gt = _Utils_gt;
var $elm$core$Basics$max = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) > 0) ? x : y;
	});
var $elm$core$Basics$mul = _Basics_mul;
var $elm$core$Array$SubTree = function (a) {
	return {$: 'SubTree', a: a};
};
var $elm$core$Elm$JsArray$initializeFromList = _JsArray_initializeFromList;
var $elm$core$Array$compressNodes = F2(
	function (nodes, acc) {
		compressNodes:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodes);
			var node = _v0.a;
			var remainingNodes = _v0.b;
			var newAcc = A2(
				$elm$core$List$cons,
				$elm$core$Array$SubTree(node),
				acc);
			if (!remainingNodes.b) {
				return $elm$core$List$reverse(newAcc);
			} else {
				var $temp$nodes = remainingNodes,
					$temp$acc = newAcc;
				nodes = $temp$nodes;
				acc = $temp$acc;
				continue compressNodes;
			}
		}
	});
var $elm$core$Tuple$first = function (_v0) {
	var x = _v0.a;
	return x;
};
var $elm$core$Array$treeFromBuilder = F2(
	function (nodeList, nodeListSize) {
		treeFromBuilder:
		while (true) {
			var newNodeSize = $elm$core$Basics$ceiling(nodeListSize / $elm$core$Array$branchFactor);
			if (newNodeSize === 1) {
				return A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodeList).a;
			} else {
				var $temp$nodeList = A2($elm$core$Array$compressNodes, nodeList, _List_Nil),
					$temp$nodeListSize = newNodeSize;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue treeFromBuilder;
			}
		}
	});
var $elm$core$Array$builderToArray = F2(
	function (reverseNodeList, builder) {
		if (!builder.nodeListSize) {
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail),
				$elm$core$Array$shiftStep,
				$elm$core$Elm$JsArray$empty,
				builder.tail);
		} else {
			var treeLen = builder.nodeListSize * $elm$core$Array$branchFactor;
			var depth = $elm$core$Basics$floor(
				A2($elm$core$Basics$logBase, $elm$core$Array$branchFactor, treeLen - 1));
			var correctNodeList = reverseNodeList ? $elm$core$List$reverse(builder.nodeList) : builder.nodeList;
			var tree = A2($elm$core$Array$treeFromBuilder, correctNodeList, builder.nodeListSize);
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail) + treeLen,
				A2($elm$core$Basics$max, 5, depth * $elm$core$Array$shiftStep),
				tree,
				builder.tail);
		}
	});
var $elm$core$Basics$idiv = _Basics_idiv;
var $elm$core$Basics$lt = _Utils_lt;
var $elm$core$Array$initializeHelp = F5(
	function (fn, fromIndex, len, nodeList, tail) {
		initializeHelp:
		while (true) {
			if (fromIndex < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					false,
					{nodeList: nodeList, nodeListSize: (len / $elm$core$Array$branchFactor) | 0, tail: tail});
			} else {
				var leaf = $elm$core$Array$Leaf(
					A3($elm$core$Elm$JsArray$initialize, $elm$core$Array$branchFactor, fromIndex, fn));
				var $temp$fn = fn,
					$temp$fromIndex = fromIndex - $elm$core$Array$branchFactor,
					$temp$len = len,
					$temp$nodeList = A2($elm$core$List$cons, leaf, nodeList),
					$temp$tail = tail;
				fn = $temp$fn;
				fromIndex = $temp$fromIndex;
				len = $temp$len;
				nodeList = $temp$nodeList;
				tail = $temp$tail;
				continue initializeHelp;
			}
		}
	});
var $elm$core$Basics$remainderBy = _Basics_remainderBy;
var $elm$core$Array$initialize = F2(
	function (len, fn) {
		if (len <= 0) {
			return $elm$core$Array$empty;
		} else {
			var tailLen = len % $elm$core$Array$branchFactor;
			var tail = A3($elm$core$Elm$JsArray$initialize, tailLen, len - tailLen, fn);
			var initialFromIndex = (len - tailLen) - $elm$core$Array$branchFactor;
			return A5($elm$core$Array$initializeHelp, fn, initialFromIndex, len, _List_Nil, tail);
		}
	});
var $elm$core$Basics$True = {$: 'True'};
var $elm$core$Result$isOk = function (result) {
	if (result.$ === 'Ok') {
		return true;
	} else {
		return false;
	}
};
var $elm$json$Json$Decode$map = _Json_map1;
var $elm$json$Json$Decode$map2 = _Json_map2;
var $elm$json$Json$Decode$succeed = _Json_succeed;
var $elm$virtual_dom$VirtualDom$toHandlerInt = function (handler) {
	switch (handler.$) {
		case 'Normal':
			return 0;
		case 'MayStopPropagation':
			return 1;
		case 'MayPreventDefault':
			return 2;
		default:
			return 3;
	}
};
var $elm$browser$Browser$External = function (a) {
	return {$: 'External', a: a};
};
var $elm$browser$Browser$Internal = function (a) {
	return {$: 'Internal', a: a};
};
var $elm$core$Basics$identity = function (x) {
	return x;
};
var $elm$browser$Browser$Dom$NotFound = function (a) {
	return {$: 'NotFound', a: a};
};
var $elm$url$Url$Http = {$: 'Http'};
var $elm$url$Url$Https = {$: 'Https'};
var $elm$url$Url$Url = F6(
	function (protocol, host, port_, path, query, fragment) {
		return {fragment: fragment, host: host, path: path, port_: port_, protocol: protocol, query: query};
	});
var $elm$core$String$contains = _String_contains;
var $elm$core$String$length = _String_length;
var $elm$core$String$slice = _String_slice;
var $elm$core$String$dropLeft = F2(
	function (n, string) {
		return (n < 1) ? string : A3(
			$elm$core$String$slice,
			n,
			$elm$core$String$length(string),
			string);
	});
var $elm$core$String$indexes = _String_indexes;
var $elm$core$String$isEmpty = function (string) {
	return string === '';
};
var $elm$core$String$left = F2(
	function (n, string) {
		return (n < 1) ? '' : A3($elm$core$String$slice, 0, n, string);
	});
var $elm$core$String$toInt = _String_toInt;
var $elm$url$Url$chompBeforePath = F5(
	function (protocol, path, params, frag, str) {
		if ($elm$core$String$isEmpty(str) || A2($elm$core$String$contains, '@', str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, ':', str);
			if (!_v0.b) {
				return $elm$core$Maybe$Just(
					A6($elm$url$Url$Url, protocol, str, $elm$core$Maybe$Nothing, path, params, frag));
			} else {
				if (!_v0.b.b) {
					var i = _v0.a;
					var _v1 = $elm$core$String$toInt(
						A2($elm$core$String$dropLeft, i + 1, str));
					if (_v1.$ === 'Nothing') {
						return $elm$core$Maybe$Nothing;
					} else {
						var port_ = _v1;
						return $elm$core$Maybe$Just(
							A6(
								$elm$url$Url$Url,
								protocol,
								A2($elm$core$String$left, i, str),
								port_,
								path,
								params,
								frag));
					}
				} else {
					return $elm$core$Maybe$Nothing;
				}
			}
		}
	});
var $elm$url$Url$chompBeforeQuery = F4(
	function (protocol, params, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '/', str);
			if (!_v0.b) {
				return A5($elm$url$Url$chompBeforePath, protocol, '/', params, frag, str);
			} else {
				var i = _v0.a;
				return A5(
					$elm$url$Url$chompBeforePath,
					protocol,
					A2($elm$core$String$dropLeft, i, str),
					params,
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompBeforeFragment = F3(
	function (protocol, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '?', str);
			if (!_v0.b) {
				return A4($elm$url$Url$chompBeforeQuery, protocol, $elm$core$Maybe$Nothing, frag, str);
			} else {
				var i = _v0.a;
				return A4(
					$elm$url$Url$chompBeforeQuery,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompAfterProtocol = F2(
	function (protocol, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '#', str);
			if (!_v0.b) {
				return A3($elm$url$Url$chompBeforeFragment, protocol, $elm$core$Maybe$Nothing, str);
			} else {
				var i = _v0.a;
				return A3(
					$elm$url$Url$chompBeforeFragment,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$core$String$startsWith = _String_startsWith;
var $elm$url$Url$fromString = function (str) {
	return A2($elm$core$String$startsWith, 'http://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		$elm$url$Url$Http,
		A2($elm$core$String$dropLeft, 7, str)) : (A2($elm$core$String$startsWith, 'https://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		$elm$url$Url$Https,
		A2($elm$core$String$dropLeft, 8, str)) : $elm$core$Maybe$Nothing);
};
var $elm$core$Basics$never = function (_v0) {
	never:
	while (true) {
		var nvr = _v0.a;
		var $temp$_v0 = nvr;
		_v0 = $temp$_v0;
		continue never;
	}
};
var $elm$core$Task$Perform = function (a) {
	return {$: 'Perform', a: a};
};
var $elm$core$Task$succeed = _Scheduler_succeed;
var $elm$core$Task$init = $elm$core$Task$succeed(_Utils_Tuple0);
var $elm$core$List$foldrHelper = F4(
	function (fn, acc, ctr, ls) {
		if (!ls.b) {
			return acc;
		} else {
			var a = ls.a;
			var r1 = ls.b;
			if (!r1.b) {
				return A2(fn, a, acc);
			} else {
				var b = r1.a;
				var r2 = r1.b;
				if (!r2.b) {
					return A2(
						fn,
						a,
						A2(fn, b, acc));
				} else {
					var c = r2.a;
					var r3 = r2.b;
					if (!r3.b) {
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(fn, c, acc)));
					} else {
						var d = r3.a;
						var r4 = r3.b;
						var res = (ctr > 500) ? A3(
							$elm$core$List$foldl,
							fn,
							acc,
							$elm$core$List$reverse(r4)) : A4($elm$core$List$foldrHelper, fn, acc, ctr + 1, r4);
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(
									fn,
									c,
									A2(fn, d, res))));
					}
				}
			}
		}
	});
var $elm$core$List$foldr = F3(
	function (fn, acc, ls) {
		return A4($elm$core$List$foldrHelper, fn, acc, 0, ls);
	});
var $elm$core$List$map = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, acc) {
					return A2(
						$elm$core$List$cons,
						f(x),
						acc);
				}),
			_List_Nil,
			xs);
	});
var $elm$core$Task$andThen = _Scheduler_andThen;
var $elm$core$Task$map = F2(
	function (func, taskA) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return $elm$core$Task$succeed(
					func(a));
			},
			taskA);
	});
var $elm$core$Task$map2 = F3(
	function (func, taskA, taskB) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return A2(
					$elm$core$Task$andThen,
					function (b) {
						return $elm$core$Task$succeed(
							A2(func, a, b));
					},
					taskB);
			},
			taskA);
	});
var $elm$core$Task$sequence = function (tasks) {
	return A3(
		$elm$core$List$foldr,
		$elm$core$Task$map2($elm$core$List$cons),
		$elm$core$Task$succeed(_List_Nil),
		tasks);
};
var $elm$core$Platform$sendToApp = _Platform_sendToApp;
var $elm$core$Task$spawnCmd = F2(
	function (router, _v0) {
		var task = _v0.a;
		return _Scheduler_spawn(
			A2(
				$elm$core$Task$andThen,
				$elm$core$Platform$sendToApp(router),
				task));
	});
var $elm$core$Task$onEffects = F3(
	function (router, commands, state) {
		return A2(
			$elm$core$Task$map,
			function (_v0) {
				return _Utils_Tuple0;
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Task$spawnCmd(router),
					commands)));
	});
var $elm$core$Task$onSelfMsg = F3(
	function (_v0, _v1, _v2) {
		return $elm$core$Task$succeed(_Utils_Tuple0);
	});
var $elm$core$Task$cmdMap = F2(
	function (tagger, _v0) {
		var task = _v0.a;
		return $elm$core$Task$Perform(
			A2($elm$core$Task$map, tagger, task));
	});
_Platform_effectManagers['Task'] = _Platform_createManager($elm$core$Task$init, $elm$core$Task$onEffects, $elm$core$Task$onSelfMsg, $elm$core$Task$cmdMap);
var $elm$core$Task$command = _Platform_leaf('Task');
var $elm$core$Task$perform = F2(
	function (toMessage, task) {
		return $elm$core$Task$command(
			$elm$core$Task$Perform(
				A2($elm$core$Task$map, toMessage, task)));
	});
var $elm$browser$Browser$element = _Browser_element;
var $author$project$QuestionEditor$ActiveModel = function (a) {
	return {$: 'ActiveModel', a: a};
};
var $author$project$QuestionEditor$ErrorModel = function (a) {
	return {$: 'ErrorModel', a: a};
};
var $elm$core$Maybe$andThen = F2(
	function (callback, maybeValue) {
		if (maybeValue.$ === 'Just') {
			var value = maybeValue.a;
			return callback(value);
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$Settings$at = F2(
	function (at_, s) {
		return _Utils_update(
			s,
			{
				at: _Utils_ap(s.at, at_)
			});
	});
var $elm$core$Platform$Cmd$batch = _Platform_batch;
var $elm$core$List$append = F2(
	function (xs, ys) {
		if (!ys.b) {
			return xs;
		} else {
			return A3($elm$core$List$foldr, $elm$core$List$cons, ys, xs);
		}
	});
var $elm$core$List$concat = function (lists) {
	return A3($elm$core$List$foldr, $elm$core$List$append, _List_Nil, lists);
};
var $elm$core$List$concatMap = F2(
	function (f, list) {
		return $elm$core$List$concat(
			A2($elm$core$List$map, f, list));
	});
var $elm$core$List$maybeCons = F3(
	function (f, mx, xs) {
		var _v0 = f(mx);
		if (_v0.$ === 'Just') {
			var x = _v0.a;
			return A2($elm$core$List$cons, x, xs);
		} else {
			return xs;
		}
	});
var $elm$core$List$filterMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			$elm$core$List$maybeCons(f),
			_List_Nil,
			xs);
	});
var $elm$json$Json$Decode$andThen = _Json_andThen;
var $elm$json$Json$Decode$decodeValue = _Json_run;
var $elm$core$Basics$composeR = F3(
	function (f, g, x) {
		return g(
			f(x));
	});
var $elm$core$List$filter = F2(
	function (isGood, list) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, xs) {
					return isGood(x) ? A2($elm$core$List$cons, x, xs) : xs;
				}),
			_List_Nil,
			list);
	});
var $elm$core$List$head = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(x);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$json$Json$Decode$list = _Json_decodeList;
var $elm$core$Tuple$pair = F2(
	function (a, b) {
		return _Utils_Tuple2(a, b);
	});
var $elm$core$Tuple$second = function (_v0) {
	var y = _v0.b;
	return y;
};
var $elm$core$Maybe$withDefault = F2(
	function (_default, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return value;
		} else {
			return _default;
		}
	});
var $author$project$Settings$decode_index_where = function (prop) {
	return A2(
		$elm$json$Json$Decode$map,
		A2(
			$elm$core$Basics$composeR,
			$elm$core$List$indexedMap($elm$core$Tuple$pair),
			function (ps) {
				return A2(
					$elm$core$Maybe$withDefault,
					$elm$core$List$length(ps),
					$elm$core$List$head(
						A2(
							$elm$core$List$map,
							$elm$core$Tuple$first,
							A2($elm$core$List$filter, $elm$core$Tuple$second, ps))));
			}),
		$elm$json$Json$Decode$list(prop));
};
var $elm$json$Json$Decode$field = _Json_decodeField;
var $elm$json$Json$Decode$index = _Json_decodeIndex;
var $elm$core$Result$toMaybe = function (result) {
	if (result.$ === 'Ok') {
		var v = result.a;
		return $elm$core$Maybe$Just(v);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Settings$maybe_get = F2(
	function (decoder, settings) {
		var reach = function (at_) {
			if (!at_.b) {
				return decoder;
			} else {
				switch (at_.a.$) {
					case 'Index':
						var i = at_.a.a;
						var rest = at_.b;
						return A2(
							$elm$json$Json$Decode$index,
							i,
							reach(rest));
					case 'Field':
						var k = at_.a.a;
						var rest = at_.b;
						return A2(
							$elm$json$Json$Decode$field,
							k,
							reach(rest));
					default:
						var _v1 = at_.a;
						var prop = _v1.a;
						var rest = at_.b;
						return A2(
							$elm$json$Json$Decode$andThen,
							function (i) {
								return A2(
									$elm$json$Json$Decode$index,
									i,
									reach(rest));
							},
							$author$project$Settings$decode_index_where(prop));
				}
			}
		};
		var d = reach(settings.at);
		return $elm$core$Result$toMaybe(
			function (r) {
				if (r.$ === 'Ok') {
					var v = r.a;
					return $elm$core$Result$Ok(v);
				} else {
					return A2($elm$json$Json$Decode$decodeValue, d, settings.defaults);
				}
			}(
				A2($elm$json$Json$Decode$decodeValue, d, settings.value)));
	});
var $author$project$QuestionEditor$ask_numbas = _Platform_outgoingPort('ask_numbas', $elm$core$Basics$identity);
var $elm$json$Json$Encode$object = function (pairs) {
	return _Json_wrap(
		A3(
			$elm$core$List$foldl,
			F2(
				function (_v0, obj) {
					var k = _v0.a;
					var v = _v0.b;
					return A3(_Json_addField, k, v, obj);
				}),
			_Json_emptyObject(_Utils_Tuple0),
			pairs));
};
var $elm$json$Json$Encode$string = _Json_wrap;
var $author$project$QuestionEditor$do_ask_numbas = function (q) {
	return $author$project$QuestionEditor$ask_numbas(
		$elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'command',
					$elm$json$Json$Encode$string(q.command)),
					_Utils_Tuple2('key', q.key),
					_Utils_Tuple2('param', q.param)
				])));
};
var $author$project$QuestionEditor$child_part_name = function (kind) {
	switch (kind.$) {
		case 'TopPart':
			return 'p';
		case 'Gap':
			return 'g';
		case 'Step':
			return 's';
		default:
			return 'a';
	}
};
var $author$project$Util$fi = $elm$core$String$fromInt;
var $author$project$QuestionEditor$part_path_toString = A2(
	$elm$core$Basics$composeR,
	$elm$core$List$map(
		function (_v0) {
			var kind = _v0.a;
			var i = _v0.b;
			return _Utils_ap(
				$author$project$QuestionEditor$child_part_name(kind),
				$author$project$Util$fi(i));
		}),
	$elm$core$String$join(''));
var $author$project$QuestionEditor$ask_numbas_about_part = F3(
	function (path, command, param) {
		return $author$project$QuestionEditor$do_ask_numbas(
			{
				command: command,
				key: $elm$json$Json$Encode$object(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'part',
							$elm$json$Json$Encode$string(
								$author$project$QuestionEditor$part_path_toString(path)))
						])),
				param: param
			});
	});
var $author$project$Settings$Field = function (a) {
	return {$: 'Field', a: a};
};
var $author$project$Settings$atField = function (k) {
	return $author$project$Settings$at(
		_List_fromArray(
			[
				$author$project$Settings$Field(k)
			]));
};
var $elm$json$Json$Encode$bool = _Json_wrap;
var $author$project$Settings$field = $author$project$Settings$Field;
var $elm$json$Json$Decode$bool = _Json_decodeBool;
var $elm$json$Json$Decode$float = _Json_decodeFloat;
var $elm$core$String$fromFloat = _String_fromNumber;
var $author$project$Settings$get = F3(
	function (decoder, _default, settings) {
		return A2(
			$elm$core$Maybe$withDefault,
			_default,
			A2($author$project$Settings$maybe_get, decoder, settings));
	});
var $elm$json$Json$Encode$null = _Json_encodeNull;
var $elm$json$Json$Decode$oneOf = _Json_oneOf;
var $elm$json$Json$Decode$string = _Json_decodeString;
var $elm$json$Json$Decode$value = _Json_decodeValue;
var $author$project$Settings$getters = {
	bool: A2($author$project$Settings$get, $elm$json$Json$Decode$bool, false),
	string: A2(
		$author$project$Settings$get,
		$elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					$elm$json$Json$Decode$string,
					A2($elm$json$Json$Decode$map, $elm$core$String$fromFloat, $elm$json$Json$Decode$float)
				])),
		''),
	value: A2($author$project$Settings$get, $elm$json$Json$Decode$value, $elm$json$Json$Encode$null)
};
var $elm$core$Maybe$map = F2(
	function (f, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return $elm$core$Maybe$Just(
				f(value));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $elm$core$Basics$not = _Basics_not;
var $author$project$QuestionEditor$part_setting_computed = function () {
	var string = A2(
		$elm$core$Basics$composeR,
		$elm$json$Json$Decode$decodeValue($elm$json$Json$Decode$string),
		$elm$core$Result$toMaybe);
	return _List_fromArray(
		[
			_Utils_Tuple2(
			_List_fromArray(
				[
					$author$project$Settings$field('answer')
				]),
			F2(
				function (path, part) {
					return (part.type_.name === 'jme') ? A2(
						$elm$core$Basics$composeR,
						string,
						$elm$core$Maybe$map(
							function (answer) {
								return A3(
									$author$project$QuestionEditor$ask_numbas_about_part,
									path,
									'is_equation',
									$elm$json$Json$Encode$object(
										_List_fromArray(
											[
												_Utils_Tuple2(
												'expression',
												$elm$json$Json$Encode$string(answer)),
												_Utils_Tuple2(
												'notation',
												$author$project$Settings$getters.value(
													A2($author$project$Settings$atField, 'notation', part.settings)))
											])));
							})) : function (_v0) {
						return $elm$core$Maybe$Nothing;
					};
				})),
			_Utils_Tuple2(
			_List_fromArray(
				[
					$author$project$Settings$field('answer')
				]),
			F2(
				function (path, part) {
					return (part.type_.name === 'jme') ? A2(
						$elm$core$Basics$composeR,
						string,
						$elm$core$Maybe$map(
							function (answer) {
								return A3(
									$author$project$QuestionEditor$ask_numbas_about_part,
									path,
									'findvars',
									$elm$json$Json$Encode$object(
										_List_fromArray(
											[
												_Utils_Tuple2(
												'expression',
												$elm$json$Json$Encode$string(answer)),
												_Utils_Tuple2(
												'notation',
												$author$project$Settings$getters.value(
													A2($author$project$Settings$atField, 'notation', part.settings))),
												_Utils_Tuple2(
												'expandJuxtapositionsSettings',
												$elm$json$Json$Encode$object(
													_List_fromArray(
														[
															_Utils_Tuple2(
															'singleLetterVariables',
															$author$project$Settings$getters.value(
																A2($author$project$Settings$atField, 'singleLetterVariables', part.settings))),
															_Utils_Tuple2(
															'noUnknownFunctions',
															$elm$json$Json$Encode$bool(
																!$author$project$Settings$getters.bool(
																	A2($author$project$Settings$atField, 'allowUnknownFunctions', part.settings)))),
															_Utils_Tuple2(
															'implicitFunctionComposition',
															$author$project$Settings$getters.value(
																A2($author$project$Settings$atField, 'implicitFunctionComposition', part.settings))),
															_Utils_Tuple2(
															'normaliseSubscripts',
															$elm$json$Json$Encode$bool(true))
														])))
											])));
							})) : function (_v1) {
						return $elm$core$Maybe$Nothing;
					};
				})),
			_Utils_Tuple2(
			_List_fromArray(
				[
					$author$project$Settings$field('mustmatchpattern'),
					$author$project$Settings$field('pattern')
				]),
			F2(
				function (path, part) {
					return (part.type_.name === 'jme') ? A2(
						$elm$core$Basics$composeR,
						string,
						$elm$core$Maybe$map(
							function (pattern) {
								return A3(
									$author$project$QuestionEditor$ask_numbas_about_part,
									path,
									'capturedNames',
									$elm$json$Json$Encode$object(
										_List_fromArray(
											[
												_Utils_Tuple2(
												'pattern',
												$elm$json$Json$Encode$string(pattern))
											])));
							})) : function (_v2) {
						return $elm$core$Maybe$Nothing;
					};
				}))
		]);
}();
var $author$project$QuestionEditor$Alternative = {$: 'Alternative'};
var $author$project$QuestionEditor$Gap = {$: 'Gap'};
var $author$project$QuestionEditor$Step = {$: 'Step'};
var $author$project$QuestionEditor$TopPart = {$: 'TopPart'};
var $author$project$QuestionEditor$apply_part_container = F2(
	function (fn, pc) {
		var c = pc.a;
		return fn(c);
	});
var $elm$core$Tuple$mapFirst = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			func(x),
			y);
	});
function $author$project$QuestionEditor$cyclic$unwrap_part_container() {
	return $author$project$QuestionEditor$apply_part_container(
		function (c) {
			var handle = F3(
				function (kind, i, part) {
					return _Utils_ap(
						_List_fromArray(
							[
								_Utils_Tuple2(
								_List_fromArray(
									[
										_Utils_Tuple2(kind, i)
									]),
								part)
							]),
						A2(
							$elm$core$List$map,
							$elm$core$Tuple$mapFirst(
								$elm$core$List$cons(
									_Utils_Tuple2(kind, i))),
							$author$project$QuestionEditor$cyclic$unwrap_part_container()(part.children)));
				});
			return A2(
				$elm$core$List$concatMap,
				function (_v0) {
					var kind = _v0.a;
					var getter = _v0.b;
					return A2(
						$elm$core$List$concatMap,
						$elm$core$Basics$identity,
						A2(
							$elm$core$List$indexedMap,
							handle(kind),
							getter(c)));
				},
				_List_fromArray(
					[
						_Utils_Tuple2(
						$author$project$QuestionEditor$TopPart,
						function ($) {
							return $.parts;
						}),
						_Utils_Tuple2(
						$author$project$QuestionEditor$Gap,
						function ($) {
							return $.gaps;
						}),
						_Utils_Tuple2(
						$author$project$QuestionEditor$Step,
						function ($) {
							return $.steps;
						}),
						_Utils_Tuple2(
						$author$project$QuestionEditor$Alternative,
						function ($) {
							return $.alternatives;
						})
					]));
		});
}
try {
	var $author$project$QuestionEditor$unwrap_part_container = $author$project$QuestionEditor$cyclic$unwrap_part_container();
	$author$project$QuestionEditor$cyclic$unwrap_part_container = function () {
		return $author$project$QuestionEditor$unwrap_part_container;
	};
} catch ($) {
	throw 'Some top-level definitions from `QuestionEditor` are causing infinite recursion:\n\n  ┌─────┐\n  │    unwrap_part_container\n  └─────┘\n\nThese errors are very tricky, so read https://elm-lang.org/0.19.2/bad-recursion to learn how to fix it!';}
var $author$project$QuestionEditor$compute_all = function (model) {
	var question = model.history.current;
	var all_parts = $author$project$QuestionEditor$unwrap_part_container(question.parts);
	var part_cmds = A2(
		$elm$core$List$concatMap,
		function (_v0) {
			var path = _v0.a;
			var part = _v0.b;
			return A2(
				$elm$core$List$filterMap,
				function (_v1) {
					var ats = _v1.a;
					var fn = _v1.b;
					return A2(
						$elm$core$Maybe$andThen,
						A2(fn, path, part),
						A2(
							$author$project$Settings$maybe_get,
							$elm$json$Json$Decode$value,
							A2($author$project$Settings$at, ats, part.settings)));
				},
				$author$project$QuestionEditor$part_setting_computed);
		},
		all_parts);
	return _Utils_Tuple2(
		model,
		$elm$core$Platform$Cmd$batch(part_cmds));
};
var $author$project$QuestionEditor$ActiveModelRecord = function (saving) {
	return function (adding_part) {
		return function (tab_state) {
			return function (pk) {
				return function (preview) {
					return function (project) {
						return function (urls) {
							return function (share) {
								return function (ui) {
									return function (numbas) {
										return function (default_settings) {
											return function (history) {
												return {adding_part: adding_part, default_settings: default_settings, history: history, numbas: numbas, pk: pk, preview: preview, project: project, saving: saving, share: share, tab_state: tab_state, ui: ui, urls: urls};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
};
var $author$project$QuestionEditor$Saved = function (a) {
	return {$: 'Saved', a: a};
};
var $elm_community$json_extra$Json$Decode$Extra$andMap = $elm$json$Json$Decode$map2($elm$core$Basics$apR);
var $author$project$QuestionEditor$andThen2 = F3(
	function (fn, a, b) {
		return A2(
			$elm$json$Json$Decode$andThen,
			$elm$core$Basics$identity,
			A3($elm$json$Json$Decode$map2, fn, a, b));
	});
var $elm$json$Json$Decode$at = F2(
	function (fields, decoder) {
		return A3($elm$core$List$foldr, $elm$json$Json$Decode$field, decoder, fields);
	});
var $author$project$QuestionEditor$Preview = F2(
	function (url, target) {
		return {target: target, url: url};
	});
var $author$project$QuestionEditor$decode_preview = A2(
	$elm_community$json_extra$Json$Decode$Extra$andMap,
	A2($elm$json$Json$Decode$field, 'target', $elm$json$Json$Decode$string),
	A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		A2($elm$json$Json$Decode$field, 'url', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$succeed($author$project$QuestionEditor$Preview)));
var $author$project$QuestionEditor$Project = F3(
	function (name, url, breadcrumbs) {
		return {breadcrumbs: breadcrumbs, name: name, url: url};
	});
var $author$project$QuestionEditor$ProjectFolder = F2(
	function (name, url) {
		return {name: name, url: url};
	});
var $author$project$QuestionEditor$decode_project_folder = A2(
	$elm_community$json_extra$Json$Decode$Extra$andMap,
	A2($elm$json$Json$Decode$field, 'url', $elm$json$Json$Decode$string),
	A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		A2($elm$json$Json$Decode$field, 'name', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$succeed($author$project$QuestionEditor$ProjectFolder)));
var $author$project$QuestionEditor$decode_project = A2(
	$elm_community$json_extra$Json$Decode$Extra$andMap,
	A2(
		$elm$json$Json$Decode$field,
		'breadcrumbs',
		$elm$json$Json$Decode$list($author$project$QuestionEditor$decode_project_folder)),
	A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		A2($elm$json$Json$Decode$field, 'url', $elm$json$Json$Decode$string),
		A2(
			$elm_community$json_extra$Json$Decode$Extra$andMap,
			A2($elm$json$Json$Decode$field, 'name', $elm$json$Json$Decode$string),
			$elm$json$Json$Decode$succeed($author$project$QuestionEditor$Project))));
var $author$project$QuestionEditor$Question = F2(
	function (settings, parts) {
		return {parts: parts, settings: settings};
	});
var $author$project$QuestionEditor$PartContainer = function (a) {
	return {$: 'PartContainer', a: a};
};
var $author$project$QuestionEditor$Parts = F4(
	function (parts, gaps, steps, alternatives) {
		return {alternatives: alternatives, gaps: gaps, parts: parts, steps: steps};
	});
var $author$project$QuestionEditor$custom_part_type = {can_be_gap: true, can_be_step: true, description: 'TODO', has_correct_answer: true, has_feedback_icon: true, has_marking_settings: true, has_marks: true, help_url: 'question/parts/custom.html', name: 'custom', nice_name: 'Custom', widget: ''};
var $elm$json$Json$Decode$lazy = function (thunk) {
	return A2(
		$elm$json$Json$Decode$andThen,
		thunk,
		$elm$json$Json$Decode$succeed(_Utils_Tuple0));
};
var $elm$core$Dict$RBEmpty_elm_builtin = {$: 'RBEmpty_elm_builtin'};
var $elm$core$Dict$empty = $elm$core$Dict$RBEmpty_elm_builtin;
var $elm$core$Dict$Black = {$: 'Black'};
var $elm$core$Dict$RBNode_elm_builtin = F5(
	function (a, b, c, d, e) {
		return {$: 'RBNode_elm_builtin', a: a, b: b, c: c, d: d, e: e};
	});
var $elm$core$Dict$Red = {$: 'Red'};
var $elm$core$Dict$balance = F5(
	function (color, key, value, left, right) {
		if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Red')) {
			var _v1 = right.a;
			var rK = right.b;
			var rV = right.c;
			var rLeft = right.d;
			var rRight = right.e;
			if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
				var _v3 = left.a;
				var lK = left.b;
				var lV = left.c;
				var lLeft = left.d;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					key,
					value,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					rK,
					rV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, left, rLeft),
					rRight);
			}
		} else {
			if ((((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) && (left.d.$ === 'RBNode_elm_builtin')) && (left.d.a.$ === 'Red')) {
				var _v5 = left.a;
				var lK = left.b;
				var lV = left.c;
				var _v6 = left.d;
				var _v7 = _v6.a;
				var llK = _v6.b;
				var llV = _v6.c;
				var llLeft = _v6.d;
				var llRight = _v6.e;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					lK,
					lV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, key, value, lRight, right));
			} else {
				return A5($elm$core$Dict$RBNode_elm_builtin, color, key, value, left, right);
			}
		}
	});
var $elm$core$Basics$compare = _Utils_compare;
var $elm$core$Dict$insertHelp = F3(
	function (key, value, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
		} else {
			var nColor = dict.a;
			var nKey = dict.b;
			var nValue = dict.c;
			var nLeft = dict.d;
			var nRight = dict.e;
			var _v1 = A2($elm$core$Basics$compare, key, nKey);
			switch (_v1.$) {
				case 'LT':
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						A3($elm$core$Dict$insertHelp, key, value, nLeft),
						nRight);
				case 'EQ':
					return A5($elm$core$Dict$RBNode_elm_builtin, nColor, nKey, value, nLeft, nRight);
				default:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						nLeft,
						A3($elm$core$Dict$insertHelp, key, value, nRight));
			}
		}
	});
var $elm$core$Dict$insert = F3(
	function (key, value, dict) {
		var _v0 = A3($elm$core$Dict$insertHelp, key, value, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$core$Dict$fromList = function (assocs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, dict) {
				var key = _v0.a;
				var value = _v0.b;
				return A3($elm$core$Dict$insert, key, value, dict);
			}),
		$elm$core$Dict$empty,
		assocs);
};
var $elm$json$Json$Decode$keyValuePairs = _Json_decodeKeyValuePairs;
var $elm$json$Json$Decode$dict = function (decoder) {
	return A2(
		$elm$json$Json$Decode$map,
		$elm$core$Dict$fromList,
		$elm$json$Json$Decode$keyValuePairs(decoder));
};
var $elm$core$Dict$foldl = F3(
	function (func, acc, dict) {
		foldl:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldl, func, acc, left)),
					$temp$dict = right;
				func = $temp$func;
				acc = $temp$acc;
				dict = $temp$dict;
				continue foldl;
			}
		}
	});
var $elm$json$Json$Encode$dict = F3(
	function (toKey, toValue, dictionary) {
		return _Json_wrap(
			A3(
				$elm$core$Dict$foldl,
				F3(
					function (key, value, obj) {
						return A3(
							_Json_addField,
							toKey(key),
							toValue(value),
							obj);
					}),
				_Json_emptyObject(_Utils_Tuple0),
				dictionary));
	});
var $author$project$Settings$empty = {
	at: _List_Nil,
	defaults: $elm$json$Json$Encode$object(_List_Nil),
	value: $elm$json$Json$Encode$object(_List_Nil)
};
var $author$project$Settings$fromValue = F2(
	function (value, defaults) {
		return {at: _List_Nil, defaults: defaults, value: value};
	});
var $elm$core$Result$withDefault = F2(
	function (def, result) {
		if (result.$ === 'Ok') {
			var a = result.a;
			return a;
		} else {
			return def;
		}
	});
var $author$project$QuestionEditor$get_default_settings = function (at) {
	return A2(
		$elm$core$Basics$composeR,
		$elm$json$Json$Decode$decodeValue(
			A2($elm$json$Json$Decode$at, at, $elm$json$Json$Decode$value)),
		$elm$core$Result$withDefault($elm$json$Json$Encode$null));
};
var $elm$core$Result$map = F2(
	function (func, ra) {
		if (ra.$ === 'Ok') {
			var a = ra.a;
			return $elm$core$Result$Ok(
				func(a));
		} else {
			var e = ra.a;
			return $elm$core$Result$Err(e);
		}
	});
var $elm$core$Result$map2 = F3(
	function (func, ra, rb) {
		if (ra.$ === 'Err') {
			var x = ra.a;
			return $elm$core$Result$Err(x);
		} else {
			var a = ra.a;
			if (rb.$ === 'Err') {
				var x = rb.a;
				return $elm$core$Result$Err(x);
			} else {
				var b = rb.a;
				return $elm$core$Result$Ok(
					A2(func, a, b));
			}
		}
	});
var $elm$core$Dict$union = F2(
	function (t1, t2) {
		return A3($elm$core$Dict$foldl, $elm$core$Dict$insert, t2, t1);
	});
var $author$project$QuestionEditor$new_part = F4(
	function (default_settings, type_, settings, children) {
		var type_defaults = A2(
			$author$project$QuestionEditor$get_default_settings,
			_List_fromArray(
				['part_types', type_.name]),
			default_settings);
		var _true = $elm$json$Json$Encode$bool(true);
		var string = $elm$json$Json$Encode$string('');
		var standard_defaults = A2(
			$author$project$QuestionEditor$get_default_settings,
			_List_fromArray(
				['part']),
			default_settings);
		var _float = A2($elm$core$Basics$composeR, $elm$core$String$fromFloat, $elm$json$Json$Encode$string);
		var _false = $elm$json$Json$Encode$bool(false);
		var defaults = A2(
			$elm$core$Result$withDefault,
			$elm$json$Json$Encode$null,
			A2(
				$elm$core$Result$map,
				A2($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$core$Basics$identity),
				A3(
					$elm$core$Result$map2,
					$elm$core$Dict$union,
					A2(
						$elm$json$Json$Decode$decodeValue,
						$elm$json$Json$Decode$dict($elm$json$Json$Decode$value),
						standard_defaults),
					A2(
						$elm$json$Json$Decode$decodeValue,
						$elm$json$Json$Decode$dict($elm$json$Json$Decode$value),
						type_defaults))));
		var nsettings = A2($author$project$Settings$fromValue, settings, defaults);
		return {children: children, computed: $author$project$Settings$empty, settings: nsettings, type_: type_};
	});
var $author$project$QuestionEditor$standard_part_type = F5(
	function (name, nice_name, description, help_page, widget) {
		return {can_be_gap: true, can_be_step: true, description: description, has_correct_answer: true, has_feedback_icon: true, has_marking_settings: true, has_marks: true, help_url: help_page, name: name, nice_name: nice_name, widget: widget};
	});
var $author$project$QuestionEditor$part_types = _List_fromArray(
	[
		{can_be_gap: false, can_be_step: true, description: 'An information part contains only a prompt and no answer input. It is most often used as a Step to provide a hint for a parent part.', has_correct_answer: false, has_feedback_icon: false, has_marking_settings: false, has_marks: false, help_url: 'information-only', name: 'information', nice_name: 'Information only', widget: ''},
		{can_be_gap: false, can_be_step: false, description: 'Gap-fill parts allow you to include answer inputs inline with the prompt text, instead of at the end of the part.', has_correct_answer: false, has_feedback_icon: true, has_marking_settings: true, has_marks: true, help_url: 'gap-fill', name: 'gapfill', nice_name: 'Gap-fill', widget: ''},
		{can_be_gap: true, can_be_step: true, description: 'An extension part acts as a placeholder for any interactive element added by an extension, or custom code in the question, which awards marks to the student.', has_correct_answer: false, has_feedback_icon: false, has_marking_settings: true, has_marks: true, help_url: 'extension-part', name: 'extension', nice_name: 'Extension', widget: ''},
		A5($author$project$QuestionEditor$standard_part_type, 'jme', 'Mathematical expression', 'Ask the student to enter an algebraic expression, using JME syntax.', 'mathematical-expression', 'jme'),
		A5($author$project$QuestionEditor$standard_part_type, 'numberentry', 'Number entry', 'Ask the student to enter a number.', 'number-entry', 'number'),
		A5($author$project$QuestionEditor$standard_part_type, 'matrix', 'Matrix entry', 'Ask the student to enter a matrix of numbers.', 'matrix-entry', 'matrix'),
		A5($author$project$QuestionEditor$standard_part_type, 'patternmatch', 'Match text pattern', 'Ask the student to enter short, non-mathematical text.', 'match-text-pattern', 'string'),
		A5($author$project$QuestionEditor$standard_part_type, '1_n_2', 'Choose one from a list', 'The student must choose one of several options.', 'multiple-choice', 'radios'),
		A5($author$project$QuestionEditor$standard_part_type, 'm_n_2', 'Choose several from a list', 'The student can choose any of a list of options.', 'multiple-choice', 'checkboxes'),
		A5($author$project$QuestionEditor$standard_part_type, 'm_n_x', 'Match choices with answers', 'The student is presented with a 2D grid of choices and answers. Depending on how the part is set up, they must either match up each choice with an answer, or select any number of choice-answer pairs.', 'multiple-choice', 'm_n_x')
	]);
var $author$project$QuestionEditor$decode_child_parts = function (default_settings) {
	var doer = function (key) {
		return $elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$field,
					key,
					$elm$json$Json$Decode$list(
						$elm$json$Json$Decode$lazy(
							function (_v1) {
								return $author$project$QuestionEditor$decode_part(default_settings);
							}))),
					$elm$json$Json$Decode$succeed(_List_Nil)
				]));
	};
	return A2(
		$elm$json$Json$Decode$map,
		$author$project$QuestionEditor$PartContainer,
		A2(
			$elm_community$json_extra$Json$Decode$Extra$andMap,
			doer('alternatives'),
			A2(
				$elm_community$json_extra$Json$Decode$Extra$andMap,
				doer('steps'),
				A2(
					$elm_community$json_extra$Json$Decode$Extra$andMap,
					doer('gaps'),
					A2(
						$elm_community$json_extra$Json$Decode$Extra$andMap,
						doer('parts'),
						$elm$json$Json$Decode$succeed($author$project$QuestionEditor$Parts))))));
};
var $author$project$QuestionEditor$decode_part = function (default_settings) {
	return A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		$author$project$QuestionEditor$decode_child_parts(default_settings),
		A2(
			$elm_community$json_extra$Json$Decode$Extra$andMap,
			$elm$json$Json$Decode$value,
			A2(
				$elm_community$json_extra$Json$Decode$Extra$andMap,
				A2(
					$elm$json$Json$Decode$field,
					'type',
					A2(
						$elm$json$Json$Decode$andThen,
						function (t) {
							var _v0 = $elm$core$List$head(
								A2(
									$elm$core$List$filter,
									A2(
										$elm$core$Basics$composeR,
										function ($) {
											return $.name;
										},
										$elm$core$Basics$eq(t)),
									$author$project$QuestionEditor$part_types));
							if (_v0.$ === 'Just') {
								var type_ = _v0.a;
								return $elm$json$Json$Decode$succeed(type_);
							} else {
								return $elm$json$Json$Decode$succeed($author$project$QuestionEditor$custom_part_type);
							}
						},
						$elm$json$Json$Decode$string)),
				$elm$json$Json$Decode$succeed(
					$author$project$QuestionEditor$new_part(default_settings)))));
};
var $author$project$QuestionEditor$decode_question = function (default_settings) {
	return A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		$author$project$QuestionEditor$decode_child_parts(default_settings),
		A2(
			$elm_community$json_extra$Json$Decode$Extra$andMap,
			A2(
				$elm$json$Json$Decode$map,
				function (s) {
					return A2(
						$author$project$Settings$fromValue,
						s,
						A2(
							$author$project$QuestionEditor$get_default_settings,
							_List_fromArray(
								['question']),
							default_settings));
				},
				$elm$json$Json$Decode$value),
			$elm$json$Json$Decode$succeed($author$project$QuestionEditor$Question)));
};
var $author$project$QuestionEditor$ShareTokens = F2(
	function (view, edit) {
		return {edit: edit, view: view};
	});
var $author$project$QuestionEditor$decode_share = A2(
	$elm_community$json_extra$Json$Decode$Extra$andMap,
	A2($elm$json$Json$Decode$field, 'edit', $elm$json$Json$Decode$string),
	A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		A2($elm$json$Json$Decode$field, 'view', $elm$json$Json$Decode$string),
		$elm$json$Json$Decode$succeed($author$project$QuestionEditor$ShareTokens)));
var $author$project$Tabber$initial_state = $elm$core$Dict$empty;
var $author$project$Tabber$decode_state = $elm$json$Json$Decode$oneOf(
	_List_fromArray(
		[
			$elm$json$Json$Decode$dict($elm$json$Json$Decode$string),
			$elm$json$Json$Decode$succeed($author$project$Tabber$initial_state)
		]));
var $author$project$Ui$UiConfig = F4(
	function (icon_map, csrf_token, help_root, docs_mapping) {
		return {csrf_token: csrf_token, docs_mapping: docs_mapping, help_root: help_root, icon_map: icon_map};
	});
var $elm$core$String$toLower = _String_toLower;
var $elm$html$Html$a = _VirtualDom_node('a');
var $elm$virtual_dom$VirtualDom$attribute = F2(
	function (key, value) {
		return A2(
			_VirtualDom_attribute,
			_VirtualDom_noOnOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlUri(value));
	});
var $elm$html$Html$Attributes$attribute = $elm$virtual_dom$VirtualDom$attribute;
var $elm$html$Html$button = _VirtualDom_node('button');
var $elm$html$Html$Attributes$stringProperty = F2(
	function (key, string) {
		return A2(
			_VirtualDom_property,
			key,
			$elm$json$Json$Encode$string(string));
	});
var $elm$html$Html$Attributes$class = $elm$html$Html$Attributes$stringProperty('className');
var $elm$html$Html$div = _VirtualDom_node('div');
var $elm$core$Dict$get = F2(
	function (targetKey, dict) {
		get:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return $elm$core$Maybe$Nothing;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var _v1 = A2($elm$core$Basics$compare, targetKey, key);
				switch (_v1.$) {
					case 'LT':
						var $temp$targetKey = targetKey,
							$temp$dict = left;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
					case 'EQ':
						return $elm$core$Maybe$Just(value);
					default:
						var $temp$targetKey = targetKey,
							$temp$dict = right;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
				}
			}
		}
	});
var $elm$html$Html$Attributes$href = function (url) {
	return A2(
		$elm$html$Html$Attributes$stringProperty,
		'href',
		_VirtualDom_noJavaScriptUri(url));
};
var $elm$html$Html$Attributes$id = $elm$html$Html$Attributes$stringProperty('id');
var $author$project$Aria$label = $elm$html$Html$Attributes$attribute('aria-label');
var $elm$html$Html$menu = _VirtualDom_node('menu');
var $elm$html$Html$p = _VirtualDom_node('p');
var $elm$html$Html$span = _VirtualDom_node('span');
var $elm$html$Html$Attributes$target = $elm$html$Html$Attributes$stringProperty('target');
var $elm$virtual_dom$VirtualDom$text = _VirtualDom_text;
var $elm$html$Html$text = $elm$virtual_dom$VirtualDom$text;
var $elm$html$Html$Attributes$title = $elm$html$Html$Attributes$stringProperty('title');
var $elm$html$Html$Attributes$type_ = $elm$html$Html$Attributes$stringProperty('type');
var $author$project$Ui$ui = function (config) {
	var inline_help_block = function (content) {
		return A2(
			$elm$html$Html$span,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('help-block inline')
				]),
			content);
	};
	var icon = function (name) {
		var mpic = A2($elm$core$Dict$get, name, config.icon_map);
		if (mpic.$ === 'Just') {
			var pic = mpic.a;
			return A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('icon')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(pic),
						$elm$html$Html$text(' ')
					]));
		} else {
			return A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('icon missing')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(name),
						$elm$html$Html$text(' ')
					]));
		}
	};
	var helplink = F2(
		function (term, subject) {
			var hint = 'Help with ' + subject;
			var _v0 = A2(
				$elm$core$Dict$get,
				$elm$core$String$toLower(term),
				config.docs_mapping);
			if (_v0.$ === 'Just') {
				var term_url = _v0.a;
				return A2(
					$elm$html$Html$a,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$href(
							_Utils_ap(config.help_root, term_url)),
							$elm$html$Html$Attributes$class('helplink info'),
							$elm$html$Html$Attributes$target('numbasquickhelp'),
							$author$project$Aria$label(hint),
							$elm$html$Html$Attributes$title(hint)
						]),
					_List_fromArray(
						[
							icon('help')
						]));
			} else {
				return A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('warning')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Unknown docs term: ' + term)
						]));
			}
		});
	var help_block = function (content) {
		return A2(
			$elm$html$Html$p,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('help-block')
				]),
			content);
	};
	var dropdown = F3(
		function (name, label_content, items) {
			return _List_fromArray(
				[
					A2(
					$elm$html$Html$button,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$type_('button'),
							$elm$html$Html$Attributes$class('btn'),
							$elm$html$Html$Attributes$id(name + '-dropdown'),
							A2($elm$html$Html$Attributes$attribute, 'popovertarget', name + '-menu')
						]),
					label_content),
					A2(
					$elm$html$Html$menu,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$id(name + '-menu'),
							A2($elm$html$Html$Attributes$attribute, 'popover', 'auto')
						]),
					items)
				]);
		});
	var alert = F2(
		function (kind, content) {
			return A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('alert ' + kind)
					]),
				content);
		});
	return {alert: alert, config: config, dropdown: dropdown, help_block: help_block, helplink: helplink, icon: icon, inline_help_block: inline_help_block};
};
var $author$project$QuestionEditor$decode_ui = A2(
	$elm$json$Json$Decode$map,
	$author$project$Ui$ui,
	A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		A2(
			$elm$json$Json$Decode$field,
			'docs_mapping',
			A2(
				$elm$json$Json$Decode$map,
				A2(
					$elm$core$Basics$composeR,
					$elm$core$Dict$toList,
					A2(
						$elm$core$Basics$composeR,
						$elm$core$List$map(
							$elm$core$Tuple$mapFirst($elm$core$String$toLower)),
						$elm$core$Dict$fromList)),
				$elm$json$Json$Decode$dict($elm$json$Json$Decode$string))),
		A2(
			$elm_community$json_extra$Json$Decode$Extra$andMap,
			A2(
				$elm$json$Json$Decode$at,
				_List_fromArray(
					['item_json', 'helpURL']),
				$elm$json$Json$Decode$string),
			A2(
				$elm_community$json_extra$Json$Decode$Extra$andMap,
				A2($elm$json$Json$Decode$field, 'CSRFToken', $elm$json$Json$Decode$string),
				A2(
					$elm_community$json_extra$Json$Decode$Extra$andMap,
					A2(
						$elm$json$Json$Decode$at,
						_List_fromArray(
							['item_json', 'icon_map']),
						$elm$json$Json$Decode$dict($elm$json$Json$Decode$string)),
					$elm$json$Json$Decode$succeed($author$project$Ui$UiConfig))))));
var $author$project$QuestionEditor$EditorUrls = F4(
	function (copy, _delete, download, source) {
		return {copy: copy, _delete: _delete, download: download, source: source};
	});
var $author$project$QuestionEditor$decode_urls = A2(
	$elm_community$json_extra$Json$Decode$Extra$andMap,
	A2($elm$json$Json$Decode$field, 'source', $elm$json$Json$Decode$string),
	A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		A2($elm$json$Json$Decode$field, 'download', $elm$json$Json$Decode$string),
		A2(
			$elm_community$json_extra$Json$Decode$Extra$andMap,
			A2($elm$json$Json$Decode$field, 'delete', $elm$json$Json$Decode$string),
			A2(
				$elm_community$json_extra$Json$Decode$Extra$andMap,
				A2($elm$json$Json$Decode$field, 'copy', $elm$json$Json$Decode$string),
				$elm$json$Json$Decode$succeed($author$project$QuestionEditor$EditorUrls)))));
var $author$project$History$init = function (state) {
	return {current: state, future: _List_Nil, past: _List_Nil, small_change: false};
};
var $elm$json$Json$Decode$int = _Json_decodeInt;
var $author$project$QuestionEditor$decode_flags = A2(
	$elm$json$Json$Decode$andThen,
	function (partial) {
		return A3(
			$author$project$QuestionEditor$andThen2,
			F2(
				function (numbas, default_settings) {
					return A2(
						$elm$json$Json$Decode$map,
						function (q) {
							return A3(
								partial,
								numbas,
								default_settings,
								$author$project$History$init(q));
						},
						A2(
							$elm$json$Json$Decode$at,
							_List_fromArray(
								['item_json', 'itemJSON', 'JSONContent']),
							$author$project$QuestionEditor$decode_question(default_settings)));
				}),
			A2($elm$json$Json$Decode$field, 'Numbas', $elm$json$Json$Decode$value),
			A2($elm$json$Json$Decode$field, 'default_settings', $elm$json$Json$Decode$value));
	},
	A2(
		$elm_community$json_extra$Json$Decode$Extra$andMap,
		$author$project$QuestionEditor$decode_ui,
		A2(
			$elm_community$json_extra$Json$Decode$Extra$andMap,
			A2(
				$elm$json$Json$Decode$at,
				_List_fromArray(
					['item_json', 'share']),
				$author$project$QuestionEditor$decode_share),
			A2(
				$elm_community$json_extra$Json$Decode$Extra$andMap,
				A2(
					$elm$json$Json$Decode$at,
					_List_fromArray(
						['item_json', 'urls']),
					$author$project$QuestionEditor$decode_urls),
				A2(
					$elm_community$json_extra$Json$Decode$Extra$andMap,
					A2(
						$elm$json$Json$Decode$at,
						_List_fromArray(
							['item_json', 'project']),
						$author$project$QuestionEditor$decode_project),
					A2(
						$elm_community$json_extra$Json$Decode$Extra$andMap,
						A2(
							$elm$json$Json$Decode$at,
							_List_fromArray(
								['item_json', 'preview']),
							$author$project$QuestionEditor$decode_preview),
						A2(
							$elm_community$json_extra$Json$Decode$Extra$andMap,
							A2(
								$elm$json$Json$Decode$at,
								_List_fromArray(
									['item_json', 'itemJSON', 'id']),
								$elm$json$Json$Decode$int),
							A2(
								$elm_community$json_extra$Json$Decode$Extra$andMap,
								A2($elm$json$Json$Decode$field, 'tab_state', $author$project$Tabber$decode_state),
								$elm$json$Json$Decode$succeed(
									A2(
										$author$project$QuestionEditor$ActiveModelRecord,
										$author$project$QuestionEditor$Saved(
											$elm$core$Result$Ok(_Utils_Tuple0)),
										_Utils_Tuple2(_List_Nil, $author$project$QuestionEditor$TopPart)))))))))));
var $elm$core$Platform$Cmd$none = $elm$core$Platform$Cmd$batch(_List_Nil);
var $author$project$QuestionEditor$nocmd = function (model) {
	return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
};
var $author$project$QuestionEditor$init = function (flags) {
	return function (r) {
		if (r.$ === 'Ok') {
			var active = r.a;
			return A2(
				$elm$core$Tuple$mapFirst,
				$author$project$QuestionEditor$ActiveModel,
				$author$project$QuestionEditor$compute_all(active));
		} else {
			var err = r.a;
			return $author$project$QuestionEditor$nocmd(
				$author$project$QuestionEditor$ErrorModel(err));
		}
	}(
		A2($elm$json$Json$Decode$decodeValue, $author$project$QuestionEditor$decode_flags, flags));
};
var $author$project$QuestionEditor$AnswerNumbas = function (a) {
	return {$: 'AnswerNumbas', a: a};
};
var $author$project$QuestionEditor$answer_numbas = _Platform_incomingPort('answer_numbas', $elm$json$Json$Decode$value);
var $elm$core$Platform$Sub$batch = _Platform_batch;
var $author$project$QuestionEditor$subscriptions = function (_v0) {
	return $elm$core$Platform$Sub$batch(
		_List_fromArray(
			[
				$author$project$QuestionEditor$answer_numbas($author$project$QuestionEditor$AnswerNumbas)
			]));
};
var $author$project$QuestionEditor$ChangePartComputed = F2(
	function (a, b) {
		return {$: 'ChangePartComputed', a: a, b: b};
	});
var $author$project$QuestionEditor$Changed = {$: 'Changed'};
var $author$project$QuestionEditor$Save = function (a) {
	return {$: 'Save', a: a};
};
var $author$project$QuestionEditor$Saving = {$: 'Saving'};
var $author$project$Tabber$SetTab = F2(
	function (a, b) {
		return {$: 'SetTab', a: a, b: b};
	});
var $author$project$QuestionEditor$UpdatePart = F2(
	function (a, b) {
		return {$: 'UpdatePart', a: a, b: b};
	});
var $author$project$QuestionEditor$UpdateQuestion = function (a) {
	return {$: 'UpdateQuestion', a: a};
};
var $author$project$QuestionEditor$UpdateTab = function (a) {
	return {$: 'UpdateTab', a: a};
};
var $author$project$History$big_change = F2(
	function (state, history) {
		return _Utils_update(
			history,
			{
				current: state,
				future: _List_Nil,
				past: A2($elm$core$List$cons, history.current, history.past),
				small_change: false
			});
	});
var $elm$core$Basics$always = F2(
	function (a, _v0) {
		return a;
	});
var $elm$core$Process$sleep = _Process_sleep;
var $author$project$Util$delay = F2(
	function (t, msg) {
		return A2(
			$elm$core$Task$perform,
			$elm$core$Basics$always(msg),
			$elm$core$Process$sleep(t));
	});
var $author$project$QuestionEditor$child_part_kinds = _List_fromArray(
	[
		_Utils_Tuple2('parts', $author$project$QuestionEditor$TopPart),
		_Utils_Tuple2('gaps', $author$project$QuestionEditor$Gap),
		_Utils_Tuple2('steps', $author$project$QuestionEditor$Step),
		_Utils_Tuple2('alternatives', $author$project$QuestionEditor$Alternative)
	]);
var $elm$json$Json$Encode$list = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$List$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(_Utils_Tuple0),
				entries));
	});
var $elm$core$Tuple$mapSecond = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			x,
			func(y));
	});
var $elm$core$Basics$neq = _Utils_notEqual;
var $author$project$QuestionEditor$part_getter = function (kind) {
	return $author$project$QuestionEditor$apply_part_container(
		function () {
			switch (kind.$) {
				case 'TopPart':
					return function ($) {
						return $.parts;
					};
				case 'Gap':
					return function ($) {
						return $.gaps;
					};
				case 'Step':
					return function ($) {
						return $.steps;
					};
				default:
					return function ($) {
						return $.alternatives;
					};
			}
		}());
};
var $author$project$QuestionEditor$encode_part = function (part) {
	return $elm$json$Json$Encode$object(
		_Utils_ap(
			A3(
				$author$project$Settings$get,
				A2(
					$elm$json$Json$Decode$map,
					$elm$core$Dict$toList,
					$elm$json$Json$Decode$dict($elm$json$Json$Decode$value)),
				_List_Nil,
				part.settings),
			_Utils_ap(
				_List_fromArray(
					[
						_Utils_Tuple2(
						'type',
						$elm$json$Json$Encode$string(part.type_.name))
					]),
				$author$project$QuestionEditor$encode_part_container(part.children))));
};
var $author$project$QuestionEditor$encode_part_container = function (pc) {
	return A2(
		$elm$core$List$map,
		$elm$core$Tuple$mapSecond(
			$elm$json$Json$Encode$list($author$project$QuestionEditor$encode_part)),
		A2(
			$elm$core$List$filter,
			A2(
				$elm$core$Basics$composeR,
				$elm$core$Tuple$second,
				$elm$core$Basics$neq(_List_Nil)),
			A2(
				$elm$core$List$map,
				$elm$core$Tuple$mapSecond(
					function (k) {
						return A2($author$project$QuestionEditor$part_getter, k, pc);
					}),
				$author$project$QuestionEditor$child_part_kinds)));
};
var $author$project$QuestionEditor$encode_question = function (question) {
	return $elm$json$Json$Encode$object(
		_Utils_ap(
			A3(
				$author$project$Settings$get,
				A2(
					$elm$json$Json$Decode$map,
					$elm$core$Dict$toList,
					$elm$json$Json$Decode$dict($elm$json$Json$Decode$value)),
				_List_Nil,
				question.settings),
			$author$project$QuestionEditor$encode_part_container(question.parts)));
};
var $elm$json$Json$Decode$fail = _Json_fail;
var $elm_community$json_extra$Json$Decode$Extra$fromMaybe = F2(
	function (error, val) {
		if (val.$ === 'Just') {
			var v = val.a;
			return $elm$json$Json$Decode$succeed(v);
		} else {
			return $elm$json$Json$Decode$fail(error);
		}
	});
var $elm$core$Platform$Cmd$map = _Platform_map;
var $author$project$History$no_change = F2(
	function (state, history) {
		return _Utils_update(
			history,
			{current: state});
	});
var $elm$parser$Parser$Done = function (a) {
	return {$: 'Done', a: a};
};
var $elm$parser$Parser$Loop = function (a) {
	return {$: 'Loop', a: a};
};
var $elm$parser$Parser$ExpectingInt = {$: 'ExpectingInt'};
var $elm$parser$Parser$Advanced$Parser = function (a) {
	return {$: 'Parser', a: a};
};
var $elm$parser$Parser$Advanced$consumeBase = _Parser_consumeBase;
var $elm$parser$Parser$Advanced$consumeBase16 = _Parser_consumeBase16;
var $elm$parser$Parser$Advanced$Bad = F2(
	function (a, b) {
		return {$: 'Bad', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$Good = F3(
	function (a, b, c) {
		return {$: 'Good', a: a, b: b, c: c};
	});
var $elm$parser$Parser$Advanced$bumpOffset = F2(
	function (newOffset, s) {
		return {col: s.col + (newOffset - s.offset), context: s.context, indent: s.indent, offset: newOffset, row: s.row, src: s.src};
	});
var $elm$parser$Parser$Advanced$chompBase10 = _Parser_chompBase10;
var $elm$parser$Parser$Advanced$isAsciiCode = _Parser_isAsciiCode;
var $elm$core$Basics$negate = function (n) {
	return -n;
};
var $elm$parser$Parser$Advanced$consumeExp = F2(
	function (offset, src) {
		if (A3($elm$parser$Parser$Advanced$isAsciiCode, 101, offset, src) || A3($elm$parser$Parser$Advanced$isAsciiCode, 69, offset, src)) {
			var eOffset = offset + 1;
			var expOffset = (A3($elm$parser$Parser$Advanced$isAsciiCode, 43, eOffset, src) || A3($elm$parser$Parser$Advanced$isAsciiCode, 45, eOffset, src)) ? (eOffset + 1) : eOffset;
			var newOffset = A2($elm$parser$Parser$Advanced$chompBase10, expOffset, src);
			return _Utils_eq(expOffset, newOffset) ? (-newOffset) : newOffset;
		} else {
			return offset;
		}
	});
var $elm$parser$Parser$Advanced$consumeDotAndExp = F2(
	function (offset, src) {
		return A3($elm$parser$Parser$Advanced$isAsciiCode, 46, offset, src) ? A2(
			$elm$parser$Parser$Advanced$consumeExp,
			A2($elm$parser$Parser$Advanced$chompBase10, offset + 1, src),
			src) : A2($elm$parser$Parser$Advanced$consumeExp, offset, src);
	});
var $elm$parser$Parser$Advanced$AddRight = F2(
	function (a, b) {
		return {$: 'AddRight', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$DeadEnd = F4(
	function (row, col, problem, contextStack) {
		return {col: col, contextStack: contextStack, problem: problem, row: row};
	});
var $elm$parser$Parser$Advanced$Empty = {$: 'Empty'};
var $elm$parser$Parser$Advanced$fromState = F2(
	function (s, x) {
		return A2(
			$elm$parser$Parser$Advanced$AddRight,
			$elm$parser$Parser$Advanced$Empty,
			A4($elm$parser$Parser$Advanced$DeadEnd, s.row, s.col, x, s.context));
	});
var $elm$parser$Parser$Advanced$finalizeInt = F5(
	function (invalid, handler, startOffset, _v0, s) {
		var endOffset = _v0.a;
		var n = _v0.b;
		if (handler.$ === 'Err') {
			var x = handler.a;
			return A2(
				$elm$parser$Parser$Advanced$Bad,
				true,
				A2($elm$parser$Parser$Advanced$fromState, s, x));
		} else {
			var toValue = handler.a;
			return _Utils_eq(startOffset, endOffset) ? A2(
				$elm$parser$Parser$Advanced$Bad,
				_Utils_cmp(s.offset, startOffset) < 0,
				A2($elm$parser$Parser$Advanced$fromState, s, invalid)) : A3(
				$elm$parser$Parser$Advanced$Good,
				true,
				toValue(n),
				A2($elm$parser$Parser$Advanced$bumpOffset, endOffset, s));
		}
	});
var $elm$parser$Parser$Advanced$fromInfo = F4(
	function (row, col, x, context) {
		return A2(
			$elm$parser$Parser$Advanced$AddRight,
			$elm$parser$Parser$Advanced$Empty,
			A4($elm$parser$Parser$Advanced$DeadEnd, row, col, x, context));
	});
var $elm$core$String$toFloat = _String_toFloat;
var $elm$parser$Parser$Advanced$finalizeFloat = F6(
	function (invalid, expecting, intSettings, floatSettings, intPair, s) {
		var intOffset = intPair.a;
		var floatOffset = A2($elm$parser$Parser$Advanced$consumeDotAndExp, intOffset, s.src);
		if (floatOffset < 0) {
			return A2(
				$elm$parser$Parser$Advanced$Bad,
				true,
				A4($elm$parser$Parser$Advanced$fromInfo, s.row, s.col - (floatOffset + s.offset), invalid, s.context));
		} else {
			if (_Utils_eq(s.offset, floatOffset)) {
				return A2(
					$elm$parser$Parser$Advanced$Bad,
					false,
					A2($elm$parser$Parser$Advanced$fromState, s, expecting));
			} else {
				if (_Utils_eq(intOffset, floatOffset)) {
					return A5($elm$parser$Parser$Advanced$finalizeInt, invalid, intSettings, s.offset, intPair, s);
				} else {
					if (floatSettings.$ === 'Err') {
						var x = floatSettings.a;
						return A2(
							$elm$parser$Parser$Advanced$Bad,
							true,
							A2($elm$parser$Parser$Advanced$fromState, s, invalid));
					} else {
						var toValue = floatSettings.a;
						var _v1 = $elm$core$String$toFloat(
							A3($elm$core$String$slice, s.offset, floatOffset, s.src));
						if (_v1.$ === 'Nothing') {
							return A2(
								$elm$parser$Parser$Advanced$Bad,
								true,
								A2($elm$parser$Parser$Advanced$fromState, s, invalid));
						} else {
							var n = _v1.a;
							return A3(
								$elm$parser$Parser$Advanced$Good,
								true,
								toValue(n),
								A2($elm$parser$Parser$Advanced$bumpOffset, floatOffset, s));
						}
					}
				}
			}
		}
	});
var $elm$parser$Parser$Advanced$number = function (c) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			if (A3($elm$parser$Parser$Advanced$isAsciiCode, 48, s.offset, s.src)) {
				var zeroOffset = s.offset + 1;
				var baseOffset = zeroOffset + 1;
				return A3($elm$parser$Parser$Advanced$isAsciiCode, 120, zeroOffset, s.src) ? A5(
					$elm$parser$Parser$Advanced$finalizeInt,
					c.invalid,
					c.hex,
					baseOffset,
					A2($elm$parser$Parser$Advanced$consumeBase16, baseOffset, s.src),
					s) : (A3($elm$parser$Parser$Advanced$isAsciiCode, 111, zeroOffset, s.src) ? A5(
					$elm$parser$Parser$Advanced$finalizeInt,
					c.invalid,
					c.octal,
					baseOffset,
					A3($elm$parser$Parser$Advanced$consumeBase, 8, baseOffset, s.src),
					s) : (A3($elm$parser$Parser$Advanced$isAsciiCode, 98, zeroOffset, s.src) ? A5(
					$elm$parser$Parser$Advanced$finalizeInt,
					c.invalid,
					c.binary,
					baseOffset,
					A3($elm$parser$Parser$Advanced$consumeBase, 2, baseOffset, s.src),
					s) : A6(
					$elm$parser$Parser$Advanced$finalizeFloat,
					c.invalid,
					c.expecting,
					c._int,
					c._float,
					_Utils_Tuple2(zeroOffset, 0),
					s)));
			} else {
				return A6(
					$elm$parser$Parser$Advanced$finalizeFloat,
					c.invalid,
					c.expecting,
					c._int,
					c._float,
					A3($elm$parser$Parser$Advanced$consumeBase, 10, s.offset, s.src),
					s);
			}
		});
};
var $elm$parser$Parser$Advanced$int = F2(
	function (expecting, invalid) {
		return $elm$parser$Parser$Advanced$number(
			{
				binary: $elm$core$Result$Err(invalid),
				expecting: expecting,
				_float: $elm$core$Result$Err(invalid),
				hex: $elm$core$Result$Err(invalid),
				_int: $elm$core$Result$Ok($elm$core$Basics$identity),
				invalid: invalid,
				octal: $elm$core$Result$Err(invalid)
			});
	});
var $elm$parser$Parser$int = A2($elm$parser$Parser$Advanced$int, $elm$parser$Parser$ExpectingInt, $elm$parser$Parser$ExpectingInt);
var $elm$parser$Parser$Advanced$map2 = F3(
	function (func, _v0, _v1) {
		var parseA = _v0.a;
		var parseB = _v1.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v2 = parseA(s0);
				if (_v2.$ === 'Bad') {
					var p = _v2.a;
					var x = _v2.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				} else {
					var p1 = _v2.a;
					var a = _v2.b;
					var s1 = _v2.c;
					var _v3 = parseB(s1);
					if (_v3.$ === 'Bad') {
						var p2 = _v3.a;
						var x = _v3.b;
						return A2($elm$parser$Parser$Advanced$Bad, p1 || p2, x);
					} else {
						var p2 = _v3.a;
						var b = _v3.b;
						var s2 = _v3.c;
						return A3(
							$elm$parser$Parser$Advanced$Good,
							p1 || p2,
							A2(func, a, b),
							s2);
					}
				}
			});
	});
var $elm$parser$Parser$Advanced$keeper = F2(
	function (parseFunc, parseArg) {
		return A3($elm$parser$Parser$Advanced$map2, $elm$core$Basics$apL, parseFunc, parseArg);
	});
var $elm$parser$Parser$keeper = $elm$parser$Parser$Advanced$keeper;
var $elm$parser$Parser$Advanced$loopHelp = F4(
	function (p, state, callback, s0) {
		loopHelp:
		while (true) {
			var _v0 = callback(state);
			var parse = _v0.a;
			var _v1 = parse(s0);
			if (_v1.$ === 'Good') {
				var p1 = _v1.a;
				var step = _v1.b;
				var s1 = _v1.c;
				if (step.$ === 'Loop') {
					var newState = step.a;
					var $temp$p = p || p1,
						$temp$state = newState,
						$temp$callback = callback,
						$temp$s0 = s1;
					p = $temp$p;
					state = $temp$state;
					callback = $temp$callback;
					s0 = $temp$s0;
					continue loopHelp;
				} else {
					var result = step.a;
					return A3($elm$parser$Parser$Advanced$Good, p || p1, result, s1);
				}
			} else {
				var p1 = _v1.a;
				var x = _v1.b;
				return A2($elm$parser$Parser$Advanced$Bad, p || p1, x);
			}
		}
	});
var $elm$parser$Parser$Advanced$loop = F2(
	function (state, callback) {
		return $elm$parser$Parser$Advanced$Parser(
			function (s) {
				return A4($elm$parser$Parser$Advanced$loopHelp, false, state, callback, s);
			});
	});
var $elm$parser$Parser$Advanced$map = F2(
	function (func, _v0) {
		var parse = _v0.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v1 = parse(s0);
				if (_v1.$ === 'Good') {
					var p = _v1.a;
					var a = _v1.b;
					var s1 = _v1.c;
					return A3(
						$elm$parser$Parser$Advanced$Good,
						p,
						func(a),
						s1);
				} else {
					var p = _v1.a;
					var x = _v1.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				}
			});
	});
var $elm$parser$Parser$map = $elm$parser$Parser$Advanced$map;
var $elm$parser$Parser$Advanced$Done = function (a) {
	return {$: 'Done', a: a};
};
var $elm$parser$Parser$Advanced$Loop = function (a) {
	return {$: 'Loop', a: a};
};
var $elm$parser$Parser$toAdvancedStep = function (step) {
	if (step.$ === 'Loop') {
		var s = step.a;
		return $elm$parser$Parser$Advanced$Loop(s);
	} else {
		var a = step.a;
		return $elm$parser$Parser$Advanced$Done(a);
	}
};
var $elm$parser$Parser$loop = F2(
	function (state, callback) {
		return A2(
			$elm$parser$Parser$Advanced$loop,
			state,
			function (s) {
				return A2(
					$elm$parser$Parser$map,
					$elm$parser$Parser$toAdvancedStep,
					callback(s));
			});
	});
var $elm$parser$Parser$Advanced$Append = F2(
	function (a, b) {
		return {$: 'Append', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$oneOfHelp = F3(
	function (s0, bag, parsers) {
		oneOfHelp:
		while (true) {
			if (!parsers.b) {
				return A2($elm$parser$Parser$Advanced$Bad, false, bag);
			} else {
				var parse = parsers.a.a;
				var remainingParsers = parsers.b;
				var _v1 = parse(s0);
				if (_v1.$ === 'Good') {
					var step = _v1;
					return step;
				} else {
					var step = _v1;
					var p = step.a;
					var x = step.b;
					if (p) {
						return step;
					} else {
						var $temp$s0 = s0,
							$temp$bag = A2($elm$parser$Parser$Advanced$Append, bag, x),
							$temp$parsers = remainingParsers;
						s0 = $temp$s0;
						bag = $temp$bag;
						parsers = $temp$parsers;
						continue oneOfHelp;
					}
				}
			}
		}
	});
var $elm$parser$Parser$Advanced$oneOf = function (parsers) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A3($elm$parser$Parser$Advanced$oneOfHelp, s, $elm$parser$Parser$Advanced$Empty, parsers);
		});
};
var $elm$parser$Parser$oneOf = $elm$parser$Parser$Advanced$oneOf;
var $elm$parser$Parser$DeadEnd = F3(
	function (row, col, problem) {
		return {col: col, problem: problem, row: row};
	});
var $elm$parser$Parser$problemToDeadEnd = function (p) {
	return A3($elm$parser$Parser$DeadEnd, p.row, p.col, p.problem);
};
var $elm$parser$Parser$Advanced$bagToList = F2(
	function (bag, list) {
		bagToList:
		while (true) {
			switch (bag.$) {
				case 'Empty':
					return list;
				case 'AddRight':
					var bag1 = bag.a;
					var x = bag.b;
					var $temp$bag = bag1,
						$temp$list = A2($elm$core$List$cons, x, list);
					bag = $temp$bag;
					list = $temp$list;
					continue bagToList;
				default:
					var bag1 = bag.a;
					var bag2 = bag.b;
					var $temp$bag = bag1,
						$temp$list = A2($elm$parser$Parser$Advanced$bagToList, bag2, list);
					bag = $temp$bag;
					list = $temp$list;
					continue bagToList;
			}
		}
	});
var $elm$parser$Parser$Advanced$run = F2(
	function (_v0, src) {
		var parse = _v0.a;
		var _v1 = parse(
			{col: 1, context: _List_Nil, indent: 1, offset: 0, row: 1, src: src});
		if (_v1.$ === 'Good') {
			var value = _v1.b;
			return $elm$core$Result$Ok(value);
		} else {
			var bag = _v1.b;
			return $elm$core$Result$Err(
				A2($elm$parser$Parser$Advanced$bagToList, bag, _List_Nil));
		}
	});
var $elm$parser$Parser$run = F2(
	function (parser, source) {
		var _v0 = A2($elm$parser$Parser$Advanced$run, parser, source);
		if (_v0.$ === 'Ok') {
			var a = _v0.a;
			return $elm$core$Result$Ok(a);
		} else {
			var problems = _v0.a;
			return $elm$core$Result$Err(
				A2($elm$core$List$map, $elm$parser$Parser$problemToDeadEnd, problems));
		}
	});
var $elm$parser$Parser$Advanced$succeed = function (a) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A3($elm$parser$Parser$Advanced$Good, false, a, s);
		});
};
var $elm$parser$Parser$succeed = $elm$parser$Parser$Advanced$succeed;
var $elm$parser$Parser$ExpectingSymbol = function (a) {
	return {$: 'ExpectingSymbol', a: a};
};
var $elm$parser$Parser$Advanced$Token = F2(
	function (a, b) {
		return {$: 'Token', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$isSubString = _Parser_isSubString;
var $elm$parser$Parser$Advanced$token = function (_v0) {
	var str = _v0.a;
	var expecting = _v0.b;
	var progress = !$elm$core$String$isEmpty(str);
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			var _v1 = A5($elm$parser$Parser$Advanced$isSubString, str, s.offset, s.row, s.col, s.src);
			var newOffset = _v1.a;
			var newRow = _v1.b;
			var newCol = _v1.c;
			return _Utils_eq(newOffset, -1) ? A2(
				$elm$parser$Parser$Advanced$Bad,
				false,
				A2($elm$parser$Parser$Advanced$fromState, s, expecting)) : A3(
				$elm$parser$Parser$Advanced$Good,
				progress,
				_Utils_Tuple0,
				{col: newCol, context: s.context, indent: s.indent, offset: newOffset, row: newRow, src: s.src});
		});
};
var $elm$parser$Parser$Advanced$symbol = $elm$parser$Parser$Advanced$token;
var $elm$parser$Parser$symbol = function (str) {
	return $elm$parser$Parser$Advanced$symbol(
		A2(
			$elm$parser$Parser$Advanced$Token,
			str,
			$elm$parser$Parser$ExpectingSymbol(str)));
};
var $author$project$QuestionEditor$parse_part_path = function () {
	var part_path_parser_help = function (path) {
		return $elm$parser$Parser$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$parser$Parser$keeper,
					A2(
						$elm$parser$Parser$keeper,
						$elm$parser$Parser$succeed(
							F2(
								function (k, n) {
									return $elm$parser$Parser$Loop(
										A2(
											$elm$core$List$cons,
											_Utils_Tuple2(k, n),
											path));
								})),
						$elm$parser$Parser$oneOf(
							A2(
								$elm$core$List$map,
								function (_v0) {
									var s = _v0.a;
									var kind = _v0.b;
									return A2(
										$elm$parser$Parser$map,
										function (_v1) {
											return kind;
										},
										$elm$parser$Parser$symbol(s));
								},
								_List_fromArray(
									[
										_Utils_Tuple2('p', $author$project$QuestionEditor$TopPart),
										_Utils_Tuple2('g', $author$project$QuestionEditor$Gap),
										_Utils_Tuple2('s', $author$project$QuestionEditor$Step),
										_Utils_Tuple2('a', $author$project$QuestionEditor$Alternative)
									])))),
					$elm$parser$Parser$int),
					A2(
					$elm$parser$Parser$map,
					function (_v2) {
						return $elm$parser$Parser$Done(
							$elm$core$List$reverse(path));
					},
					$elm$parser$Parser$succeed(_Utils_Tuple0))
				]));
	};
	var part_path_parser = A2($elm$parser$Parser$loop, _List_Nil, part_path_parser_help);
	return A2(
		$elm$core$Basics$composeR,
		$elm$parser$Parser$run(part_path_parser),
		$elm$core$Result$toMaybe);
}();
var $author$project$History$redo = function (history) {
	var _v0 = history.future;
	if (!_v0.b) {
		return history;
	} else {
		var a = _v0.a;
		var rest = _v0.b;
		return _Utils_update(
			history,
			{
				current: a,
				future: rest,
				past: A2($elm$core$List$cons, history.current, history.past),
				small_change: false
			});
	}
};
var $author$project$QuestionEditor$FinishedSaving = function (a) {
	return {$: 'FinishedSaving', a: a};
};
var $elm$http$Http$BadStatus_ = F2(
	function (a, b) {
		return {$: 'BadStatus_', a: a, b: b};
	});
var $elm$http$Http$BadUrl_ = function (a) {
	return {$: 'BadUrl_', a: a};
};
var $elm$http$Http$GoodStatus_ = F2(
	function (a, b) {
		return {$: 'GoodStatus_', a: a, b: b};
	});
var $elm$http$Http$NetworkError_ = {$: 'NetworkError_'};
var $elm$http$Http$Receiving = function (a) {
	return {$: 'Receiving', a: a};
};
var $elm$http$Http$Sending = function (a) {
	return {$: 'Sending', a: a};
};
var $elm$http$Http$Timeout_ = {$: 'Timeout_'};
var $elm$core$Maybe$isJust = function (maybe) {
	if (maybe.$ === 'Just') {
		return true;
	} else {
		return false;
	}
};
var $elm$core$Platform$sendToSelf = _Platform_sendToSelf;
var $elm$core$Dict$getMin = function (dict) {
	getMin:
	while (true) {
		if ((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) {
			var left = dict.d;
			var $temp$dict = left;
			dict = $temp$dict;
			continue getMin;
		} else {
			return dict;
		}
	}
};
var $elm$core$Dict$moveRedLeft = function (dict) {
	if (((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) && (dict.e.$ === 'RBNode_elm_builtin')) {
		if ((dict.e.d.$ === 'RBNode_elm_builtin') && (dict.e.d.a.$ === 'Red')) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var lLeft = _v1.d;
			var lRight = _v1.e;
			var _v2 = dict.e;
			var rClr = _v2.a;
			var rK = _v2.b;
			var rV = _v2.c;
			var rLeft = _v2.d;
			var _v3 = rLeft.a;
			var rlK = rLeft.b;
			var rlV = rLeft.c;
			var rlL = rLeft.d;
			var rlR = rLeft.e;
			var rRight = _v2.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				$elm$core$Dict$Red,
				rlK,
				rlV,
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					rlL),
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rlR, rRight));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v4 = dict.d;
			var lClr = _v4.a;
			var lK = _v4.b;
			var lV = _v4.c;
			var lLeft = _v4.d;
			var lRight = _v4.e;
			var _v5 = dict.e;
			var rClr = _v5.a;
			var rK = _v5.b;
			var rV = _v5.c;
			var rLeft = _v5.d;
			var rRight = _v5.e;
			if (clr.$ === 'Black') {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$moveRedRight = function (dict) {
	if (((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) && (dict.e.$ === 'RBNode_elm_builtin')) {
		if ((dict.d.d.$ === 'RBNode_elm_builtin') && (dict.d.d.a.$ === 'Red')) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var _v2 = _v1.d;
			var _v3 = _v2.a;
			var llK = _v2.b;
			var llV = _v2.c;
			var llLeft = _v2.d;
			var llRight = _v2.e;
			var lRight = _v1.e;
			var _v4 = dict.e;
			var rClr = _v4.a;
			var rK = _v4.b;
			var rV = _v4.c;
			var rLeft = _v4.d;
			var rRight = _v4.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				$elm$core$Dict$Red,
				lK,
				lV,
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					lRight,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight)));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v5 = dict.d;
			var lClr = _v5.a;
			var lK = _v5.b;
			var lV = _v5.c;
			var lLeft = _v5.d;
			var lRight = _v5.e;
			var _v6 = dict.e;
			var rClr = _v6.a;
			var rK = _v6.b;
			var rV = _v6.c;
			var rLeft = _v6.d;
			var rRight = _v6.e;
			if (clr.$ === 'Black') {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$removeHelpPrepEQGT = F7(
	function (targetKey, dict, color, key, value, left, right) {
		if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
			var _v1 = left.a;
			var lK = left.b;
			var lV = left.c;
			var lLeft = left.d;
			var lRight = left.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				lK,
				lV,
				lLeft,
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, lRight, right));
		} else {
			_v2$2:
			while (true) {
				if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Black')) {
					if (right.d.$ === 'RBNode_elm_builtin') {
						if (right.d.a.$ === 'Black') {
							var _v3 = right.a;
							var _v4 = right.d;
							var _v5 = _v4.a;
							return $elm$core$Dict$moveRedRight(dict);
						} else {
							break _v2$2;
						}
					} else {
						var _v6 = right.a;
						var _v7 = right.d;
						return $elm$core$Dict$moveRedRight(dict);
					}
				} else {
					break _v2$2;
				}
			}
			return dict;
		}
	});
var $elm$core$Dict$removeMin = function (dict) {
	if ((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) {
		var color = dict.a;
		var key = dict.b;
		var value = dict.c;
		var left = dict.d;
		var lColor = left.a;
		var lLeft = left.d;
		var right = dict.e;
		if (lColor.$ === 'Black') {
			if ((lLeft.$ === 'RBNode_elm_builtin') && (lLeft.a.$ === 'Red')) {
				var _v3 = lLeft.a;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					key,
					value,
					$elm$core$Dict$removeMin(left),
					right);
			} else {
				var _v4 = $elm$core$Dict$moveRedLeft(dict);
				if (_v4.$ === 'RBNode_elm_builtin') {
					var nColor = _v4.a;
					var nKey = _v4.b;
					var nValue = _v4.c;
					var nLeft = _v4.d;
					var nRight = _v4.e;
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						$elm$core$Dict$removeMin(nLeft),
						nRight);
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			}
		} else {
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				value,
				$elm$core$Dict$removeMin(left),
				right);
		}
	} else {
		return $elm$core$Dict$RBEmpty_elm_builtin;
	}
};
var $elm$core$Dict$removeHelp = F2(
	function (targetKey, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_cmp(targetKey, key) < 0) {
				if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Black')) {
					var _v4 = left.a;
					var lLeft = left.d;
					if ((lLeft.$ === 'RBNode_elm_builtin') && (lLeft.a.$ === 'Red')) {
						var _v6 = lLeft.a;
						return A5(
							$elm$core$Dict$RBNode_elm_builtin,
							color,
							key,
							value,
							A2($elm$core$Dict$removeHelp, targetKey, left),
							right);
					} else {
						var _v7 = $elm$core$Dict$moveRedLeft(dict);
						if (_v7.$ === 'RBNode_elm_builtin') {
							var nColor = _v7.a;
							var nKey = _v7.b;
							var nValue = _v7.c;
							var nLeft = _v7.d;
							var nRight = _v7.e;
							return A5(
								$elm$core$Dict$balance,
								nColor,
								nKey,
								nValue,
								A2($elm$core$Dict$removeHelp, targetKey, nLeft),
								nRight);
						} else {
							return $elm$core$Dict$RBEmpty_elm_builtin;
						}
					}
				} else {
					return A5(
						$elm$core$Dict$RBNode_elm_builtin,
						color,
						key,
						value,
						A2($elm$core$Dict$removeHelp, targetKey, left),
						right);
				}
			} else {
				return A2(
					$elm$core$Dict$removeHelpEQGT,
					targetKey,
					A7($elm$core$Dict$removeHelpPrepEQGT, targetKey, dict, color, key, value, left, right));
			}
		}
	});
var $elm$core$Dict$removeHelpEQGT = F2(
	function (targetKey, dict) {
		if (dict.$ === 'RBNode_elm_builtin') {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_eq(targetKey, key)) {
				var _v1 = $elm$core$Dict$getMin(right);
				if (_v1.$ === 'RBNode_elm_builtin') {
					var minKey = _v1.b;
					var minValue = _v1.c;
					return A5(
						$elm$core$Dict$balance,
						color,
						minKey,
						minValue,
						left,
						$elm$core$Dict$removeMin(right));
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			} else {
				return A5(
					$elm$core$Dict$balance,
					color,
					key,
					value,
					left,
					A2($elm$core$Dict$removeHelp, targetKey, right));
			}
		} else {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		}
	});
var $elm$core$Dict$remove = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$removeHelp, key, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$core$Dict$update = F3(
	function (targetKey, alter, dictionary) {
		var _v0 = alter(
			A2($elm$core$Dict$get, targetKey, dictionary));
		if (_v0.$ === 'Just') {
			var value = _v0.a;
			return A3($elm$core$Dict$insert, targetKey, value, dictionary);
		} else {
			return A2($elm$core$Dict$remove, targetKey, dictionary);
		}
	});
var $elm$http$Http$expectBytesResponse = F2(
	function (toMsg, toResult) {
		return A3(
			_Http_expect,
			'arraybuffer',
			_Http_toDataView,
			A2($elm$core$Basics$composeR, toResult, toMsg));
	});
var $elm$http$Http$BadBody = function (a) {
	return {$: 'BadBody', a: a};
};
var $elm$http$Http$BadStatus = function (a) {
	return {$: 'BadStatus', a: a};
};
var $elm$http$Http$BadUrl = function (a) {
	return {$: 'BadUrl', a: a};
};
var $elm$http$Http$NetworkError = {$: 'NetworkError'};
var $elm$http$Http$Timeout = {$: 'Timeout'};
var $elm$core$Result$mapError = F2(
	function (f, result) {
		if (result.$ === 'Ok') {
			var v = result.a;
			return $elm$core$Result$Ok(v);
		} else {
			var e = result.a;
			return $elm$core$Result$Err(
				f(e));
		}
	});
var $elm$http$Http$resolve = F2(
	function (toResult, response) {
		switch (response.$) {
			case 'BadUrl_':
				var url = response.a;
				return $elm$core$Result$Err(
					$elm$http$Http$BadUrl(url));
			case 'Timeout_':
				return $elm$core$Result$Err($elm$http$Http$Timeout);
			case 'NetworkError_':
				return $elm$core$Result$Err($elm$http$Http$NetworkError);
			case 'BadStatus_':
				var metadata = response.a;
				return $elm$core$Result$Err(
					$elm$http$Http$BadStatus(metadata.statusCode));
			default:
				var body = response.b;
				return A2(
					$elm$core$Result$mapError,
					$elm$http$Http$BadBody,
					toResult(body));
		}
	});
var $elm$http$Http$expectWhatever = function (toMsg) {
	return A2(
		$elm$http$Http$expectBytesResponse,
		toMsg,
		$elm$http$Http$resolve(
			function (_v0) {
				return $elm$core$Result$Ok(_Utils_Tuple0);
			}));
};
var $elm$http$Http$Header = F2(
	function (a, b) {
		return {$: 'Header', a: a, b: b};
	});
var $elm$http$Http$header = $elm$http$Http$Header;
var $elm$http$Http$jsonBody = function (value) {
	return A2(
		_Http_pair,
		'application/json',
		A2($elm$json$Json$Encode$encode, 0, value));
};
var $author$project$QuestionEditor$numbas_version = 'finer_feedback_settings';
var $elm$http$Http$Request = function (a) {
	return {$: 'Request', a: a};
};
var $elm$http$Http$State = F2(
	function (reqs, subs) {
		return {reqs: reqs, subs: subs};
	});
var $elm$http$Http$init = $elm$core$Task$succeed(
	A2($elm$http$Http$State, $elm$core$Dict$empty, _List_Nil));
var $elm$core$Process$kill = _Scheduler_kill;
var $elm$core$Process$spawn = _Scheduler_spawn;
var $elm$http$Http$updateReqs = F3(
	function (router, cmds, reqs) {
		updateReqs:
		while (true) {
			if (!cmds.b) {
				return $elm$core$Task$succeed(reqs);
			} else {
				var cmd = cmds.a;
				var otherCmds = cmds.b;
				if (cmd.$ === 'Cancel') {
					var tracker = cmd.a;
					var _v2 = A2($elm$core$Dict$get, tracker, reqs);
					if (_v2.$ === 'Nothing') {
						var $temp$router = router,
							$temp$cmds = otherCmds,
							$temp$reqs = reqs;
						router = $temp$router;
						cmds = $temp$cmds;
						reqs = $temp$reqs;
						continue updateReqs;
					} else {
						var pid = _v2.a;
						return A2(
							$elm$core$Task$andThen,
							function (_v3) {
								return A3(
									$elm$http$Http$updateReqs,
									router,
									otherCmds,
									A2($elm$core$Dict$remove, tracker, reqs));
							},
							$elm$core$Process$kill(pid));
					}
				} else {
					var req = cmd.a;
					return A2(
						$elm$core$Task$andThen,
						function (pid) {
							var _v4 = req.tracker;
							if (_v4.$ === 'Nothing') {
								return A3($elm$http$Http$updateReqs, router, otherCmds, reqs);
							} else {
								var tracker = _v4.a;
								return A3(
									$elm$http$Http$updateReqs,
									router,
									otherCmds,
									A3($elm$core$Dict$insert, tracker, pid, reqs));
							}
						},
						$elm$core$Process$spawn(
							A3(
								_Http_toTask,
								router,
								$elm$core$Platform$sendToApp(router),
								req)));
				}
			}
		}
	});
var $elm$http$Http$onEffects = F4(
	function (router, cmds, subs, state) {
		return A2(
			$elm$core$Task$andThen,
			function (reqs) {
				return $elm$core$Task$succeed(
					A2($elm$http$Http$State, reqs, subs));
			},
			A3($elm$http$Http$updateReqs, router, cmds, state.reqs));
	});
var $elm$http$Http$maybeSend = F4(
	function (router, desiredTracker, progress, _v0) {
		var actualTracker = _v0.a;
		var toMsg = _v0.b;
		return _Utils_eq(desiredTracker, actualTracker) ? $elm$core$Maybe$Just(
			A2(
				$elm$core$Platform$sendToApp,
				router,
				toMsg(progress))) : $elm$core$Maybe$Nothing;
	});
var $elm$http$Http$onSelfMsg = F3(
	function (router, _v0, state) {
		var tracker = _v0.a;
		var progress = _v0.b;
		return A2(
			$elm$core$Task$andThen,
			function (_v1) {
				return $elm$core$Task$succeed(state);
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$filterMap,
					A3($elm$http$Http$maybeSend, router, tracker, progress),
					state.subs)));
	});
var $elm$http$Http$Cancel = function (a) {
	return {$: 'Cancel', a: a};
};
var $elm$http$Http$cmdMap = F2(
	function (func, cmd) {
		if (cmd.$ === 'Cancel') {
			var tracker = cmd.a;
			return $elm$http$Http$Cancel(tracker);
		} else {
			var r = cmd.a;
			return $elm$http$Http$Request(
				{
					allowCookiesFromOtherDomains: r.allowCookiesFromOtherDomains,
					body: r.body,
					expect: A2(_Http_mapExpect, func, r.expect),
					headers: r.headers,
					method: r.method,
					timeout: r.timeout,
					tracker: r.tracker,
					url: r.url
				});
		}
	});
var $elm$http$Http$MySub = F2(
	function (a, b) {
		return {$: 'MySub', a: a, b: b};
	});
var $elm$http$Http$subMap = F2(
	function (func, _v0) {
		var tracker = _v0.a;
		var toMsg = _v0.b;
		return A2(
			$elm$http$Http$MySub,
			tracker,
			A2($elm$core$Basics$composeR, toMsg, func));
	});
_Platform_effectManagers['Http'] = _Platform_createManager($elm$http$Http$init, $elm$http$Http$onEffects, $elm$http$Http$onSelfMsg, $elm$http$Http$cmdMap, $elm$http$Http$subMap);
var $elm$http$Http$command = _Platform_leaf('Http');
var $elm$http$Http$subscription = _Platform_leaf('Http');
var $elm$http$Http$request = function (r) {
	return $elm$http$Http$command(
		$elm$http$Http$Request(
			{allowCookiesFromOtherDomains: false, body: r.body, expect: r.expect, headers: r.headers, method: r.method, timeout: r.timeout, tracker: r.tracker, url: r.url}));
};
var $author$project$QuestionEditor$save_question = function (model) {
	var eq = $author$project$QuestionEditor$encode_question(model.history.current);
	var body = $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'content',
				$elm$json$Json$Encode$string(
					'// Numbas version: ' + ($author$project$QuestionEditor$numbas_version + ('\u000A' + A2($elm$json$Json$Encode$encode, 0, eq))))),
				_Utils_Tuple2(
				'ability_levels',
				A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil)),
				_Utils_Tuple2(
				'extensions',
				A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil)),
				_Utils_Tuple2(
				'metadata',
				$elm$json$Json$Encode$object(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'description',
							$elm$json$Json$Encode$string('')),
							_Utils_Tuple2(
							'licence',
							$elm$json$Json$Encode$string('None specified'))
						]))),
				_Utils_Tuple2(
				'resources',
				A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil)),
				_Utils_Tuple2(
				'tags',
				A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil)),
				_Utils_Tuple2(
				'taxonomy_nodes',
				A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil))
			]));
	return $elm$http$Http$request(
		{
			body: $elm$http$Http$jsonBody(body),
			expect: $elm$http$Http$expectWhatever($author$project$QuestionEditor$FinishedSaving),
			headers: _List_fromArray(
				[
					A2($elm$http$Http$header, 'X-CSRFToken', model.ui.config.csrf_token)
				]),
			method: 'POST',
			timeout: $elm$core$Maybe$Just(5000),
			tracker: $elm$core$Maybe$Nothing,
			url: ''
		});
};
var $author$project$History$small_change = F2(
	function (state, history) {
		return history.small_change ? _Utils_update(
			history,
			{current: state}) : _Utils_update(
			history,
			{
				current: state,
				future: _List_Nil,
				past: A2($elm$core$List$cons, history.current, history.past),
				small_change: true
			});
	});
var $author$project$History$undo = function (history) {
	var _v0 = history.past;
	if (!_v0.b) {
		return history;
	} else {
		var a = _v0.a;
		var rest = _v0.b;
		return _Utils_update(
			history,
			{
				current: a,
				future: A2($elm$core$List$cons, history.current, history.future),
				past: rest,
				small_change: false
			});
	}
};
var $author$project$Tabber$NoOp = {$: 'NoOp'};
var $elm$core$Basics$composeL = F3(
	function (g, f, x) {
		return g(
			f(x));
	});
var $elm$core$Task$onError = _Scheduler_onError;
var $elm$core$Task$attempt = F2(
	function (resultToMessage, task) {
		return $elm$core$Task$command(
			$elm$core$Task$Perform(
				A2(
					$elm$core$Task$onError,
					A2(
						$elm$core$Basics$composeL,
						A2($elm$core$Basics$composeL, $elm$core$Task$succeed, resultToMessage),
						$elm$core$Result$Err),
					A2(
						$elm$core$Task$andThen,
						A2(
							$elm$core$Basics$composeL,
							A2($elm$core$Basics$composeL, $elm$core$Task$succeed, resultToMessage),
							$elm$core$Result$Ok),
						task))));
	});
var $elm$browser$Browser$Dom$focus = _Browser_call('focus');
var $author$project$Tabber$save_tab_state = _Platform_outgoingPort('save_tab_state', $elm$core$Basics$identity);
var $author$project$Tabber$update = F2(
	function (msg, state) {
		if (msg.$ === 'SetTab') {
			var key = msg.a;
			var id = msg.b;
			var nstate = A3($elm$core$Dict$insert, key, id, state);
			return _Utils_Tuple2(
				nstate,
				$elm$core$Platform$Cmd$batch(
					_List_fromArray(
						[
							$author$project$Tabber$save_tab_state(
							A3($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$json$Json$Encode$string, nstate)),
							A2(
							$elm$core$Task$attempt,
							function (_v1) {
								return $author$project$Tabber$NoOp;
							},
							$elm$browser$Browser$Dom$focus(key + ('-tab-' + id)))
						])));
		} else {
			return _Utils_Tuple2(state, $elm$core$Platform$Cmd$none);
		}
	});
var $author$project$QuestionEditor$map_part_container = function (fn) {
	return $author$project$QuestionEditor$apply_part_container(
		A2($elm$core$Basics$composeR, fn, $author$project$QuestionEditor$PartContainer));
};
var $author$project$QuestionEditor$set_parts = F2(
	function (kind, parts) {
		return $author$project$QuestionEditor$map_part_container(
			function (c) {
				switch (kind.$) {
					case 'TopPart':
						return _Utils_update(
							c,
							{parts: parts});
					case 'Gap':
						return _Utils_update(
							c,
							{gaps: parts});
					case 'Step':
						return _Utils_update(
							c,
							{steps: parts});
					default:
						return _Utils_update(
							c,
							{alternatives: parts});
				}
			});
	});
var $author$project$QuestionEditor$add_part = F3(
	function (kind, p, c) {
		var existing = A2($author$project$QuestionEditor$part_getter, kind, c);
		return A3(
			$author$project$QuestionEditor$set_parts,
			kind,
			_Utils_ap(
				existing,
				_List_fromArray(
					[p])),
			c);
	});
var $elm$core$List$drop = F2(
	function (n, list) {
		drop:
		while (true) {
			if (n <= 0) {
				return list;
			} else {
				if (!list.b) {
					return list;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs;
					n = $temp$n;
					list = $temp$list;
					continue drop;
				}
			}
		}
	});
var $elm$core$List$takeReverse = F3(
	function (n, list, kept) {
		takeReverse:
		while (true) {
			if (n <= 0) {
				return kept;
			} else {
				if (!list.b) {
					return kept;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs,
						$temp$kept = A2($elm$core$List$cons, x, kept);
					n = $temp$n;
					list = $temp$list;
					kept = $temp$kept;
					continue takeReverse;
				}
			}
		}
	});
var $elm$core$List$takeTailRec = F2(
	function (n, list) {
		return $elm$core$List$reverse(
			A3($elm$core$List$takeReverse, n, list, _List_Nil));
	});
var $elm$core$List$takeFast = F3(
	function (ctr, n, list) {
		if (n <= 0) {
			return _List_Nil;
		} else {
			var _v0 = _Utils_Tuple2(n, list);
			_v0$1:
			while (true) {
				_v0$5:
				while (true) {
					if (!_v0.b.b) {
						return list;
					} else {
						if (_v0.b.b.b) {
							switch (_v0.a) {
								case 1:
									break _v0$1;
								case 2:
									var _v2 = _v0.b;
									var x = _v2.a;
									var _v3 = _v2.b;
									var y = _v3.a;
									return _List_fromArray(
										[x, y]);
								case 3:
									if (_v0.b.b.b.b) {
										var _v4 = _v0.b;
										var x = _v4.a;
										var _v5 = _v4.b;
										var y = _v5.a;
										var _v6 = _v5.b;
										var z = _v6.a;
										return _List_fromArray(
											[x, y, z]);
									} else {
										break _v0$5;
									}
								default:
									if (_v0.b.b.b.b && _v0.b.b.b.b.b) {
										var _v7 = _v0.b;
										var x = _v7.a;
										var _v8 = _v7.b;
										var y = _v8.a;
										var _v9 = _v8.b;
										var z = _v9.a;
										var _v10 = _v9.b;
										var w = _v10.a;
										var tl = _v10.b;
										return (ctr > 1000) ? A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A2($elm$core$List$takeTailRec, n - 4, tl))))) : A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A3($elm$core$List$takeFast, ctr + 1, n - 4, tl)))));
									} else {
										break _v0$5;
									}
							}
						} else {
							if (_v0.a === 1) {
								break _v0$1;
							} else {
								break _v0$5;
							}
						}
					}
				}
				return list;
			}
			var _v1 = _v0.b;
			var x = _v1.a;
			return _List_fromArray(
				[x]);
		}
	});
var $elm$core$List$take = F2(
	function (n, list) {
		return A3($elm$core$List$takeFast, 0, n, list);
	});
var $elm_community$list_extra$List$Extra$updateAt = F3(
	function (index, fn, list) {
		if (index < 0) {
			return list;
		} else {
			var tail = A2($elm$core$List$drop, index, list);
			if (tail.b) {
				var x = tail.a;
				var xs = tail.b;
				return _Utils_ap(
					A2($elm$core$List$take, index, list),
					A2(
						$elm$core$List$cons,
						fn(x),
						xs));
			} else {
				return list;
			}
		}
	});
var $author$project$QuestionEditor$update_part_container = F3(
	function (path, fn, container) {
		if (!path.b) {
			return fn(container);
		} else {
			var _v1 = path.a;
			var kind = _v1.a;
			var i = _v1.b;
			var rest = path.b;
			var list = A2($author$project$QuestionEditor$part_getter, kind, container);
			var nlist = A3(
				$elm_community$list_extra$List$Extra$updateAt,
				i,
				function (p) {
					return _Utils_update(
						p,
						{
							children: A3($author$project$QuestionEditor$update_part_container, rest, fn, p.children)
						});
				},
				list);
			return A3($author$project$QuestionEditor$set_parts, kind, nlist, container);
		}
	});
var $author$project$QuestionEditor$add_part_at = F3(
	function (path, kind, part) {
		return A2(
			$author$project$QuestionEditor$update_part_container,
			path,
			A2($author$project$QuestionEditor$add_part, kind, part));
	});
var $elm_community$list_extra$List$Extra$removeAt = F2(
	function (index, l) {
		if (index < 0) {
			return l;
		} else {
			var _v0 = A2($elm$core$List$drop, index, l);
			if (!_v0.b) {
				return l;
			} else {
				var rest = _v0.b;
				return _Utils_ap(
					A2($elm$core$List$take, index, l),
					rest);
			}
		}
	});
var $author$project$QuestionEditor$delete_part = F3(
	function (kind, i, c) {
		var existing = A2($author$project$QuestionEditor$part_getter, kind, c);
		return A3(
			$author$project$QuestionEditor$set_parts,
			kind,
			A2($elm_community$list_extra$List$Extra$removeAt, i, existing),
			c);
	});
var $author$project$QuestionEditor$delete_part_at = F2(
	function (path, pc) {
		var _v0 = $elm$core$List$reverse(path);
		if (!_v0.b) {
			return pc;
		} else {
			var _v1 = _v0.a;
			var kind = _v1.a;
			var i = _v1.b;
			var rest = _v0.b;
			return A3(
				$author$project$QuestionEditor$update_part_container,
				$elm$core$List$reverse(rest),
				A2($author$project$QuestionEditor$delete_part, kind, i),
				pc);
		}
	});
var $elm_community$list_extra$List$Extra$getAt = F2(
	function (idx, xs) {
		return (idx < 0) ? $elm$core$Maybe$Nothing : $elm$core$List$head(
			A2($elm$core$List$drop, idx, xs));
	});
var $author$project$QuestionEditor$part_siblings = F3(
	function (kind, path, c) {
		if (!path.b) {
			return A2($author$project$QuestionEditor$part_getter, kind, c);
		} else {
			var _v1 = path.a;
			var k = _v1.a;
			var i = _v1.b;
			var rest = path.b;
			return A2(
				$elm$core$Maybe$withDefault,
				_List_Nil,
				A2(
					$elm$core$Maybe$map,
					A2(
						$elm$core$Basics$composeR,
						function ($) {
							return $.children;
						},
						A2($author$project$QuestionEditor$part_siblings, kind, rest)),
					A2(
						$elm_community$list_extra$List$Extra$getAt,
						i,
						A2($author$project$QuestionEditor$part_getter, k, c))));
		}
	});
var $author$project$QuestionEditor$part_tab_id = function (path) {
	return 'part-' + $author$project$QuestionEditor$part_path_toString(path);
};
var $author$project$Settings$Index = function (a) {
	return {$: 'Index', a: a};
};
var $elm$core$List$repeatHelp = F3(
	function (result, n, value) {
		repeatHelp:
		while (true) {
			if (n <= 0) {
				return result;
			} else {
				var $temp$result = A2($elm$core$List$cons, value, result),
					$temp$n = n - 1,
					$temp$value = value;
				result = $temp$result;
				n = $temp$n;
				value = $temp$value;
				continue repeatHelp;
			}
		}
	});
var $elm$core$List$repeat = F2(
	function (n, value) {
		return A3($elm$core$List$repeatHelp, _List_Nil, n, value);
	});
var $author$project$Settings$force_updateAt = F4(
	function (i, fn, _default, l) {
		var nl = _Utils_ap(
			l,
			A2(
				$elm$core$List$repeat,
				(i + 1) - $elm$core$List$length(l),
				_default));
		return A3($elm_community$list_extra$List$Extra$updateAt, i, fn, nl);
	});
var $author$project$Settings$setAt = F3(
	function (at_, v, settings) {
		var setValue = F2(
			function (aa, ss) {
				setValue:
				while (true) {
					if (!aa.b) {
						return v;
					} else {
						switch (aa.a.$) {
							case 'Index':
								var i = aa.a.a;
								var rest = aa.b;
								return A2(
									$elm$json$Json$Encode$list,
									$elm$core$Basics$identity,
									A4(
										$author$project$Settings$force_updateAt,
										i,
										setValue(rest),
										$elm$json$Json$Encode$null,
										A2(
											$elm$core$Result$withDefault,
											_List_Nil,
											A2(
												$elm$json$Json$Decode$decodeValue,
												$elm$json$Json$Decode$list($elm$json$Json$Decode$value),
												ss))));
							case 'Field':
								var k = aa.a.a;
								var rest = aa.b;
								return A3(
									$elm$json$Json$Encode$dict,
									$elm$core$Basics$identity,
									$elm$core$Basics$identity,
									A3(
										$elm$core$Dict$update,
										k,
										A2(
											$elm$core$Basics$composeR,
											$elm$core$Maybe$withDefault(
												$elm$json$Json$Encode$object(_List_Nil)),
											A2(
												$elm$core$Basics$composeR,
												setValue(rest),
												$elm$core$Maybe$Just)),
										A2(
											$elm$core$Result$withDefault,
											$elm$core$Dict$fromList(_List_Nil),
											A2(
												$elm$json$Json$Decode$decodeValue,
												$elm$json$Json$Decode$dict($elm$json$Json$Decode$value),
												ss))));
							default:
								var _v1 = aa.a;
								var prop = _v1.a;
								var _default = _v1.b;
								var rest = aa.b;
								var i = A2(
									$elm$core$Result$withDefault,
									0,
									A2(
										$elm$json$Json$Decode$decodeValue,
										$author$project$Settings$decode_index_where(prop),
										ss));
								var nss = A2(
									$elm$json$Json$Encode$list,
									$elm$core$Basics$identity,
									A4(
										$author$project$Settings$force_updateAt,
										i,
										$elm$core$Basics$identity,
										_default,
										A2(
											$elm$core$Result$withDefault,
											_List_Nil,
											A2(
												$elm$json$Json$Decode$decodeValue,
												$elm$json$Json$Decode$list($elm$json$Json$Decode$value),
												ss))));
								var $temp$aa = A2(
									$elm$core$List$cons,
									$author$project$Settings$Index(i),
									rest),
									$temp$ss = nss;
								aa = $temp$aa;
								ss = $temp$ss;
								continue setValue;
						}
					}
				}
			});
		return _Utils_update(
			settings,
			{
				value: A2(setValue, at_, settings.value)
			});
	});
var $author$project$Tabber$set_tab = F2(
	function (tabber, tab) {
		return $elm$core$Task$succeed(
			A2($author$project$Tabber$SetTab, tabber, tab));
	});
var $author$project$Settings$insert = F3(
	function (k, v, s) {
		var dict = A2(
			$elm$core$Result$withDefault,
			$elm$core$Dict$empty,
			A2(
				$elm$json$Json$Decode$decodeValue,
				$elm$json$Json$Decode$dict($elm$json$Json$Decode$value),
				s.value));
		var ndict = A3($elm$core$Dict$insert, k, v, dict);
		return _Utils_update(
			s,
			{
				value: A3($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$core$Basics$identity, ndict)
			});
	});
var $author$project$QuestionEditor$update_part = F3(
	function (msg, path, part) {
		if (msg.$ === 'ChangePartSetting') {
			var _v1 = msg.a;
			var v = _v1.a;
			var at = _v1.b;
			var nsettings = A3($author$project$Settings$setAt, at, v, part.settings);
			var cmds = $elm$core$Platform$Cmd$batch(
				A2(
					$elm$core$List$filterMap,
					function (_v2) {
						var ats = _v2.a;
						var f = _v2.b;
						return _Utils_eq(
							A2($author$project$Settings$at, ats, $author$project$Settings$empty).at,
							at) ? A3(f, path, part, v) : $elm$core$Maybe$Nothing;
					},
					$author$project$QuestionEditor$part_setting_computed));
			return _Utils_Tuple2(
				_Utils_update(
					part,
					{settings: nsettings}),
				_Utils_Tuple2(
					$elm$core$Maybe$Just(false),
					$elm$core$Maybe$Just(cmds)));
		} else {
			var key = msg.a;
			var v = msg.b;
			return _Utils_Tuple2(
				_Utils_update(
					part,
					{
						computed: A3($author$project$Settings$insert, key, v, part.computed)
					}),
				_Utils_Tuple2($elm$core$Maybe$Nothing, $elm$core$Maybe$Nothing));
		}
	});
var $author$project$QuestionEditor$m_updateAt = F2(
	function (i, fn) {
		return A2(
			$elm$core$Basics$composeR,
			$elm$core$List$indexedMap($elm$core$Tuple$pair),
			A2(
				$elm$core$List$foldl,
				F2(
					function (_v0, _v1) {
						var j = _v0.a;
						var a = _v0.b;
						var ol = _v1.a;
						var mm = _v1.b;
						if (_Utils_eq(j, i)) {
							var _v2 = fn(a);
							var na = _v2.a;
							var x = _v2.b;
							return _Utils_Tuple2(
								_Utils_ap(
									ol,
									_List_fromArray(
										[na])),
								x);
						} else {
							return _Utils_Tuple2(
								_Utils_ap(
									ol,
									_List_fromArray(
										[a])),
								mm);
						}
					}),
				_Utils_Tuple2(
					_List_Nil,
					_Utils_Tuple2($elm$core$Maybe$Nothing, $elm$core$Maybe$Nothing))));
	});
var $author$project$QuestionEditor$mapMonad = $elm$core$Tuple$mapFirst;
var $author$project$QuestionEditor$update_part_at = F3(
	function (path, fn, c) {
		if (!path.b) {
			return _Utils_Tuple2(
				c,
				_Utils_Tuple2($elm$core$Maybe$Nothing, $elm$core$Maybe$Nothing));
		} else {
			var _v1 = path.a;
			var kind = _v1.a;
			var i = _v1.b;
			var rest = path.b;
			var up = function (p) {
				if (!rest.b) {
					return fn(p);
				} else {
					return A2(
						$author$project$QuestionEditor$mapMonad,
						function (nchildren) {
							return _Utils_update(
								p,
								{children: nchildren});
						},
						A3($author$project$QuestionEditor$update_part_at, rest, fn, p.children));
				}
			};
			var parts = A2($author$project$QuestionEditor$part_getter, kind, c);
			return A2(
				$author$project$QuestionEditor$mapMonad,
				function (nparts) {
					return A3($author$project$QuestionEditor$set_parts, kind, nparts, c);
				},
				A3($author$project$QuestionEditor$m_updateAt, i, up, parts));
		}
	});
var $author$project$QuestionEditor$update_question = F2(
	function (msg, question) {
		switch (msg.$) {
			case 'ChangeQuestionSetting':
				var _v1 = msg.a;
				var v = _v1.a;
				var at = _v1.b;
				return _Utils_Tuple2(
					_Utils_update(
						question,
						{
							settings: A3($author$project$Settings$setAt, at, v, question.settings)
						}),
					_Utils_Tuple2(
						$elm$core$Maybe$Just(false),
						$elm$core$Maybe$Nothing));
			case 'AddPart':
				var parent_path = msg.a;
				var kind = msg.b;
				var part = msg.c;
				var siblings = A3($author$project$QuestionEditor$part_siblings, kind, parent_path, question.parts);
				var index = $elm$core$List$length(siblings);
				var npath = _Utils_ap(
					parent_path,
					_List_fromArray(
						[
							_Utils_Tuple2(kind, index)
						]));
				var tab_id = $author$project$QuestionEditor$part_tab_id(npath);
				return _Utils_Tuple2(
					_Utils_update(
						question,
						{
							parts: A4($author$project$QuestionEditor$add_part_at, parent_path, kind, part, question.parts)
						}),
					_Utils_Tuple2(
						$elm$core$Maybe$Just(true),
						$elm$core$Maybe$Just(
							A2(
								$elm$core$Task$perform,
								$author$project$QuestionEditor$UpdateTab,
								A2($author$project$Tabber$set_tab, 'parts', tab_id)))));
			case 'UpdatePart':
				var path = msg.a;
				var pmsg = msg.b;
				var _v2 = A3(
					$author$project$QuestionEditor$update_part_at,
					path,
					A2($author$project$QuestionEditor$update_part, pmsg, path),
					question.parts);
				var parts = _v2.a;
				var mcmd = _v2.b;
				return _Utils_Tuple2(
					_Utils_update(
						question,
						{parts: parts}),
					mcmd);
			default:
				var path = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						question,
						{
							parts: A2($author$project$QuestionEditor$delete_part_at, path, question.parts)
						}),
					_Utils_Tuple2(
						$elm$core$Maybe$Just(true),
						$elm$core$Maybe$Just($elm$core$Platform$Cmd$none)));
		}
	});
var $author$project$QuestionEditor$update_active = F2(
	function (msg, model) {
		switch (msg.$) {
			case 'UpdateQuestion':
				var qmsg = msg.a;
				var oq = model.history.current;
				var _v1 = A2($author$project$QuestionEditor$update_question, qmsg, oq);
				var nq = _v1.a;
				var _v2 = _v1.b;
				var mchange = _v2.a;
				var mcmd = _v2.b;
				var change = function () {
					if (mchange.$ === 'Nothing') {
						return $author$project$History$no_change;
					} else {
						if (mchange.a) {
							return $author$project$History$big_change;
						} else {
							return $author$project$History$small_change;
						}
					}
				}();
				var cmd = A2($elm$core$Maybe$withDefault, $elm$core$Platform$Cmd$none, mcmd);
				var history = A2(change, nq, model.history);
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{history: history, saving: $author$project$QuestionEditor$Changed}),
					$elm$core$Platform$Cmd$batch(
						_List_fromArray(
							[
								cmd,
								(!_Utils_eq(mchange, $elm$core$Maybe$Nothing)) ? A2(
								$author$project$Util$delay,
								2000,
								$author$project$QuestionEditor$Save(nq)) : $elm$core$Platform$Cmd$none
							])));
			case 'UpdateTab':
				var tab_msg = msg.a;
				var nmodel = function () {
					if (((tab_msg.$ === 'SetTab') && (tab_msg.a === 'parts')) && (tab_msg.b === 'add-part')) {
						return _Utils_update(
							model,
							{
								adding_part: _Utils_Tuple2(_List_Nil, $author$project$QuestionEditor$TopPart)
							});
					} else {
						return model;
					}
				}();
				var _v4 = A2($author$project$Tabber$update, tab_msg, model.tab_state);
				var state = _v4.a;
				var tabcmd = _v4.b;
				return _Utils_Tuple2(
					_Utils_update(
						nmodel,
						{tab_state: state}),
					A2($elm$core$Platform$Cmd$map, $author$project$QuestionEditor$UpdateTab, tabcmd));
			case 'AnswerNumbas':
				var res = msg.a;
				return A2(
					$elm$core$Result$withDefault,
					_Utils_Tuple2(model, $elm$core$Platform$Cmd$none),
					A2(
						$elm$json$Json$Decode$decodeValue,
						$elm$json$Json$Decode$oneOf(
							_List_fromArray(
								[
									A2(
									$elm$json$Json$Decode$andThen,
									function (path) {
										return A2(
											$elm$json$Json$Decode$andThen,
											function (command) {
												return A2(
													$elm$json$Json$Decode$map,
													function (v) {
														return A2(
															$author$project$QuestionEditor$update_active,
															$author$project$QuestionEditor$UpdateQuestion(
																A2(
																	$author$project$QuestionEditor$UpdatePart,
																	path,
																	A2($author$project$QuestionEditor$ChangePartComputed, command, v))),
															model);
													},
													A2($elm$json$Json$Decode$field, 'result', $elm$json$Json$Decode$value));
											},
											A2($elm$json$Json$Decode$field, 'command', $elm$json$Json$Decode$string));
									},
									A2(
										$elm$json$Json$Decode$at,
										_List_fromArray(
											['key', 'part']),
										A2(
											$elm$json$Json$Decode$andThen,
											A2(
												$elm$core$Basics$composeR,
												$author$project$QuestionEditor$parse_part_path,
												$elm_community$json_extra$Json$Decode$Extra$fromMaybe('Bad part path')),
											$elm$json$Json$Decode$string)))
								])),
						res));
			case 'Save':
				var q = msg.a;
				var encode = A2(
					$elm$core$Basics$composeR,
					$author$project$QuestionEditor$encode_question,
					$elm$json$Json$Encode$encode(0));
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{saving: $author$project$QuestionEditor$Saving}),
					_Utils_eq(
						encode(q),
						encode(model.history.current)) ? $author$project$QuestionEditor$save_question(model) : $elm$core$Platform$Cmd$none);
			case 'FinishedSaving':
				var res = msg.a;
				return $author$project$QuestionEditor$nocmd(
					_Utils_update(
						model,
						{
							saving: _Utils_eq(model.saving, $author$project$QuestionEditor$Saving) ? $author$project$QuestionEditor$Saved(res) : model.saving
						}));
			case 'AddChildPart':
				var path = msg.a;
				var kind = msg.b;
				return A2(
					$elm$core$Tuple$mapFirst,
					function (m) {
						return _Utils_update(
							m,
							{
								adding_part: _Utils_Tuple2(path, kind)
							});
					},
					A2(
						$author$project$QuestionEditor$update_active,
						$author$project$QuestionEditor$UpdateTab(
							A2($author$project$Tabber$SetTab, 'parts', 'add-part')),
						model));
			case 'Undo':
				return $author$project$QuestionEditor$compute_all(
					_Utils_update(
						model,
						{
							history: $author$project$History$undo(model.history)
						}));
			case 'Redo':
				return $author$project$QuestionEditor$compute_all(
					_Utils_update(
						model,
						{
							history: $author$project$History$redo(model.history)
						}));
			default:
				return $author$project$QuestionEditor$nocmd(model);
		}
	});
var $author$project$QuestionEditor$update = F2(
	function (msg, model) {
		if (model.$ === 'ActiveModel') {
			var active = model.a;
			return A2(
				$elm$core$Tuple$mapFirst,
				$author$project$QuestionEditor$ActiveModel,
				A2($author$project$QuestionEditor$update_active, msg, active));
		} else {
			return $author$project$QuestionEditor$nocmd(model);
		}
	});
var $author$project$QuestionEditor$AddChildPart = F2(
	function (a, b) {
		return {$: 'AddChildPart', a: a, b: b};
	});
var $author$project$QuestionEditor$AddPart = F3(
	function (a, b, c) {
		return {$: 'AddPart', a: a, b: b, c: c};
	});
var $author$project$QuestionEditor$AllPartsMode = {$: 'AllPartsMode'};
var $author$project$QuestionEditor$ChangePartSetting = function (a) {
	return {$: 'ChangePartSetting', a: a};
};
var $author$project$QuestionEditor$ChangeQuestionSetting = function (a) {
	return {$: 'ChangeQuestionSetting', a: a};
};
var $author$project$QuestionEditor$DeletePart = function (a) {
	return {$: 'DeletePart', a: a};
};
var $author$project$QuestionEditor$ExploreMode = {$: 'ExploreMode'};
var $author$project$Tabber$HtmlLabel = function (a) {
	return {$: 'HtmlLabel', a: a};
};
var $author$project$QuestionEditor$NoOp = {$: 'NoOp'};
var $author$project$QuestionEditor$Redo = {$: 'Redo'};
var $author$project$Tabber$SimpleLabel = function (a) {
	return {$: 'SimpleLabel', a: a};
};
var $author$project$QuestionEditor$Undo = {$: 'Undo'};
var $elm$html$Html$Attributes$boolProperty = F2(
	function (key, bool) {
		return A2(
			_VirtualDom_property,
			key,
			$elm$json$Json$Encode$bool(bool));
	});
var $elm$html$Html$Attributes$checked = $elm$html$Html$Attributes$boolProperty('checked');
var $elm$html$Html$input = _VirtualDom_node('input');
var $elm$virtual_dom$VirtualDom$Normal = function (a) {
	return {$: 'Normal', a: a};
};
var $elm$virtual_dom$VirtualDom$on = _VirtualDom_on;
var $elm$html$Html$Events$on = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$Normal(decoder));
	});
var $elm$html$Html$Events$targetChecked = A2(
	$elm$json$Json$Decode$at,
	_List_fromArray(
		['target', 'checked']),
	$elm$json$Json$Decode$bool);
var $elm$html$Html$Events$onCheck = function (tagger) {
	return A2(
		$elm$html$Html$Events$on,
		'change',
		A2($elm$json$Json$Decode$map, tagger, $elm$html$Html$Events$targetChecked));
};
var $author$project$Settings$set = F4(
	function (msg, at_, encoder, a) {
		return msg(
			_Utils_Tuple2(
				encoder(a),
				at_));
	});
var $author$project$Settings$setters = F2(
	function (settings, msg) {
		var sset = A2($author$project$Settings$set, msg, settings.at);
		return {
			bool: sset($elm$json$Json$Encode$bool),
			string: sset($elm$json$Json$Encode$string),
			value: sset($elm$core$Basics$identity)
		};
	});
var $author$project$QuestionEditor$boolean_property = F2(
	function (_v0, o) {
		return _List_fromArray(
			[
				A2(
				$elm$html$Html$input,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$type_('checkbox'),
						$elm$html$Html$Attributes$checked(
						$author$project$Settings$getters.bool(o.settings)),
						$elm$html$Html$Events$onCheck(
						A2($author$project$Settings$setters, o.settings, o.setter).bool),
						$elm$html$Html$Attributes$id(o.id)
					]),
				_List_Nil)
			]);
	});
var $author$project$QuestionEditor$bottom_index = A2($elm$core$Basics$composeR, $elm$core$List$reverse, $elm$core$List$head);
var $author$project$History$can_redo = function (history) {
	return !_Utils_eq(history.future, _List_Nil);
};
var $author$project$History$can_undo = function (history) {
	return !_Utils_eq(history.past, _List_Nil);
};
var $author$project$QuestionEditor$child_part_label = function (kind) {
	switch (kind.$) {
		case 'TopPart':
			return 'part';
		case 'Gap':
			return 'gap';
		case 'Step':
			return 'step';
		default:
			return 'alternative';
	}
};
var $elm$html$Html$Attributes$classList = function (classes) {
	return $elm$html$Html$Attributes$class(
		A2(
			$elm$core$String$join,
			' ',
			A2(
				$elm$core$List$map,
				$elm$core$Tuple$first,
				A2($elm$core$List$filter, $elm$core$Tuple$second, classes))));
};
var $elm$html$Html$Events$alwaysStop = function (x) {
	return _Utils_Tuple2(x, true);
};
var $elm$virtual_dom$VirtualDom$MayStopPropagation = function (a) {
	return {$: 'MayStopPropagation', a: a};
};
var $elm$html$Html$Events$stopPropagationOn = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$MayStopPropagation(decoder));
	});
var $elm$html$Html$Events$targetValue = A2(
	$elm$json$Json$Decode$at,
	_List_fromArray(
		['target', 'value']),
	$elm$json$Json$Decode$string);
var $elm$html$Html$Events$onInput = function (tagger) {
	return A2(
		$elm$html$Html$Events$stopPropagationOn,
		'input',
		A2(
			$elm$json$Json$Decode$map,
			$elm$html$Html$Events$alwaysStop,
			A2($elm$json$Json$Decode$map, tagger, $elm$html$Html$Events$targetValue)));
};
var $elm$html$Html$textarea = _VirtualDom_node('textarea');
var $elm$html$Html$Attributes$value = $elm$html$Html$Attributes$stringProperty('value');
var $author$project$QuestionEditor$code_property = F2(
	function (_v0, o) {
		return _List_fromArray(
			[
				A2(
				$elm$html$Html$textarea,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$value(
						$author$project$Settings$getters.string(o.settings)),
						$elm$html$Html$Events$onInput(
						A2($author$project$Settings$setters, o.settings, o.setter).string),
						$elm$html$Html$Attributes$id(o.id),
						$elm$html$Html$Attributes$class('monospace')
					]),
				_List_Nil)
			]);
	});
var $elm$virtual_dom$VirtualDom$node = function (tag) {
	return _VirtualDom_node(
		_VirtualDom_noScript(tag));
};
var $elm$html$Html$node = $elm$virtual_dom$VirtualDom$node;
var $author$project$QuestionEditor$content_property = F2(
	function (_v0, o) {
		return _List_fromArray(
			[
				A3(
				$elm$html$Html$node,
				'tinymce-editor',
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$attribute, 'config', 'tinymceConfig'),
						A2($elm$html$Html$Attributes$attribute, 'setup', 'setupTinyMCE'),
						A2(
						$elm$html$Html$Events$on,
						'input',
						A2(
							$elm$json$Json$Decode$map,
							A2($author$project$Settings$setters, o.settings, o.setter).string,
							A2($elm$json$Json$Decode$field, 'detail', $elm$json$Json$Decode$string))),
						$elm$html$Html$Attributes$id(o.id),
						$elm$html$Html$Attributes$value(
						$author$project$Settings$getters.string(o.settings))
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						$author$project$Settings$getters.string(o.settings))
					]))
			]);
	});
var $elm$html$Html$Attributes$disabled = $elm$html$Html$Attributes$boolProperty('disabled');
var $elm$html$Html$em = _VirtualDom_node('em');
var $author$project$QuestionEditor$empty_part_container = $author$project$QuestionEditor$PartContainer(
	{alternatives: _List_Nil, gaps: _List_Nil, parts: _List_Nil, steps: _List_Nil});
var $elm$html$Html$fieldset = _VirtualDom_node('fieldset');
var $elm$html$Html$form = _VirtualDom_node('form');
var $elm$core$Set$Set_elm_builtin = function (a) {
	return {$: 'Set_elm_builtin', a: a};
};
var $elm$core$Set$empty = $elm$core$Set$Set_elm_builtin($elm$core$Dict$empty);
var $elm$core$Set$insert = F2(
	function (key, _v0) {
		var dict = _v0.a;
		return $elm$core$Set$Set_elm_builtin(
			A3($elm$core$Dict$insert, key, _Utils_Tuple0, dict));
	});
var $elm$core$Set$fromList = function (list) {
	return A3($elm$core$List$foldl, $elm$core$Set$insert, $elm$core$Set$empty, list);
};
var $elm$core$Basics$ge = _Utils_ge;
var $elm$html$Html$h1 = _VirtualDom_node('h1');
var $elm$html$Html$h2 = _VirtualDom_node('h2');
var $elm$html$Html$h3 = _VirtualDom_node('h3');
var $elm$html$Html$h4 = _VirtualDom_node('h4');
var $elm$html$Html$header = _VirtualDom_node('header');
var $elm$html$Html$hr = _VirtualDom_node('hr');
var $author$project$Settings$index = $author$project$Settings$Index;
var $author$project$Settings$IndexWhere = F2(
	function (a, b) {
		return {$: 'IndexWhere', a: a, b: b};
	});
var $author$project$Settings$indexWhere = $author$project$Settings$IndexWhere;
var $author$project$Settings$indexWhereName = function (name) {
	return A2(
		$author$project$Settings$indexWhere,
		A2(
			$elm$json$Json$Decode$map,
			$elm$core$Basics$eq(name),
			A2($elm$json$Json$Decode$field, 'name', $elm$json$Json$Decode$string)),
		$elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'name',
					$elm$json$Json$Encode$string(name))
				])));
};
var $author$project$Ui$jme_preview = function (o) {
	return A3(
		$elm$html$Html$node,
		'jme-preview',
		_List_fromArray(
			[
				A2($elm$html$Html$Attributes$attribute, 'expression', o.expression),
				A2($elm$html$Html$Attributes$attribute, 'notation', o.notation),
				A2($elm$html$Html$Attributes$attribute, 'for', o._for)
			]),
		_List_Nil);
};
var $author$project$QuestionEditor$text_property = F2(
	function (_v0, o) {
		return _List_fromArray(
			[
				A2(
				$elm$html$Html$input,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$value(
						$author$project$Settings$getters.string(o.settings)),
						$elm$html$Html$Events$onInput(
						A2($author$project$Settings$setters, o.settings, o.setter).string),
						$elm$html$Html$Attributes$id(o.id),
						$elm$html$Html$Attributes$class('monospace')
					]),
				_List_Nil)
			]);
	});
var $author$project$QuestionEditor$jme_property = F3(
	function (eo, ui, o) {
		return _Utils_ap(
			A2($author$project$QuestionEditor$text_property, ui, o),
			_List_fromArray(
				[
					$author$project$Ui$jme_preview(
					{
						expression: $author$project$Settings$getters.string(o.settings),
						_for: o.id,
						notation: eo.notation
					})
				]));
	});
var $elm$html$Html$Attributes$for = $elm$html$Html$Attributes$stringProperty('htmlFor');
var $elm$html$Html$label = _VirtualDom_node('label');
var $author$project$QuestionEditor$labelled_field = F3(
	function (ui, o, make_input) {
		return _Utils_ap(
			_List_fromArray(
				[
					A2(
					$elm$html$Html$label,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$for(o.id)
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(o.label)
						])),
					function () {
					var _v0 = A2(make_input, ui, o);
					if (_v0.b && (!_v0.b.b)) {
						var a = _v0.a;
						return a;
					} else {
						var lots = _v0;
						return A2($elm$html$Html$div, _List_Nil, lots);
					}
				}()
				]),
			function () {
				var _v1 = o.help;
				if (_v1.$ === 'Just') {
					var subject = _v1.a;
					return _List_fromArray(
						[
							$elm$html$Html$text(' '),
							A2(ui.helplink, o.label, subject)
						]);
				} else {
					return _List_Nil;
				}
			}());
	});
var $elm$html$Html$legend = _VirtualDom_node('legend');
var $elm$html$Html$li = _VirtualDom_node('li');
var $elm$html$Html$main_ = _VirtualDom_node('main');
var $elm$virtual_dom$VirtualDom$map = _VirtualDom_map;
var $elm$html$Html$map = $elm$virtual_dom$VirtualDom$map;
var $author$project$QuestionEditor$mathjax_span = function (content) {
	return A3(
		$elm$html$Html$node,
		'mathjax-span',
		_List_fromArray(
			[
				A2($elm$html$Html$Attributes$attribute, 'text', content)
			]),
		_List_Nil);
};
var $elm$json$Json$Decode$maybe = function (decoder) {
	return $elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$map, $elm$core$Maybe$Just, decoder),
				$elm$json$Json$Decode$succeed($elm$core$Maybe$Nothing)
			]));
};
var $elm$core$List$any = F2(
	function (isOkay, list) {
		any:
		while (true) {
			if (!list.b) {
				return false;
			} else {
				var x = list.a;
				var xs = list.b;
				if (isOkay(x)) {
					return true;
				} else {
					var $temp$isOkay = isOkay,
						$temp$list = xs;
					isOkay = $temp$isOkay;
					list = $temp$list;
					continue any;
				}
			}
		}
	});
var $elm$core$List$member = F2(
	function (x, xs) {
		return A2(
			$elm$core$List$any,
			function (a) {
				return _Utils_eq(a, x);
			},
			xs);
	});
var $elm$core$Dict$member = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$get, key, dict);
		if (_v0.$ === 'Just') {
			return true;
		} else {
			return false;
		}
	});
var $elm$core$Set$member = F2(
	function (key, _v0) {
		var dict = _v0.a;
		return A2($elm$core$Dict$member, key, dict);
	});
var $elm$html$Html$Attributes$name = $elm$html$Html$Attributes$stringProperty('name');
var $elm$core$Set$remove = F2(
	function (key, _v0) {
		var dict = _v0.a;
		return $elm$core$Set$Set_elm_builtin(
			A2($elm$core$Dict$remove, key, dict));
	});
var $elm$html$Html$ul = _VirtualDom_node('ul');
var $author$project$QuestionEditor$multi_select_property = F3(
	function (choices, ui, o) {
		var chosen = A3(
			$author$project$Settings$get,
			A2(
				$elm$json$Json$Decode$map,
				$elm$core$Set$fromList,
				$elm$json$Json$Decode$list($elm$json$Json$Decode$string)),
			$elm$core$Set$empty,
			o.settings);
		var check = F2(
			function (choice, checked) {
				var nchosen = A2(
					checked ? $elm$core$Set$insert : $elm$core$Set$remove,
					choice.value,
					chosen);
				return A2($author$project$Settings$setters, o.settings, o.setter).value(
					A2(
						$elm$json$Json$Encode$list,
						$elm$json$Json$Encode$string,
						$elm$core$Set$toList(nchosen)));
			});
		return _List_fromArray(
			[
				A2(
				$elm$html$Html$ul,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('list-unstyled multi-select')
					]),
				A2(
					$elm$core$List$indexedMap,
					F2(
						function (i, choice) {
							var id = o.id + ('-choice-' + $author$project$Util$fi(i));
							return A2(
								$elm$html$Html$li,
								_List_Nil,
								_List_fromArray(
									[
										A2(
										$elm$html$Html$input,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$type_('checkbox'),
												$elm$html$Html$Attributes$name(choice.value),
												$elm$html$Html$Attributes$checked(
												A2($elm$core$Set$member, choice.value, chosen)),
												$elm$html$Html$Events$onCheck(
												check(choice)),
												$elm$html$Html$Attributes$id(id)
											]),
										_List_Nil),
										$elm$html$Html$text(' '),
										A2(
										$elm$html$Html$label,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$for(id)
											]),
										_List_fromArray(
											[
												$elm$html$Html$text(choice.label)
											])),
										$elm$html$Html$text(' '),
										ui.inline_help_block(
										_List_fromArray(
											[
												$elm$html$Html$text(choice.description)
											]))
									]));
						}),
					choices))
			]);
	});
var $elm$html$Html$nav = _VirtualDom_node('nav');
var $author$project$QuestionEditor$numberNotationStyles = _List_fromArray(
	[
		{description: 'No thousands separator; dot for decimal point.', label: 'English (Plain)', value: 'plain'},
		{description: 'Commas separate thousands; dot for decimal point.', label: 'English', value: 'en'},
		{description: 'Spaces separate thousands; dot for decimal point.', label: 'SI (English)', value: 'si-en'},
		{description: 'Spaces separate thousands; comma for decimal point.', label: 'SI (French)', value: 'si-fr'},
		{description: 'Dots separate thousands; comma for decimal point.', label: 'Continental', value: 'eu'},
		{description: 'No thousands separator; comma for decimal point.', label: 'Continental (Plain)', value: 'plain-eu'},
		{description: 'Apostrophes separate thousands; dot for decimal point.', label: 'Swiss', value: 'ch'},
		{description: 'Commas separate groups; rightmost group is 3 digits, other groups 2 digits; dot for decimal point.', label: 'Indian', value: 'in'},
		{description: 'A significand followed by the letter \u0022e\u0022 and an integer exponent.', label: 'Scientific', value: 'scientific'}
	]);
var $elm$html$Html$ol = _VirtualDom_node('ol');
var $elm$html$Html$Events$onClick = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'click',
		$elm$json$Json$Decode$succeed(msg));
};
var $author$project$Util$alphabet = 'abcdefghijklmnopqrstuvwxyz';
var $elm$core$Basics$modBy = _Basics_modBy;
var $author$project$Util$letter_ordinal = function (n) {
	var b = $elm$core$String$length($author$project$Util$alphabet);
	var m = A2($elm$core$Basics$modBy, b, n);
	var c = A3($elm$core$String$slice, m, m + 1, $author$project$Util$alphabet);
	return (!n) ? A2($elm$core$String$left, 1, $author$project$Util$alphabet) : _Utils_ap(
		(_Utils_cmp(n, b) > -1) ? $author$project$Util$letter_ordinal(((n / b) | 0) - 1) : '',
		c);
};
var $author$project$QuestionEditor$part_name = F2(
	function (path, part) {
		var _v0 = $author$project$Settings$getters.string(
			A2($author$project$Settings$atField, 'customName', part.settings));
		if (_v0 === '') {
			var _v1 = $author$project$QuestionEditor$bottom_index(path);
			if (_v1.$ === 'Just') {
				switch (_v1.a.a.$) {
					case 'TopPart':
						var _v2 = _v1.a;
						var _v3 = _v2.a;
						var i = _v2.b;
						return 'Part ' + ($author$project$Util$letter_ordinal(i) + ')');
					case 'Gap':
						var _v4 = _v1.a;
						var _v5 = _v4.a;
						var i = _v4.b;
						return 'Gap ' + ($author$project$Util$fi(i) + '.');
					case 'Step':
						var _v6 = _v1.a;
						var _v7 = _v6.a;
						var i = _v6.b;
						return 'Step ' + $author$project$Util$fi(i);
					default:
						var _v8 = _v1.a;
						var _v9 = _v8.a;
						var i = _v8.b;
						return 'Alternative ' + $author$project$Util$fi(i);
				}
			} else {
				return 'Part';
			}
		} else {
			var name = _v0;
			return name;
		}
	});
var $elm$html$Html$Attributes$max = $elm$html$Html$Attributes$stringProperty('max');
var $elm$html$Html$Attributes$min = $elm$html$Html$Attributes$stringProperty('min');
var $elm$html$Html$output = _VirtualDom_node('output');
var $elm$html$Html$Attributes$step = function (n) {
	return A2($elm$html$Html$Attributes$stringProperty, 'step', n);
};
var $author$project$QuestionEditor$percent_property = F2(
	function (_v0, o) {
		return _List_fromArray(
			[
				A2(
				$elm$html$Html$input,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$value(
						$author$project$Settings$getters.string(o.settings)),
						$elm$html$Html$Events$onInput(
						A2($author$project$Settings$setters, o.settings, o.setter).string),
						$elm$html$Html$Attributes$id(o.id),
						$elm$html$Html$Attributes$type_('range'),
						$elm$html$Html$Attributes$min('0'),
						$elm$html$Html$Attributes$max('100'),
						$elm$html$Html$Attributes$step('5')
					]),
				_List_Nil),
				A2(
				$elm$html$Html$output,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$for(o.id)
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						$author$project$Settings$getters.string(o.settings) + '%')
					]))
			]);
	});
var $elm$html$Html$Attributes$placeholder = $elm$html$Html$Attributes$stringProperty('placeholder');
var $elm$core$String$replace = F3(
	function (before, after, string) {
		return A2(
			$elm$core$String$join,
			after,
			A2($elm$core$String$split, before, string));
	});
var $elm$html$Html$option = _VirtualDom_node('option');
var $elm$html$Html$select = _VirtualDom_node('select');
var $elm$html$Html$Attributes$selected = $elm$html$Html$Attributes$boolProperty('selected');
var $author$project$QuestionEditor$select_property = F3(
	function (options, _v0, o) {
		return _List_fromArray(
			[
				A2(
				$elm$html$Html$select,
				_List_fromArray(
					[
						$elm$html$Html$Events$onInput(
						A2($author$project$Settings$setters, o.settings, o.setter).string),
						$elm$html$Html$Attributes$id(o.id)
					]),
				A2(
					$elm$core$List$map,
					function (_v1) {
						var value = _v1.a;
						var label = _v1.b;
						return A2(
							$elm$html$Html$option,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$value(value),
									$elm$html$Html$Attributes$selected(
									_Utils_eq(
										value,
										$author$project$Settings$getters.string(o.settings)))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(label)
								]));
					},
					options))
			]);
	});
var $elm$core$Dict$sizeHelp = F2(
	function (n, dict) {
		sizeHelp:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return n;
			} else {
				var left = dict.d;
				var right = dict.e;
				var $temp$n = A2($elm$core$Dict$sizeHelp, n + 1, right),
					$temp$dict = left;
				n = $temp$n;
				dict = $temp$dict;
				continue sizeHelp;
			}
		}
	});
var $elm$core$Dict$size = function (dict) {
	return A2($elm$core$Dict$sizeHelp, 0, dict);
};
var $elm$core$Set$size = function (_v0) {
	var dict = _v0.a;
	return $elm$core$Dict$size(dict);
};
var $elm$html$Html$small = _VirtualDom_node('small');
var $author$project$Tabber$tab_link = F3(
	function (tabber, tab, text) {
		return A2(
			$elm$html$Html$a,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$href('#'),
					$elm$html$Html$Events$onClick(
					A2($author$project$Tabber$SetTab, tabber, tab))
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(text)
				]));
	});
var $elm$html$Html$table = _VirtualDom_node('table');
var $elm$html$Html$td = _VirtualDom_node('td');
var $elm$html$Html$th = _VirtualDom_node('th');
var $elm$html$Html$thead = _VirtualDom_node('thead');
var $elm$html$Html$tr = _VirtualDom_node('tr');
var $author$project$Aria$controls = $elm$html$Html$Attributes$attribute('aria-controls');
var $author$project$Tabber$current_tab = F2(
	function (state, tabber) {
		return (tabber.allow_empty ? $elm$core$Basics$identity : function (mc) {
			if (mc.$ === 'Just') {
				var c = mc.a;
				return $elm$core$Maybe$Just(c);
			} else {
				return $elm$core$List$head(tabber.tabs);
			}
		})(
			A2(
				$elm$core$Maybe$andThen,
				function (id) {
					return $elm$core$List$head(
						A2(
							$elm$core$List$filter,
							A2(
								$elm$core$Basics$composeR,
								function ($) {
									return $.id;
								},
								$elm$core$Basics$eq(id)),
							tabber.tabs));
				},
				A2($elm$core$Dict$get, tabber.name, state)));
	});
var $author$project$Aria$role = $elm$html$Html$Attributes$attribute('role');
var $author$project$Aria$selected = function (v) {
	return A2(
		$elm$html$Html$Attributes$attribute,
		'aria-selected',
		v ? 'true' : 'false');
};
var $author$project$Tabber$tab_id = F2(
	function (tabber, tab) {
		return tabber.name + ('-tab-' + tab.id);
	});
var $elm$html$Html$Attributes$tabindex = function (n) {
	return A2(
		_VirtualDom_attribute,
		'tabIndex',
		$elm$core$String$fromInt(n));
};
var $author$project$Tabber$tabpanel_id = F2(
	function (tabber, tab) {
		return tabber.name + ('-tabpanel-' + tab.id);
	});
var $author$project$Tabber$view_tablist = F5(
	function (ui, wrap_msg, state, tabber, tabber_attrs) {
		return A2(
			$elm$html$Html$menu,
			_Utils_ap(
				_List_fromArray(
					[
						$author$project$Aria$role('tablist')
					]),
				tabber_attrs),
			A2(
				$elm$core$List$indexedMap,
				F2(
					function (index, tab) {
						var selected = _Utils_eq(
							$elm$core$Maybe$Just(tab.id),
							A2(
								$elm$core$Maybe$map,
								function ($) {
									return $.id;
								},
								A2($author$project$Tabber$current_tab, state, tabber)));
						var nth_tab = function (i) {
							return A2($elm_community$list_extra$List$Extra$getAt, i, tabber.tabs);
						};
						var move_to_tab = function (i) {
							return A2(
								$elm$core$Maybe$withDefault,
								$elm$json$Json$Decode$fail('that tab doesn\u0027t exist'),
								A2(
									$elm$core$Maybe$map,
									$elm$json$Json$Decode$succeed,
									A2(
										$elm$core$Maybe$map,
										function (ntab) {
											return A2($author$project$Tabber$SetTab, tabber.name, ntab.id);
										},
										nth_tab(i))));
						};
						var handle_keypress = A2(
							$elm$json$Json$Decode$andThen,
							function (key) {
								switch (key) {
									case 'ArrowUp':
										return move_to_tab(index - 1);
									case 'ArrowLeft':
										return move_to_tab(index - 1);
									case 'ArrowRight':
										return move_to_tab(index + 1);
									case 'ArrowDown':
										return move_to_tab(index + 1);
									case 'Home':
										return move_to_tab(0);
									case 'End':
										return move_to_tab(
											$elm$core$List$length(tabber.tabs) - 1);
									default:
										return $elm$json$Json$Decode$fail('unhandled key');
								}
							},
							A2($elm$json$Json$Decode$field, 'key', $elm$json$Json$Decode$string));
						var extra_contents = function () {
							var _v2 = _Utils_Tuple2(selected, tab.label);
							if (_v2.a && (_v2.b.$ === 'HtmlLabel')) {
								var o = _v2.b.a;
								return o.extra_contents;
							} else {
								return _List_Nil;
							}
						}();
						var extra_attributes = function () {
							var _v1 = tab.label;
							if (_v1.$ === 'HtmlLabel') {
								var o = _v1.a;
								return o.button_attributes;
							} else {
								return _List_Nil;
							}
						}();
						return A2(
							$elm$html$Html$li,
							extra_attributes,
							_Utils_ap(
								_List_fromArray(
									[
										A2(
										$elm$html$Html$button,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$type_('button'),
												$elm$html$Html$Attributes$class('btn'),
												$author$project$Aria$role('tab'),
												$elm$html$Html$Attributes$id(
												A2($author$project$Tabber$tab_id, tabber, tab)),
												$elm$html$Html$Attributes$tabindex(
												selected ? 0 : (-1)),
												$author$project$Aria$selected(selected),
												$author$project$Aria$controls(
												A2($author$project$Tabber$tabpanel_id, tabber, tab)),
												$elm$html$Html$Events$onClick(
												wrap_msg(
													A2($author$project$Tabber$SetTab, tabber.name, tab.id))),
												A2(
												$elm$html$Html$Events$on,
												'keyup',
												A2($elm$json$Json$Decode$map, wrap_msg, handle_keypress))
											]),
										function () {
											var _v0 = tab.label;
											if (_v0.$ === 'SimpleLabel') {
												var label = _v0.a;
												return _List_fromArray(
													[
														A2(
														$elm$core$Maybe$withDefault,
														$elm$html$Html$text(''),
														A2($elm$core$Maybe$map, ui.icon, tab.icon)),
														$elm$html$Html$text(label)
													]);
											} else {
												var o = _v0.a;
												return o.button_contents;
											}
										}())
									]),
								extra_contents));
					}),
				tabber.tabs));
	});
var $author$project$Aria$labelledBy = $elm$html$Html$Attributes$attribute('aria-labelledby');
var $elm$html$Html$section = _VirtualDom_node('section');
var $author$project$Tabber$view_tabpanel = F3(
	function (ui, state, tabber) {
		var _v0 = A2($author$project$Tabber$current_tab, state, tabber);
		if (_v0.$ === 'Nothing') {
			return $elm$html$Html$text('');
		} else {
			var tab = _v0.a;
			var v = tab.view;
			return A2(
				$elm$html$Html$section,
				_Utils_ap(
					_List_fromArray(
						[
							$author$project$Aria$role('tabpanel'),
							$elm$html$Html$Attributes$id(
							A2($author$project$Tabber$tabpanel_id, tabber, tab)),
							$author$project$Aria$labelledBy(
							A2($author$project$Tabber$tab_id, tabber, tab))
						]),
					v.attributes),
				v.contents);
		}
	});
var $author$project$Ui$visibleIf = F2(
	function (prop, content) {
		return prop ? content : _List_Nil;
	});
var $author$project$QuestionEditor$view_active = function (model) {
	var ui = model.ui;
	var view_tablist = A3($author$project$Tabber$view_tablist, ui, $author$project$QuestionEditor$UpdateTab, model.tab_state);
	var view_tabpanel = A2($author$project$Tabber$view_tabpanel, ui, model.tab_state);
	var saving_class = function () {
		var _v23 = model.saving;
		switch (_v23.$) {
			case 'Saved':
				return 'saved';
			case 'Changed':
				return 'changed';
			default:
				return 'saving';
		}
	}();
	var ready_to_download = $elm$core$Result$Ok(_Utils_Tuple0);
	var question = model.history.current;
	var qfield = function (k) {
		return A2($author$project$Settings$atField, k, question.settings);
	};
	var question_field = function (o) {
		return A2(
			$author$project$QuestionEditor$labelled_field,
			ui,
			{
				help: o.help,
				id: o.id,
				label: o.label,
				setter: A2($elm$core$Basics$composeR, $author$project$QuestionEditor$ChangeQuestionSetting, $author$project$QuestionEditor$UpdateQuestion),
				settings: qfield(o.id)
			});
	};
	var settings_tab = {
		attributes: _List_Nil,
		contents: _List_fromArray(
			[
				A2(
				$elm$html$Html$fieldset,
				_List_Nil,
				A2(
					question_field,
					{help: $elm$core$Maybe$Nothing, id: 'name', label: 'Name'},
					$author$project$QuestionEditor$text_property))
			])
	};
	var statement_tab = {
		attributes: _List_Nil,
		contents: _List_fromArray(
			[
				A2(
				$elm$html$Html$fieldset,
				_List_Nil,
				A2(
					question_field,
					{
						help: $elm$core$Maybe$Just('the question statement'),
						id: 'statement',
						label: 'Statement'
					},
					$author$project$QuestionEditor$content_property))
			])
	};
	var parts_mode = function (s) {
		if (s === 'explore') {
			return $author$project$QuestionEditor$ExploreMode;
		} else {
			return $author$project$QuestionEditor$AllPartsMode;
		}
	}(
		$author$project$Settings$getters.string(
			qfield('partsMode')));
	var notation_options = A2(
		$elm$core$Result$withDefault,
		_List_fromArray(
			[
				_Utils_Tuple2('standard', 'Standard')
			]),
		A2(
			$elm$json$Json$Decode$decodeValue,
			A2(
				$elm$json$Json$Decode$map,
				$elm$core$Dict$toList,
				A2(
					$elm$json$Json$Decode$at,
					_List_fromArray(
						['jme', 'notations']),
					$elm$json$Json$Decode$dict(
						A2($elm$json$Json$Decode$field, 'name', $elm$json$Json$Decode$string)))),
			model.numbas));
	var part_tab = function (_v21) {
		var path = _v21.a;
		var part = _v21.b;
		var testing_tab = {
			icon: $elm$core$Maybe$Just('check'),
			id: 'testing',
			label: $author$project$Tabber$SimpleLabel('Testing'),
			view: {attributes: _List_Nil, contents: _List_Nil}
		};
		var term_to_url = A2($elm$core$String$replace, ' ', '-');
		var scripts_tab = {
			icon: $elm$core$Maybe$Just('file'),
			id: 'scripts',
			label: $author$project$Tabber$SimpleLabel('Scripts'),
			view: {attributes: _List_Nil, contents: _List_Nil}
		};
		var pset = A2(
			$elm$core$Basics$composeR,
			$author$project$QuestionEditor$ChangePartSetting,
			A2(
				$elm$core$Basics$composeR,
				$author$project$QuestionEditor$UpdatePart(path),
				$author$project$QuestionEditor$UpdateQuestion));
		var pfield = function (k) {
			return A2($author$project$Settings$atField, k, part.settings);
		};
		var pstring = A2($elm$core$Basics$composeR, pfield, $author$project$Settings$getters.string);
		var pfloat = A2(
			$elm$core$Basics$composeR,
			pstring,
			A2(
				$elm$core$Basics$composeR,
				$elm$core$String$toFloat,
				$elm$core$Maybe$withDefault(0)));
		var pbool = A2($elm$core$Basics$composeR, pfield, $author$project$Settings$getters.bool);
		var path_string = $author$project$QuestionEditor$part_path_toString(path);
		var prefix_id = function (id) {
			return path_string + ('-' + id);
		};
		var part_type_help = function (term) {
			var filename = A2(
				$elm$core$Maybe$withDefault,
				part.type_.name,
				A2(
					$elm$core$Dict$get,
					part.type_.name,
					$elm$core$Dict$fromList(
						_List_fromArray(
							[
								_Utils_Tuple2('jme', 'mathematical-expression'),
								_Utils_Tuple2('patternmatch', 'match-text-pattern'),
								_Utils_Tuple2('1_n_2', 'multiple-choice'),
								_Utils_Tuple2('m_n_2', 'multiple-choice'),
								_Utils_Tuple2('m_n_x', 'multiple-choice')
							]))));
			return 'question/parts/' + (filename + ('.html#term-' + term_to_url(term)));
		};
		var part_tabber_name = 'part-' + path_string;
		var part_help = function (term) {
			return 'question/parts/reference.html#term-' + term_to_url(term);
		};
		var part_field = function (o) {
			return A2(
				$author$project$QuestionEditor$labelled_field,
				ui,
				{
					help: o.help,
					id: prefix_id(o.id),
					label: o.label,
					setter: pset,
					settings: pfield(o.id)
				});
		};
		var prompt_tab = {
			icon: $elm$core$Maybe$Just('text'),
			id: 'prompt',
			label: $author$project$Tabber$SimpleLabel('Prompt'),
			view: {
				attributes: _List_Nil,
				contents: _List_fromArray(
					[
						A2(
						$elm$html$Html$fieldset,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('vertical')
							]),
						A2(
							part_field,
							{
								help: $elm$core$Maybe$Just('the part prompt'),
								id: 'prompt',
								label: 'Prompt'
							},
							$author$project$QuestionEditor$content_property))
					])
			}
		};
		var show_feedback_fields = $elm$core$List$concat(
			_List_fromArray(
				[
					A2(
					part_field,
					{
						help: $elm$core$Maybe$Just('revealing the correct answer'),
						id: 'showCorrectAnswer',
						label: 'Show correct answer on reveal?'
					},
					$author$project$QuestionEditor$boolean_property),
					A2(
					part_field,
					{
						help: $elm$core$Maybe$Just('the feedback icon'),
						id: 'showFeedbackIcon',
						label: 'Show score feedback icon?'
					},
					$author$project$QuestionEditor$boolean_property)
				]));
		var next_parts_tab = {
			icon: $elm$core$Maybe$Just('next'),
			id: 'next-parts',
			label: $author$project$Tabber$SimpleLabel('Next parts'),
			view: {attributes: _List_Nil, contents: _List_Nil}
		};
		var marks_field = A2(
			part_field,
			{
				help: $elm$core$Maybe$Just('marks'),
				id: 'marks',
				label: 'Marks'
			},
			$author$project$QuestionEditor$text_property);
		var marking_algorithm_tab = {
			icon: $elm$core$Maybe$Just('ok'),
			id: 'marking-algorithm',
			label: $author$project$Tabber$SimpleLabel('Marking algorithm'),
			view: {attributes: _List_Nil, contents: _List_Nil}
		};
		var kind = A2(
			$elm$core$Maybe$withDefault,
			$author$project$QuestionEditor$TopPart,
			A2(
				$elm$core$Maybe$map,
				$elm$core$Tuple$first,
				$author$project$QuestionEditor$bottom_index(path)));
		var is_top_level = _Utils_eq(kind, $author$project$QuestionEditor$TopPart);
		var is_step = _Utils_eq(kind, $author$project$QuestionEditor$Step);
		var is_gap = _Utils_eq(kind, $author$project$QuestionEditor$Gap);
		var is_alternative = _Utils_eq(kind, $author$project$QuestionEditor$Alternative);
		var fieldIsString = function (field) {
			return !_Utils_eq(
				$elm$core$Maybe$Nothing,
				$elm$core$Result$toMaybe(
					A2(
						$elm$json$Json$Decode$decodeValue,
						$elm$json$Json$Decode$string,
						$author$project$Settings$getters.value(
							pfield(field)))));
		};
		var toggleExpressionField = function (eo) {
			return A3(
				$author$project$QuestionEditor$labelled_field,
				ui,
				{help: eo.help, id: eo.id, label: eo.label, setter: pset, settings: part.settings},
				F2(
					function (_v20, o) {
						return _List_fromArray(
							[
								A2(
								$elm$html$Html$input,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$type_('checkbox'),
										$elm$html$Html$Attributes$checked(
										fieldIsString(eo.field)),
										$elm$html$Html$Events$onCheck(
										function (b) {
											return pset(
												_Utils_Tuple2(
													b ? $elm$json$Json$Encode$string('') : eo._default,
													_List_fromArray(
														[
															$author$project$Settings$field(eo.field)
														])));
										}),
										$elm$html$Html$Attributes$id(o.id)
									]),
								_List_Nil)
							]);
					}));
		};
		var customMCQMarking = fieldIsString('matrix');
		var control_buttons = A2(
			$elm$core$List$map,
			$elm$core$Tuple$second,
			A2(
				$elm$core$List$filter,
				$elm$core$Tuple$first,
				_List_fromArray(
					[
						_Utils_Tuple2(
						part.type_.name === 'gapfill',
						A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn xs'),
									$elm$html$Html$Events$onClick(
									A2($author$project$QuestionEditor$AddChildPart, path, $author$project$QuestionEditor$Gap))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Add a gap')
								]))),
						_Utils_Tuple2(
						_Utils_eq(parts_mode, $author$project$QuestionEditor$AllPartsMode) && (is_top_level && part.type_.has_marks),
						A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn xs'),
									$elm$html$Html$Events$onClick(
									A2($author$project$QuestionEditor$AddChildPart, path, $author$project$QuestionEditor$Step))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Add a step')
								]))),
						_Utils_Tuple2(
						part.type_.has_marks && (!is_alternative),
						A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('btn xs'),
									$elm$html$Html$Events$onClick(
									A2($author$project$QuestionEditor$AddChildPart, path, $author$project$QuestionEditor$Alternative))
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Add an alternative')
								]))),
						_Utils_Tuple2(
						true,
						A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$type_('button'),
									$elm$html$Html$Events$onClick(
									$author$project$QuestionEditor$UpdateQuestion(
										$author$project$QuestionEditor$DeletePart(path))),
									$elm$html$Html$Attributes$class('btn danger sm')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Delete this part')
								])))
					])));
		var choices_tab = function () {
			var settings_value = $author$project$Settings$getters.value(part.settings);
			var set_choices = function (c) {
				return pset(
					_Utils_Tuple2(
						A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, c),
						_List_fromArray(
							[
								$author$project$Settings$field('choices')
							])));
			};
			var matrix = A3(
				$author$project$Settings$get,
				$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
				_List_Nil,
				pfield('matrix'));
			var markingMethod = pstring('markingMethod');
			var needsMaxMarks = (markingMethod === 'score per matched cell') || (markingMethod === 'all-or-nothing');
			var distractors = A3(
				$author$project$Settings$get,
				$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
				_List_Nil,
				pfield('distractors'));
			var customChoices = fieldIsString('choices');
			var choices = A3(
				$author$project$Settings$get,
				$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
				_List_Nil,
				pfield('choices'));
			var remove_choice = function (i) {
				return function (s) {
					return pset(
						_Utils_Tuple2(s, _List_Nil));
				}(
					A2(
						$elm$core$Result$withDefault,
						settings_value,
						A2(
							$elm$core$Result$map,
							A2(
								$elm$core$Basics$composeR,
								A2(
									$elm$core$Dict$insert,
									'choices',
									A2(
										$elm$json$Json$Encode$list,
										$elm$json$Json$Encode$string,
										A2($elm_community$list_extra$List$Extra$removeAt, i, choices))),
								A2(
									$elm$core$Basics$composeR,
									A2(
										$elm$core$Dict$insert,
										'matrix',
										A2(
											$elm$json$Json$Encode$list,
											$elm$json$Json$Encode$string,
											A2($elm_community$list_extra$List$Extra$removeAt, i, matrix))),
									A2(
										$elm$core$Basics$composeR,
										A2(
											$elm$core$Dict$insert,
											'distractors',
											A2(
												$elm$json$Json$Encode$list,
												$elm$json$Json$Encode$string,
												A2($elm_community$list_extra$List$Extra$removeAt, i, distractors))),
										A2($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$core$Basics$identity)))),
							A2(
								$elm$json$Json$Decode$decodeValue,
								$elm$json$Json$Decode$dict($elm$json$Json$Decode$value),
								settings_value))));
			};
			return {
				icon: $elm$core$Maybe$Just('list'),
				id: 'choices',
				label: $author$project$Tabber$SimpleLabel('Choices'),
				view: {
					attributes: _List_Nil,
					contents: $elm$core$List$concat(
						_List_fromArray(
							[
								_List_fromArray(
								[
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												function () {
												var _v18 = part.type_.name;
												if (_v18 === 'm_n_2') {
													return _Utils_ap(
														A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('marking method'),
																id: 'markingMethod',
																label: 'Marking method'
															},
															$author$project$QuestionEditor$select_property(
																_List_fromArray(
																	[
																		_Utils_Tuple2('sum ticked cells', 'Sum ticked cells'),
																		_Utils_Tuple2('score per matched cell', 'Score per matched cell'),
																		_Utils_Tuple2('all-or-nothing', 'All-or-nothing')
																	]))),
														_Utils_ap(
															function () {
																switch (markingMethod) {
																	case 'sum ticked cells':
																		return _List_fromArray(
																			[
																				ui.help_block(
																				_List_fromArray(
																					[
																						$elm$html$Html$text('For each choice, specify the number of marks to add or subtract when the student picks it.')
																					]))
																			]);
																	case 'score per matched cell':
																		return _List_fromArray(
																			[
																				ui.help_block(
																				_List_fromArray(
																					[
																						$elm$html$Html$text('For each choice, write 1 in the marks field if the student should tick it, or 0 if they should leave it unticked.')
																					]))
																			]);
																	default:
																		return _List_Nil;
																}
															}(),
															A2(
																$author$project$Ui$visibleIf,
																needsMaxMarks && (!pfloat('maxMarks')),
																_List_fromArray(
																	[
																		A2(
																		ui.alert,
																		'warning',
																		_List_fromArray(
																			[
																				$elm$html$Html$text('You must set a '),
																				A2(
																				$elm$html$Html$map,
																				$author$project$QuestionEditor$UpdateTab,
																				A3($author$project$Tabber$tab_link, part_tabber_name, 'marking-settings', 'maximum number of marks')),
																				$elm$html$Html$text(' in order to use this marking method.')
																			]))
																	]))));
												} else {
													return _List_Nil;
												}
											}(),
												toggleExpressionField(
												{
													_default: A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil),
													field: 'choices',
													help: $elm$core$Maybe$Just('variable list of choices'),
													id: 'customChoices',
													label: 'Variable list of choices?'
												}),
												A2(
												$author$project$Ui$visibleIf,
												customChoices,
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('list of choices'),
														id: 'choices',
														label: 'List of choices'
													},
													$author$project$QuestionEditor$text_property)),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('shuffling choices'),
													id: 'shuffleChoices',
													label: 'Shuffle order of choices?'
												},
												$author$project$QuestionEditor$boolean_property)
											])))
								]),
								A2(
								$author$project$Ui$visibleIf,
								!customChoices,
								_Utils_ap(
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$h4,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Choices')
														]))
												]),
												A2(
												$elm$core$List$indexedMap,
												F2(
													function (i, choice) {
														return A2(
															$elm$html$Html$fieldset,
															_List_fromArray(
																[
																	$elm$html$Html$Attributes$class('choice')
																]),
															$elm$core$List$concat(
																_List_fromArray(
																	[
																		_List_fromArray(
																		[
																			A2(
																			$elm$html$Html$legend,
																			_List_Nil,
																			_List_fromArray(
																				[
																					$elm$html$Html$text(
																					'Choice ' + $author$project$Util$fi(i))
																				]))
																		]),
																		A3(
																		$author$project$QuestionEditor$labelled_field,
																		ui,
																		{
																			help: $elm$core$Maybe$Nothing,
																			id: 'choice-' + $author$project$Util$fi(i),
																			label: 'Content',
																			setter: pset,
																			settings: A2(
																				$author$project$Settings$at,
																				_List_fromArray(
																					[
																						$author$project$Settings$field('choices'),
																						$author$project$Settings$index(i)
																					]),
																				part.settings)
																		},
																		$author$project$QuestionEditor$content_property),
																		_List_fromArray(
																		[
																			A2(
																			$elm$html$Html$button,
																			_List_fromArray(
																				[
																					$elm$html$Html$Attributes$type_('button'),
																					$elm$html$Html$Events$onClick(
																					remove_choice(i))
																				]),
																			_List_fromArray(
																				[
																					ui.icon('remove'),
																					$elm$html$Html$text('Delete this choice')
																				]))
																		]),
																		A2(
																		$author$project$Ui$visibleIf,
																		!customMCQMarking,
																		A3(
																			$author$project$QuestionEditor$labelled_field,
																			ui,
																			{
																				help: $elm$core$Maybe$Nothing,
																				id: 'choice-' + ($author$project$Util$fi(i) + '-marks'),
																				label: 'Marks',
																				setter: pset,
																				settings: A2(
																					$author$project$Settings$at,
																					_List_fromArray(
																						[
																							$author$project$Settings$field('matrix'),
																							$author$project$Settings$index(i)
																						]),
																					part.settings)
																			},
																			$author$project$QuestionEditor$text_property)),
																		A3(
																		$author$project$QuestionEditor$labelled_field,
																		ui,
																		{
																			help: $elm$core$Maybe$Nothing,
																			id: 'choice-' + ($author$project$Util$fi(i) + '-distractor'),
																			label: 'Distractor message',
																			setter: pset,
																			settings: A2(
																				$author$project$Settings$at,
																				_List_fromArray(
																					[
																						$author$project$Settings$field('distractors'),
																						$author$project$Settings$index(i)
																					]),
																				part.settings)
																		},
																		$author$project$QuestionEditor$text_property)
																	])));
													}),
												choices)
											])),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$button,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$type_('button'),
													$elm$html$Html$Events$onClick(
													set_choices(
														_Utils_ap(
															choices,
															_List_fromArray(
																['']))))
												]),
											_List_fromArray(
												[
													ui.icon('add'),
													$elm$html$Html$text('Add a choice')
												]))
										])))
							]))
				}
			};
		}();
		var cfield = function (k) {
			return A2($author$project$Settings$atField, k, part.computed);
		};
		var marking_settings_tab = {
			icon: $elm$core$Maybe$Just('pencil'),
			id: 'marking-settings',
			label: $author$project$Tabber$SimpleLabel('Marking settings'),
			view: {
				attributes: _List_Nil,
				contents: function () {
					var _v13 = part.type_.name;
					switch (_v13) {
						case 'jme':
							return _List_fromArray(
								[
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												marks_field,
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('correct answer'),
													id: 'answer',
													label: 'Correct answer'
												},
												$author$project$QuestionEditor$jme_property(
													{
														notation: pstring('notation')
													})),
												A2(
												$author$project$Ui$visibleIf,
												$author$project$Settings$getters.bool(
													cfield('is_equation')),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$div,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$class('alert warning')
															]),
														_List_fromArray(
															[
																A2(ui.helplink, 'marking-an-equation', 'marking an equation'),
																$elm$html$Html$text('The correct answer is an equation. Use the '),
																A2(
																$elm$html$Html$map,
																$author$project$QuestionEditor$UpdateTab,
																A3($author$project$Tabber$tab_link, part_tabber_name, 'checking-accuracy', 'accuracy tab')),
																$elm$html$Html$text(' to generate variable values satisfying this equation so it can be marked accurately.')
															]))
													])),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('notation'),
													id: 'notation',
													label: 'Notation'
												},
												$author$project$QuestionEditor$select_property(notation_options))
											]))),
									A2($elm$html$Html$fieldset, _List_Nil, show_feedback_fields),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Advanced settings')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('answer simplification rules'),
													id: 'answerSimplification',
													label: 'Answer simplification rules'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('student answer preview'),
													id: 'showPreview',
													label: 'Show preview of student\u0027s answer?'
												},
												$author$project$QuestionEditor$boolean_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('case-sensitivity'),
													id: 'caseSensitive',
													label: 'Expression is case-sensitive?'
												},
												$author$project$QuestionEditor$boolean_property)
											])))
								]);
						case 'numberentry':
							var precisionType = pstring('precisionType');
							var precisionWord = function () {
								switch (precisionType) {
									case 'dp':
										return 'Digits';
									case 'sigfig':
										return 'Significant figures';
									default:
										return '';
								}
							}();
							var mustBeReduced = pbool('mustBeReduced');
							var fractionPossible = !A2(
								$elm$core$List$member,
								precisionType,
								_List_fromArray(
									['dp', 'sigfig']));
							var allowFractions = pbool('allowFractions');
							return _List_fromArray(
								[
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												marks_field,
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('minimum accepted value'),
													id: 'minValue',
													label: 'Minimum accepted value'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('maximum accepted value'),
													id: 'maxValue',
													label: 'Maximum accepted value'
												},
												$author$project$QuestionEditor$text_property)
											]))),
									A2($elm$html$Html$fieldset, _List_Nil, show_feedback_fields),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Advanced settings')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('display answer'),
													id: 'displayAnswer',
													label: 'Display answer'
												},
												F2(
													function (_v14, o) {
														return $elm$core$List$concat(
															_List_fromArray(
																[
																	A2($author$project$QuestionEditor$text_property, ui, o),
																	A2(
																	$author$project$Ui$visibleIf,
																	pstring('displayAnswer') === '',
																	_List_fromArray(
																		[
																			ui.help_block(
																			_List_fromArray(
																				[
																					$elm$html$Html$text('(The midpoint of the minimum and maximum accepted values)')
																				]))
																		]))
																]));
													})),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('precision restriction'),
													id: 'precisionType',
													label: 'Precision restriction'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('none', 'None'),
															_Utils_Tuple2('dp', 'Decimal places'),
															_Utils_Tuple2('sigfig', 'Significant figures')
														]))),
												A2(
												$author$project$Ui$visibleIf,
												fractionPossible,
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('allowing the student to enter a fraction'),
														id: 'allowFractions',
														label: 'Allow the student to enter a fraction?'
													},
													$author$project$QuestionEditor$boolean_property)),
												A2(
												$author$project$Ui$visibleIf,
												fractionPossible && allowFractions,
												$elm$core$List$concat(
													_List_fromArray(
														[
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('reduced fractions'),
																id: 'mustBeReduced',
																label: 'Must the fraction be reduced?'
															},
															$author$project$QuestionEditor$boolean_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('the fraction input hint'),
																id: 'showFractionHint',
																label: 'Show fraction input hint?'
															},
															$author$project$QuestionEditor$boolean_property),
															A2(
															$author$project$Ui$visibleIf,
															mustBeReduced,
															A2(
																part_field,
																{
																	help: $elm$core$Maybe$Just('reduced fraction'),
																	id: 'mustBeReducedPC',
																	label: 'Partial credit for unreduced fraction'
																},
																$author$project$QuestionEditor$boolean_property)),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('displaying the correct answer as a fraction'),
																id: 'correctAnswerFraction',
																label: 'Display the correct answer as a fraction?'
															},
															$author$project$QuestionEditor$boolean_property)
														]))),
												A2(
												$author$project$Ui$visibleIf,
												precisionType !== 'none',
												$elm$core$List$concat(
													_List_fromArray(
														[
															A2(
															part_field,
															{help: $elm$core$Maybe$Nothing, id: 'precision', label: precisionWord},
															$author$project$QuestionEditor$text_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('trailing zeros'),
																id: 'strictPrecision',
																label: 'Require trailing zeros?'
															},
															$author$project$QuestionEditor$boolean_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('precision restriction hint'),
																id: 'showPrecisionHint',
																label: 'Show precision restriction hint?'
															},
															$author$project$QuestionEditor$boolean_property),
															A2(
															part_field,
															{help: $elm$core$Maybe$Nothing, id: 'precisionPartialCredit', label: 'Partial credit for wrong precision'},
															$author$project$QuestionEditor$percent_property),
															A2(
															part_field,
															{help: $elm$core$Maybe$Nothing, id: 'precisionMessage', label: 'Message if wrong precision'},
															$author$project$QuestionEditor$content_property)
														])))
											]))),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Notation styles')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('allowed notation styles'),
													id: 'notationStyles',
													label: 'Allowed notation'
												},
												$author$project$QuestionEditor$multi_select_property($author$project$QuestionEditor$numberNotationStyles)),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('correct answer style'),
													id: 'correctAnswerStyle',
													label: 'Correct answer style'
												},
												$author$project$QuestionEditor$select_property(
													A2(
														$elm$core$List$map,
														function (s) {
															return _Utils_Tuple2(s.value, s.label);
														},
														$author$project$QuestionEditor$numberNotationStyles)))
											])))
								]);
						case '1_n_2':
							var displayType = pstring('displayType');
							return _List_fromArray(
								[
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('choice feedback state'),
													id: 'showCellAnswerState',
													label: 'Show choice feedback state?'
												},
												$author$project$QuestionEditor$boolean_property)
											]))),
									A2($elm$html$Html$fieldset, _List_Nil, show_feedback_fields),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Advanced settings')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('selection type'),
													id: 'displayType',
													label: 'Selection type'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('radiogroup', 'Radio buttons'),
															_Utils_Tuple2('dropdownlist', 'Drop down list')
														]))),
												A2(
												$author$project$Ui$visibleIf,
												displayType === 'dropdownlist',
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('blank choice'),
														id: 'showBlankOption',
														label: 'Show a blank choice?'
													},
													$author$project$QuestionEditor$boolean_property)),
												A2(
												$author$project$Ui$visibleIf,
												displayType === 'radiogroup',
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('display columns'),
														id: 'displayColumns',
														label: 'Number of display columns'
													},
													$author$project$QuestionEditor$text_property)),
												toggleExpressionField(
												{
													_default: A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil),
													field: 'matrix',
													help: $elm$core$Maybe$Just('custom marking matrix'),
													id: 'customMarking',
													label: 'Custom marking matrix?'
												}),
												A2(
												$author$project$Ui$visibleIf,
												customMCQMarking,
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('custom matrix expression'),
														id: 'matrix',
														label: 'Custom matrix expression'
													},
													$author$project$QuestionEditor$text_property)),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('form of the interpreted answer'),
													id: 'interpretedAnswerForm',
													label: 'Form of the interpreted answer'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('list of list of boolean', '2D array of booleans'),
															_Utils_Tuple2('index of choice', 'Index of selected choice'),
															_Utils_Tuple2('text of choice', 'Text of selected choice')
														])))
											])))
								]);
						case 'm_n_2':
							return _List_fromArray(
								[
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('minimum marks'),
													id: 'minMarks',
													label: 'Minimum marks'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('maximum marks'),
													id: 'maxMarks',
													label: 'Maximum marks'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('choice feedback state'),
													id: 'showCellAnswerState',
													label: 'Show choice feedback state?'
												},
												$author$project$QuestionEditor$boolean_property)
											]))),
									A2($elm$html$Html$fieldset, _List_Nil, show_feedback_fields),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Advanced settings')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('display columns'),
													id: 'displayColumns',
													label: 'Number of display columns'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('minimum answers'),
													id: 'minAnswers',
													label: 'Minimum answers'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('maximum answers'),
													id: 'maxAnswers',
													label: 'Maximum answers'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												$author$project$Ui$visibleIf,
												(!(!pfloat('minAnswers'))) || (!(!pfloat('maxAnswers'))),
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('wrong number of answers'),
														id: 'warningType',
														label: 'What to do if wrong number of answers selected'
													},
													$author$project$QuestionEditor$select_property(
														_List_fromArray(
															[
																_Utils_Tuple2('none', 'Do nothing'),
																_Utils_Tuple2('warn', 'Warn'),
																_Utils_Tuple2('prevent', 'Prevent submission')
															])))),
												A3(
												$author$project$QuestionEditor$labelled_field,
												ui,
												{
													help: $elm$core$Maybe$Just('custom marking matrix'),
													id: 'customMCQMarking',
													label: 'Custom marking matrix?',
													setter: pset,
													settings: part.settings
												},
												F2(
													function (_v16, o) {
														return _List_fromArray(
															[
																A2(
																$elm$html$Html$input,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$type_('checkbox'),
																		$elm$html$Html$Attributes$checked(customMCQMarking),
																		$elm$html$Html$Events$onCheck(
																		function (b) {
																			return b ? pset(
																				_Utils_Tuple2(
																					$elm$json$Json$Encode$string(''),
																					_List_fromArray(
																						[
																							$author$project$Settings$field('matrix')
																						]))) : pset(
																				_Utils_Tuple2(
																					A2($elm$json$Json$Encode$list, $elm$core$Basics$identity, _List_Nil),
																					_List_fromArray(
																						[
																							$author$project$Settings$field('matrix')
																						])));
																		}),
																		$elm$html$Html$Attributes$id(o.id)
																	]),
																_List_Nil)
															]);
													})),
												A2(
												$author$project$Ui$visibleIf,
												customMCQMarking,
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('custom matrix expression'),
														id: 'matrix',
														label: 'Custom matrix expression'
													},
													$author$project$QuestionEditor$text_property)),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('form of the interpreted answer'),
													id: 'interpretedAnswerForm',
													label: 'Form of the interpreted answer'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('list of list of boolean', '2D array of booleans'),
															_Utils_Tuple2('list of boolean', 'List of booleans'),
															_Utils_Tuple2('indices of choices', 'Indices of selected choices'),
															_Utils_Tuple2('text of choices', 'Text of selected choices')
														])))
											])))
								]);
						case 'm_n_x':
							var layoutType = pstring('layoutType');
							var displayType = pstring('displayType');
							return _List_fromArray(
								[
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('minimum marks'),
													id: 'minMarks',
													label: 'Minimum marks'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('maximum marks'),
													id: 'maxMarks',
													label: 'Maximum marks'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('choice feedback state'),
													id: 'showCellAnswerState',
													label: 'Show choice feedback state?'
												},
												$author$project$QuestionEditor$boolean_property)
											]))),
									A2($elm$html$Html$fieldset, _List_Nil, show_feedback_fields),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Advanced settings')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('minimum answers'),
													id: 'minAnswers',
													label: 'Minimum answers'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('maximum answers'),
													id: 'maxAnswers',
													label: 'Maximum answers'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												$author$project$Ui$visibleIf,
												(!(!pfloat('minAnswers'))) || (!(!pfloat('maxAnswers'))),
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('wrong number of answers'),
														id: 'warningType',
														label: 'What to do if wrong number of answers selected'
													},
													$author$project$QuestionEditor$select_property(
														_List_fromArray(
															[
																_Utils_Tuple2('none', 'Do nothing'),
																_Utils_Tuple2('warn', 'Warn'),
																_Utils_Tuple2('prevent', 'Prevent submission')
															])))),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('selection type'),
													id: 'displayType',
													label: 'Selection type'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('radiogroup', 'One from each row'),
															_Utils_Tuple2('checkbox', 'Checkboxes')
														]))),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('layout'),
													id: 'layoutType',
													label: 'Layout'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('all', 'Show all options'),
															_Utils_Tuple2('lowertriangle', 'Lower triangle'),
															_Utils_Tuple2('strictlowertriangle', 'Lower triangle (no diagonal)'),
															_Utils_Tuple2('uppertriangle', 'Upper triangle'),
															_Utils_Tuple2('strictuppertriangle', 'Upper triangle (no diagonal)'),
															_Utils_Tuple2('expression', 'Custom expression')
														]))),
												A2(
												$author$project$Ui$visibleIf,
												layoutType === 'expression',
												A2(
													part_field,
													{help: $elm$core$Maybe$Nothing, id: 'layoutExpression', label: 'Custom layout expression'},
													$author$project$QuestionEditor$text_property)),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('form of the interpreted answer'),
													id: 'interpretedAnswerForm',
													label: 'Form of the interpreted answer'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('list of list of boolean', '2D array of booleans'),
															_Utils_Tuple2('indices of pairs', 'List of chosen pair indices'),
															_Utils_Tuple2('text of choices', 'Text of chosen pairs')
														])))
											])))
								]);
						case 'gapfill':
							var gaps = A2($author$project$QuestionEditor$part_getter, $author$project$QuestionEditor$Gap, part.children);
							var gap_types = $elm$core$Set$fromList(
								A2(
									$elm$core$List$map,
									function (g) {
										return g.type_.name;
									},
									gaps));
							var all_gaps_same_type = 1 >= $elm$core$Set$size(
								$elm$core$Set$fromList(
									A2(
										$elm$core$List$map,
										function (g) {
											return g.type_.name;
										},
										gaps)));
							return _List_fromArray(
								[
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												A2(
												$author$project$Ui$visibleIf,
												all_gaps_same_type,
												A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('sorting answers'),
														id: 'sortAnswers',
														label: 'Sort student\u0027s answers before marking?'
													},
													$author$project$QuestionEditor$boolean_property)),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('showing expected answers inline'),
													id: 'inlineCorrectAnswer',
													label: 'Show expected answers inline?'
												},
												$author$project$QuestionEditor$boolean_property)
											]))),
									A2($elm$html$Html$fieldset, _List_Nil, show_feedback_fields)
								]);
						case 'matrix':
							var precisionType = pstring('precisionType');
							var precisionWord = function () {
								switch (precisionType) {
									case 'dp':
										return 'Digits';
									case 'sigfig':
										return 'Significant figures';
									default:
										return '';
								}
							}();
							var gridlines = pstring('gridlines');
							var allowResize = pbool('allowResize');
							return _List_fromArray(
								[
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												marks_field,
												A2(
												part_field,
												{help: $elm$core$Maybe$Nothing, id: 'correctAnswer', label: 'Correct answer'},
												$author$project$QuestionEditor$code_property)
											]))),
									A2($elm$html$Html$fieldset, _List_Nil, show_feedback_fields),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Size of the matrix')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('number of rows'),
													id: 'numRows',
													label: 'Number of rows'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('number of columns'),
													id: 'numColumns',
													label: 'Number of columns'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('resizing the matrix'),
													id: 'allowResize',
													label: 'Allow student to change size of matrix?'
												},
												$author$project$QuestionEditor$boolean_property),
												A2(
												$author$project$Ui$visibleIf,
												allowResize,
												$elm$core$List$concat(
													_List_fromArray(
														[
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('minimum number of rows'),
																id: 'minRows',
																label: 'Minimum number of rows'
															},
															$author$project$QuestionEditor$text_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('maximum number of rows'),
																id: 'maxRows',
																label: 'Maximum number of rows'
															},
															$author$project$QuestionEditor$text_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('minimum number of columns'),
																id: 'minColumns',
																label: 'Minimum number of columns'
															},
															$author$project$QuestionEditor$text_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('maximum number of columns'),
																id: 'maxColumns',
																label: 'Maximum number of columns'
															},
															$author$project$QuestionEditor$text_property)
														])))
											]))),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Precision')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('margin of error'),
													id: 'tolerance',
													label: 'Margin of error allowed in each cell'
												},
												$author$project$QuestionEditor$text_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('marks per correct cell'),
													id: 'markPerCell',
													label: 'Gain marks for each correct cell?'
												},
												$author$project$QuestionEditor$boolean_property),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('precision restriction'),
													id: 'precisionType',
													label: 'Precision restriction'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('none', 'None'),
															_Utils_Tuple2('dp', 'Decimal places'),
															_Utils_Tuple2('sigfig', 'Significant figures')
														]))),
												A2(
												$author$project$Ui$visibleIf,
												precisionType !== 'none',
												$elm$core$List$concat(
													_List_fromArray(
														[
															A2(
															part_field,
															{help: $elm$core$Maybe$Nothing, id: 'precision', label: precisionWord},
															$author$project$QuestionEditor$text_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('trailing zeros'),
																id: 'strictPrecision',
																label: 'Require trailing zeros?'
															},
															$author$project$QuestionEditor$boolean_property),
															A2(
															part_field,
															{help: $elm$core$Maybe$Nothing, id: 'precisionPartialCredit', label: 'Partial credit for wrong precision'},
															$author$project$QuestionEditor$percent_property),
															A2(
															part_field,
															{help: $elm$core$Maybe$Nothing, id: 'precisionMessage', label: 'Message if wrong precision'},
															$author$project$QuestionEditor$content_property)
														])))
											]))),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Pre-filled cells')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('pre-filled cells'),
													id: 'prefilledCells',
													label: 'Pre-filled cells'
												},
												$author$project$QuestionEditor$code_property)
											]))),
									A2(
									$elm$html$Html$fieldset,
									_List_Nil,
									$elm$core$List$concat(
										_List_fromArray(
											[
												_List_fromArray(
												[
													A2(
													$elm$html$Html$legend,
													_List_Nil,
													_List_fromArray(
														[
															$elm$html$Html$text('Grid lines')
														]))
												]),
												A2(
												part_field,
												{
													help: $elm$core$Maybe$Just('grid lines'),
													id: 'gridlines',
													label: 'Grid lines'
												},
												$author$project$QuestionEditor$select_property(
													_List_fromArray(
														[
															_Utils_Tuple2('none', 'None'),
															_Utils_Tuple2('afterFirstRow', 'After first row'),
															_Utils_Tuple2('beforeLastRow', 'Before last row'),
															_Utils_Tuple2('afterFirstColumn', 'After first column'),
															_Utils_Tuple2('beforeLastColumn', 'Before last column'),
															_Utils_Tuple2('custom', 'Custom expression')
														]))),
												A2(
												$author$project$Ui$visibleIf,
												gridlines === 'custom',
												$elm$core$List$concat(
													_List_fromArray(
														[
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('rows with lines'),
																id: 'gridlinesCustomRows',
																label: 'Rows with lines'
															},
															$author$project$QuestionEditor$code_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('columns with lines'),
																id: 'gridlinesCustomColumns',
																label: 'Columns with lines'
															},
															$author$project$QuestionEditor$code_property)
														])))
											])))
								]);
						default:
							return _List_Nil;
					}
				}()
			}
		};
		var type_tabs = function () {
			var _v5 = part.type_.name;
			switch (_v5) {
				case 'jme':
					var notation = pstring('notation');
					var notation_name = A2(
						$elm$core$Maybe$withDefault,
						notation,
						A2(
							$elm$core$Maybe$map,
							$elm$core$Tuple$second,
							$elm$core$List$head(
								A2(
									$elm$core$List$filter,
									A2(
										$elm$core$Basics$composeR,
										$elm$core$Tuple$first,
										$elm$core$Basics$eq(notation)),
									notation_options))));
					var mustMatchPattern = $author$project$Settings$getters.string(
						A2(
							$author$project$Settings$at,
							_List_fromArray(
								[
									$author$project$Settings$field('mustmatchpattern'),
									$author$project$Settings$field('pattern')
								]),
							part.settings));
					var capturedNames = A3(
						$author$project$Settings$get,
						$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
						_List_Nil,
						cfield('capturedNames'));
					var capturedNameOptions = A2(
						$elm$core$List$cons,
						_Utils_Tuple2('', 'Whole expression'),
						A2(
							$elm$core$List$map,
							function (n) {
								return _Utils_Tuple2(n, n);
							},
							capturedNames));
					return _List_fromArray(
						[
							{
							icon: $elm$core$Maybe$Just('restriction'),
							id: 'restrictions',
							label: $author$project$Tabber$SimpleLabel('Restrictions'),
							view: {
								attributes: _List_Nil,
								contents: _List_fromArray(
									[
										A2(
										$elm$html$Html$fieldset,
										_List_Nil,
										$elm$core$List$concat(
											_List_fromArray(
												[
													_List_fromArray(
													[
														A2(
														$elm$html$Html$legend,
														_List_Nil,
														_List_fromArray(
															[
																$elm$html$Html$text('Pattern restriction')
															]))
													]),
													A3(
													$author$project$QuestionEditor$labelled_field,
													ui,
													{
														help: $elm$core$Maybe$Just('pattern restriction'),
														id: 'mustMatchPattern',
														label: 'Pattern student\u0027s answer must match',
														setter: pset,
														settings: A2(
															$author$project$Settings$at,
															_List_fromArray(
																[
																	$author$project$Settings$field('mustmatchpattern'),
																	$author$project$Settings$field('pattern')
																]),
															part.settings)
													},
													F2(
														function (_v6, o) {
															return $elm$core$List$concat(
																_List_fromArray(
																	[
																		A3(
																		$author$project$QuestionEditor$jme_property,
																		{notation: 'pattern_matching'},
																		ui,
																		o),
																		A2(
																		$author$project$Ui$visibleIf,
																		notation !== 'standard',
																		_List_fromArray(
																			[
																				A2(
																				ui.alert,
																				'warning',
																				_List_fromArray(
																					[
																						$elm$html$Html$text('Write this pattern in the standard notation, not '),
																						A2(
																						$elm$html$Html$em,
																						_List_Nil,
																						_List_fromArray(
																							[
																								$elm$html$Html$text(notation_name)
																							])),
																						$elm$html$Html$text('.')
																					]))
																			]))
																	]));
														})),
													(mustMatchPattern === '') ? _List_Nil : $elm$core$List$concat(
													_List_fromArray(
														[
															A3(
															$author$project$QuestionEditor$labelled_field,
															ui,
															{
																help: $elm$core$Maybe$Just('part of expression to mark'),
																id: 'mustmatchpattern-nameToCompare',
																label: 'Part of expression to mark',
																setter: pset,
																settings: A2(
																	$author$project$Settings$at,
																	_List_fromArray(
																		[
																			$author$project$Settings$field('mustmatchpattern'),
																			$author$project$Settings$field('nameToCompare')
																		]),
																	part.settings)
															},
															$author$project$QuestionEditor$select_property(capturedNameOptions)),
															A3(
															$author$project$QuestionEditor$labelled_field,
															ui,
															{
																help: $elm$core$Maybe$Just('partial credit for not matching pattern'),
																id: 'mustmatchpattern-partialCredit',
																label: 'Partial credit for not matching pattern',
																setter: pset,
																settings: A2(
																	$author$project$Settings$at,
																	_List_fromArray(
																		[
																			$author$project$Settings$field('mustmatchpattern'),
																			$author$project$Settings$field('partialCredit')
																		]),
																	part.settings)
															},
															$author$project$QuestionEditor$percent_property),
															A3(
															$author$project$QuestionEditor$labelled_field,
															ui,
															{
																help: $elm$core$Maybe$Just('pattern warning time'),
																id: 'mustmatchpattern-warningTime',
																label: 'When to warn the student if their answer does not match the pattern',
																setter: pset,
																settings: A2(
																	$author$project$Settings$at,
																	_List_fromArray(
																		[
																			$author$project$Settings$field('mustmatchpattern'),
																			$author$project$Settings$field('warningTime')
																		]),
																	part.settings)
															},
															$author$project$QuestionEditor$select_property(
																_List_fromArray(
																	[
																		_Utils_Tuple2('submission', 'After submitting'),
																		_Utils_Tuple2('input', 'While entering their answer'),
																		_Utils_Tuple2('prevent', 'Prevent submission')
																	]))),
															A3(
															$author$project$QuestionEditor$labelled_field,
															ui,
															{
																help: $elm$core$Maybe$Nothing,
																id: 'mustmatchpattern-message',
																label: 'Warning message',
																setter: pset,
																settings: A2(
																	$author$project$Settings$at,
																	_List_fromArray(
																		[
																			$author$project$Settings$field('mustmatchpattern'),
																			$author$project$Settings$field('message')
																		]),
																	part.settings)
															},
															$author$project$QuestionEditor$content_property)
														]))
												]))),
										A2(
										$elm$html$Html$fieldset,
										_List_Nil,
										$elm$core$List$concat(
											_List_fromArray(
												[
													_List_fromArray(
													[
														A2(
														$elm$html$Html$legend,
														_List_Nil,
														_List_fromArray(
															[
																$elm$html$Html$text('Variables')
															]))
													]),
													A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('unexpected variable names'),
														id: 'checkVariableNames',
														label: 'Warn if student uses an unexpected variable name?'
													},
													$author$project$QuestionEditor$boolean_property),
													A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('single letter variable names'),
														id: 'singleLetterVariables',
														label: 'Force single letter variable names?'
													},
													$author$project$QuestionEditor$boolean_property),
													A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('unknown function names'),
														id: 'allowUnknownFunctions',
														label: 'Allow unknown function names?'
													},
													$author$project$QuestionEditor$boolean_property),
													A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('implicit function composition'),
														id: 'implicitFunctionComposition',
														label: 'Use implicit function composition?'
													},
													$author$project$QuestionEditor$boolean_property)
												])))
									])
							}
						},
							{
							icon: $elm$core$Maybe$Just('scale'),
							id: 'checking-accuracy',
							label: $author$project$Tabber$SimpleLabel('Checking accuracy'),
							view: {
								attributes: _List_Nil,
								contents: _List_fromArray(
									[
										A2(
										$elm$html$Html$fieldset,
										_List_Nil,
										$elm$core$List$concat(
											_List_fromArray(
												[
													_List_fromArray(
													[
														A2(
														$elm$html$Html$legend,
														_List_Nil,
														_List_fromArray(
															[
																$elm$html$Html$text('Checking accuracy')
															])),
														ui.help_block(
														_List_fromArray(
															[
																A2(ui.helplink, 'Checking accuracy', 'checking accuracy'),
																$elm$html$Html$text('Define the range of points over which the student\u0027s answer will be compared with the correct answer, and the method used to compare them.')
															]))
													]),
													A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('checking type'),
														id: 'checkingType',
														label: 'Checking type'
													},
													$author$project$QuestionEditor$select_property(
														_List_fromArray(
															[
																_Utils_Tuple2('absdiff', 'Absolute difference'),
																_Utils_Tuple2('reldiff', 'Relative difference'),
																_Utils_Tuple2('dp', 'Decimal points'),
																_Utils_Tuple2('sigfig', 'Significant figures')
															]))),
													A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('checking accuracy'),
														id: 'checkingAccuracy',
														label: 'Checking accuracy'
													},
													$author$project$QuestionEditor$text_property),
													A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('checked points'),
														id: 'vsetRangePoints',
														label: 'Points to check'
													},
													$author$project$QuestionEditor$text_property),
													A2(
													part_field,
													{
														help: $elm$core$Maybe$Just('maximum number of failures'),
														id: 'failureRate',
														label: 'Maximum no. of failures'
													},
													$author$project$QuestionEditor$text_property),
													A3(
													$author$project$QuestionEditor$labelled_field,
													ui,
													{
														help: $elm$core$Maybe$Just('checking range start'),
														id: 'vsetRangeStart',
														label: 'Checking range start',
														setter: pset,
														settings: A2(
															$author$project$Settings$at,
															_List_fromArray(
																[
																	$author$project$Settings$field('vsetRange'),
																	$author$project$Settings$index(0)
																]),
															part.settings)
													},
													$author$project$QuestionEditor$text_property),
													A3(
													$author$project$QuestionEditor$labelled_field,
													ui,
													{
														help: $elm$core$Maybe$Just('checking range end'),
														id: 'vsetRangeEnd',
														label: 'Checking range end',
														setter: pset,
														settings: A2(
															$author$project$Settings$at,
															_List_fromArray(
																[
																	$author$project$Settings$field('vsetRange'),
																	$author$project$Settings$index(1)
																]),
															part.settings)
													},
													$author$project$QuestionEditor$text_property)
												]))),
										A2(
										$elm$html$Html$fieldset,
										_List_Nil,
										$elm$core$List$concat(
											_List_fromArray(
												[
													_List_fromArray(
													[
														A2(
														$elm$html$Html$legend,
														_List_Nil,
														_List_fromArray(
															[
																$elm$html$Html$text('Variable value generators')
															])),
														ui.help_block(
														_List_fromArray(
															[
																A2(ui.helplink, 'variable-value-generators', 'variable value generators'),
																$elm$html$Html$text('Give expressions which produce values for each of the variables in the expected answer. Leave blank to pick a random value from the range defined above, following the inferred type of the variable.')
															]))
													]),
													function () {
													var names = A3(
														$author$project$Settings$get,
														$elm$json$Json$Decode$list(
															A3(
																$elm$json$Json$Decode$map2,
																$elm$core$Tuple$pair,
																A2($elm$json$Json$Decode$field, 'name', $elm$json$Json$Decode$string),
																$elm$json$Json$Decode$maybe(
																	A2($elm$json$Json$Decode$field, 'inferredType', $elm$json$Json$Decode$string)))),
														_List_Nil,
														cfield('findvars'));
													return A2(
														$elm$core$List$concatMap,
														function (_v7) {
															var name = _v7.a;
															var minferredType = _v7.b;
															return $elm$core$List$concat(
																_List_fromArray(
																	[
																		A3(
																		$author$project$QuestionEditor$labelled_field,
																		ui,
																		{
																			help: $elm$core$Maybe$Nothing,
																			id: 'value-generator-' + name,
																			label: name,
																			setter: pset,
																			settings: A2(
																				$author$project$Settings$at,
																				_List_fromArray(
																					[
																						$author$project$Settings$field('valuegenerators'),
																						$author$project$Settings$indexWhereName(name),
																						$author$project$Settings$field('value')
																					]),
																				part.settings)
																		},
																		F2(
																			function (_v8, o) {
																				return _Utils_ap(
																					A2($author$project$QuestionEditor$text_property, ui, o),
																					function () {
																						if (minferredType.$ === 'Nothing') {
																							return _List_Nil;
																						} else {
																							var inferredType = minferredType.a;
																							return _List_fromArray(
																								[
																									ui.help_block(
																									_List_fromArray(
																										[
																											$elm$html$Html$text('(this might be a ' + (inferredType + ')'))
																										]))
																								]);
																						}
																					}());
																			}))
																	]));
														},
														names);
												}()
												])))
									])
							}
						}
						]);
				case '1_n_2':
					return _List_fromArray(
						[choices_tab]);
				case 'm_n_2':
					return _List_fromArray(
						[choices_tab]);
				case 'm_n_x':
					var settings_value = $author$project$Settings$getters.value(part.settings);
					var set_choices = function (c) {
						return pset(
							_Utils_Tuple2(
								A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, c),
								_List_fromArray(
									[
										$author$project$Settings$field('choices')
									])));
					};
					var set_answers = function (c) {
						return pset(
							_Utils_Tuple2(
								A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, c),
								_List_fromArray(
									[
										$author$project$Settings$field('answers')
									])));
					};
					var matrix = A3(
						$author$project$Settings$get,
						$elm$json$Json$Decode$list(
							$elm$json$Json$Decode$list($elm$json$Json$Decode$string)),
						_List_Nil,
						pfield('matrix'));
					var markingMethod = pstring('markingMethod');
					var needsMaxMarks = (markingMethod === 'score per matched cell') || (markingMethod === 'all-or-nothing');
					var displayType = pstring('displayType');
					var customChoices = fieldIsString('choices');
					var customAnswers = fieldIsString('answers');
					var choices = A3(
						$author$project$Settings$get,
						$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
						_List_Nil,
						pfield('choices'));
					var hasChoices = !_Utils_eq(choices, _List_Nil);
					var remove_answer = function (i) {
						return function (s) {
							return pset(
								_Utils_Tuple2(s, _List_Nil));
						}(
							A2(
								$elm$core$Result$withDefault,
								settings_value,
								A2(
									$elm$core$Result$map,
									A2(
										$elm$core$Basics$composeR,
										A2(
											$elm$core$Dict$insert,
											'choices',
											A2(
												$elm$json$Json$Encode$list,
												$elm$json$Json$Encode$string,
												A2($elm_community$list_extra$List$Extra$removeAt, i, choices))),
										A2(
											$elm$core$Basics$composeR,
											A2(
												$elm$core$Dict$insert,
												'matrix',
												A2(
													$elm$json$Json$Encode$list,
													$elm$json$Json$Encode$list($elm$json$Json$Encode$string),
													A2(
														$elm$core$List$map,
														$elm_community$list_extra$List$Extra$removeAt(i),
														matrix))),
											A2($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$core$Basics$identity))),
									A2(
										$elm$json$Json$Decode$decodeValue,
										$elm$json$Json$Decode$dict($elm$json$Json$Decode$value),
										settings_value))));
					};
					var remove_choice = function (i) {
						return function (s) {
							return pset(
								_Utils_Tuple2(s, _List_Nil));
						}(
							A2(
								$elm$core$Result$withDefault,
								settings_value,
								A2(
									$elm$core$Result$map,
									A2(
										$elm$core$Basics$composeR,
										A2(
											$elm$core$Dict$insert,
											'choices',
											A2(
												$elm$json$Json$Encode$list,
												$elm$json$Json$Encode$string,
												A2($elm_community$list_extra$List$Extra$removeAt, i, choices))),
										A2(
											$elm$core$Basics$composeR,
											A2(
												$elm$core$Dict$insert,
												'matrix',
												A2(
													$elm$json$Json$Encode$list,
													$elm$json$Json$Encode$list($elm$json$Json$Encode$string),
													A2($elm_community$list_extra$List$Extra$removeAt, i, matrix))),
											A2($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$core$Basics$identity))),
									A2(
										$elm$json$Json$Decode$decodeValue,
										$elm$json$Json$Decode$dict($elm$json$Json$Decode$value),
										settings_value))));
					};
					var answers = A3(
						$author$project$Settings$get,
						$elm$json$Json$Decode$list($elm$json$Json$Decode$string),
						_List_Nil,
						pfield('answers'));
					var hasAnswers = !_Utils_eq(answers, _List_Nil);
					var showMarkingMatrix = hasChoices && (hasAnswers && (!customMCQMarking));
					return _List_fromArray(
						[
							{
							icon: $elm$core$Maybe$Just('list'),
							id: 'choices',
							label: $author$project$Tabber$SimpleLabel('Choices'),
							view: {
								attributes: _List_Nil,
								contents: $elm$core$List$concat(
									_List_fromArray(
										[
											_List_fromArray(
											[
												A2(
												$elm$html$Html$fieldset,
												_List_Nil,
												$elm$core$List$concat(
													_List_fromArray(
														[
															toggleExpressionField(
															{
																_default: A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil),
																field: 'choices',
																help: $elm$core$Maybe$Just('variable list of choices'),
																id: 'customChoices',
																label: 'Variable list of choices?'
															}),
															A2(
															$author$project$Ui$visibleIf,
															customChoices,
															A2(
																part_field,
																{
																	help: $elm$core$Maybe$Just('list of choices'),
																	id: 'choices',
																	label: 'List of choices'
																},
																$author$project$QuestionEditor$text_property)),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('shuffling choices'),
																id: 'shuffleChoices',
																label: 'Shuffle order of choices?'
															},
															$author$project$QuestionEditor$boolean_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('text before choices'),
																id: 'choicesHeader',
																label: 'Text before choices'
															},
															$author$project$QuestionEditor$text_property)
														])))
											]),
											A2(
											$author$project$Ui$visibleIf,
											!customChoices,
											_Utils_ap(
												$elm$core$List$concat(
													_List_fromArray(
														[
															_List_fromArray(
															[
																A2(
																$elm$html$Html$h4,
																_List_Nil,
																_List_fromArray(
																	[
																		$elm$html$Html$text('Choices')
																	]))
															]),
															A2(
															$elm$core$List$indexedMap,
															F2(
																function (i, choice) {
																	return A2(
																		$elm$html$Html$fieldset,
																		_List_fromArray(
																			[
																				$elm$html$Html$Attributes$class('choice')
																			]),
																		$elm$core$List$concat(
																			_List_fromArray(
																				[
																					_List_fromArray(
																					[
																						A2(
																						$elm$html$Html$legend,
																						_List_Nil,
																						_List_fromArray(
																							[
																								$elm$html$Html$text(
																								'Choice ' + $author$project$Util$fi(i))
																							]))
																					]),
																					A3(
																					$author$project$QuestionEditor$labelled_field,
																					ui,
																					{
																						help: $elm$core$Maybe$Nothing,
																						id: 'choice-' + $author$project$Util$fi(i),
																						label: 'Content',
																						setter: pset,
																						settings: A2(
																							$author$project$Settings$at,
																							_List_fromArray(
																								[
																									$author$project$Settings$field('choices'),
																									$author$project$Settings$index(i)
																								]),
																							part.settings)
																					},
																					$author$project$QuestionEditor$content_property),
																					_List_fromArray(
																					[
																						A2(
																						$elm$html$Html$button,
																						_List_fromArray(
																							[
																								$elm$html$Html$Attributes$type_('button'),
																								$elm$html$Html$Events$onClick(
																								remove_choice(i))
																							]),
																						_List_fromArray(
																							[
																								ui.icon('remove'),
																								$elm$html$Html$text('Delete this choice')
																							]))
																					])
																				])));
																}),
															choices)
														])),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$button,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$type_('button'),
																$elm$html$Html$Events$onClick(
																set_choices(
																	_Utils_ap(
																		choices,
																		_List_fromArray(
																			['']))))
															]),
														_List_fromArray(
															[
																ui.icon('add'),
																$elm$html$Html$text('Add a choice')
															]))
													])))
										]))
							}
						},
							{
							icon: $elm$core$Maybe$Just('list'),
							id: 'answers',
							label: $author$project$Tabber$SimpleLabel('Answers'),
							view: {
								attributes: _List_Nil,
								contents: $elm$core$List$concat(
									_List_fromArray(
										[
											_List_fromArray(
											[
												A2(
												$elm$html$Html$fieldset,
												_List_Nil,
												$elm$core$List$concat(
													_List_fromArray(
														[
															toggleExpressionField(
															{
																_default: A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, _List_Nil),
																field: 'answers',
																help: $elm$core$Maybe$Just('variable list of answers'),
																id: 'customAnswers',
																label: 'Variable list of answers?'
															}),
															A2(
															$author$project$Ui$visibleIf,
															customAnswers,
															A2(
																part_field,
																{
																	help: $elm$core$Maybe$Just('list of answers'),
																	id: 'answers',
																	label: 'List of answers'
																},
																$author$project$QuestionEditor$text_property)),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('shuffling answers'),
																id: 'shuffleAnswers',
																label: 'Shuffle order of answers?'
															},
															$author$project$QuestionEditor$boolean_property),
															A2(
															part_field,
															{
																help: $elm$core$Maybe$Just('text above answers'),
																id: 'answersHeader',
																label: 'Text above answers'
															},
															$author$project$QuestionEditor$text_property)
														])))
											]),
											A2(
											$author$project$Ui$visibleIf,
											!customAnswers,
											_Utils_ap(
												$elm$core$List$concat(
													_List_fromArray(
														[
															_List_fromArray(
															[
																A2(
																$elm$html$Html$h4,
																_List_Nil,
																_List_fromArray(
																	[
																		$elm$html$Html$text('Answers')
																	]))
															]),
															A2(
															$elm$core$List$indexedMap,
															F2(
																function (i, _v10) {
																	return A2(
																		$elm$html$Html$fieldset,
																		_List_fromArray(
																			[
																				$elm$html$Html$Attributes$class('answer')
																			]),
																		$elm$core$List$concat(
																			_List_fromArray(
																				[
																					_List_fromArray(
																					[
																						A2(
																						$elm$html$Html$legend,
																						_List_Nil,
																						_List_fromArray(
																							[
																								$elm$html$Html$text(
																								'Answer ' + $author$project$Util$fi(i))
																							]))
																					]),
																					A3(
																					$author$project$QuestionEditor$labelled_field,
																					ui,
																					{
																						help: $elm$core$Maybe$Nothing,
																						id: 'answer-' + $author$project$Util$fi(i),
																						label: 'Content',
																						setter: pset,
																						settings: A2(
																							$author$project$Settings$at,
																							_List_fromArray(
																								[
																									$author$project$Settings$field('answers'),
																									$author$project$Settings$index(i)
																								]),
																							part.settings)
																					},
																					$author$project$QuestionEditor$content_property),
																					_List_fromArray(
																					[
																						A2(
																						$elm$html$Html$button,
																						_List_fromArray(
																							[
																								$elm$html$Html$Attributes$type_('button'),
																								$elm$html$Html$Events$onClick(
																								remove_answer(i))
																							]),
																						_List_fromArray(
																							[
																								ui.icon('remove'),
																								$elm$html$Html$text('Delete this answer')
																							]))
																					])
																				])));
																}),
															answers)
														])),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$button,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$type_('button'),
																$elm$html$Html$Events$onClick(
																set_answers(
																	_Utils_ap(
																		answers,
																		_List_fromArray(
																			['']))))
															]),
														_List_fromArray(
															[
																ui.icon('add'),
																$elm$html$Html$text('Add a answer')
															]))
													])))
										]))
							}
						},
							{
							icon: $elm$core$Maybe$Just('grid'),
							id: 'marking-matrix',
							label: $author$project$Tabber$SimpleLabel('Marking matrix'),
							view: {
								attributes: _List_Nil,
								contents: $elm$core$List$concat(
									_List_fromArray(
										[
											_List_fromArray(
											[
												A2(
												$elm$html$Html$fieldset,
												_List_Nil,
												$elm$core$List$concat(
													_List_fromArray(
														[
															A2(
															$author$project$Ui$visibleIf,
															displayType === 'checkbox',
															A2(
																part_field,
																{
																	help: $elm$core$Maybe$Just('marking method'),
																	id: 'markingMethod',
																	label: 'Marking method'
																},
																$author$project$QuestionEditor$select_property(
																	_List_fromArray(
																		[
																			_Utils_Tuple2('sum ticked cells', 'Sum ticked cells'),
																			_Utils_Tuple2('score per matched cell', 'Score per matched cell'),
																			_Utils_Tuple2('all-or-nothing', 'All-or-nothing')
																		])))),
															A2(
															$author$project$Ui$visibleIf,
															(displayType === 'checkbox') && (needsMaxMarks && (A2(
																$elm$core$Maybe$withDefault,
																0,
																$elm$core$String$toFloat(
																	pstring('maxMarks'))) <= 0)),
															_List_fromArray(
																[
																	A2(
																	ui.alert,
																	'warning',
																	_List_fromArray(
																		[
																			$elm$html$Html$text('You must set a '),
																			A2(
																			$elm$html$Html$map,
																			$author$project$QuestionEditor$UpdateTab,
																			A3($author$project$Tabber$tab_link, part_tabber_name, 'marking-settings', 'maximum number of marks')),
																			$elm$html$Html$text(' in order to use this marking method.')
																		]))
																])),
															A3(
															$author$project$QuestionEditor$labelled_field,
															ui,
															{
																help: $elm$core$Maybe$Just('custom marking matrix'),
																id: 'customMCQMarking',
																label: 'Custom marking matrix?',
																setter: pset,
																settings: part.settings
															},
															F2(
																function (_v11, o) {
																	return _List_fromArray(
																		[
																			A2(
																			$elm$html$Html$input,
																			_List_fromArray(
																				[
																					$elm$html$Html$Attributes$type_('checkbox'),
																					$elm$html$Html$Attributes$checked(customMCQMarking),
																					$elm$html$Html$Events$onCheck(
																					function (b) {
																						return b ? pset(
																							_Utils_Tuple2(
																								$elm$json$Json$Encode$string(''),
																								_List_fromArray(
																									[
																										$author$project$Settings$field('matrix')
																									]))) : pset(
																							_Utils_Tuple2(
																								A2($elm$json$Json$Encode$list, $elm$core$Basics$identity, _List_Nil),
																								_List_fromArray(
																									[
																										$author$project$Settings$field('matrix')
																									])));
																					}),
																					$elm$html$Html$Attributes$id(o.id)
																				]),
																			_List_Nil)
																		]);
																})),
															A2(
															$author$project$Ui$visibleIf,
															customMCQMarking,
															A2(
																part_field,
																{
																	help: $elm$core$Maybe$Just('custom matrix expression'),
																	id: 'matrix',
																	label: 'Custom matrix expression'
																},
																$author$project$QuestionEditor$text_property))
														])))
											]),
											A2(
											$author$project$Ui$visibleIf,
											showMarkingMatrix,
											_List_fromArray(
												[
													A2(
													$elm$html$Html$fieldset,
													_List_Nil,
													_List_fromArray(
														[
															A2(
															$elm$html$Html$legend,
															_List_Nil,
															_List_fromArray(
																[
																	$elm$html$Html$text('Marking matrix')
																])),
															((displayType === 'radiogroup') || (markingMethod === 'sum ticked cells')) ? ui.help_block(
															_List_fromArray(
																[
																	$elm$html$Html$text('For each combination of answer and choice, specify the number of marks to add or subtract when the student picks it.')
																])) : ui.help_block(
															_List_fromArray(
																[
																	$elm$html$Html$text('For each combination of answer and choice, write 1 if the student should tick it, or 0 if they should leave it unticked.')
																])),
															A2(
															$elm$html$Html$table,
															_List_Nil,
															$elm$core$List$concat(
																_List_fromArray(
																	[
																		_List_fromArray(
																		[
																			A2(
																			$elm$html$Html$thead,
																			_List_Nil,
																			_List_fromArray(
																				[
																					A2(
																					$elm$html$Html$tr,
																					_List_Nil,
																					A2(
																						$elm$core$List$cons,
																						A2($elm$html$Html$td, _List_Nil, _List_Nil),
																						A2(
																							$elm$core$List$map,
																							function (answer) {
																								return A2(
																									$elm$html$Html$th,
																									_List_Nil,
																									_List_fromArray(
																										[
																											$author$project$QuestionEditor$mathjax_span(answer)
																										]));
																							},
																							answers)))
																				]))
																		]),
																		A2(
																		$elm$core$List$indexedMap,
																		F2(
																			function (i, choice) {
																				return A2(
																					$elm$html$Html$tr,
																					_List_Nil,
																					$elm$core$List$concat(
																						_List_fromArray(
																							[
																								_List_fromArray(
																								[
																									A2(
																									$elm$html$Html$th,
																									_List_Nil,
																									_List_fromArray(
																										[
																											$author$project$QuestionEditor$mathjax_span(choice)
																										]))
																								]),
																								A2(
																								$elm$core$List$indexedMap,
																								F2(
																									function (j, _v12) {
																										return A2(
																											$elm$html$Html$td,
																											_List_Nil,
																											A2(
																												$author$project$QuestionEditor$text_property,
																												ui,
																												{
																													help: $elm$core$Maybe$Nothing,
																													id: 'matrix-' + ($author$project$Util$fi(i) + ('-' + $author$project$Util$fi(j))),
																													label: 'Choice ' + ($author$project$Util$fi(i) + (', answer ' + $author$project$Util$fi(j))),
																													setter: pset,
																													settings: A2(
																														$author$project$Settings$at,
																														_List_fromArray(
																															[
																																$author$project$Settings$field('matrix'),
																																$author$project$Settings$index(i),
																																$author$project$Settings$index(j)
																															]),
																														part.settings)
																												}));
																									}),
																								answers)
																							])));
																			}),
																		choices)
																	])))
														]))
												]))
										]))
							}
						}
						]);
				default:
					return _List_Nil;
			}
		}();
		var alternative_feedback_tab = {
			icon: $elm$core$Maybe$Just('feedback'),
			id: 'alternative-feedback-message',
			label: $author$project$Tabber$SimpleLabel('Feedback message'),
			view: {attributes: _List_Nil, contents: _List_Nil}
		};
		var adaptive_marking_tab = {
			icon: $elm$core$Maybe$Just('transfer'),
			id: 'adaptive-marking',
			label: $author$project$Tabber$SimpleLabel('Adaptive marking'),
			view: {attributes: _List_Nil, contents: _List_Nil}
		};
		var tabs = A2(
			$elm$core$List$map,
			$elm$core$Tuple$first,
			A2(
				$elm$core$List$filter,
				$elm$core$Tuple$second,
				_Utils_ap(
					_List_fromArray(
						[
							_Utils_Tuple2(prompt_tab, (!is_gap) && (!is_alternative)),
							_Utils_Tuple2(alternative_feedback_tab, is_alternative),
							_Utils_Tuple2(marking_settings_tab, part.type_.has_marking_settings)
						]),
					_Utils_ap(
						A2(
							$elm$core$List$map,
							function (p) {
								return _Utils_Tuple2(p, true);
							},
							type_tabs),
						_List_fromArray(
							[
								_Utils_Tuple2(marking_algorithm_tab, part.type_.has_marks),
								_Utils_Tuple2(testing_tab, part.type_.has_marks),
								_Utils_Tuple2(scripts_tab, true),
								_Utils_Tuple2(
								adaptive_marking_tab,
								(!is_alternative) && _Utils_eq(parts_mode, $author$project$QuestionEditor$AllPartsMode)),
								_Utils_Tuple2(
								next_parts_tab,
								is_top_level && _Utils_eq(parts_mode, $author$project$QuestionEditor$ExploreMode))
							])))));
		var part_tabber = {allow_empty: false, name: part_tabber_name, tabs: tabs};
		var pview = {
			attributes: _List_fromArray(
				[
					$elm$html$Html$Attributes$class('part')
				]),
			contents: _List_fromArray(
				[
					A2(
					$elm$html$Html$header,
					_List_Nil,
					_List_fromArray(
						[
							A2(
							$elm$html$Html$h3,
							_List_Nil,
							_List_fromArray(
								[
									A2(
									$elm$html$Html$input,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$value(
											pstring('customName')),
											$elm$html$Html$Attributes$placeholder(
											A2($author$project$QuestionEditor$part_name, path, part)),
											$elm$html$Html$Events$onInput(
											A2(
												$author$project$Settings$setters,
												pfield('customName'),
												pset).string)
										]),
									_List_Nil)
								])),
							A2(
							$elm$html$Html$small,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('muted')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(part.type_.nice_name)
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('part-controls')
								]),
							control_buttons)
						])),
					A2(view_tablist, part_tabber, _List_Nil),
					view_tabpanel(part_tabber)
				])
		};
		return {
			icon: $elm$core$Maybe$Nothing,
			id: $author$project$QuestionEditor$part_tab_id(path),
			label: $author$project$Tabber$HtmlLabel(
				{
					button_attributes: _List_fromArray(
						[
							$elm$html$Html$Attributes$classList(
							_List_fromArray(
								[
									_Utils_Tuple2('step', is_step),
									_Utils_Tuple2('indented', !is_top_level)
								]))
						]),
					button_contents: _List_fromArray(
						[
							$author$project$QuestionEditor$mathjax_span(
							A2($author$project$QuestionEditor$part_name, path, part)),
							$elm$html$Html$text(' '),
							A2(
							$elm$html$Html$small,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text(part.type_.nice_name)
								]))
						]),
					extra_contents: _List_Nil
				}),
			view: pview
		};
	};
	var icon = ui.icon;
	var all_parts = $author$project$QuestionEditor$unwrap_part_container(question.parts);
	var _v0 = model.adding_part;
	var add_part_path = _v0.a;
	var add_part_kind = _v0.b;
	var add_part_tab = function () {
		var kind_label = $author$project$QuestionEditor$child_part_label(add_part_kind);
		return {
			attributes: _List_Nil,
			contents: _List_fromArray(
				[
					A2(
					$elm$html$Html$h2,
					_List_Nil,
					_List_fromArray(
						[
							icon('add'),
							$elm$html$Html$text(
							function () {
								switch (add_part_kind.$) {
									case 'TopPart':
										return 'Add a part';
									case 'Gap':
										return 'Add a gap';
									case 'Step':
										return 'Add a step';
									default:
										return 'Add an alternative';
								}
							}())
						])),
					ui.help_block(
					_List_fromArray(
						[
							$elm$html$Html$text('Choose a type for this new ' + (kind_label + '.'))
						])),
					A2(
					$elm$html$Html$form,
					_List_Nil,
					_List_fromArray(
						[
							A2(
							$elm$html$Html$ul,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('list-unstyled')
								]),
							A2(
								$elm$core$List$map,
								function (t) {
									return A2(
										$elm$html$Html$li,
										_List_Nil,
										_List_fromArray(
											[
												A2(
												$elm$html$Html$button,
												_List_fromArray(
													[
														$elm$html$Html$Events$onClick(
														$author$project$QuestionEditor$UpdateQuestion(
															A3(
																$author$project$QuestionEditor$AddPart,
																add_part_path,
																add_part_kind,
																A4(
																	$author$project$QuestionEditor$new_part,
																	model.default_settings,
																	t,
																	$elm$json$Json$Encode$object(_List_Nil),
																	$author$project$QuestionEditor$empty_part_container)))),
														$elm$html$Html$Attributes$class('btn primary'),
														$elm$html$Html$Attributes$type_('button')
													]),
												_List_fromArray(
													[
														icon('add'),
														$elm$html$Html$text(t.nice_name)
													])),
												A2(
												$elm$html$Html$map,
												function (_v4) {
													return $author$project$QuestionEditor$NoOp;
												},
												ui.help_block(
													_List_fromArray(
														[
															A2(ui.helplink, t.help_url, t.nice_name),
															$elm$html$Html$text(t.description)
														])))
											]));
								},
								$author$project$QuestionEditor$part_types))
						]))
				])
		};
	}();
	var parts_tabber = {
		allow_empty: true,
		name: 'parts',
		tabs: _Utils_ap(
			A2($elm$core$List$map, part_tab, all_parts),
			_List_fromArray(
				[
					{
					icon: $elm$core$Maybe$Just('add'),
					id: 'add-part',
					label: $author$project$Tabber$SimpleLabel(
						_Utils_eq(all_parts, _List_Nil) ? 'Add a part' : 'Add another part'),
					view: add_part_tab
				}
				]))
	};
	var parts_tab = {
		attributes: _List_fromArray(
			[
				$elm$html$Html$Attributes$class('tabbed-sidebar')
			]),
		contents: _List_fromArray(
			[
				A2(
				$elm$html$Html$nav,
				_List_Nil,
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h2,
						_List_Nil,
						_List_fromArray(
							[
								$elm$html$Html$text('Parts')
							])),
						A2(
						view_tablist,
						parts_tabber,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('vertical')
							]))
					])),
				view_tabpanel(parts_tabber)
			])
	};
	var main_tabber = {
		allow_empty: false,
		name: 'main',
		tabs: _List_fromArray(
			[
				{
				icon: $elm$core$Maybe$Just('text'),
				id: 'statement',
				label: $author$project$Tabber$SimpleLabel('Statement'),
				view: statement_tab
			},
				{
				icon: $elm$core$Maybe$Just('correct'),
				id: 'parts',
				label: $author$project$Tabber$SimpleLabel('Parts'),
				view: parts_tab
			},
				{
				icon: $elm$core$Maybe$Just('settings'),
				id: 'settings',
				label: $author$project$Tabber$SimpleLabel('Settings'),
				view: settings_tab
			}
			])
	};
	return A2(
		$elm$html$Html$main_,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$id('loaded-content')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$header,
				_List_Nil,
				_List_fromArray(
					[
						A2(
						$elm$html$Html$ol,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$id('location'),
								$elm$html$Html$Attributes$class('list-inline')
							]),
						A2(
							$elm$core$List$cons,
							A2(
								$elm$html$Html$li,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('project')
									]),
								_List_fromArray(
									[
										icon('project'),
										A2(
										$elm$html$Html$a,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$href(model.project.url)
											]),
										_List_fromArray(
											[
												$elm$html$Html$text(model.project.name)
											]))
									])),
							A2(
								$elm$core$List$map,
								function (folder) {
									return A2(
										$elm$html$Html$li,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('folder')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$a,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$href(folder.url)
													]),
												_List_fromArray(
													[
														$elm$html$Html$text(folder.name)
													]))
											]));
								},
								model.project.breadcrumbs))),
						A2(
						$elm$html$Html$h1,
						_List_Nil,
						_List_fromArray(
							[
								icon('question'),
								$author$project$QuestionEditor$mathjax_span(
								$author$project$Settings$getters.string(
									qfield('name')))
							])),
						A2($elm$html$Html$hr, _List_Nil, _List_Nil),
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class(saving_class),
								$elm$html$Html$Attributes$id('saving')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text(
								function () {
									var _v1 = model.saving;
									switch (_v1.$) {
										case 'Saved':
											return 'Saved';
										case 'Changed':
											return 'Unsaved changes';
										default:
											return 'Saving...';
									}
								}())
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$disabled(
								!$author$project$History$can_undo(model.history)),
								$elm$html$Html$Attributes$type_('button'),
								$elm$html$Html$Events$onClick($author$project$QuestionEditor$Undo)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Undo')
							])),
						A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$disabled(
								!$author$project$History$can_redo(model.history)),
								$elm$html$Html$Attributes$type_('button'),
								$elm$html$Html$Events$onClick($author$project$QuestionEditor$Redo)
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Redo')
							]))
					])),
				A2(
				$elm$html$Html$nav,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$id('tabs')
					]),
				A2(
					$elm$core$List$cons,
					A2(
						$elm$html$Html$a,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('btn success'),
								$elm$html$Html$Attributes$href(model.preview.url),
								$elm$html$Html$Attributes$target(model.preview.target),
								$elm$html$Html$Attributes$title('Run this question in a new window')
							]),
						_List_fromArray(
							[
								icon('play'),
								$elm$html$Html$text(' Run')
							])),
					_Utils_ap(
						A3(
							ui.dropdown,
							'organisation',
							_List_fromArray(
								[
									$elm$html$Html$text('Organisation')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$li,
									_List_Nil,
									_List_fromArray(
										[
											A2(
											$elm$html$Html$a,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('warning'),
													$elm$html$Html$Attributes$href(model.urls.copy),
													$elm$html$Html$Attributes$target('_blank')
												]),
											_List_fromArray(
												[
													icon('copy'),
													$elm$html$Html$text('Make a copy')
												]))
										])),
									A2(
									$elm$html$Html$li,
									_List_Nil,
									_List_fromArray(
										[
											A2(
											$elm$html$Html$a,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('danger'),
													$elm$html$Html$Attributes$href(model.urls._delete)
												]),
											_List_fromArray(
												[
													icon('remove'),
													$elm$html$Html$text('Delete')
												]))
										])),
									A2($elm$html$Html$hr, _List_Nil, _List_Nil),
									A2(
									$elm$html$Html$li,
									_List_Nil,
									_List_fromArray(
										[
											A2(
											$elm$html$Html$a,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('add-to-queue'),
													$elm$html$Html$Attributes$href('#'),
													A2(
													$elm$html$Html$Attributes$attribute,
													'data-question-id',
													$author$project$Util$fi(model.pk))
												]),
											_List_fromArray(
												[
													icon('list'),
													$elm$html$Html$text('Add to a queue')
												]))
										])),
									A2(
									$elm$html$Html$li,
									_List_Nil,
									_List_fromArray(
										[
											A2(
											$elm$html$Html$a,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('add-to-queue'),
													$elm$html$Html$Attributes$href('#'),
													A2(
													$elm$html$Html$Attributes$attribute,
													'data-question-id',
													$author$project$Util$fi(model.pk))
												]),
											_List_fromArray(
												[
													icon('basket'),
													$elm$html$Html$text('Add to your basket')
												]))
										]))
								])),
						_Utils_ap(
							A3(
								ui.dropdown,
								'download',
								_List_fromArray(
									[
										icon('download'),
										$elm$html$Html$text('Download')
									]),
								_List_fromArray(
									[
										function () {
										if (ready_to_download.$ === 'Ok') {
											return A2(
												$elm$html$Html$li,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('alert success')
													]),
												_List_fromArray(
													[
														icon('ok'),
														$elm$html$Html$text('This question is ready to download.')
													]));
										} else {
											var err = ready_to_download.a;
											return A2(
												$elm$html$Html$li,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('alert danger')
													]),
												_List_fromArray(
													[
														icon('danger'),
														$elm$html$Html$text('This question might need some attention: '),
														err
													]));
										}
									}(),
										A2(
										$elm$html$Html$li,
										_List_Nil,
										_List_fromArray(
											[
												A2(
												$elm$html$Html$a,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$href(model.urls.download + ('?scorm=true&token=' + model.share.view))
													]),
												_List_fromArray(
													[
														icon('package'),
														$elm$html$Html$text('SCORM package')
													]))
											])),
										A2(
										$elm$html$Html$li,
										_List_Nil,
										_List_fromArray(
											[
												A2(
												$elm$html$Html$a,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$href(model.urls.download + ('?token=' + model.share.view))
													]),
												_List_fromArray(
													[
														icon('package'),
														$elm$html$Html$text('standalone .zip (no SCORM)')
													]))
											])),
										A2(
										$elm$html$Html$li,
										_List_Nil,
										_List_fromArray(
											[
												A2(
												$elm$html$Html$a,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$href(model.urls.source + ('?token=' + model.share.view))
													]),
												_List_fromArray(
													[
														icon('file'),
														$elm$html$Html$text('source')
													]))
											]))
									])),
							_List_fromArray(
								[
									A2(view_tablist, main_tabber, _List_Nil)
								]))))),
				view_tabpanel(main_tabber)
			]));
};
var $author$project$QuestionEditor$view_error = function (error) {
	return A2(
		$elm$html$Html$main_,
		_List_Nil,
		_List_fromArray(
			[
				$elm$html$Html$text(
				$elm$json$Json$Decode$errorToString(error))
			]));
};
var $author$project$QuestionEditor$view = function (model) {
	if (model.$ === 'ActiveModel') {
		var active = model.a;
		return $author$project$QuestionEditor$view_active(active);
	} else {
		var error = model.a;
		return $author$project$QuestionEditor$view_error(error);
	}
};
var $author$project$QuestionEditor$main = $elm$browser$Browser$element(
	{init: $author$project$QuestionEditor$init, subscriptions: $author$project$QuestionEditor$subscriptions, update: $author$project$QuestionEditor$update, view: $author$project$QuestionEditor$view});
_Platform_export({'QuestionEditor':{'init':$author$project$QuestionEditor$main($elm$json$Json$Decode$value)(0)}});}(this));