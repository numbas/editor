.. role:: no-test

.. _jme:

JME
===

JME expressions are used by students to enter answers to algebraic questions, and by question authors to define variables.
JME syntax is similar to what you'd type on a calculator.

.. _jme-syntax:

Syntax
******

Expressions are strings of text, made of *variable names*, *literal values*, *grouped terms*, *function applications*, *operators*, *collections* and *indices*.

Whitespace (space characters, tabs, newlines, etc.) can be used to separate literal values, for example ``a 2`` is not interpreted the same as ``a2``. 
For all other purposes, whitespace is ignored.

.. _variable-names:

Variable names
--------------

Variable names are case-insensitive, so ``y`` represents the same thing as ``Y``.
The first character of a variable name must be an alphabet letter; after that, any combination of letters, numbers and underscores is allowed, with any number of ``'`` on the end.

**Examples**:
    * ``x``
    * ``x_1``
    * ``time_between_trials``
    * ``var1``
    * ``row1val2``
    * ``y''``

``e``, ``i`` and ``pi`` are reserved names representing mathematical constants.
They are rewritten by the interpreter to their respective numerical values before evaluation.

This screencast describes which variable names are valid, and gives some advice on how you should pick names:

.. raw:: html

    <iframe src="https://player.vimeo.com/video/167085662" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

.. _variable-annotations:

Variable name annotations
^^^^^^^^^^^^^^^^^^^^^^^^^

Names can be given annotations to change how they are displayed.
The following annotations are built-in:

* ``verb`` – does nothing, but names like ``i``, ``pi`` and ``e`` are not interpreted as the famous mathematical constants.
* ``op`` – denote the name as the name of an operator — wraps the name in the LaTeX \operatorname command when displayed
* ``v`` or ``vector`` – denote the name as representing a vector — the name is displayed in boldface
* ``unit`` – denote the name as representing a unit vector — places a hat above the name when displayed
* ``dot`` – places a dot above the name when displayed, for example when representing a derivative
* ``m`` or ``matrix`` – denote the name as representing a matrix — displayed using a non-italic font

Any other annotation is taken to be a LaTeX command.
For example, a name ``vec:x`` is rendered in LaTeX as ``\vec{x}``, which places an arrow above the name.

You can apply multiple annotations to a single variable.
For example, ``v:dot:x`` produces a bold *x* with a dot on top: :math:`\boldsymbol{\dot{x}}`.

Names with different annotations are considered to represent different values, for the purpose of simplification and evaluation.
For example, in the expression ``dot:x + x``, the two terms will not be collected together.

Literal values
--------------

:data:`boolean`, :data:`integer`, :data:`number` and :data:`string` data types can be constructed with literal values.

**Examples**: ``true``, ``1``, ``4.3``, ``"Numbas"``

There are also some built-in constants which are interpreted as number values:

* ``pi`` or ``π`` - the ratio of a circle's circumference to its diameter;
* ``e`` - the base of the natural logarithm;
* ``i`` - the square root of -1;
* ``infinity``, ``infty`` or ``∞`` - infinity;
* ``nan`` - "Not a number", sometimes returned by JavaScript functions.

Grouped terms
-------------

Use parentheses ``( )`` to group terms.
For example::

    (a+2)(a+1)

No other symbols can be used to group terms - square brackets ``[ ]`` and curly braces ``{ }`` have other meanings in Numbas.

Function application
--------------------

A name followed immediately by a bracketed group is interpreted as a function application.
Function names can be :ref:`annotated <variable-annotations>` similarly to variables.

A function takes one or more *arguments*, separated by commas.
Each argument is a JME expression.

**Examples**:
    * ``f(x)``
    * ``g(a,b)``

Operators
---------

There are three kinds of operators:

.. glossary::

    Binary

        A symbol written between two terms, for example ``a + b`` (":math:`a` plus :math:`b`").
        Each binary operator has a *precedence* which determines when it is evaluated in relation to other operators.

    Prefix
    
        A symbol written to the left of a term, for example ``!a`` ("not :math:`a`").

    Postfix

        A symbol written to the right of a term, for example ``a!`` (":math:`a` factorial").

Relations
^^^^^^^^^

Some binary operators are marked as *relations*.
Relations can be chained together, for example ``a<b<c`` is interpreted as ``a<b and b<c``.

The relation operators are ``<``, ``<=``, ``>``, ``>=``, ``=``, ``<>`` and ``in``.

Collections
-----------

There are two kinds of collection: *lists* and *dictionaries*.

Both are written as a series of terms written between square brackets and separated by commas.

For a dictionary, each term is a :data:`keypair`: a variable name or string followed by a colon and an expression.
For example, ``[a: 1, "first name": "Owen"]`` is a dictionary with keys ``"a"`` and ``"first name"``.

A collection made of any other kind of term is interpreted as a :data:`list`.

An empty pair of brackets ``[]`` is interpreted as an empty :data:`list`.
To construct an empty dictionary, use ``dict()``.

**Examples**:
    * ``[1,2,3]``
    * ``[a]``
    * ``[]``

Indices
-------

Many :ref:`JME data types <jme-data-types>` support indexing.

An index is a single term inside square brackets immediately following another term.

The first element in a list has index ``0``.

Negative indices read from the end: the index ``-1`` corresponds to the last item.

**Examples**:
    * ``[1,2,3][0]`` produces the first element in the list, ``1``.
    * ``x[3..7]`` produces the fourth to the eighth elements of the list ``x``.
    * ``id(4)[1]`` produces the second row of a :math:`4 \times 4` identity matrix, ``vector(0,1,0,0)``.
    * ``info["name"]`` returns the value corresponding to the key ``"name"`` in the dictionary ``info``.
    * ``"Numbas"[0]`` produces the first letter of the string ``"Numbas"``, ``"N"``.

Implicit multiplication
-----------------------

JME supports implicit multiplication in some cases, allowing you to omit the multiplication symbol:

* A bracket followed by an :data:integer`, :data:`number` or :data:`name`.
* An :data:`integer`, :data:`number` or :data:`name` followed by a :data:`name`.

**Examples**:
    * ``(a+1)2 = (a+1)*2``
    * ``(x+y)z = (x+y)*z``
    * ``2x = 2*x``
    * ``x y = x*y``

.. warning::
    Note that a name followed by a bracket is not always interpreted as implicit multiplication.
    Instead, it's interpreted as a function application.

    To interpret such expressions as products, in a mathematical expression part turn off the :term:`Allow unknown function names?` option, and when dealing with :data:`expression` values, use :jme:func:`expand_juxtapositions`.



.. _jme-data-types:

Data types
**********

JME expressions are composed of the following data types.
Some extensions add new data types.

.. data:: number

    A real or complex floating-point number.

    ``i``, ``e``, ``infinity`` and ``pi`` are reserved keywords for the imaginary unit, the base of the natural logarithm, ∞ and π, respectively.

    **Examples**: ``0.0``, ``-1.0``, ``0.234``, ``i``, ``e``, ``pi``

    Numbers of this type are represented using JavaScript's built-in ``Number`` object, which is a 64-bit IEEE 754 floating-point number.
    This representation offers a very good compromise between precision and the range of values that can be stored, but can behave in unexpected ways.
    Accuracy is easily lost when dealing with very big or very small numbers, and on division.

    See functions related to :ref:`jme-fns-arithmetic`, :ref:`jme-fns-number-operations`, :ref:`jme-fns-trigonometry` and :ref:`jme-fns-number-theory`.

    **Automatically converts to:**
        * :data:`decimal`

.. data:: integer

    An element of the set of integers, :math:`\mathbb{Z}`.

    **Examples**: ``0``, ``1``, ``-2``, `431``.

    **Automatically converts to:**
        * :data:`number`
        * :data:`rational`
        * :data:`decimal`

.. data:: rational

    A fraction; an element of the set of rationals, :math:`\mathbb{Q}`.
    The numerator and denominator are integers.

    Instances of this data type may be top-heavy, with numerator bigger than the denominator, and are not required to be reduced.

    **Examples**: ``1/1``, ``-34/2``, `3/4``.

    **Automatically converts to:**
        * :data:`number`
        * :data:`decimal`

.. data:: decimal

    A number with a guaranteed level of precision, and arbitrary order of magnitude.

    Numbers of this type are represented using the `Decimal.js <https://github.com/MikeMcl/decimal.js/>`_ library.
    They're guaranteed to be accurate to 40 significant figures.
    The order of magnitude is stored separately from the significant digits, so there's no less of precision for very big or very small numbers.

    **Examples**: ``dec(0)``, ``dec("1.23e-5")``, ``6.0221409*10^23``

    **Automatically converts to:**
        * :data:`number`

.. data:: boolean

    Booleans represent either truth or falsity.
    The logical operations and, or and xor operate on and return booleans.

    **Examples**: ``true``, ``false``

    See functions related to :ref:`jme-fns-logic` and :ref:`jme-fns-control-flow`.

.. data:: string

    Use strings to create non-mathematical text.
    Either ``'`` or ``"`` can be used to delimit strings.

    You can escape a character by placing a single backslash character before it.
    The following escape codes have special behaviour:

    ====== =========
    ``\n`` New-line
    ``\{`` ``\{``
    ``\}`` ``\}``
    ====== =========

    If you want to write a string which contains a mixture of single and double quotes, you can delimit it with triple-double-quotes or triple-single-quotes, to save escaping too many characters.

    **Examples**: ``"hello there"``, ``'hello there'``, ``""" I said, "I'm Mike's friend" """``

    See functions related to :ref:`jme-fns-strings`.

.. data:: list

    An ordered list of elements of any data type.

    **Examples**: ``[0,1,2,3]``, ``[a,b,c]``, ``[true,false,true]``

    See functions related to :ref:`jme-fns-lists`.

.. data:: dict

    A 'dictionary', mapping key strings to values of any data type.

    A dictionary is created by enclosing one or more key-value pairs (a string followed by a colon and any JME expression) in square brackets, or with the ``dict`` function.

    Key strings are case-sensitive.

    **Examples**:

    * ``["a": 1, "b": 2]``
    * ``["name": "Tess Tuser", "age": 106, "hobbies": ["reading","writing","arithmetic"] ]``
    * ``dict("key1": 0.1, "key2": 1..3)``
    * ``dict([["key1",1], ["key2",2]])``

    .. warning::
        Because lists and dicts use similar syntax, ``[]`` produces an empty list, **not** an empty dictionary.
        To create an empty dictionary, use ``dict()``.

    See functions related to :ref:`jme-fns-dictionaries` and :ref:`jme-fns-json`.

.. data:: range

    A range ``a..b#c`` represents (roughly) the set of numbers :math:`\{a+nc \: | \: 0 \leq n \leq \frac{b-a}{c} \}`.
    If the step size is zero, then the range is the continuous interval :math:`[a,b]`.

    **Examples**: ``1..3``, ``1..3#0.1``, ``1..3#0``

    See functions related to :ref:`jme-fns-ranges`.

    **Automatically converts to:**
        * :data:`list` - a list of :data:`number` values corresponding to the numbers included in the range. If the step size is zero, an error is thrown.

.. data:: set

    An unordered set of elements of any data type.
    The elements are pairwise distinct - if you create a set from a list with duplicate elements, the resulting set will not contain the duplicates.

    **Examples**: ``set(a,b,c)``, ``set([1,2,3,4])``, ``set(1..5)``

    See functions related to :ref:`jme-fns-sets`.

    **Automatically converts to:**
        * :data:`list`

.. data:: vector

    The components of a vector must be numbers.

    When combining vectors of different dimensions, the smaller vector is padded with zeros to make up the difference.

    **Examples**: ``vector(1,2)``, ``vector([1,2,3,4])``

    See functions related to :ref:`jme-fns-vector-and-matrix-arithmetic`.

    **Automatically converts to:**
        * :data:`list` - a list of :data:`number` values corresponding to the components of the vector.

.. data:: matrix

    Matrices are constructed from lists of numbers, representing the rows.

    When combining matrices of different dimensions, the smaller matrix is padded with zeros to make up the difference.

    **Examples**: ``matrix([1,2,3],[4,5,6])``, ``matrix(row1,row2,row3)``

    See functions related to :ref:`jme-fns-vector-and-matrix-arithmetic`.

    **Automatically converts to:**
        * :data:`list` - a list of :data:`vector` values corresponding to the rows of the matrix.

.. data:: name

    A variable name. 
    When an expression is evaluated, all variable names are replaced withe their corresponding value in the current scope.

.. data:: function

    An application of a function.

    **Examples**: ``f(x)``, ``sin(x)``

.. data:: op

    An infix binary operation, or a pre-/post-fix unary operation.

    **Examples**: ``x+y``, ``n!``, ``a and b``

.. data:: html

    An HTML DOM node.

    **Examples**: ``html("<div>things</div>")``

    See functions related to :ref:`jme-fns-html`.

.. data:: expression

    A JME sub-expression.
    Sub-expressions can be simplified, rearranged, pattern-matched, or evaluated using given values for their free variables.

    See functions related to :ref:`jme-fns-subexpressions`.

Automatic data type conversion
------------------------------

Some data types can be automatically converted to others when required.
For example, the number-like types such as :data:`integer` and :data:`decimal` can be automatically converted to :data:`number` values.

The data types of the arguments to a function application determine which version of the function is used.
Ideally, this will do what you expect without you having to think about it.
For reference, the process for deciding on what conversions to perform is as follows:

* If there is a version of the function which takes exactly the given data types, that is used.
* Otherwise, each definition of the function is compared by looking at each of the arguments, working from left to right.
* A definition which does not convert an argument is preferred to one that does.
* If both definitions being compared need to convert an argument, the type that occurs first in the input type's list of automatic conversion methods is used.
  (This follows the order of the types under the "Automatically converts to" headers above)

The following examples illustrate how this works.

.. list-table::
    :widths: 15 15 70

    * - Expression
      - Type of result
      - Explanation
    * - ``1+3.3``
      - :data:`number`
      - The ``1`` is converted to a :data:`number`, and then added to ``3.3``.
    * - ``1+1/2``
      - :data:`rational`
      - :data:`integer` prefers to convert to :data:`rational` over :data:`number`.
    * - ``1.23+dec("1.2")``
      - :data:`decimal`
      - :data:`decimal` values are preferred to :data:`number` because they're more precise.
    * - ``1/2+0.5``
      - :data:`number`
      - :data:`rational` can convert to :data:`number`, but not the other way round, so :data:`number` addition is used.
    * - ``set(1,2,3,4) except [2]``
      - :data:`list`
      - :func:`except` is only defined on :data:`list` values, so the :data:`set` is converted to a :data:`list` automatically.

.. _jme-functions:

Function reference
******************

.. contents::
    :local:
 

.. _jme-fns-arithmetic:

Arithmetic
----------

.. jme:function:: x+y

    Addition.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`list`, :data:`list` → :data:`list` - concatenate two lists
        * :data:`list`, anything → :data:`list` - add an item to the end of a list
        * :data:`dict`, :data:`dict` → :data:`dict` - merge two dictionaries, with values from the right-hand side taking precedence when the same key is present in both dictionaries.
        * :data:`string`, anything → :data:`string` - convert the right-hand argument to a string, and concatenate
        * anything, :data:`string` → :data:`string` - convert the left-hand argument to a string, and concatenate
        * :data:`vector`, :data:`vector` → :data:`vector`
        * :data:`matrix`, :data:`matrix` → :data:`matrix`
        * :data:`integer`, :data:`integer` → :data:`integer`
        * :data:`rational`, :data:`rational` → :data:`rational`
        * :data:`decimal`, :data:`decimal` → :data:`decimal`
        * :data:`number`, :data:`decimal` → :data:`decimal`

    **Examples**:
        * ``1+2`` → ``3``
        * ``vector(1,2)+vector(3,4)`` → ``vector(4,6)``
        * ``matrix([1,2],[3,4])+matrix([5,6],[7,8])`` → ``matrix([6,8],[10,12])``
        * ``[1,2,3]+4`` → ``[1,2,3,4]``
        * ``[1,2,3]+[4,5,6]`` → ``[1,2,3,4,5,6]``
        * ``"hi "+"there"`` → ``"hi there"``

.. jme:function:: x-y

    Subtraction.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`vector`, :data:`vector` → :data:`vector`
        * :data:`matrix`, :data:`matrix` → :data:`matrix`
        * :data:`integer`, :data:`integer` → :data:`integer`
        * :data:`rational`, :data:`rational` → :data:`rational`
        * :data:`decimal`, :data:`decimal` → :data:`decimal`
        * :data:`number`, :data:`decimal` → :data:`decimal`
        * :data:`set`, :data:`set` → :data:`set`

    **Examples**:
        * ``1-2`` → ``-1``
        * ``vector(3,2)-vector(1,4)`` → ``vector(2,-2)``
        * ``matrix([5,6],[3,4])-matrix([1,2],[7,8])`` → ``matrix([4,4],[-4,-4])``

.. jme:function:: x*y

    Multiplication.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`number`, :data:`vector` → :data:`vector`
        * :data:`vector`, :data:`number` → :data:`vector`
        * :data:`matrix`, :data:`vector` → :data:`vector`
        * :data:`number`, :data:`matrix` → :data:`matrix`
        * :data:`matrix`, :data:`number` → :data:`matrix`
        * :data:`matrix`, :data:`matrix` → :data:`matrix`
        * :data:`vector`, :data:`matrix` → :data:`vector`
        * :data:`integer`, :data:`integer` → :data:`integer`
        * :data:`rational`, :data:`rational` → :data:`rational`
        * :data:`decimal`, :data:`decimal` → :data:`decimal`
        * :data:`number`, :data:`decimal` → :data:`decimal`

    **Examples**:
        * ``1*2`` → ``2``
        * ``2*vector(1,2,3)`` → ``vector(2,4,6)``
        * ``matrix([1,2],[3,4])*2`` → ``matrix([2,4],[6,8])``
        * ``matrix([1,2],[3,4])*vector(1,2)`` → ``vector(5,11)``

.. jme:function:: x/y

    Division.
    Only defined for numbers.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`matrix`, :data:`number` → :data:`matrix`
        * :data:`vector`, :data:`number` → :data:`vector`
        * :data:`integer`, :data:`integer` → :data:`rational`
        * :data:`rational`, :data:`rational` → :data:`rational`
        * :data:`decimal`, :data:`decimal` → :data:`decimal`
        * :data:`number`, :data:`decimal` → :data:`decimal`

    **Example**:
        * ``1.2/3`` → ``0.4``.

.. jme:function:: x^y

    Exponentiation.

    ``exp(x)`` is a synoynm for ``e^x``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`integer`, :data:`integer` → :data:`number`
        * :data:`rational`, :data:`integer` → :data:`rational`
        * :data:`decimal`, :data:`decimal` → :data:`decimal`

    **Examples**:
        * ``3^2`` → ``9``
        * ``e^(pi * i)`` → ``-1``


.. jme:function:: exp(x)

    :math:`e^x` - a synonym for ``e^x``.

    **Definitions**:
        * :data:`number` → :data:`number`

.. _jme-fns-number-operations:

Number operations
-----------------

.. jme:function:: decimal(n)
                  decimal(x)

    Construct a :data:`decimal` value.
    Any string accepted by `Decimal.js <https://github.com/MikeMcl/decimal.js/>`_ is accepted.

    **Definitions**:
        * :data:`number` → :data:`decimal`
        * :data:`string` → :data:`decimal`

.. jme:function:: rational(n)

    Convert ``n`` to a rational nubmer, taking an approximation when necessary.

    **Definition**:
        * :data:`number` → :data:`rational`
        
    **Example**:
        * ``rational(pi)`` → ``355/113``

.. jme:function:: int(n)

    Convert ``n`` to an integer, rounding to the nearest integer.

    **Definitions**:
        * :data:`number` → :data:`integer`

    **Example**:
        * ``int(3.0)`` → ``3``

.. jme:function:: abs(x)
              len(x)
              length(x)

    Absolute value, or modulus.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`string` → :data:`number` - the number of characters
        * :data:`list` → :data:`number` - the number of elements
        * :data:`range` → :data:`number` - the difference between the upper and lower bound
        * :data:`vector` → :data:`number`
        * :data:`dict` → :data:`number` - the number of keys
        * :data:`decimal` → :data:`decimal`
        * :data:`set` → :data:`number` - the number of elements

    **Examples**:
        * ``abs(-8)`` → ``8``
        * ``abs(3-4i)`` → ``5``
        * ``abs("Hello")`` → ``5``
        * ``abs([1,2,3])`` → ``3``
        * ``len([1,2,3])`` → ``3``
        * ``len(set([1,2,2]))`` → ``2``
        * ``length(vector(3,4))`` → ``5``
        * ``abs(vector(3,4,12))`` → ``13``
        * ``len(["a": 1, "b": 2, "c": 1])`` → ``3``

.. jme:function:: arg(z)

    Argument of a complex number.

    **Definitions**:
        * :data:`number` → :data:`number`

    **Example**:
        * ``arg(-1)`` → ``pi``

.. jme:function:: re(z)

    Real part of a complex number.

    **Definitions**:
        * :data:`number` → :data:`number`

    **Example**:
        * ``re(1+2i)`` → ``1``

.. jme:function:: im(z)

    Imaginary part of a complex number.

    **Definitions**:
        * :data:`number` → :data:`number`

    **Example**:
        * ``im(1+2i)`` → ``2``

.. jme:function:: conj(z)

    Complex conjugate.

    **Definitions**:
        * :data:`number` → :data:`number`

    **Example**:
        * ``conj(1+i)`` → ``1-i``

.. jme:function:: isint(x)

    Returns ``true`` if ``x`` is an integer - that is, it is real and has no fractional part.

    **Definitions**:
        * :data:`number` → :data:`boolean`
        * :data:`decimal` → :data:`boolean`

    **Example**:
        * ``isint(4.0)`` → ``true``

.. jme:function:: iszero(n)

    Returns ``true`` when ``n`` is exactly 0.

    **Definitions**:
        * :data:`decimal` → :data:`boolean`

.. jme:function:: sqrt(x)
              sqr(x)

    Square root of a number.

    **Examples**:
        * ``sqrt(4)`` → ``2``
        * ``sqrt(-1)`` → ``i``

.. jme:function:: root(x,n)

    ``n``:sup:`th` root of ``x``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`

    **Example**:
        * ``root(8,3)`` → ``2``.

.. jme:function:: ln(x)

    Natural logarithm.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

    **Example**:
        * ``ln(e)`` → ``1``

.. jme:function:: log(x,b)

    Logarithm with base ``b``, or base 10 if ``b`` is not given.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`
        * :data:`decimal`, :data:`decimal` → :data:`decimal`

    **Example**:
        * ``log(100)`` → ``2``.
        * ``log(343,7)`` → ``3``.

.. jme:function:: degrees(x)

    Convert radians to degrees.

    **Definitions**:
        * :data:`number` → :data:`number`

    **Example**:
        * ``degrees(pi/2)`` → ``90``

.. jme:function:: radians(x)

    Convert degrees to radians.

    **Example**:
        * ``radians(180)`` → ``pi``

.. jme:function:: sign(x)
              sgn(x)

    Sign of a number.
    Equivalent to :math:`\frac{x}{|x|}`, or 0 when ``x`` is 0.

    **Definitions**:
        * :data:`number` → :data:`number`

    **Examples**:
        * ``sign(3)`` → ``1``
        * ``sign(-3)`` → ``-1``

.. jme:function:: max(a,b)

    Greatest of the given numbers.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number` - return the greatest of the two numbers.
        * :data:`list` → :data:`number` - return the greatest number in the list.

    **Example**:
        * ``max(46,2)`` → ``46``
        * ``max([1,2,3])`` → ``3``

.. jme:function:: min(a,b)

    Least of the given numbers.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number` - return the least of the two numbers.
        * :data:`list` → :data:`number` - return the lowest number in the list.

    **Example**:
        * ``min(3,2)`` → ``2``
        * ``min([1,2,3])`` → ``1``

.. jme:function:: clamp(x,a,b)

    Return the point nearest to ``x`` in the interval :math:`[a,b]`.
    
    Equivalent to ``max(a,min(x,b))``.

    **Definitions**:
        * :data:`number`, :data:`number`, :data:`number` → :data:`number`

    **Example**:
        * ``clamp(1,0,2)`` → ``1``
        * ``clamp(-1,0,2)`` → ``0``
        * ``clamp(3,0,2)`` → ``2``

.. jme:function:: precround(n,d)

    Round ``n`` to ``d`` decimal places.
    On matrices and vectors, this rounds each element independently.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`matrix`, :data:`number` → :data:`matrix`
        * :data:`vector`, :data:`number` → :data:`vector`
        * :data:`decimal`, :data:`integer` → :data:`decimal`

    **Examples**:
        * ``precround(pi,5)`` → ``3.14159``
        * ``precround(matrix([[0.123,4.56],[54,98.765]]),2)`` → ``matrix([0.12,4.56],[54,98.77])``
        * ``precround(vector(1/3,2/3),1)`` → ``vector(0.3,0.7)``

.. jme:function:: siground(n,f)

    Round ``n`` to ``f`` significant figures.
    On matrices and vectors, this rounds each element independently.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`matrix`, :data:`number` → :data:`matrix`
        * :data:`vector`, :data:`number` → :data:`vector`
        * :data:`decimal`, :data:`integer` → :data:`decimal`

    **Examples**:
        * ``siground(pi,3)`` → ``3.14``
        * ``siground(matrix([[0.123,4.56],[54,98.765]]),2)`` → ``matrix([0.12,4.6],[54,99])``
        * ``siground(vector(10/3,20/3),2)`` → ``vector(3.3,6.7)``

.. jme:function:: withintolerance(a,b,t)

    Returns ``true`` if :math:`b-t \leq a \leq b+t`.

    **Definitions**:
        * :data:`number`, :data:`number`, :data:`number` → :data:`boolean`

    **Example**:
        * ``withintolerance(pi,22/7,0.1)`` → ``true``

.. jme:function:: dpformat(n,d,[style])

    Round ``n`` to ``d`` decimal places and return a string, padding with zeros if necessary.

    If ``style`` is given, the number is rendered using the given notation style.
    See the page on :ref:`number-notation` for more on notation styles.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`string`
        * :data:`number`, :data:`number`, :data:`string` → :data:`string`
        * :data:`decimal`, :data:`integer` → :data:`string`

    **Example**:
        * ``dpformat(1.2,4)`` → ``"1.2000"``

.. jme:function:: countdp(n)

    Assuming ``n`` is a string representing a number, return the number of decimal places used.
    The string is passed through :jme:func:`cleannumber` first.

    **Definitions**:
        * :data:`string` → :data:`number`
        * :data:`decimal` → :data:`integer`

    **Example**:
        * ``countdp("1.0")`` → ``1``
        * ``countdp("1")`` → ``0``
        * ``countdp("not a number")`` → ``0``

.. jme:function:: sigformat(n,d,[style])

    Round ``n`` to ``d`` significant figures and return a string, padding with zeros if necessary.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`string`
        * :data:`number`, :data:`number`, :data:`string` → :data:`string`
        * :data:`decimal`, :data:`integer` → :data:`string`

    **Example**:
        * ``sigformat(4,3)`` → ``"4.00"``

.. jme:function:: countsigfigs(n)

    Assuming ``n`` is a string representing a number, return the number of significant figures.
    The string is passed through :jme:func:`cleannumber` first.

    **Definitions**:
        * :data:`string` → :data:`number`
        * :data:`decimal` → :data:`integer`

    **Example**:
        * ``countsigfigs("1")`` → ``1``
        * ``countsigfigs("100")`` → ``1``
        * ``countsigfigs("1.0")`` → ``2``
        * ``countsigfigs("not a number")`` → ``0``

.. jme:function:: togivenprecision(str, precisionType, precision, strict)

    Returns ``true`` if ``str`` is a string representing a number given to the desired number of decimal places or significant figures.

    ``precisionType`` is either ``"dp"``, for decimal places, or ``"sigfig"``, for significant figures.

    If ``strict`` is ``true``, then trailing zeroes **must** be included.

    **Definitions**:
        * :data:`string`, :data:`string`, :data:`number`, :data:`boolean` → :data:`boolean`

    **Examples**:
        * ``togivenprecision("1","dp",1,true)`` → ``false``
        * ``togivenprecision("1","dp",1,false)`` → ``true``
        * ``togivenprecision("1.0","dp",1,true)`` → ``true``
        * ``togivenprecision("100","sigfig",1,true)`` → ``true``
        * ``togivenprecision("100","sigfig",3,true)`` → ``true``

.. jme:function:: tonearest(a,b)

    Round ``a`` to the nearest multiple of ``b``.

    **Definitions**:
        * :data:`decimal`, :data:`decimal` → :data:`decimal`

    **Example**:
        * ``tonearest(1.234,0.1)`` → ``1.2``


.. jme:function:: formatnumber(n,style)

    Render the number ``n`` using the given number notation style.

    See the page on :ref:`number-notation` for more on notation styles.

    **Definitions**:
        * :data:`number`, :data:`string` → :data:`string`

    **Example**:
        * ``formatnumber(1234.567,"eu")`` → ``"1.234,567"``

.. jme:function:: scientificnumberlatex(n)

    Return a LaTeX string representing the given number in scientific notation, :math:`a \times 10^b`.

    This function exists because scientific notation may use superscripts, which aren't easily typeset in plain text.

    **Definitions**:
        * :data:`number` → :data:`string`
        * :data:`decimal` → :data:`string`

    **Example**:
        * ``scientificnumberlatex(123)`` → ``"1.23 \\times 10^{2}"``

.. jme:function:: scientificnumberhtml(n)

    Return an HTML element representing the given number in scientific notation, :math:`a \times 10^b`.

    This function exists because scientific notation may use superscripts, which aren't easily typeset in plain text.

    **Definitions**:
        * :data:`number` → :data:`html`
        * :data:`decimal` → :data:`html`

    **Example**:
        * ``scientificnumberhtml(123)`` → ``html("<span>1.23 × 10<sup>2</sup></span>")``

.. jme:function:: cleannumber(str, styles)

    Clean a string potentially representing a number.
    Remove space, and then try to identify a notation style, and rewrite to the ``plain-en`` style.

    ``styles`` is a list of :ref:`notation styles <number-notation>`.
    If ``styles`` is given, `str` will be tested against the given styles.
    If it matches, the string will be rewritten using the matched integer and decimal parts, with punctuation removed and the decimal point changed to a dot.

    **Definitions**:
        * :data:`string`, :data:`list` of :data:`string` → :data:`string`

    **Examples**:
        * ``cleannumber("100 000,02",["si-fr"])`` → ``"100000.02"``
        * ``cleannumber(" 1 ")`` → ``"1"``
        * ``cleannumber("1.0")`` → ``"1.0"``

.. jme:function:: matchnumber(str,styles)

    Try to match a string representing a number in any of the given styles at the start of the given string, and return both the matched text and a corresponding :data:`number` value.

    **Definitions**:
        * :data:`string`, :data:`list` of :data:`string` → :data:`list`

    **Examples**:
        * ``matchnumber("1.234",["plain","eu"])`` → ``[ "1.234", 1.234 ]``
        * ``matchnumber("1,234",["plain","eu"])`` → ``[ "1,234", 1.234 ]``
        * ``matchnumber("5 000 things",["plain","si-en"])`` → ``[ "5 000", 5000 ]``
        * ``matchnumber("apple",["plain"])`` → ``[ "", NaN ]``

.. jme:function:: parsenumber(string,style)

    Parse a string representing a number written in the given style.

    If a list of styles is given, the first that accepts the given string is used.

    See the page on :ref:`number-notation` for more on notation styles.

    **Examples**:
        * ``parsenumber("1 234,567","si-fr")`` → ``1234.567``
        * ``parsenumber("1.001",["si-fr","eu"])`` → ``1001``

.. jme:function:: parsenumber_or_fraction(string,style)

    Works the same as :jme:func:`parsenumber`, but also accepts strings of the form ``number/number``, which it interprets as fractions.

    **Example**:
        * ``parsenumber_or_fraction("1/2")`` → ``0.5``

.. jme:function:: parsedecimal(string,style)

    Parse a string representing a number written in the given style, and return a :data:`decimal` value.

    If a list of styles is given, the first that accepts the given string is used.

    See the page on :ref:`number-notation` for more on notation styles.

    **Definitions**:
        * :data:`string`, :data:`string` → :data:`decimal`
        * :data:`string`, :data:`list` of :data:`string` → :data:`decimal`

    **Examples**:
        * ``parsedecimal("1 234,567","si-fr")`` → ``1234.567``
        * ``parsedecimal("1.001",["si-fr","eu"])`` → ``1001``

.. jme:function:: parsedecimal_or_fraction(string,style)

    Works the same as :jme:func:`parsedecimal`, but also accepts strings of the form ``number/number``, which it interprets as fractions.

    **Definitions**:
        * :data:`string`, :data:`string` → :data:`number`

    **Example**:
        * ``parsedecimal_or_fraction("1/2")`` → ``0.5``

.. jme:function:: isnan(n)

    Is ``n`` the "not a number" value, ``NaN``?

    **Definitions**:
        * :data:`number` → :data:`boolean`
        * :data:`decimal` → :data:`boolean`

    **Examples**:
        * ``isnan(1)`` → ``false``
        * ``isnan(parsenumber("a","en"))`` → ``true``

.. _jme-fns-trigonometry:

Trigonometry
------------

Trigonometric functions all work in radians, and have as their domain the complex numbers.

.. jme:function:: sin(x)

    Sine.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: cos(x)

    Cosine.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: tan(x)

    Tangent: :math:`\tan(x) = \frac{\sin(x)}{\cos(x)}`

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: cosec(x)

    Cosecant: :math:`\csc(x) = \frac{1}{sin(x)}`

    **Definitions**:
        * :data:`number` → :data:`number`

.. jme:function:: sec(x)

    Secant: :math:`\sec(x) = \frac{1}{cos(x)}`

    **Definitions**:
        * :data:`number` → :data:`number`

.. jme:function:: cot(x)

    Cotangent: :math:`\cot(x) = \frac{1}{\tan(x)}`

    **Definitions**:
        * :data:`number` → :data:`number`

.. jme:function:: arcsin(x)

    Inverse of :jme:func:`sin`.
    When :math:`x \in [-1,1]`, ``arcsin(x)`` returns a value in :math:`[-\frac{\pi}{2}, \frac{\pi}{2}]`.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: arccos(x)

    Inverse of :jme:func:`cos`.
    When :math:`x \in [-1,1]`, ``arccos(x)`` returns a value in :math:`[0, \frac{\pi}]`.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: arctan(x)

    Inverse of :jme:func:`tan`.
    When :math:`x` is non-complex, ``arctan(x)`` returns a value in :math:`[-\frac{\pi}{2}, \frac{\pi}{2}]`.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: atan2(y,x)

    The angle in radians between the positive :math:`x`-axis and the line through the origin and :math:`(x,y)`.
    This is often equivalent to ``arctan(y/x)``, except when :math:`x \lt 0`, when :math:`pi` is either added or subtracted from the result.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`decimal`, :data:`decimal` → :data:`decimal`

    **Examples**:
        * ``atan2(0,1)`` → ``0``
        * ``atan2(sin(1),cos(1))`` → ``1``
        * ``atan2(sin(pi/4), cos(pi/4)) / pi`` → ``0.25``
        * ``atan2(sin(pi/4), -cos(pi/4)) / pi`` → ``0.75``

.. jme:function:: sinh(x)

    Hyperbolic sine: :math:`\sinh(x) = \frac{1}{2} \left( \mathrm{e}^x - \mathrm{e}^{-x} \right)`

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: cosh(x)

    Hyperbolic cosine: :math:`\cosh(x) = \frac{1}{2} \left( \mathrm{e}^x + \mathrm{e}^{-x} \right)`

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: tanh(x)

    Hyperbolic tangent: :math:`\tanh(x) = \frac{\sinh(x)}{\cosh(x)}`

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: cosech(x)

    Hyperbolic cosecant: :math:`\operatorname{cosech}(x) = \frac{1}{\sinh(x)}`

    **Definitions**:
        * :data:`number` → :data:`number`

.. jme:function:: sech(x)

    Hyperbolic secant: :math:`\operatorname{sech}(x) = \frac{1}{\cosh(x)}`

    **Definitions**:
        * :data:`number` → :data:`number`

.. jme:function:: coth(x)

    Hyperbolic cotangent: :math:`\coth(x) = \frac{1}{\tanh(x)}`

    **Definitions**:
        * :data:`number` → :data:`number`

.. jme:function:: arcsinh(x)

    Inverse of :jme:func:`sinh`.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: arccosh(x)

    Inverse of :jme:func:`cosh`.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. jme:function:: arctanh(x)

    Inverse of :jme:func:`tanh`.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

.. _jme-fns-number-theory:

Number theory
-------------

.. jme:function:: x!

    Factorial.
    When ``x`` is not an integer, :math:`\Gamma(x+1)` is used instead.

    ``fact(x)`` is a synoynm for ``x!``.

    **Definitions**:
        * :data:`number` → :data:`number`

    **Examples**:
        * ``fact(3)`` → ``6``
        * ``3!`` → ``6``
        * ``fact(5.5)`` → ``287.885277815``

.. jme:function:: factorise(n)

    Factorise ``n``.
    Returns the exponents of the prime factorisation of ``n`` as a list.

    **Definitions**:
        * :data:`number` → :data:`list`

    **Examples**
        * ``factorise(18)`` → ``[1,2]``
        * ``factorise(70)`` → ``[1,0,1,1]``

.. jme:function:: gamma(x)

    Gamma function.

    **Definitions**:
        * :data:`number` → :data:`number`

    **Examples**:
        * ``gamma(3)`` → ``2``
        * ``gamma(1+i)`` → ``0.4980156681 - 0.1549498283i``

.. jme:function:: ceil(x)

    Round up to the nearest integer.
    When ``x`` is complex, each component is rounded separately.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

    **Examples**:
        * ``ceil(3.2)`` → ``4``
        * ``ceil(-1.3+5.4i)`` → ``-1+6i``

.. jme:function:: floor(x)

    Round down to the nearest integer.
    When ``x`` is complex, each component is rounded separately.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

    **Example**:
        * ``floor(3.5)`` → ``3``

.. jme:function:: round(x)

    Round to the nearest integer.
    ``0.5`` is rounded up.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

    **Examples**:
        * ``round(0.1)`` → ``0``
        * ``round(0.9)`` → ``1``
        * ``round(4.5)`` → ``5``
        * ``round(-0.5)`` → ``0``

.. jme:function:: trunc(x)

    If ``x`` is positive, round down to the nearest integer; if it is negative, round up to the nearest integer.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

    **Example**:
        * ``trunc(3.3)`` → ``3``
        * ``trunc(-3.3)`` → ``-3``

.. jme:function:: fract(x)

    Fractional part of a number.
    Equivalent to ``x-trunc(x)``.

    **Definitions**:
        * :data:`number` → :data:`number`
        * :data:`decimal` → :data:`decimal`

    **Example**:
        * ``fract(4.3)`` → ``0.3``

.. jme:function:: rational_approximation(n,[accuracy])

    Compute a rational approximation to the given number by computing terms of its continued fraction, returning the numerator and denominator separately.
    The approximation will be within :math:`e^{-\text{accuracy}}` of the true value; the default value for ``accuracy`` is 15.

    **Definitions**:
        * :data:`number` → :data:`list`
        * :data:`number`, :data:`number` → :data:`list`

    **Examples**:
        * ``rational_approximation(pi)`` → ``[355,113]``
        * ``rational_approximation(pi,3)`` → ``[22,7]``

.. jme:function:: mod(a,b)

    Modulo; remainder after integral division, i.e. :math:`a \bmod b`.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`integer`, :data:`integer` → :data:`integer`
        * :data:`decimal`, :data:`decimal` → :data:`decimal`

    **Example**:
        * ``mod(5,3)`` → ``2``

.. jme:function:: perm(n,k)

    Count permutations, i.e. :math:`^n \kern-2pt P_k = \frac{n!}{(n-k)!}`.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`

    **Example**:
        * ``perm(5,2)`` → ``20``

.. jme:function:: comb(n,k)

    Count combinations, i.e. :math:`^n \kern-2pt C_k = \frac{n!}{k!(n-k)!}`.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`

    **Example**:
        * ``comb(5,2)`` → ``10``.

.. jme:function:: gcd(a,b)
              gcf(a,b)

    Greatest common divisor of integers ``a`` and ``b``.
    Can also write ``gcf(a,b)``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`

    **Example**:
        * ``gcd(12,16)`` → ``4``

.. jme:function:: gcd_without_pi_or_i(a,b)

    Take out factors of :math:`\pi` or :math:`i` from ``a`` and ``b`` before computing their greatest common denominator.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`

    **Example**:
        * ``gcd_without_pi_or_i(6*pi, 9)`` → ``3``

.. jme:function:: coprime(a,b)

    Are ``a`` and ``b`` coprime? True if their :jme:func:`gcd` is :math:`1`, or if either of ``a`` or ``b`` is not an integer.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`boolean`

    **Examples**:
        * ``coprime(12,16)`` → ``false``
        * ``coprime(2,3)`` → ``true``
        * ``coprime(1,3)`` → ``true``
        * ``coprime(1,1)`` → ``true``

.. jme:function:: lcm(a,b)

    Lowest common multiple of integers ``a`` and ``b``.
    Can be used with any number of arguments; it returns the lowest common multiple of all the arguments.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`number`
        * :data:`list` of :data:`number` → :data:`number`

    **Examples**
        * ``lcm(8,12)`` → ``24``
        * ``lcm(8,12,5)`` → ``120``

.. jme:function:: x|y

    ``x`` divides ``y``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`boolean`

    **Example**:
        * ``4|8`` → ``true``

.. _jme-fns-vector-and-matrix-arithmetic:

Vector and matrix arithmetic
----------------------------

.. jme:function:: vector(a1,a2,...,aN)

    Create a vector with given components.
    Alternately, you can create a vector from a single list of numbers.

    **Definitions**:
        * multiple :data:`number` → :data:`vector`
        * :data:`list` of :data:`number` → :data:`vector`

    **Examples**:
        * ``vector(1,2,3)``
        * ``vector([1,2,3])``

.. jme:function:: matrix(row1,row2,...,rowN)

    Create a matrix with given rows, which should be either vectors or lists of numbers.
    Or, you can pass in a single list of lists of numbers.

    **Definitions**:
        * :data:`list` of :data:`vector` → :data:`matrix`
        * :data:`list` of :data:`list` of :data:`number` → :data:`matrix`
        * :data:`list` of :data:`number` → :data:`matrix` - a matrix with one row.
        * multiple :data:`list` of :data:`number` → :data:`matrix`

    **Examples**:
        * ``matrix([1,2],[3,4])``
        * ``matrix([[1,2],[3,4]])``

.. jme:function:: id(n)

    Identity matrix with :math:`n` rows and columns.

    **Definitions**:
        * :data:`number` → :data:`matrix`

    **Example**:
        * ``id(3)`` → ``matrix([1,0,0],[0,1,0],[0,0,1])``

.. jme:function:: numrows(matrix)

    The number of rows in the given matrix

    **Definitions**:
        * :data:`matrix` → :data:`number`

    **Example**:
        * ``numrows(matrix([1,2],[3,4],[5,6]))`` → ``3``

.. jme:function:: numcolumns(matrix)

    The number of columns in the given matrix

    **Definitions**:
        * :data:`matrix` → :data:`number`

    **Example**:
        * ``numcolumns(matrix([1,2],[3,4],[5,6]))`` → ``2``

.. jme:function:: rowvector(a1,a2,...,aN)

    Create a row vector (:math:`1 \times n` matrix) with the given components.
    Alternately, you can create a row vector from a single list of numbers.

    **Definitions**:
        * multiple :data:`number` → :data:`matrix`
        * :data:`list` of :data:`number` → :data:`matrix`

    **Examples**:
        * ``rowvector(1,2)`` → ``matrix([1,2])``
        * ``rowvector([1,2])`` → ``matrix([1,2])``

.. jme:function:: dot(x,y)

    Dot (scalar) product.
    Inputs can be vectors or column matrices.

    **Definitions**:
        * :data:`vector`, :data:`vector` → :data:`number`
        * :data:`matrix`, :data:`vector` → :data:`number`
        * :data:`vector`, :data:`matrix` → :data:`number`
        * :data:`matrix`, :data:`matrix` → :data:`number`

    **Examples**:
        * ``dot(vector(1,2,3),vector(4,5,6))`` → ``32``
        * ``dot(matrix([1],[2]), matrix([3],[4]))`` → ``11``

.. jme:function:: cross(x,y)

    Cross product.
    Inputs can be vectors or column matrices.

    **Definitions**:
        * :data:`vector`, :data:`vector` → :data:`vector`
        * :data:`matrix`, :data:`vector` → :data:`vector`
        * :data:`vector`, :data:`matrix` → :data:`vector`
        * :data:`matrix`, :data:`matrix` → :data:`vector`

    **Examples**:
        * ``cross(vector(1,2,3),vector(4,5,6))`` → ``vector(-3,6,-3)``
        * ``cross(matrix([1],[2],[3]), matrix([4],[5],[6]))`` → ``vector(-3,6,-3)``

.. jme:function:: angle(a,b)

    Angle between vectors ``a`` and ``b``, in radians.
    Returns ``0`` if either ``a`` or ``b`` has length 0.

    **Definitions**:
        * :data:`vector`, :data:`vector` → :data:`number`

    **Example**:
        * ``angle(vector(1,0),vector(0,1))`` → ``1.5707963268``

.. jme:function:: is_zero(x)

    Returns ``true`` if every component of the vector ``x`` is zero.

    **Definitions**:
        * :data:`vector` → :data:`boolean`

    **Example**:
        * ``is_zero(vector(0,0,0))`` → ``true``

.. jme:function:: det(x)

    Determinant of a matrix.
    Throws an error if used on anything larger than a 3×3 matrix.

    **Definitions**:
        * :data:`matrix` → :data:`number`

    **Examples**:
        * ``det(matrix([1,2],[3,4]))`` → ``-2``
        * ``det(matrix([1,2,3],[4,5,6],[7,8,9]))`` → ``0``

.. jme:function:: transpose(x)

    Matrix transpose.

    **Definitions**:
        * :data:`vector` → :data:`matrix` - returns a single-row matrix.
        * :data:`matrix` → :data:`matrix`

    **Examples**:
        * ``transpose(matrix([1,2],[3,4]))`` → ``matrix([1,3],[2,4])``
        * ``transpose(vector(1,2,3))`` → ``matrix([1,2,3])``

.. jme:function:: sum_cells(m)

    Calculate the sum of all the cells in a matrix.

    **Definitions**:
        * :data:`matrix` → :data:`number`

    **Example**:
        * ``sum_cells(matrix([1,2],[3,4]))`` → ``10``

.. _jme-fns-strings:

Strings
------------------

.. jme:function:: x[n]

    Get the Nth character of the string ``x``.
    Indices start at 0.

    **Example**:
        * ``"hello"[1]`` → ``"e"``

.. jme:function:: x[a..b]

    Slice the string ``x`` - get the substring between the given indices.
    Note that indices start at 0, and the final index is not included.

    **Example**:
        * ``"hello"[1..4]`` → ``"ell"``

.. jme:function:: substring in string

    Test if ``substring`` occurs anywhere in ``string``.
    This is case-sensitive.

    **Example**:
        * ``"plain" in "explains"`` → ``true``

.. jme:function:: string(x)

    Convert ``x`` to a string.

    **Definitions**:
        * :data:`number` → :data:`string` - rendered using the ``plain-en`` :ref:`notation style <number-notation>`.
        * :data:`integer` → :data:`string`
        * :data:`rational` → :data:`string`
        * :data:`decimal` → :data:`string`
        * :data:`name` → :data:`string`
        * :data:`expression` → :data:`string`

    **Example**:
        * ``string(123)`` → ``"123"``
        * ``string(x)`` → ``"x"``

.. jme:function:: latex(x)

    Mark string ``x`` as containing raw LaTeX, so when it's included in a mathmode environment it doesn't get wrapped in a ``\textrm`` environment.

    If ``x`` is a :data:`expression` value, it's rendered to LaTeX.

    Note that backslashes must be double up, because the backslash is an escape character in JME strings.

    **Definitions**:
        * :data:`string` → :data:`string`
        * :data:`expression` → :data:`string`

    **Example**:
        * ``latex('\\frac{1}{2}')``.
        * ``latex(expression("x^2 + 3/4"))`` → ``"x^{2} + \\frac{3}{4}"``

.. jme:function:: safe(x)

    Mark string ``x`` as safe: don't substitute variable values into it when this expression is evaluated.

    Use this function to preserve curly braces in string literals.

    **Definitions**:
        * :data:`string` → :data:`string`

    **Example**:
        * ``safe('From { to }')``

.. jme:function:: render(x, values)

    Substitute variable values into the string ``x``, even if it's marked as safe (see :jme:func:`safe`).

    The optional dictionary ``values`` overrides any previously-defined values of variables.

    **Definitions**:
        * :data:`string`, optional :data:`dict` → :data:`string`

    **Example**:
        * ``render(safe("I have {num_apples} apples."), ["num_apples": 5])`` → ``"I have 5 apples."``
        * ``render(safe("Let $x = \\var{x}$"), ["x": 2])`` → ``"Let $x = {2}$"``

    .. note::
        The variable dependency checker can't establish which variables will be used in the string until ``render`` is evaluated, so you may encounter errors if using ``render`` in the definition of a question variable.
        You can ensure a variable has been evaluated by including it in the ``values`` argument, e.g.::

            render("a is {}",["a": a])

        This function is intended for use primarily in content areas.

.. jme:function:: capitalise(x)

    Capitalise the first letter of a string.

    **Definitions**:
        * :data:`string` → :data:`string`

    **Example**:
        * ``capitalise('hello there')``.

.. jme:function:: pluralise(n,singular,plural)

    Return ``singular`` if ``n`` is 1, otherwise return ``plural``.

    **Definitions**:
        * :data:`number`, :data:`string`, :data:`string` → :data:`string`

    **Example**:
        * ``pluralise(num_things,"thing","things")``

.. jme:function:: upper(x)

    Convert string to upper-case.

    **Definitions**:
        * :data:`string` → :data:`string`

    **Example**:
        * ``upper('Hello there')``.

.. jme:function:: lower(x)

    Convert string to lower-case.

    **Definitions**:
        * :data:`string` → :data:`string`

    **Example**:
        * ``lower('CLAUS, Santa')``.

.. jme:function:: join(strings, delimiter)

    Join a list of strings with the given delimiter.

    **Definitions**:
        * :data:`list`, :data:`string` → :data:`string`

    **Example**:
        * ``join(['a','b','c'],',')`` → ``"a,b,c"``

.. jme:function:: split(string,delimiter)

    Split a string at every occurrence of ``delimiter``, returning a list of the the remaining pieces.

    **Definitions**:
        * :data:`string`, :data:`string` → :data:`list`

    **Example**:
        * ``split("a,b,c,d",",")`` → ``["a","b","c","d"]``

.. jme:function:: match_regex(pattern,str,flags)

    If ``str`` matches the regular expression ``pattern``, returns a list of matched groups, otherwise returns an empty list.

    This function uses `JavaScript regular expression syntax <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp>`_.

    ``flags`` is an optional string listing the options flags to use.
    If it's not given, the default value of ``"u"`` is used.

    **Definitions**:
        * :data:`string`, :data:`string` → :data:`list`
        * :data:`string`, :data:`string`, :data:`string` → :data:`list`

    **Examples**:
        * ``match_regex("\\d+","01234")`` → ``["01234"]``
        * ``match_regex("a(b+)","abbbb")`` → ``["abbbb","bbbb"]``
        * ``match_regex("a(b+)","ABBBB")`` → ``[]``
        * ``match_regex("a(b+)","ABBBB","i")`` → ``["ABBBB","BBBB"]``

.. jme:function:: split_regex(string,pattern,flags)

    Split a string at every occurrence of a substring matching the given regular expression pattern, returning a list of the the remaining pieces.

    ``flags`` is an optional string listing the options flags to use.
    If it's not given, the default value of ``"u"`` is used.

    **Definitions**:
        * :data:`string`, :data:`string` → :data:`list`
        * :data:`string`, :data:`string`, :data:`string` → :data:`list`

    **Example**:
        * ``split_regex("a, b,c, d ",", *")`` → ``["a","b","c","d"]``
        * ``split_regex("this and that AND THIS"," and ","i")`` → ``["this","that","THIS"]``

.. jme:function:: replace_regex(pattern,replacement,string,flags)

    Replace a substring of ``string`` matching the given regular expression ``pattern`` with the string ``replacement``.

    ``flags`` is an optional string listing the options flags to use.
    If it's not given, the default value of ``"u"`` is used.

    Remember that backslashes must be doubled up inside JME strings, and curly braces are normally used to substitute in variables.
    You can use the :func:`safe` function to avoid this behaviour.

    To replace all occurrences of the pattern, add the flag ``"g"``.

    **Definitions**:
        * :data:`string`, :data:`string`, :data:`string` → :data:`string`
        * :data:`string`, :data:`string`, :data:`string`, :data:`string`→ :data:`string`

    **Example**:
        * ``replace_regex("day","DAY","Monday Tuesday Wednesday")`` → ``"MonDAY Tuesday Wednesday"``
        * ``replace_regex("day","DAY","Monday Tuesday Wednesday","g")`` → ``"MonDAY TuesDAY WednesDAY"``
        * ``replace_regex("a","o","Aardvark")`` → ``"Aordvark"``
        * ``replace_regex("a","o","Aardvark","i")`` → ``"oardvark"``
        * ``replace_regex("a","o","Aardvark","ig")`` → ``"oordvork"``
        * ``replace_regex(safe("(\\d+)x(\\d+)"),"$1 by $2","32x24")`` → ``"32 by 24"``
        * ``replace_regex(safe("a{2}"),"c","a aa aaa")`` → ``"a c aaa"``

.. jme:function:: trim(str)

    Remove whitespace from the start and end of ``str``.

    **Definitions**:
        * :data:`string` → :data:`string`

    **Example**:
        * ``trim(" a string  ")`` → ``"a string"``

.. jme:function:: currency(n,prefix,suffix)

    Write a currency amount, with the given prefix or suffix characters.

    **Definitions**:
        * :data:`number`, :data:`string`, :data:`string` → :data:`string`

    **Example**:
        * ``currency(123.321,"£","")`` → ``"£123.32"``

.. jme:function:: separateThousands(n,separator)

    Write a number, with the given separator character between every 3 digits

    To write a number using notation appropriate to a particular culture or context, see :jme:func:`formatnumber`.

    **Definitions**:
        * :data:`number`, :data:`string` → :data:`string`

    **Example**:
        * ``separateThousands(1234567.1234,",")`` → ``"1,234,567.1234"``

.. jme:function:: unpercent(str)

    Get rid of the ``%`` on the end of a percentage and parse as a number, then divide by 100.

    **Definitions**:
        * :data:`string` → :data:`number`

    **Example**:
        * ``unpercent("2%")`` → ``0.02``

.. jme:function:: lpad(str, n, prefix)

    Add copies of ``prefix`` to the start of ``str`` until the result is at least ``n`` characters long.

    **Definitions**:
        * :data:`string`, :data:`number`, :data:`string` → :data:`string`

    **Example**:
        * ``lpad("3", 2, "0")`` → ``"03"``

.. jme:function:: rpad(str, n, suffix)

    Add copies of ``suffix`` to the end of ``str`` until the result is at least ``n`` characters long.

    **Definitions**:
        * :data:`string`, :data:`number`, :data:`string` → :data:`string`

    **Example**:
        * ``rpad("3", 2, "0")`` → ``"30"``

.. jme:function:: formatstring(str, values)

    For each occurrence of ``%s`` in ``str``, replace it with the corresponding entry in the list ``values``.

    **Definitions**:
        * :data:`string`, :data:`list` → :data:`string`

    **Example**:
        * ``formatstring("Their name is %s",["Hortense"])`` → ``"Their name is Hortense"``
        * ``formatstring("You should %s the %s",["simplify","denominator"])`` → ``"You should simplify the denominator"``

.. jme:function:: letterordinal(n)

    Get the :math:`n`:sup:`th` element of the sequence ``a, b, c, ..., aa, ab, ...``.

    Note that the numbering starts from 0.

    **Definitions**:
        * :data:`number` → :data:`string`

    **Examples**:
        * ``letterordinal(0)`` → ``"a"``
        * ``letterordinal(1)`` → ``"b"``
        * ``letterordinal(26)`` → ``"aa"``

.. jme:function:: translate(str, arguments)

    Translate the given string, if it's in the localisation file.

    Look at `the default localisation file <https://github.com/numbas/Numbas/blob/master/locales/en-GB.json>`_ for strings which can be translated.
    This function takes a key representing a string to be translated, and returns the corresponding value from the current localisation file.

    ``arguments`` is a dictionary of named substitutions to make in the string.

    **Definitions**:
        * :data:`string` → :data:`string`
        * :data:`string`, :data:`dict` → :data:`string`

    **Examples**:
        * ``translate("question.header",["number": 2])`` → ``"Question 2"`` (when the ``en-GB`` locale is in use)
        * ``translate("question.header",["number": 2])`` :no-test:`→` ``"Pregunta 2"`` (when the ``es-ES`` locale is in use)

.. jme:function:: isbool(str)

    After converting to lower case, is ``str`` any of the strings ``"true"``, ``"false"``, ``"yes"`` or ``"no"``?

    **Definitions**:
        * :data:`string` → :data:`boolean`
    
    **Examples**:
        * ``isbool("true")`` → ``true``
        * ``isbool("YES")`` → ``true``
        * ``isbool("no")`` → ``true``
        * ``isbool("y")`` → ``false``

.. _jme-fns-logic:

Logic
-----

.. jme:function:: x<y

    Returns ``true`` if ``x`` is less than ``y``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`boolean`
        * :data:`decimal`, :data:`decimal` → :data:`boolean`

    **Example**:
        * ``4<5``

.. jme:function:: x>y

    Returns ``true`` if ``x`` is greater than ``y``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`boolean`
        * :data:`decimal`, :data:`decimal` → :data:`boolean`

    **Example**:
        * ``5>4``

.. jme:function:: x<=y

    Returns ``true`` if ``x`` is less than or equal to ``y``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`boolean`
        * :data:`decimal`, :data:`decimal` → :data:`boolean`
        * :data:`decimal`, :data:`number` → :data:`boolean`

    **Example**:
        * ``4<=4``

.. jme:function:: x>=y

    Returns ``true`` if ``x`` is greater than or equal to ``y``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`boolean`
        * :data:`decimal`, :data:`decimal` → :data:`boolean`
        * :data:`decimal`, :data:`number` → :data:`boolean`

    **Example**:
        * ``4>=4``

.. jme:function:: x<>y

    Returns ``true`` if ``x`` is not equal to ``y``.
    Returns ``true`` if ``x`` and ``y`` are not of the same data type.

    **Definitions**:
        * anything, anything → :data:`boolean`

    **Examples**:
        * ``'this string' <> 'that string'``
        * ``1<>2``
        * ``'1' <> 1``

.. jme:function:: x=y

    Returns ``true`` if ``x`` is equal to ``y``.
    Returns ``false`` if ``x`` and ``y`` are not of the same data type.

    **Definitions**:
        * anything, anything → :data:`boolean`

    **Examples**:
        * ``vector(1,2)=vector(1,2,0)``
        * ``4.0=4``

.. jme:function:: isclose(x,y,[rel_tol],[abs_tol])

    Returns ``true`` if ``x`` is close to ``y``.

    The arguments `rel_tol` and `abs_tol` are optional, with default values of :math:`10^{-15}`.

    Equivalent to the following expression::

        abs(x-y) <= max( rel_tol*max(abs(a),abs(b)), abs_tol )

    **Definitions**:
        * :data:`number`, :data:`number`, :data:`number`, :data:`number` → :data:`boolean`

.. jme:function:: resultsequal(a,b,checkingFunction,accuracy)

    Returns ``true`` if ``a`` and ``b`` are both of the same data type, and "close enough" according to the given checking function.

    Vectors, matrices, and lists are considered equal only if every pair of corresponding elements in ``a`` and ``b`` is "close enough".

    ``checkingFunction`` is the name of a checking function to use.
    These are documented in `the Numbas runtime documentation <http://numbas.github.io/Numbas/Numbas.jme.html#.checkingFunctions>`_.

    **Definitions**:
        * anything, anything, :data:`string`, :data:`number` → :data:`boolean`

    **Examples**:
        * ``resultsequal(22/7,pi,"absdiff",0.001)`` → ``false``
        * ``resultsequal(22/7,pi,"reldiff",0.001)`` → ``true``

.. jme:function:: x and y
                x && y
                x & y

    Logical AND.
    Returns ``true`` if both ``x`` and ``y`` are true, otherwise returns ``false``.

    **Definitions**:
        * :data:`boolean`, :data:`boolean` → :data:`boolean`
        * :data:`set`, :data:`set` → :data:`set`

    **Examples**:
        * ``true and true``
        * ``true && true``
        * ``true & true``

.. jme:function:: not x

    Logical NOT.

    **Definitions**:
        * :data:`boolean` → :data:`boolean`

    **Examples**:
        * ``not true``
        * ``!true``

.. jme:function:: x or y

    Logical OR.
    Returns ``true`` when at least one of ``x`` and ``y`` is true.
    Returns false when both ``x`` and ``y`` are false.

    **Definitions**:
        * :data:`boolean`, :data:`boolean` → :data:`boolean`
        * :data:`set`, :data:`set` → :data:`set` - equivalent to ``union(x,y)``

    **Examples**:
        * ``true or false``
        * ``true || false``

.. jme:function:: x xor y

    Logical XOR.
    Returns ``true`` when at either ``x`` or ``y`` is true but not both.
    Returns ``false`` when ``x`` and ``y`` are the same expression.

    **Definitions**:
        * :data:`boolean`, :data:`boolean` → :data:`boolean`

    **Example**:
        * ``true XOR false``.

.. jme:function:: x implies y

    Logical implication.
    If ``x`` is true and ``y`` is false, then the implication is false.
    Otherwise, the implication is true.

    **Definitions**:
        * :data:`boolean`, :data:`boolean` → :data:`boolean`

    **Example**:
        * ``false implies true``.

.. _jme-fns-collections:

Collections
-----------

.. jme:function:: x[y]

    Get the ``y``:sup:`th` element of the collection ``x``.

    For matrices, the ``y``:sup:`th` row is returned.

    For dictionaries, the value corresponding to the key ``y`` is returned.
    If the key is not present in the dictionary, an error will be thrown.

    **Definitions**:
        * :data:`dict`, :data:`string` → unspecified
        * :data:`string`, :data:`number` → :data:`string`
        * :data:`list`, :data:`number` → unspecified
        * :data:`vector`, :data:`number` → :data:`number`
        * :data:`matrix`, :data:`number` → :data:`vector`

    **Examples**:
        * ``[0,1,2,3][1]`` → ``1``
        * ``vector(0,1,2)[2]`` → ``2``
        * ``matrix([0,1,2],[3,4,5],[6,7,8])[0]`` → ``vector(0,1,2)``
        * ``["a": 1, "b": 2]["a"]`` → ``1``

.. jme:function:: x[a..b]
                x[a..b#c]

    Slice the collection ``x`` - return elements with indices in the given range.
    Note that list indices start at 0, and the final index is not included.

    **Definitions**:
        * :data:`string`, :data:`range` → :data:`string`
        * :data:`list`, :data:`range` → :data:`list`
        * :data:`vector`, :data:`range` → :data:`vector`
        * :data:`matrix`, :data:`range` → :data:`matrix`

    **Example**:
        * ``[0,1,2,3,4,5][1..3]`` → ``[1,2]``
        * ``[0,1,2,3,4,5][1..6#2]`` → ``[1,3,5]``

.. jme:function:: x in collection

    Is element ``x`` in ``collection``?

    **Definitions**:
        * :data:`number`, :data:`range` → :data:`boolean`
        * :data:`string`, :data:`dict` → :data:`boolean` - returns ``true`` if the dictionary has a key ``x``
        * :data:`string`, :data:`string` → :data:`boolean`
        * anything, :data:`list` → :data:`boolean`
        * anything, :data:`set` → :data:`boolean`

    **Examples**:
        * ``3 in [1,2,3,4]`` → ``true``
        * ``3 in (set(1,2,3,4) and set(2,4,6,8))`` → ``false``
        * ``"a" in ["a": 1]`` → ``true``
        * ``1 in ["a": 1]`` throws an error because dictionary keys must be strings.


.. _jme-fns-ranges:

Ranges
------

.. jme:function:: a..b

    Define a range.
    Includes all integers between and including ``a`` and ``b``.

    **Definitions**:
        * :data:`number`, :data:`number` → :data:`range`

    **Examples**:
        * ``1..5``
        * ``-6..6``

.. jme:function:: range#step

    Set the step size for a range.
    Default is 1.
    When ``step`` is 0, the range includes all real numbers between the limits.

    **Definitions**:
        * :data:`range`, :data:`number` → :data:`range`

    **Examples**:
        * ``0..1 # 0.1``
        * ``2..10 # 2``
        * ``0..1#0``

.. jme:function:: a except b

    Exclude a number, range, or list of items from a list or range.

    **Definitions**:
        * :data:`range`, :data:`range` → :data:`list`
        * :data:`range`, :data:`list` → :data:`list` - exclude the given list of numbers
        * :data:`range`, :data:`number` → :data:`list` - exclude the given number
        * :data:`list`, :data:`range` → :data:`list` - exclude all numbers in the given range
        * :data:`list`, :data:`list` → :data:`list`
        * :data:`list`, anything → :data:`list` - exclude the given element

    **Examples**:
        * ``-9..9 except 0``
        * ``-9..9 except [-1,1]``
        * ``3..8 except 4..6``
        * ``[1,2,3,4,5] except [2,3]``

.. _jme-fns-lists:

Lists
-----

.. jme:function:: repeat(expression,n)

    Evaluate ``expression`` ``n`` times, and return the results in a list.

    **Definitions**:
        * anything, :data:`number` → :data:`list`

    **Example**:
        * ``repeat(random(1..4),5)`` :no-test:`→` ``[2, 4, 1, 3, 4]``

.. jme:function:: all(list)

    Returns ``true`` if every element of ``list`` is ``true``.

    **Definitions**:
        * :data:`list` of :data:`boolean` → :data:`boolean`

    **Examples**:
        * ``all([true,true])`` → ``true``
        * ``all([true,false])`` → ``false``
        * ``all([])`` → ``true``

.. jme:function:: some(list)

    Returns ``true`` if at least one element of ``list`` is ``true``.

    **Definitions**:
        * :data:`list` of :data:`boolean` → :data:`boolean`

    **Examples**:
        * ``some([false,true,false])`` → ``true``
        * ``some([false,false,false])`` → ``false``
        * ``some([])`` → ``false``

.. jme:function:: map(expression,name[s],d)

    Evaluate ``expression`` for each item in list, range, vector or matrix ``d``, replacing variable ``name`` with the element from ``d`` each time.

    You can also give a list of names if each element of ``d`` is a list of values.
    The Nth element of the list will be mapped to the Nth name.

    .. note::
        Do not use ``i`` or ``e`` as the variable name to map over - they're already defined as mathematical constants!

    **Definitions**:
        * anything, :data:`name`, anything → :data:`list`

    **Examples**:
        * ``map(x+1,x,1..3)`` → ``[2,3,4]``
        * ``map(capitalise(s),s,["jim","bob"])`` → ``["Jim","Bob"]``
        * ``map(sqrt(x^2+y^2),[x,y],[ [3,4], [5,12] ])`` → ``[5,13]``
        * ``map(x+1,x,id(2))`` → ``matrix([2,1],[1,2])``
        * ``map(sqrt(x),x,vector(1,4,9))`` → ``vector(1,2,3)``

.. jme:function:: filter(expression,name,d)

    Filter each item in list or range ``d``, replacing variable ``name`` with the element from ``d`` each time, returning only the elements for which ``expression`` evaluates to ``true``.

    .. note::
        Do not use ``i`` or ``e`` as the variable name to map over - they're already defined as mathematical constants!

    **Definitions**:
        * anything, :data:`name`, anything → :data:`list`

    **Example**:
        * ``filter(x>5,x,[1,3,5,7,9])`` → ``[7,9]``

.. jme:function:: take(n,expression,name,d)

    Take the first ``n`` elements from list or range ``d``, replacing variable ``name`` with the element from ``d`` each time, returning only the elements for which ``expression`` evaluates to ``true``.

    This operation is lazy - once ``n`` elements satisfying the expression have been found, execution stops.
    You can use this to filter a few elements from a large list, where the condition might take a long time to calculate.

    .. note::
        Do not use ``i`` or ``e`` as the variable name to map over - they're already defined as mathematical constants!

    **Definitions**:
        * :data:`number`, anything, :data:`name`, anything → :data:`list`

    **Example**:
        * ``take(3,gcd(x,6)=1,x,10..30)`` → ``[11,13,17]``


.. jme:function:: let(name,definition,...,expression)
              let(definitions, expression)

    Evaluate ``expression``, temporarily defining variables with the given names.
    Use this to cut down on repetition.
    You can define any number of variables - in the first calling pattern, follow a variable name with its definition.
    Or you can give a dictionary mapping variable names to their values.
    The last argument is the expression to be evaluated.

    **Definitions**:
        * :data:`dict`, anything or multiple :data:`name`, anything or :data:`list` of :data:`name`, :data:`list` of anything, anything → :data:`list`

    **Examples**:
        * ``let([a,b,c],[1,5,6],d,sqrt(b^2-4*a*c), [(-b+d)/2, (-b-d)/2])`` → ``[-2,-3]`` (when ``[a,b,c]`` = ``[1,5,6]``)
        * ``let(x,1, y,2, x+y)`` → ``3``
        * ``let(["x": 1, "y": 2], x+y)`` → ``3``

.. jme:function:: sort(x)

    Sort list ``x``.

    **Definitions**:
        * :data:`list` → :data:`list`

    **Example**:
        * ``sort([4,2,1,3])`` → ``[1,2,3,4]``

.. jme:function:: sort_destinations(x)

    Return a list giving the index that each entry in the list will occupy after sorting.

    **Definitions**:
        * :data:`list` → :data:`list`

    **Example**:
        * ``sort_destinations([4,2,1,3])`` → ``[3,1,0,2]``
        * ``sort_destinations([1,2,3,4])`` → ``[0,1,2,3]``

.. jme:function:: sort_by(key,list)

    Sort the given list of either :data:`list` or :data:`dict` values by their entries corresponding to the given key.
    When sorting a list of lists, the key is a number representing the index of each list to look at.
    When sorting a list of dictionaries, the key is a string.

    **Definitions**:
        * :data:`number`, :data:`list` of :data:`list` → :data:`list`
        * :data:`string`, :data:`list` of :data:`dict` → :data:`list`

    **Examples**:
        * ``sort_by(0, [[5,0], [3,2], [4,4]])`` → ``[[3,2], [4,4], [5,0]]``
        * ``sort_by("width", [["label": "M", "width": 20], ["label": "L", "width": 30], ["label": "S", "width": 10]])`` → ``[["label": "S", "width": 10], ["label": "M", "width": 20], ["label": "L", "width": 30]]``

.. jme:function:: group_by(key,list)

    Group the entries in the given list of either :data:`list` or :data:`dict` values by their entries corresponding to the given key.
    The returned value is a list of lists of the form ``[key, group]``, where ``key`` is the value all elements of the list ``group`` have in common.

    When grouping a list of lists, the ``key`` argument is a number representing the index of each list to look at.
    When grouping a list of dictionaries, the ``key`` argument is a string.

    **Definitions**:
        * :data:`number`, :data:`list` of :data:`list` → :data:`list`
        * :data:`string`, :data:`list` of :data:`dict` → :data:`list`

    **Examples**:
        * ``group_by(0, [[0,0], [3,2], [0,4]])`` → ``[[0, [[0,0], [0,4]]], [3, [[3,2]]]]``
        * ``group_by("a", [["a": 1, "b": "M"], ["a": 2, "b": "S"], ["a": 1, "b": "XL"]])`` → ``[[1,[["a": 1, "b": "M"], ["a": 1, "b": "XL"]]], [2, [["a": 2, "b": "S"]]]]``

.. jme:function:: reverse(x)

    Reverse list ``x``.

    **Definitions**:
        * :data:`list` → :data:`list`

    **Example**:
        * ``reverse([1,2,3])`` → ``[3,2,1]``

.. jme:function:: indices(list,value)

    Find the indices at which ``value`` occurs in ``list``.

    **Definitions**:
        * :data:`list`, anything → :data:`list`

    **Examples**:
        * ``indices([1,0,1,0],1)`` → ``[0,2]``
        * ``indices([2,4,6],4)`` → ``[1]``
        * ``indices([1,2,3],5)`` → ``[]``

.. jme:function:: distinct(x)

    Return a copy of the list ``x`` with duplicates removed.

    **Definitions**:
        * :data:`list` → :data:`list`

    **Example**:
        * ``distinct([1,2,3,1,4,3])`` → ``[1,2,3,4]``

.. jme:function:: list(x)

    Convert a value to a list of its components (or rows, for a matrix).

    **Definitions**:
        * :data:`range` → :data:`list`
        * :data:`set` → :data:`list`
        * :data:`vector` → :data:`list` - returns a list of :data:`number`.
        * :data:`matrix` → :data:`list` - returns a list of lists representing the rows.

    **Examples**:
        * ``list(set(1,2,3))`` → ``[1,2,3]`` (note that you can't depend on the elements of sets being in any order)
        * ``list(vector(1,2))`` → ``[1,2]``
        * ``list(matrix([1,2],[3,4]))`` → ``[[1,2], [3,4]]``

.. jme:function:: make_variables(definitions)

    Evaluate a dictionary of variable definitions and return a dictionary containing the generated values.

    ``definitions`` is a dictionary mapping variable names to :data:`expression` values corresponding to definitions.

    The definitions can refer to other variables to be evaluated, or variables already defined in the current scope.
    Variables named in the dictionary which have already been defined will be removed before evaluation begins.

    **Definitions**:
        * :data:`dict` of :data:`expression`, :data:`range` → :data:`dict`

    **Example**:
        * ``make_variables(["a": expression("random(1..5)"), "b": expression("a^2")])`` :no-test:`→` ``["a": 3, "b": 9]``

.. jme:function:: satisfy(names,definitions,conditions,maxRuns)

    Each variable name in ``names`` should have a corresponding definition expression in ``definitions``.
    ``conditions`` is a list of expressions which you want to evaluate to ``true``.
    The definitions will be evaluated repeatedly until all the conditions are satisfied, or the number of attempts is greater than ``maxRuns``.
    If ``maxRuns`` isn't given, it defaults to 100 attempts.

    .. note::
        This function is deprecated, and retained only for backwards compatibility.
        Use :jme:func:`make_variables` instead.

    **Definitions**:
        * :data:`list`, :data:`list`, :data:`list`, :data:`number` → :data:`list`

    **Example**:
        * ``satisfy([a,b,c],[random(1..10),random(1..10),random(1..10)],[b^2-4*a*c>0])``

.. jme:function:: sum(numbers)

    Add up a list of numbers

    **Definitions**:
        * :data:`list` of :data:`number` → :data:`number`
        * :data:`vector` → :data:`number` - sum of the components

    **Example**:
        * ``sum([1,2,3])`` → ``6``
        * ``sum(vector(4,5,6))`` → ``15``

.. jme:function:: prod(list)

    Multiply a list of numbers together

    **Definitions**:
        * :data:`list` of :data:`number` → :data:`number`
        * :data:`vector` → :data:`number` - product of the components

    **Example**:
        * ``prod([2,3,4])`` → ``24``
      

.. jme:function:: product(list1,list2,...,listN)

    Cartesian product of lists.
    In other words, every possible combination of choices of one value from each given list.

    If one list and a number are given, then the ``n``-th Cartesian power of the list is returned: the Cartesian product of ``n`` copies of the list.

    **Definitions**:
        * multiple :data:`list` → :data:`list`
        * :data:`list`, :data:`number` → :data:`list`

    **Example**:
        * ``product([1,2],[a,b])`` → ``[ [1,a], [1,b], [2,a], [2,b] ]``
        * ``product([1,2],2)`` → ``[ [1,1], [1,2], [2,1], [2,2] ]``

.. jme:function:: zip(list1,list2,...,listN)

    Combine two (or more) lists into one - the Nth element of the output is a list containing the Nth elements of each of the input lists.

    **Definitions**:
        * multiple :data:`list` → :data:`list`

    **Example**:
        * ``zip([1,2,3],[4,5,6])`` → ``[ [1,4], [2,5], [3,6] ]``

.. jme:function:: combinations(collection,r)

    All ordered choices of ``r`` elements from ``collection``, without replacement.

    **Definitions**:
        * :data:`list`, :data:`number` → :data:`list`

    **Example**:
        * ``combinations([1,2,3],2)`` → ``[ [1,2], [1,3], [2,3] ]``

.. jme:function:: combinations_with_replacement(collection,r)

    All ordered choices of ``r`` elements from ``collection``, with replacement.

    **Definitions**:
        * :data:`list`, :data:`number` → :data:`list`

    **Example**:
        * ``combinations_with_replacement([1,2,3],2)`` → ``[ [1,1], [1,2], [1,3], [2,2], [2,3], [3,3] ]``

.. jme:function:: permutations(collection,r)

    All choices of ``r`` elements from ``collection``, in any order, without replacement.

    **Definitions**:
        * :data:`list`, :data:`number` → :data:`list`

    **Example**:
        * ``permutations([1,2,3],2)`` → ``[ [1,2], [1,3], [2,1], [2,3], [3,1], [3,2] ]``

.. jme:function:: enumerate(collection)

    Enumerate the elements of ``collection``: this function returns a list containing, for each element ``v`` of ``collection``, a new list of the form ``[i,v]``, where ``i`` is the index of the element in ``collection``.

    **Definitions**:
        * :data:`list` → :data:`list`

    **Example**:
        * ``enumerate(["A","B","C"])`` → ``[ [0,"A"], [1,"B"], [2,"C"] ]``

.. _jme-fns-dictionaries:

Dictionaries
------------

.. jme:function:: dict[key]

    Get the value corresponding to the given key string in the dictionary ``d``.

    If the key is not present in the dictionary, an error will be thrown.

    **Definitions**:
        * :data:`dict`, :data:`string` → unspecified

    **Example**:
        * ``["a": 1, "b": 2]["a"]`` → ``1``

.. jme:function:: get(dict,key,default)

    Get the value corresponding to the given key string in the dictionary.

    If the key is not present in the dictionary, the ``default`` value will be returned.

    **Definitions**:
        * :data:`dict`, :data:`string`, anything → unspecified

    **Examples**:
        * ``get(["a":1], "a", 0)`` → ``1``
        * ``get(["a":1], "b", 0)`` → ``0``

.. jme:function:: dict(a:b, c:d, ...) 
        dict(pairs)

    Create a dictionary with the given key-value pairs.
    Equivalent to ``[ .. ]``, except when no key-value pairs are given: ``[]`` creates an empty *list* instead.

    You can alternately pass a list of pairs of the form ``[key, value]``, to transform a list into a dictionary.

    **Definitions**:
        * multiple :data:`keypair` → :data:`dict`

    **Examples**:
        * ``dict()``
        * ``dict("a": 1, "b": 2)``
        * ``dict([ ["a",1], ["b",2] ])``

.. jme:function:: keys(dict)

    A list of all of the given dictionary's keys.

    **Definitions**:
        * :data:`dict` → :data:`list`

    **Example**:
        * ``keys(["a": 1, "b": 2, "c": 1])`` → ``["a","b","c"]``

.. jme:function:: values(dict,[keys])

    A list of the values corresponding to each of the given dictionary's keys.

    If a list of keys is given, only the values corresponding to those keys are returned, in the same order.

    **Definitions**:
        * :data:`dict` → :data:`list`
        * :data:`dict`, :data:`list` of :data:`string` → :data:`list`

    **Examples**:
        * ``values(["a": 1, "b": 2, "c": 1])`` → ``[1,2,1]``
        * ``values(["a": 1, "b": 2, "c": 3], ["b","a"])`` → ``[2,1]``

.. jme:function:: items(dict)

    A list of all of the ``[key,value]`` pairs in the given dictionary.

    **Definitions**:
        * :data:`dict` → :data:`list`

    **Example**:
        * ``items(["a": 1, "b": 2, "c": 1])`` → ``[ ["a",1], ["b",2], ["c",1] ]``

.. _jme-fns-sets:

Sets
----

.. jme:function:: set(elements)

    Create a set with the given elements.
    Either pass the elements as individual arguments, or as a list.

    **Definitions**:
        * :data:`list` → :data:`set`
        * multiple anything → :data:`set`

    **Examples**:
        * ``set(1,2,3)``
        * ``set([1,2,3])``

.. jme:function:: union(a,b)

    Union of sets ``a`` and ``b``

    **Definitions**:
        * :data:`set`, :data:`set` → :data:`set`

    **Examples**:
        * ``union(set(1,2,3),set(2,4,6))`` → ``set(1,2,3,4,6)``
        * ``set(1,2,3) or set(2,4,6)`` → ``set(1,2,3,4,6)``

.. jme:function:: intersection(a,b)

    Intersection of sets ``a`` and ``b``, i.e. elements which are in both sets.

    **Definitions**:
        * :data:`set`, :data:`set` → :data:`set`

    **Examples**:
        * ``intersection(set(1,2,3),set(2,4,6))`` → ``set(2)``
        * ``set(1,2,3) and set(2,4,6)`` → ``set(2)``

.. jme:function:: a-b

    Set minus - elements which are in a but not b

    **Example**:
        * ``set(1,2,3,4) - set(2,4,6)`` → ``set(1,3)``

.. _jme-fns-randomisation:

Randomisation
-------------

.. jme:function:: random(x)

    Pick uniformly at random from a range, list, or from the given arguments.

    **Definitions**:
        * :data:`range` → :data:`number`
        * :data:`list` → unspecified
        * multiple anything → unspecified

    **Examples**:
        * ``random(1..5)``
        * ``random([1,2,4])``
        * ``random(1,2,3)``

.. jme:function:: deal(n)

    Get a random shuffling of the integers :math:`[0 \dots n-1]`

    **Definitions**:
        * :data:`number` → :data:`list`

    **Example**:
        * ``deal(3)`` :no-test:`→` ``[2,0,1]``

.. jme:function:: reorder(list,order)

    Reorder a list given a permutation.
    The ``i``th element of the output is the ``order[i]``th element of ``list``.

    **Definitions**:
        * :data:`list`, :data:`list` → :data:`list`

    **Examples**:
        * ``reorder([0,1,2,3],[3,2,0,1])`` → ``[3,2,0,1]``
        * ``reorder(["a","b","c","d"],[3,2,0,1])`` → ``["d","c","a","b"]``

.. jme:function:: shuffle(x)

    Random shuffling of list or range.

    **Definitions**:
        * :data:`list` → :data:`list`

    **Examples**:
        * ``shuffle(["a","b","c"])`` :no-test:`→` ``["c","b","a"]``
        * ``shuffle(0..4)`` :no-test:`→` ``[2,3,0,4,1]``

.. jme:function:: shuffle_together(lists)

    Shuffle several lists together - each list has the same permutation of its elements applied.
    The lists must all be the same length, otherwise an error is thrown.

    **Definitions**:
        * :data:`list` → :data:`list`

    **Example**:
        * ``shuffle_together([ ["a","b","c","d"], [0,1,2,3] ])`` :no-test:`→` ``[ ["d","a","c","b"], [3,0,2,1] ]``

.. _jme-fns-control-flow:

Control flow
------------

.. jme:function:: award(a,b)

    Return ``a`` if ``b`` is ``true``, else return ``0``.

    **Definitions**:
        * :data:`number`, :data:`boolean` → :data:`number`

    **Example**:
        * ``award(5,true)`` → ``5``

.. jme:function:: if(p,a,b)

    If ``p`` is ``true``, return ``a``, else return ``b``.
    Only the returned value is evaluated.

    **Definitions**:
        * :data:`boolean`, anything, anything → unspecified

    **Example**:
        * ``if(false,1,0)`` → ``0``

.. jme:function:: switch(p1,a1,p2,a2, ..., pn,an,d)

    Select cases.
    Alternating boolean expressions with values to return, with the final argument representing the default case.
    Only the returned value is evaluated.

    **Definitions**:
        * multiple :data:`boolean`,anything, anything → unspecified

    **Examples**:
        * ``switch(true,1,false,0,3)`` → ``1``
        * ``switch(false,1,true,0,3)`` → ``0``
        * ``switch(false,1,false,0,3)`` → ``3``

.. jme:function:: assert(condition, value)

    If ``condition`` is ``false``, then return ``value``, otherwise don't evaluate ``value`` and return ``false``.
    This is intended for use in marking scripts, to apply marking feedback only if a condition is met.

    **Definitions**:
        * :data:`boolean`, anything → unspecified

    **Example**:
        * ``assert(studentAnswer<=0, correct("Student answer is positive"))``

.. jme:function:: try(expression, name, except)

    Try to evaluate ``expression``.
    If it is successfully evaluated, return the result.
    Otherwise, evaluate ``except``, with the error message available as ``name``.

    **Definitions**:
        * anything, :data:`name`, anything → unspecified

    **Examples**:
        * ``try(eval(expression("x+")),err, "Error: "+err)`` → ``"Error: Not enough arguments for operation <code>+</code>"``
        * ``try(1+2,err,0)`` → ``3``

.. _jme-fns-html:

HTML
----

.. jme:function:: html(x)

    Parse string ``x`` as HTML.

    **Definitions**:
        * :data:`string` → :data:`html`

    **Example**:
        * ``html('<div>Text!</div>')``

.. jme:function:: isnonemptyhtml(str)

    Does ``str`` represent a string of HTML containing text?
    Returns false for the empty string, or HTML elements with no text content.

    **Definitions**:
        * :data:`string` → :data:`boolean`

    **Examples**:
        * ``isnonemptyhtml("<p>Yes</p>")`` → ``true``
        * ``isnonemptyhtml("<p></p>")`` → ``false``

.. jme:function:: table(data), table(data,headers)

    Create an HTML with cell contents defined by ``data``, which should be a list of lists of data, and column headers defined by the list of strings ``headers``.

    **Definitions**:
        * :data:`list`, :data:`list` of :data:`list` → :data:`html`
        * :data:`list` → :data:`html`

    **Examples**:
        * ``table([[0,1],[1,0]], ["Column A","Column B"])``
        * ``table([[0,1],[1,0]])``

.. jme:function:: image(url)

    Create an HTML `img` element loading the image from the given URL.
    Images uploaded through the resources tab are stored in the relative URL `resources/images/<filename>.png`, where `<filename>` is the name of the original file.

    **Definitions**:
        * :data:`string` → :data:`html`

    **Examples**:
        * ``image('resources/images/picture.png')``
        * ``image(chosenimage)``
        * `Question using randomly chosen images <https://numbas.mathcentre.ac.uk/question/1132/using-a-randomly-chosen-image/>`_.

.. jme:function:: max_width(width,element)

    Apply a CSS `max-width` attribute to the given element.
    You can use this to ensure that an image is not displayed too wide.
    The given `width` is in pixels.

    **Definitions**:
        * :data:`number`, :data:`html` → :data:`html`

    **Example**:
        ``max_width(400,html("<p>Text</p>"))`` → ``html("<p style=\"max-width: 400em;\">a</p>")``

.. jme:function:: max_height(width,element)

    Apply a CSS `max-height` attribute to the given element. 
    You can use this to ensure that an image is not displayed too long.
    The given `height` is in pixels.

    **Definitions**:
        * :data:`number`, :data:`html` → :data:`html`

    **Example**:
        ``max_height(400,html("<p>Text</p>"))`` → ``html("<p style=\"max-height: 400em;\">a</p>")``

.. _jme-fns-json:

JSON
----

`JSON <http://www.json.org/>`_ is a lightweight data-interchange format.
Many public data sets come in JSON format; it's a good way of encoding data in a way that is easy for both humans and computers to read and write.

For an example of how you can use JSON data in a Numbas question, see the exam `Working with JSON data <https://numbas.mathcentre.ac.uk/exam/4684/working-with-json-data/>`_.

.. jme:function:: json_decode(json)

    Decode a JSON string into JME data types.

    JSON is decoded into numbers, strings, booleans, lists, or dictionaries.
    To produce other data types, such as matrices or vectors, you will have to post-process the resulting data.

    .. warning::
        The JSON value ``null`` is silently converted to an empty string, because JME has no "null" data type.
        This may change in the future.

    **Definitions**:
        * :data:`string` → unspecified

    **Example**:
        * ``json_decode(safe(' {"a": 1, "b": [2,true,"thing"]} '))`` → ``["a": 1, "b": [2,true,"thing"]]``

.. jme:function:: json_encode(data)

    Convert the given object to a JSON string.

    Numbers, strings, booleans, lists, and dictionaries are converted in a straightforward manner.
    Other data types may behave unexpectedly.

    **Definitions**:
        * anything → :data:`string`

    **Example**:
        * ``json_encode([1,"a",true])`` → ``"[1,\"a\",true]"``

.. _jme-fns-subexpressions:

Sub-expressions
---------------

The :data:`expression` data type represents a JME expression.
You can use it to store and manipulate expressions symbolically, substituting in other variables before evaluating or displaying to the student.

There are functions to construct sub-expressions from strings of code, or by joining other sub-expressions together as the arguments to operators or functions.

Once you've got a sub-expression, you can evaluate it to a normal JME data type, test if it matches a :ref:`pattern <pattern-matching>`, substitute values or other sub-expressions for free variables, rearrange using :ref:`simplification rules <simplification-rules>`, or test if it is equivalent to another sub-expression.

.. jme:function:: expression(string)
.. jme:function:: parse(string)

    Parse a string as a JME expression.
    The expression can be substituted into other expressions, such as the answer to a mathematical expression part, or the ``\simplify`` LaTeX command.

    ``parse(string)`` is a synonym for ``expression(string)``.

    .. warning::

        Note that the argument to ``expression`` is evaluated using the same rules as any other JME expression, so for example ``expression("2" + "x")`` is equivalent to ``expression("2x")``, not ``expression("2 + x")``.
        A good way to construct a randomised sub-expression is using :func:`substitute`.

    **Definitions**:
        * :data:`string` → :data:`expression`

    **Example**:
        * `A question using randomly chosen variable names <https://numbas.mathcentre.ac.uk/question/20358/randomise-variable-names-expression-version/>`_.


.. jme:function:: eval(expression, values)

    Evaluate the given sub-expression.

    If ``values`` is given, it should be a dictionary mapping names of variables to their values.

    **Definitions**:
        * :data:`expression` → unspecified
        * :data:`expression`, :data:`dict` → unspecified

    **Example**:
        * ``eval(expression("1+2"))`` → ``3``
        * ``eval(expression("x+1"), ["x":1])`` → ``2``

.. jme:function:: args(expression)

    Returns the arguments of the top-level operation of ``expression``, as a list of sub-expressions.
    If ``expression`` is a data type other than an operation or function, an empty list is returned.

    Binary operations only ever have two arguments.
    For example, ``1+2+3`` is parsed as ``(1+2)+3``.

    **Definitions**:
        * :data:`expression` → :data:`list`

    **Examples**:
        * ``args(expression("f(x)"))`` → ``[expression("x")]``
        * ``args(expression("1+2+3"))`` → ``[expression("1+2"), expression("3")]``
        * ``args(expression("1"))`` → ``[]``

.. jme:function:: type(expression)

    Returns the name of the :ref:`data type <jme-data-types>` of the top token in the expression, as a string.

    **Definitions**:
        * :data:`expression` → :data:`string`

    **Examples**:
        * ``type(expression("x"))`` → ``"name"``
        * ``type(expression("1"))`` → ``"integer"``
        * ``type(expression("x+1"))`` → ``"op"``
        * ``type(expression("sin(x)"))`` → ``"function"``

.. jme:function:: name(string)

    Construct a :data:`name` token with the given name.

    **Definitions**:
        * :data:`string` → :data:`name`

    **Example**:
        * ``name("x")`` → ``x``

.. jme:function:: op(name)

    Construct an operator with the given name.

    **Definitions**:
        * :data:`string` → :data:`op`

    **Example**:
        * ``op("+")`` :no-test:`→` ``+``

.. jme:function:: function(name)

    Construct a function token with the given name.

    **Definitions**:
        * :data:`string` → :data:`func`

    **Example**:
        * ``function("sin")`` :no-test:`→` ``sin``

.. jme:function:: exec(op, arguments)

    Returns a sub-expression representing the application of the given operation to the list of arguments.

    **Definitions**:
        * :data:`op`, :data:`list` → :data:`expression`

    **Example**:
        * ``exec(op("+"), [2,1])`` → ``expression("2+1")``
        * ``exec(op("-"), [2,name("x")])`` → ``expression("2-x")``

.. jme:function:: findvars(expression)

    Return a list of all unbound variables used in the given expression.
    Effectively, this is all the variables that need to be given values in order for this expression to be evaluated.

    *Bound variables* are those defined as part of operations which also assign values to those variables, such as ``map`` or ``let``.

    **Definitions**:
        * :data:`expression` → :data:`list`

    **Examples**:
        * ``findvars(expression("x+1"))`` → ``["x"]``
        * ``findvars(expression("x + x*y"))`` → ``["x","y"]``
        * ``findvars(expression("map(x+2, x, [1,2,3])"))`` → ``[]``

.. jme:function:: substitute(variables,expression)

    Substitute the given variable values into ``expression``.

    ``variables`` is a dictionary mapping variable names to values.

    **Definitions**:
        * :data:`dict`, :data:`expression` → :data:`expression`

    **Examples**:
        * ``substitute(["x": 1], expression("x + y"))`` → ``expression("1 + y")``
        * ``substitute(["x": 1, "y": expression("sqrt(z+2)")], expression("x + y"))`` → ``expression("1 + sqrt(z + 2)")``

.. jme:function:: simplify(expression,rules)

    Apply the given simplification rules to ``expression``, until no rules apply.

    ``rules`` is a list of names of rules to apply, given either as a string containing a comma-separated list of names, or a list of strings.

    Unlike the ``\\simplify`` command in content areas, the ``basic`` rule is not turned on by default.

    See :ref:`simplification-rules` for a list of rules available.

    **Definitions**:
        * :data:`expression`, :data:`string` → :data:`expression`
        * :data:`expression`, :data:`list` → :data:`expression`
        * :data:`string`, :data:`string` → :data:`expression`

    **Examples**:
        * ``simplify(expression("1*x+cos(pi)"),"unitfactor")`` → ``expression("x+cos(pi)")``
        * ``simplify(expression("1*x+cos(pi)"),["basic","unitfactor","trig"])`` → ``expression("x-1")``

.. jme:function:: expand_juxtapositions(expression, options)

    Expand juxtapositions in variable and function names for implicit multiplication of terms or composition of functions.
    This is to do with strings of letters with no spaces or operator symbols between them.

    ``options`` is an optional dictionary of settings for the process.
    It can contain the following keys. 

    * ``singleLetterVariables`` - Insist that all variable names consist of a single letter, interpreting longer strings of characters as implicit multiplication.
        Greek letters are considered to be one letter long.
    * ``noUnknownFunctions`` - When a name appears before a bracket, but it's not the name of a defined function, interpret it as a multiplication instead. This does not apply function applications with more than one argument.
    * ``implicitFunctionComposition`` - When several function names are juxtaposed together to form a string that is not the name of a defined function, or several function names are joined with the multiplication symbol ``*``, interpret it as implicity composition of functions.

    If ``options`` is not given, all of these are turned on.

    Variable name annotations, subscripts and primes do not count towards the number of letters in a name.

    **Definition**:
        * :data:`expression` → :data:`expression`
        * :data:`expression`, :data:`dict` → :data:`expression`

    **Examples**:
        * ``expand_juxtapositions(expression("xy"))`` → ``expression("x*y")``
        * ``expand_juxtapositions(expression("x'y"))`` → ``expression("x\'*y")``
        * ``expand_juxtapositions(expression("pizza"))`` → ``expression("pi*z*z*a")``
        * ``expand_juxtapositions(expression("hat:abc"))`` → ``expression("hat:a*b*c")``
        * ``expand_juxtapositions(expression("xcos(x)"))`` → ``expression("x*cos(x)")``
        * ``expand_juxtapositions(expression("lnabs(x)"))`` → ``expression("ln(abs(x))")``
        * ``expand_juxtapositions(expression("ln*abs(x)"))`` → ``expression("ln(abs(x))")``
        * ``expand_juxtapositions(expression("xy"),["singleLetterVariables": false])`` → ``expression("xy")``
        * ``expand_juxtapositions(expression("x(x+1)"))`` → ``expression("x*(x+1)")``
        * ``expand_juxtapositions(expression("x(x+1)"),["noUnknownFunctions": false])`` → ``expression("x(x+1)")``
        * ``expand_juxtapositions(expression("ln*abs(x)"),["implicitFunctionComposition": false, "singleLetterVariables": true, "noUnknownFunctions": true])`` → ``expression("l*n*abs(x)")``

.. jme:function:: canonical_compare(expr1,expr2)

    Compare expressions ``a`` and ``b`` using the "canonical" ordering.
    Returns ``-1`` if ``a`` should go before ``b``, ``0`` if they are considered "equal", and ``1`` if ``a`` should go after ``b``.

    Expressions are examined in the following order:

    * 
        Names used: all variable names used in each expression are collected in a depth-first search and the resulting lists are compared lexicographically.
    * 
        Data type: if ``a`` and ``b`` are of different data types, :data:`op` and :data:`function` go first, and then they are compared using the names of their data types.
    *
        Polynomials: terms of the form ``x^b`` or ``a*x^b``, where ``a`` and ``b`` are numbers and ``x`` is a variable name, go before anything else.
    * 
        Function name: if ``a`` and ``b`` are both function applications, they are compared using the names of the functions. 
        If the functions are the same, the arguments are compared. 
        Powers, or multiples of powers, go after anything else.
    * 
        Number: if ``a`` and ``b`` are both numbers, the lowest number goes first. 
        Complex numbers are compared by real part and then by imaginary part.
    * 
        Elements of other data types are considered to be equal to any other value of the same data type.

    **Definitions**:
        * anything, anything → :data:`number`

    **Examples**:
        * ``canonical_compare(a,b)`` → ``-1``
        * ``canonical_compare(f(y),g(x))`` → ``1``
        * ``canonical_compare(f(x),g(x))`` → ``-1``
        * ``canonical_compare("a","b")`` → ``0``

.. jme:function:: numerical_compare(a,b)

    Compare expression ``a`` and ``b`` by substituting random values in for the free variables.

    Returns ``true`` if ``a`` and ``b`` have exactly the same free variables, and produce the same results when evaluated against the randomly chosen values.

    For more control over the evaluation, see :func:`resultsequal`.

    **Definitions**:
        * :data:`expression`, :data:`expression` → :data:`boolean`

    **Example**:
        * ``numerical_compare(expression("x^2"), expression("x*x"))`` → ``true``
        * ``numerical_compare(expression("x^2"), expression("2x"))`` → ``false``
        * ``numerical_compare(expression("x^2"), expression("y^2"))`` → ``false``

Calculus
--------

.. jme:function:: diff(expression,variable)

    Differentiate the given expression with respect to the given variable name

    **Definitions**:
        * :data:`expression`, :data:`string` → :data:`expression`

    **Example**:
        * ``diff(expression("x^2 + 2x + 4"), "x")`` → ``expression("2x + 2")``
        * ``diff(expression("x * y + 3x + 2y"), "x")`` → ``expression("y + 3")``
        * ``diff(expression("cos(x^2)"), "x")`` → ``expression("-2 * sin(x^2) * x")``

.. _jme-fns-pattern-matching:

Pattern-matching sub-expressions
--------------------------------

.. jme:function:: match(expr, pattern, options)

    If ``expr`` matches ``pattern``, return a dictionary of the form ``["match": boolean, "groups": dict]``, where ``"groups"`` is a dictionary mapping names of matches to sub-expressions.

    See :ref:`the documentation on pattern-matching mathematical expressions <pattern-matching>`.

    If you don't need to use any parts of the matched expression, use :jme:func:`matches` instead.

    **Definitions**:
        * :data:`expression`, :data:`string` → :data:`dict`
        * :data:`expression`, :data:`string`, :data:`string` → :data:`dict`

    **Examples**:
        * ``match(expression("x+1"),"?;a + ?;b")`` → ``["match": true, "groups": ["a": expression("x"), "b": expression("1"), "_match": expression("x+1")]]``
        * ``match(expression("sin(x)"), "?;a + ?;b")`` → ``["match": false, "groups": dict()]``
        * ``match(expression("x+1"),"1+?;a")`` → ``["match": true, "groups": ["a": expression("x"), "_match": expression("x+1")]]``

.. jme:function:: matches(expr, pattern, options)

    Return ``true`` if ``expr`` matches ``pattern``.

    Use this if you're not interested in capturing any parts of the matched expression.

    **Definitions**:
        * :data:`expression`, :data:`string` → :data:`boolean`
        * :data:`expression`, :data:`string`, :data:`string` → :data:`boolean`

    **Examples**:
        * ``matches(expression("x+1"),"?;a + ?;b")`` → ``true``
        * ``matches(expression("sin(x)"), "?;a + ?;b")`` → ``false``

.. jme:function:: replace(pattern, replacement, expr)

    Replace occurrences of ``pattern`` in ``expr`` with the expression created by substituting the matched items into ``replacement``.

    **Definitions**:
        * :data:`string`, :data:`string`, :data:`expression` → :data:`expression`
        * :data:`string`, :data:`string`, :data:`expression`, :data:`string` → :data:`expression`

    **Examples**:
        * ``replace("?;x + ?;y", "x*y", expression("1+2"))`` → ``expression("1*2")``
        * ``replace("?;x + ?;y", "f(x,y)", expression("1+2+3"))`` → ``expression("f(f(1,2),3)")``
        * ``replace("0*?", "0", expression("0*sin(x) + x*0 + 2*cos(0*pi)"))`` → ``expression("0 + 0 + 2*cos(0)")``

.. _jme-fns-data-types:

Identifying data types
----------------------

.. jme:function:: type(x)

    Returns the name of the :ref:`data type <jme-data-types>` of ``x``.

    **Example**:
        * ``type(1)`` → ``"integer"``

.. jme:function:: x isa type

    Returns ``true`` if ``x`` is of the :ref:`data type <jme-data-types>` ``type``.

    **Definitions**:
        * anything, :data:`string` → :data:`boolean`

    **Examples**:
        * ``1 isa "number"`` → ``true``
        * ``x isa "name"`` → ``true`` (if ``x`` is not defined in this scope)
        * ``x isa "number"`` :no-test:`→` ``true`` (if ``x`` has a numerical value in this scope)

.. jme:function:: x as type

    Convert ``x`` to the given data type, if possible.

    If ``x`` can not be automatically converted to ``type``, an error is thrown.

    **Definitions**:
        * anything, :data:`string` → given type

    **Examples**:
        * ``dec(1.23) as "number"`` → ``1.23``
        * ``set(1,2,3) as "list"`` → ``[1,2,3]``

.. jme:function:: infer_variable_types(expression)

    Attempt to infer the types of free variables in the given expression.

    There can be more than one valid assignment of types to the variables in an expression.
    For example, in the expression ``a+a``, the variable ``a`` can be any type which has a defined addition operation.

    Returns the first possible assignment of types to variables, as a dictionary mapping variable names to the name of its type.
    If a variable name is missing from the dictionary, the algorithm can't establish any constraint on it.

    **Definitions**:
        * :data:`expression` → :data:`dict`

    **Examples**:
        * ``infer_variable_types(expression("x^2"))`` → ``["x": "number"]``
        * ``infer_variable_types(expression("union(a,b)"))`` → ``["a": "set", "b": "set"]``
        * ``infer_variable_types(expression("k*det(a)"))`` → ``[ "k": "number", "a": "matrix" ]``

.. jme:function:: infer_type(expression)

    Attempt to infer the type of the value produced by the given expression, which may contain free variables.

    First, the types of any free variables are inferred.
    Then, definitions of an operations or functions in the function are chosen to match the types of their arguments.

    Returns the name of the expression's output type as a string, or ``"?"`` if the type can't be determined.

    **Definitions**:
        * :data:`expression` → :data:`string`

    **Examples**:
        * ``infer_type(expression("x+2"))`` → ``"number"``
        * ``infer_type(expression("id(n)"))`` → ``"matrix"``
        * ``infer_type(expression("random(2,true)"))`` → ``"?"``

.. _jme-fns-inspecting-the-scope:

Inspecting the evaluation scope
-------------------------------

.. jme:function:: definedvariables()

    Returns a list containing the names of every variable defined in the current scope, as strings.

    **Definitions**:
        * () → :data:`list`

.. jme:function:: isset(name)

    Returns ``true`` if the variable with the given name has been defined in the current scope.

    **Definitions**:
        * :data:`name` → :data:`boolean`

.. jme:function:: unset(names, expression)

    Temporarily remove the named variables, functions and rulesets from the scope, and evaluate the given expression.

    ``names`` is a dictionary of the form ``["variables": list, "functions": list, "rulesets": list]``.

    **Definitions**:
        * :data:`dict`, anything → unspecified
