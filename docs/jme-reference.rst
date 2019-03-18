.. _jme:

JME
===

JME expressions are used by students to enter answers to algebraic questions, and by question authors to define variables.
JME syntax is similar to what you'd type on a calculator.

.. _variable-names:

Variable names
***************

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
-------------------------

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

.. _jme-data-types:

Data types
**********

.. data:: number

    Numbers include integers, real numbers and complex numbers.
    There is only one data type for all numbers.

    ``i``, ``e``, ``infinity`` and ``pi`` are reserved keywords for the imaginary unit, the base of the natural logarithm, ∞ and π, respectively.

    **Examples**: ``0``, ``-1``, ``0.234``, ``i``, ``e``, ``pi``

    See functions related to :ref:`jme-fns-arithmetic`, :ref:`jme-fns-number-operations`, :ref:`jme-fns-trigonometry` and :ref:`jme-fns-number-theory`.

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

.. data:: set

    An unordered set of elements of any data type.
    The elements are pairwise distinct - if you create a set from a list with duplicate elements, the resulting set will not contain the duplicates.

    **Examples**: ``set(a,b,c)``, ``set([1,2,3,4])``, ``set(1..5)``

    See functions related to :ref:`jme-fns-sets`.

.. data:: vector

    The components of a vector must be numbers.

    When combining vectors of different dimensions, the smaller vector is padded with zeros to make up the difference.

    **Examples**: ``vector(1,2)``, ``vector([1,2,3,4])``

    See functions related to :ref:`jme-fns-vector-and-matrix-arithmetic`.

.. data:: matrix

    Matrices are constructed from lists of numbers, representing the rows.

    When combining matrices of different dimensions, the smaller matrix is padded with zeros to make up the difference.

    **Examples**: ``matrix([1,2,3],[4,5,6])``, ``matrix(row1,row2,row3)``

    See functions related to :ref:`jme-fns-vector-and-matrix-arithmetic`.

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
    Numbers, vectors, matrices, lists, dicts, or strings can be added together.

    * ``list1+list2`` concatenates the two lists, while ``list+value`` returns a list with the right-hand-side value appended.
    * ``dict1+dict2`` merges the two dictionaries, with values from the right-hand side taking precedence when the same key is present in both dictionaries.

    **Examples**:
        * ``1+2`` → ``3``
        * ``vector(1,2)+vector(3,4)`` → ``vector(4,6)``
        * ``matrix([1,2],[3,4])+matrix([5,6],[7,8])`` → ``matrix([6,8],[10,12])``
        * ``[1,2,3]+4`` → ``[1,2,3,4]``
        * ``[1,2,3]+[4,5,6]`` → ``[1,2,3,4,5,6]``
        * ``"hi "+"there"`` → ``"hi there"``

.. jme:function:: x-y

    Subtraction.
    Defined for numbers, vectors and matrices.

    **Examples**:
        * ``1-2`` → ``-1``
        * ``vector(3,2)-vector(1,4)`` → ``vector(2,-2)``
        * ``matrix([5,6],[3,4])-matrix([1,2],[7,8])`` → ``matrix([4,4],[-4,-4])``

.. jme:function:: x*y

    Multiplication.
    Numbers, vectors and matrices can be multiplied together.

    **Examples**:
        * ``1*2`` → ``2``
        * ``2*vector(1,2,3)`` → ``vector(2,4,6)``
        * ``matrix([1,2],[3,4])*2`` → ``matrix([2,4],[6,8])``
        * ``matrix([1,2],[3,4])*vector(1,2)`` → ``vector(5,11)``

.. jme:function:: x/y

    Division.
    Only defined for numbers.

    **Example**:
        * ``3/4`` → ``0.75``.

.. jme:function:: x^y

    Exponentiation.
    Only defined for numbers.

    ``exp(x,y)`` is a synoynm for ``x^y``.

    **Examples**:
        * ``3^2`` → ``9``
        * ``exp(3,2)`` → ``9``
        * ``e^(pi * i)`` → ``-1``

.. _jme-fns-number-operations:

Number operations
-----------------

.. jme:function:: abs(x)
              len(x)
              length(x)

    Absolute value, or modulus.
    Defined for numbers, strings, ranges, vectors, lists and dictionaries.
    In the case of a list, returns the number of elements.
    For a range, returns the difference between the upper and lower bounds.
    For a dictionary, returns the number of keys.

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

    **Example**:
        * ``arg(-1)`` → ``pi``

.. jme:function:: re(z)

    Real part of a complex number.

    **Example**:
        * ``re(1+2i)`` → ``1``

.. jme:function:: im(z)

    Imaginary part of a complex number.

    **Example**:
        * ``im(1+2i)`` → ``2``

.. jme:function:: conj(z)

    Complex conjugate.

    **Example**:
        * ``conj(1+i)`` → ``1-i``

.. jme:function:: isint(x)

    Returns ``true`` if ``x`` is an integer.

    **Example**:
        * ``isint(4.0)`` → ``true``

.. jme:function:: sqrt(x)
              sqr(x)

    Square root of a number.

    **Examples**:
        * ``sqrt(4)`` → ``2``
        * ``sqrt(-1)`` → ``i``

.. jme:function:: root(x,n)

    ``n``:sup:`th` root of ``x``.

    **Example**:
        * ``root(8,3)`` → ``2``.

.. jme:function:: ln(x)

    Natural logarithm.

    **Example**:
        * ``ln(e)`` → ``1``

.. jme:function:: log(x)

    Logarithm with base 10.

    **Example**:
        * ``log(100)`` → ``2``.

.. jme:function:: log(x,b)

    Logarithm with base ``b``.

    **Example**:
        * ``log(8,2)`` → ``3``.

.. jme:function:: degrees(x)

    Convert radians to degrees.

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

    **Examples**:
        * ``sign(3)`` → ``1``
        * ``sign(-3)`` → ``-1``

.. jme:function:: max(a,b)

    Greatest of two numbers.

    **Example**:
        * ``max(46,2)`` → ``46``

.. jme:function:: max(list)

    Greatest of a list of numbers.

    **Example**:
        * ``max([1,2,3])`` → ``3``

.. jme:function:: min(a,b)

    Least of two numbers.

    **Example**:
        * ``min(3,2)`` → ``2``

.. jme:function:: min(list)

    Least of a list of numbers.

    **Example**:
        * ``min([1,2,3])`` → ``1``

.. jme:function:: precround(n,d)

    Round ``n`` to ``d`` decimal places.
    On matrices and vectors, this rounds each element independently.

    **Examples**:
        * ``precround(pi,5)`` → ``3.14159``
        * ``precround(matrix([[0.123,4.56],[54,98.765]]),2)`` → ``matrix([[0.12,4.56],[54,98.77]])``
        * ``precround(vector(1/3,2/3),1)`` → ``vector(0.3,0.7)``

.. jme:function:: siground(n,f)

    Round ``n`` to ``f`` significant figures.
    On matrices and vectors, this rounds each element independently.

    **Examples**:
        * ``siground(pi,3)`` → ``3.14``
        * ``siground(matrix([[0.123,4.56],[54,98.765]]),2)`` → ``matrix([[0.12,4.6],[54,99]])``
        * ``siground(vector(10/3,20/3),2)`` → ``vector(3.3,6.7)``

.. jme:function:: withintolerance(a,b,t)

    Returns ``true`` if :math:`b-t \leq a \leq b+t`.

    **Example**:
        * ``withintolerance(pi,22/7,0.1)`` → ``true``

.. jme:function:: dpformat(n,d,[style])

    Round ``n`` to ``d`` decimal places and return a string, padding with zeros if necessary.

    If ``style`` is given, the number is rendered using the given notation style.
    See the page on :ref:`number-notation` for more on notation styles.

    **Example**:
        * ``dpformat(1.2,4)`` → ``"1.2000"``

.. jme:function:: countdp(str)

    Assuming ``str`` is a string representing a number, return the number of decimal places used.
    The string is passed through :jme:func:`cleannumber` first.

    **Example**:
        * ``countdp("1.0")`` → ``1``
        * ``countdp("1")`` → ``0``
        * ``countdp("not a number")`` → ``0``

.. jme:function:: sigformat(n,d,[style])

    Round ``n`` to ``d`` significant figures and return a string, padding with zeros if necessary.

    **Example**:
        * ``sigformat(4,3)`` → ``"4.00"``

.. jme:function:: countsigfigs(str)

    Assuming ``str`` is a string representing a number, return the number of significant figures.
    The string is passed through :jme:func:`cleannumber` first.

    **Example**:
        * ``countsigfigs("1")`` → ``1``
        * ``countsigfigs("100")`` → ``1``
        * ``countsigfigs("1.0")`` → ``2``
        * ``countsigfigs("not a number")`` → ``0``

.. jme:function:: togivenprecision(str, precisionType, precision, strict)

    Returns ``true`` if ``str`` is a string representing a number given to the desired number of decimal places or significant figures.

    ``precisionType`` is either ``"dp"``, for decimal places, or ``"sigfig"``, for significant figures.

    If ``strict`` is ``true``, then trailing zeroes **must** be included.

    **Examples**:
        * ``togivenprecision("1","dp",1,true)`` → ``false``
        * ``togivenprecision("1","dp",1,false)`` → ``true``
        * ``togivenprecision("1.0","dp",1,true)`` → ``true``
        * ``togivenprecision("100","sigfig",1,true)`` → ``true``
        * ``togivenprecision("100","sigfig",3,true)`` → ``true``

.. jme:function:: formatnumber(n,style)

    Render the number ``n`` using the given number notation style.

    See the page on :ref:`number-notation` for more on notation styles.

    **Example**:
        * ``formatnumber(1234.567,"fr")`` → ``"1.234,567"``

.. jme:function:: cleannumber(str, styles)

    Clean a string potentially representing a number.
    Remove space, and then try to identify a notation style, and rewrite to the ``plain-en`` style.

    ``styles`` is a list of :ref:`notation styles <number-notation>`.
    If ``styles`` is given, `str` will be tested against the given styles.
    If it matches, the string will be rewritten using the matched integer and decimal parts, with punctuation removed and the decimal point changed to a dot.

    **Example**:
        * ``cleannumber("100 000,02",["si-fr"])`` → ``"100000.02"``
        * ``cleannumber(" 1 ")`` → ``"1"``
        * ``cleannumber("1.0")`` → ``"1.0"``

.. jme:function:: string(n)

    Render the number ``n`` using the ``plain-en`` notation style.

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

.. jme:function:: isnan(n)

    Is ``n`` the "not a number" value, ``NaN``?

    **Examples**:
        * ``isnan(1)`` → ``false``
        * ``isnan(parsenumber("a","en"))`` → ``true``

.. _jme-fns-trigonometry:

Trigonometry
------------

Trigonometric functions all work in radians, and have as their domain the complex numbers.

.. jme:function:: sin(x)

    Sine.

.. jme:function:: cos(x)

    Cosine.

.. jme:function:: tan(x)

    Tangent: :math:`\tan(x) = \frac{\sin(x)}{\cos(x)}`

.. jme:function:: cosec(x)

    Cosecant: :math:`\csc(x) = \frac{1}{sin(x)}`

.. jme:function:: sec(x)

    Secant: :math:`\sec(x) = \frac{1}{cos(x)}`

.. jme:function:: cot(x)

    Cotangent: :math:`\cot(x) = \frac{1}{\tan(x)}`

.. jme:function:: arcsin(x)

    Inverse of :jme:func:`sin`.
    When :math:`x \in [-1,1]`, ``arcsin(x)`` returns a value in :math:`[-\frac{\pi}{2}, \frac{\pi}{2}]`.

.. jme:function:: arccos(x)

    Inverse of :jme:func:`cos`.
    When :math:`x \in [-1,1]`, ``arccos(x)`` returns a value in :math:`[0, \frac{\pi}]`.

.. jme:function:: arctan(x)

    Inverse of :jme:func:`tan`.
    When :math:`x` is non-complex, ``arctan(x)`` returns a value in :math:`[-\frac{\pi}{2}, \frac{\pi}{2}]`.

.. jme:function:: sinh(x)

    Hyperbolic sine: :math:`\sinh(x) = \frac{1}{2} \left( \mathrm{e}^x - \mathrm{e}^{-x} \right)`

.. jme:function:: cosh(x)

    Hyperbolic cosine: :math:`\cosh(x) = \frac{1}{2} \left( \mathrm{e}^x + \mathrm{e}^{-x} \right)`

.. jme:function:: tanh(x)

    Hyperbolic tangent: :math:`\tanh(x) = \frac{\sinh(x)}{\cosh(x)}`

.. jme:function:: cosech(x)

    Hyperbolic cosecant: :math:`\operatorname{cosech}(x) = \frac{1}{\sinh(x)}`

.. jme:function:: sech(x)

    Hyperbolic secant: :math:`\operatorname{sech}(x) = \frac{1}{\cosh(x)}`

.. jme:function:: coth(x)

    Hyperbolic cotangent: :math:`\coth(x) = \frac{1}{\tanh(x)}`

.. jme:function:: arcsinh(x)

    Inverse of :jme:func:`sinh`.

.. jme:function:: arccosh(x)

    Inverse of :jme:func:`cosh`.

.. jme:function:: arctanh(x)

    Inverse of :jme:func:`tanh`.

.. _jme-fns-number-theory:

Number theory
-------------

.. jme:function:: x!

    Factorial.
    When ``x`` is not an integer, :math:`\Gamma(x+1)` is used instead.

    ``fact(x)`` is a synoynm for ``x!``.

    **Examples**:
        * ``fact(3)`` → ``6``
        * ``3!`` → ``6``
        * ``fact(5.5)`` → ``287.885277815``

.. jme:function:: factorise(n)

    Factorise ``n``.
    Returns the exponents of the prime factorisation of ``n`` as a list.

    **Examples**
        * ``factorise(18)`` → ``[1,2]``
        * ``factorise(70)`` → ``[1,0,1,1]``

.. jme:function:: gamma(x)

    Gamma function.

    **Examples**:
        * ``gamma(3)`` → ``2``
        * ``gamma(1+i)`` → ``0.4980156681 - 0.1549498283i``

.. jme:function:: ceil(x)

    Round up to the nearest integer.
    When ``x`` is complex, each component is rounded separately.

    **Examples**:
        * ``ceil(3.2)`` → ``4``
        * ``ceil(-1.3+5.4i)`` → ``-1+6i``

.. jme:function:: floor(x)

    Round down to the nearest integer.
    When ``x`` is complex, each component is rounded separately.

    **Example**:
        * ``floor(3.5)`` → ``3``

.. jme:function:: round(x)

    Round to the nearest integer.
    ``0.5`` is rounded up.

    **Examples**:
        * ``round(0.1)`` → ``0``
        * ``round(0.9)`` → ``1``
        * ``round(4.5)`` → ``5``
        * ``round(-0.5)`` → ``0``

.. jme:function:: trunc(x)

    If ``x`` is positive, round down to the nearest integer; if it is negative, round up to the nearest integer.

    **Example**:
        * ``trunc(3.3)`` → ``3``
        * ``trunc(-3.3)`` → ``-3``

.. jme:function:: fract(x)

    Fractional part of a number.
    Equivalent to ``x-trunc(x)``.

    **Example**:
        * ``fract(4.3)`` → ``0.3``

.. jme:function:: rational_approximation(n,[accuracy])

    Compute a rational approximation to the given number by computing terms of its continued fraction, returning the numerator and denominator separately.
    The approximation will be within :math:`e^{-\text{accuracy}}` of the true value; the default value for ``accuracy`` is 15.

    **Examples**:
        * ``rational_approximation(pi)`` → ``[355,113]``
        * ``rational_approximation(pi,3)`` → ``[22,7]``

.. jme:function:: mod(a,b)

    Modulo; remainder after integral division, i.e. :math:`a \bmod b`.

    **Example**:
        * ``mod(5,3)`` → ``2``

.. jme:function:: perm(n,k)

    Count permutations, i.e. :math:`^n \kern-2pt P_k = \frac{n!}{(n-k)!}`.

    **Example**:
        * ``perm(5,2)`` → ``20``

.. jme:function:: comb(n,k)

    Count combinations, i.e. :math:`^n \kern-2pt C_k = \frac{n!}{k!(n-k)!}`.

    **Example**:
        * ``comb(5,2)`` → ``10``.

.. jme:function:: gcd(a,b)
              gcf(a,b)

    Greatest common divisor of integers ``a`` and ``b``.
    Can also write ``gcf(a,b)``.

    **Example**:
        * ``gcd(12,16)`` → ``4``

.. jme:function:: gcd_without_pi_or_i(a,b)

    Take out factors of :math:`\pi` or :math:`i` from ``a`` and ``b`` before computing their greatest common denominator.

    **Example**:
        * ``gcd_without_pi_or_i(6*pi, 9)`` → ``3``

.. jme:function:: coprime(a,b)

    Are ``a`` and ``b`` coprime? True if their :jme:func:`gcd` is :math:`1`, or if either of ``a`` or ``b`` is not an integer.

    **Examples**:
        * ``coprime(12,16)`` → ``false``
        * ``coprime(2,3)`` → ``true``
        * ``coprime(1,3)`` → ``true``
        * ``coprime(1,1)`` → ``true``

.. jme:function:: lcm(a,b)

    Lowest common multiple of integers ``a`` and ``b``.
    Can be used with any number of arguments; it returns the lowest common multiple of all the arguments.

    **Examples**
        * ``lcm(8,12)`` → ``24``
        * ``lcm(8,12,5)`` → ``120``

.. jme:function:: x|y

    ``x`` divides ``y``.

    **Example**:
        * ``4|8`` → ``true``

.. _jme-fns-vector-and-matrix-arithmetic:

Vector and matrix arithmetic
----------------------------

.. jme:function:: vector(a1,a2,...,aN)

    Create a vector with given components.
    Alternately, you can create a vector from a single list of numbers.

    **Examples**:
        * ``vector(1,2,3)``
        * ``vector([1,2,3])``

.. jme:function:: matrix(row1,row2,...,rowN)

    Create a matrix with given rows, which should be lists of numbers.
    Or, you can pass in a single list of lists of numbers.

    **Examples**:
        * ``matrix([1,2],[3,4])``
        * ``matrix([[1,2],[3,4]])``

.. jme:function:: id(n)

    Identity matrix with :math:`n` rows and columns.

    **Example**:
        * ``id(3)`` → ``matrix([[1,0,0],[0,1,0],[0,0,1])``

.. jme:function:: numrows(matrix)

    The number of rows in the given matrix

    **Example**:
        * ``numrows(matrix([1,2],[3,4],[5,6])`` → ``3``

.. jme:function:: numcolumns(matrix)

    The number of columns in the given matrix

    **Example**:
        * ``numrows(matrix([1,2],[3,4],[5,6])`` → ``2``

.. jme:function:: rowvector(a1,a2,...,aN)

    Create a row vector (:math:`1 \times n` matrix) with the given components.
    Alternately, you can create a row vector from a single list of numbers.

    **Examples**:
        * ``rowvector(1,2)`` → ``matrix([1,2])``
        * ``rowvector([1,2])`` → ``matrix([1,2])``

.. jme:function:: dot(x,y)

    Dot (scalar) product.
    Inputs can be vectors or column matrices.

    **Examples**:
        * ``dot(vector(1,2,3),vector(4,5,6))`` → ``32``
        * ``dot(matrix([1],[2]), matrix([3],[4]))`` → ``11``

.. jme:function:: cross(x,y)

    Cross product.
    Inputs can be vectors or column matrices.

    **Examples**:
        * ``cross(vector(1,2,3),vector(4,5,6))`` → ``vector(-3,6,-3)``
        * ``cross(matrix([1],[2],[3]), matrix([4],[5],[6]))`` → ``vector(-3,6,-3)``

.. jme:function:: angle(a,b)

    Angle between vectors ``a`` and ``b``, in radians.
    Returns ``0`` if either ``a`` or ``b`` has length 0.

    **Example**:
        * ``angle(vector(1,0),vector(0,1))`` → ``pi/2``

.. jme:function:: is_zero(x)

    Returns ``true`` if every component of the vector ``x`` is zero.

    **Example**:
        * ``is_zero(vector(0,0,0))`` → ``true``

.. jme:function:: det(x)

    Determinant of a matrix.
    Throws an error if used on anything larger than a 3×3 matrix.

    **Examples**:
        * ``det(matrix([1,2],[3,4]))`` → ``-2``
        * ``det(matrix([1,2,3],[4,5,6],[7,8,9]))`` → ``0``

.. jme:function:: transpose(x)

    Matrix transpose.
    Can also take a vector, in which case it returns a single-row matrix.

    **Examples**:
        * ``transpose(matrix([1,2],[3,4]))`` → ``matrix([1,3],[2,4])``
        * ``transpose(vector(1,2,3))`` → ``matrix([1,2,3])``

.. jme:function:: sum_cells(m)

    Calculate the sum of all the cells in a matrix.

    **Example**:
        * ``sum_cells(matrix([1,2],[3,4]))`` → ``12``

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

.. jme:function:: latex(x)

    Mark string ``x`` as containing raw LaTeX, so when it's included in a mathmode environment it doesn't get wrapped in a ``\textrm`` environment.

    Note that backslashes must be double up, because the backslash is an escape character in JME strings.

    **Example**:
        * ``latex('\\frac{1}{2}')``.

.. jme:function:: safe(x)

    Mark string ``x`` as safe: don't substitute variable values into it when this expression is evaluated.

    Use this function to preserve curly braces in string literals.

    **Example**:
        * ``safe('From { to }')``

.. jme:function:: render(x, values)

    Substitute variable values into the string ``x``, even if it's marked as safe (see :jme:func:`safe`).

    The optional dictionary ``values`` overrides any previously-defined values of variables.

    **Example**:
        * ``render("I have {num_apples} apples.", ["num_apples": 5])`` → ``"I have 5 apples"``
        * ``render("Let $x = \\var{x}$", ["x": 2])`` → ``"Let $x = {2}$"``

    .. note::
        The variable dependency checker can't establish which variables will be used in the string until ``render`` is evaluated, so you may encounter errors if using ``render`` in the definition of a question variable.
        You can ensure a variable has been evaluated by including it in the ``values`` argument, e.g.::

            render("a is {}",["a": a])

        This function is intended for use primarily in content areas.

.. jme:function:: capitalise(x)

    Capitalise the first letter of a string.

    **Example**:
        * ``capitalise('hello there')``.

.. jme:function:: pluralise(n,singular,plural)

    Return ``singular`` if ``n`` is 1, otherwise return ``plural``.

    **Example**:
        * ``pluralise(num_things,"thing","things")``

.. jme:function:: upper(x)

    Convert string to upper-case.

    **Example**:
        * ``upper('Hello there')``.

.. jme:function:: lower(x)

    Convert string to lower-case.

    **Example**:
        * ``lower('CLAUS, Santa')``.

.. jme:function:: join(strings, delimiter)

    Join a list of strings with the given delimiter.

    **Example**:
        * ``join(['a','b','c'],',')`` → ``'a,b,c'``

.. jme:function:: split(string,delimiter)

    Split a string at every occurrence of ``delimiter``, returning a list of the the remaining pieces.

    **Example**:
        * ``split("a,b,c,d",",")`` → ``["a","b","c","d"]``

.. jme:function:: trim(str)

    Remove whitespace from the start and end of ``str``.

    **Example**:
        * ``trim(" a string  ")`` → ``"a string"``

.. jme:function:: currency(n,prefix,suffix)

    Write a currency amount, with the given prefix or suffix characters.

    **Example**:
        * ``currency(123.321,"£","")`` → ``'£123.32'``

.. jme:function:: separateThousands(n,separator)

    Write a number, with the given separator character between every 3 digits

    To write a number using notation appropriate to a particular culture or context, see :jme:func:`formatnumber`.

    **Example**:
        * ``separateThousands(1234567.1234,",")`` → ``'1,234,567.1234'``

.. jme:function:: unpercent(str)

    Get rid of the ``%`` on the end of a percentage and parse as a number, then divide by 100.

    **Example**:
        * ``unpercent("2%")`` → ``0.02``

.. jme:function:: lpad(str, n, prefix)

    Add copies of ``prefix`` to the start of ``str`` until the result is at least ``n`` characters long.

    **Example**:
        * ``lpad("3", 2, "0")`` → ``"03"``

.. jme:function:: rpad(str, n, suffix)

    Add copies of ``suffix`` to the end of ``str`` until the result is at least ``n`` characters long.

    **Example**:
        * ``rpad("3", 2, "0")`` → ``"30"``

.. jme:function:: formatstring(str, values)

    For each occurrence of ``%s`` in ``str``, replace it with the corresponding entry in the list ``values``.

    **Example**:
        * ``formatstring("Their name is %s",["Hortense"])`` → ``"Their name is Hortense"``
        * ``formatstring("You should %s the %s",["simplify","denominator"])`` → ``You should simplify the denominator"``

.. jme:function:: letterordinal(n)

    Get the :math:`n`:sup:`th` element of the sequence ``a, b, c, ..., aa, ab, ...``.

    Note that the numbering starts from 0.

    **Examples**:
        * ``letterordinal(0)`` → ``"a"``
        * ``letterordinal(1)`` → ``"b"``
        * ``letterordinal(26)`` → ``"aa"``

.. jme:function:: match_regex(pattern,str,flags)

    If ``str`` matches the regular expression ``pattern``, returns a list of matched groups, otherwise returns an empty list.

    This function uses `JavaScript regular expression syntax <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp>`_.

    ``flags`` is an optional string listing the options flags to use.

    **Examples**:
        * ``match_regex("\\d+","01234")`` → ``["01234"]``
        * ``match_regex("a(b+)","abbbb")`` → ``["abbbb","bbbb"]``
        * ``match_regex("a(b+)","ABBBB")`` → ``[]``
        * ``match_regex("a(b+)","ABBBB","i")`` → ``["ABBBB","BBBB"]``

.. jme:function:: translate(str, arguments)

    Translate the given string, if it's in the localisation file.

    Look at `the default localisation file <https://github.com/numbas/Numbas/blob/master/locales/en-GB.json>`_ for strings which can be translated.
    This function takes a key representing a string to be translated, and returns the corresponding value from the current localisation file.

    ``arguments`` is a dictionary of named substitutions to make in the string.

    **Examples**:
        * ``translate("question.header",["number": 2])`` → ``"Question 2"`` (when the ``en-GB`` locale is in use)
        * ``translate("question.header",["number": 2])`` → ``"Pregunta 2"`` (when the ``es-ES`` locale is in use)

.. jme:function:: isbool(str)

    After converting to lower case, is ``str`` any of the strings ``"true"``, ``"false"``, ``"yes"`` or ``"no"``?
    
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
    Defined only for numbers.

    **Example**:
        * ``4<5``

.. jme:function:: x>y

    Returns ``true`` if ``x`` is greater than ``y``.
    Defined only for numbers.

    **Example**:
        * ``5>4``

.. jme:function:: x<=y

    Returns ``true`` if ``x`` is less than or equal to ``y``.
    Defined only for numbers.

    **Example**:
        * ``4<=4``

.. jme:function:: x>=y

    Returns ``true`` if ``x`` is greater than or equal to ``y``.
    Defined only for numbers.

    **Example**:
        * ``4>=4``

.. jme:function:: x<>y

    Returns ``true`` if ``x`` is not equal to ``y``.
    Defined for any data type.
    Returns ``true`` if ``x`` and ``y`` are not of the same data type.

    **Examples**:
        * ``'this string' <> 'that string'``
        * ``1<>2``
        * ``'1' <> 1``

.. jme:function:: x=y

    Returns ``true`` if ``x`` is equal to ``y``.
    Defined for any data type.
    Returns ``false`` if ``x`` and ``y`` are not of the same data type.

    **Examples**:
        * ``vector(1,2)=vector(1,2,0)``
        * ``4.0=4``

.. jme:function:: isclose(x,y,rel_tol,abs_tol)

    Returns ``true`` if ``x`` is close to ``y``.

    Equivalent to the following expression::

        abs(x-y) <= max( rel_tol*max(abs(a),abs(b)), abs_tol )

.. jme:function:: resultsequal(a,b,checkingFunction,accuracy)

    Returns ``true`` if ``a`` and ``b`` are both of the same data type, and "close enough" according to the given checking function.

    Vectors, matrices, and lists are considered equal only if every pair of corresponding elements in ``a`` and ``b`` is "close enough".

    ``checkingFunction`` is the name of a checking function to use.
    These are documented in `the Numbas runtime documentation <http://numbas.github.io/Numbas/Numbas.jme.html#.checkingFunctions>`_.

    **Examples**:
        * ``resultsequal(22/7,pi,"absdiff",0.001)`` → ``false``
        * ``resultsequal(22/7,pi,"reldiff",0.001)`` → ``true``

.. jme:function:: x and y

    Logical AND.
    Returns ``true`` if both ``x`` and ``y`` are true, otherwise returns false.

    **Examples**:
        * ``true and true``
        * ``true && true``
        * ``true & true``

.. jme:function:: not x

    Logical NOT.

    **Examples**:
        * ``not true``
        * ``!true``

.. jme:function:: x or y

    Logical OR.
    Returns ``true`` when at least one of ``x`` and ``y`` is true.
    Returns false when both ``x`` and ``y`` are false.

    **Examples**:
        * ``true or false``
        * ``true || false``

.. jme:function:: x xor y

    Logical XOR.
    Returns ``true`` when at either ``x`` or ``y`` is true but not both.
    Returns false when ``x`` and ``y`` are the same expression.

    **Example**:
        * ``true XOR false``.

.. jme:function:: x implies y

    Logical implication.
    If ``x`` is true and ``y`` is false, then the implication is false.
    Otherwise, the implication is true.

    **Example**:
        * ``false implies true``.

.. _jme-fns-ranges:

Ranges
------

.. jme:function:: a..b

    Define a range.
    Includes all integers between and including ``a`` and ``b``.

    **Examples**:
        * ``1..5``
        * ``-6..6``

.. jme:function:: a..b#s

    Set the step size for a range.
    Default is 1.
    When ``s`` is 0, the range includes all real numbers between the limits.

    **Examples**:
        * ``0..1 # 0.1``
        * ``2..10 # 2``
        * ``0..1#0``

.. jme:function:: a except b

    Exclude a number, range, or list of items from a list or range.

    **Examples**:
        * ``-9..9 except 0``
        * ``-9..9 except [-1,1]``
        * ``3..8 except 4..6``
        * ``[1,2,3,4,5] except [2,3]``

.. jme:function:: list(range)

    Convert a range to a list of its elements.

    **Example**:
        * ``list(-2..2)`` → ``[-2,-1,0,1,2]``

.. _jme-fns-lists:

Lists
-----

.. jme:function:: x[n]

    Get the ``n``:sup:`th` element of list, vector or matrix ``x``.
    For matrices, the ``n``:sup:`th` row is returned.

    **Examples**:
        * ``[0,1,2,3][1]`` → ``1``
        * ``vector(0,1,2)[2]`` → ``2``
        * ``matrix([0,1,2],[3,4,5],[6,7,8])[0]`` → ``matrix([0,1,2])``

.. jme:function:: x[a..b]
                x[a..b#c]

    Slice list ``x`` - return elements with indices in the given range.
    Note that list indices start at 0, and the final index is not included.

    **Example**:
        * ``[0,1,2,3,4,5][1..3]`` → ``[1,2]``
        * ``[0,1,2,3,4,5][1..6#2]`` → ``[1,3,5]``

.. jme:function:: x in collection

    Is element ``x`` in the list, set or range ``collection``?

    If ``collection`` is a dictionary, returns ``true`` if the dictionary has a key ``x``.

    **Examples**:
        * ``3 in [1,2,3,4]`` → ``true``
        * ``3 in (set(1,2,3,4) and set(2,4,6,8))`` → ``false``
        * ``"a" in ["a": 1]`` → ``true``
        * ``1 in ["a": 1]`` throws an error because dictionary keys must be strings.

.. jme:function:: repeat(expression,n)

    Evaluate ``expression`` ``n`` times, and return the results in a list.

    **Example**:
        * ``repeat(random(1..4),5)`` → ``[2, 4, 1, 3, 4]``

.. jme:function:: all(list)

    Returns ``true`` if every element of ``list`` is ``true``.


    **Examples**:
        * ``all([true,true])`` → ``true``
        * ``all([true,false])`` → ``false``
        * ``all([])`` → ``true``

.. jme:function:: some(list)

    Returns ``true`` if at least one element of ``list`` is ``true``.

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

    **Examples**:
        * ``map(x+1,x,1..3)`` → ``[2,3,4]``
        * ``map(capitalise(s),s,["jim","bob"])`` → ``["Jim","Bob"]``
        * ``map(sqrt(x^2+y^2),[x,y],[ [3,4], [5,12] ])`` → ``[5,13]``
        * ``map(x+1,x,id(2))`` → ``matrix([[2,1],[1,2]])``
        * ``map(sqrt(x),x,vector(1,4,9))`` → ``vector(1,2,3)``

.. jme:function:: filter(expression,name,d)

    Filter each item in list or range ``d``, replacing variable ``name`` with the element from ``d`` each time, returning only the elements for which ``expression`` evaluates to ``true``.

    .. note::
        Do not use ``i`` or ``e`` as the variable name to map over - they're already defined as mathematical constants!

    **Example**:
        * ``filter(x>5,x,[1,3,5,7,9])`` → ``[7,9]``

.. jme:function:: take(n,expression,name,d)

    Take the first ``n`` elements from list or range ``d``, replacing variable ``name`` with the element from ``d`` each time, returning only the elements for which ``expression`` evaluates to ``true``.

    This operation is lazy - once ``n`` elements satisfying the expression have been found, execution stops.
    You can use this to filter a few elements from a large list, where the condition might take a long time to calculate.

    .. note::
        Do not use ``i`` or ``e`` as the variable name to map over - they're already defined as mathematical constants!

    **Example**:
        * ``take(3,gcd(x,6)=1,x,10..30)`` → ``[11,13,17]``


.. jme:function:: let(name,definition,...,expression)
              let(definitions, expression)

    Evaluate ``expression``, temporarily defining variables with the given names.
    Use this to cut down on repetition.
    You can define any number of variables - in the first calling pattern, follow a variable name with its definition.
    Or you can give a dictionary mapping variable names to their values.
    The last argument is the expression to be evaluated.

    **Examples**:
        * ``let(d,sqrt(b^2-4*a*ac), [(-b+d)/2, (-b-d)/2])`` → ``[-2,-3]`` (when ``[a,b,c]`` = ``[1,5,6]``)
        * ``let(x,1, y,2, x+y)`` → ``3``
        * ``let(["x": 1, "y": 2], x+y)`` → ``3``

.. jme:function:: sort(x)

    Sort list ``x``.

    **Example**:
        * ``sort([4,2,1,3])`` → ``[1,2,3,4]``

.. jme:function:: sort_destinations(x)

    Return a list giving the index that each entry in the list will occupy after sorting.

    **Example**:
        * ``sort_destinations([4,2,1,3])`` → ``[3,1,0,2]``
        * ``sort_destinations([1,2,3,4])`` → ``[0,1,2,3]``

.. jme:function:: sort_by(key,list)

    Sort the given list of either :data:`list` or :data:`dict` values by their entries corresponding to the given key.
    When sorting a list of lists, the key is a number representing the index of each list to look at.
    When sorting a list of dictionaries, the key is a string.

    **Examples**:
        * ``sort_by(0, [[5,0], [3,2], [4,4]])`` → ``[[3,2], [4,4], [5,0]]``
        * ``sort_by("width", [["label": "M", "width": 20], ["label": "L", "width": 30], ["label": "S", "width": 10]]`` → ``[["label": "S", "width": 10], ["label": "M", "width": 20], ["label": "L", "width": 30]]``

.. jme:function:: group_by(key,list)

    Group the entries in the given list of either :data:`list` or :data:`dict` values by their entries corresponding to the given key.
    The returned value is a list of lists of the form ``[key, group]``, where ``key`` is the value all elements of the list ``group`` have in common.

    When grouping a list of lists, the ``key`` argument is a number representing the index of each list to look at.
    When grouping a list of dictionaries, the ``key`` argument is a string.

    **Examples**:
        * ``group_by(0, [[0,0], [3,2], [0,4]])`` → ``[[0, [[0,0], [0,4]]], [3, [[3,2]]]``
        * ``group_by("a", [["a": 1, "b": "M"], ["a": 2, "b": "S"], ["a": 1, "b": "XL"]])`` → ``[[1,[["a": 1, "b": "M"], ["a: 1, "b": "XL"]]], [2, [["a": 2, "b": "S"]]]]``

.. jme:function:: reverse(x)

    Reverse list ``x``.

    **Example**:
        * ``reverse([1,2,3])`` → ``[3,2,1]``

.. jme:function:: indices(list,value)

    Find the indices at which ``value`` occurs in ``list``.

    **Examples**:
        * ``indices([1,0,1,0],1)`` → ``[0,2]``
        * ``indices([2,4,6],4)`` → ``[1]``
        * ``indices([1,2,3],5)`` → ``[]``

.. jme:function:: distinct(x)

    Return a copy of the list ``x`` with duplicates removed.

    **Example**:
        * ``distinct([1,2,3,1,4,3])`` → ``[1,2,3,4]``

.. jme:function:: list(x)

    Convert set, vector or matrix ``x`` to a list of components (or rows, for a matrix).

    **Examples**:
        * ``list(set(1,2,3))`` → ``[1,2,3]`` (note that you can't depend on the elements of sets being in any order)
        * ``list(vector(1,2))`` → ``[1,2]``
        * ``list(matrix([1,2],[3,4]))`` → ``[[1,2], [3,4]]``

.. jme:function:: make_variables(definitions)

    Evaluate a dictionary of variable definitions and return a dictionary containing the generated values.

    ``definitions`` is a dictionary mapping variable names to :data:`expression` values corresponding to definitions.

    The definitions can refer to other variables to be evaluated, or variables already defined in the current scope.
    Variables named in the dictionary which have already been defined will be removed before evaluation begins.

    **Example**:
        * ``make_variables(["a": expression("random(1..5)"), "b": expression("a^2")])`` → ``["a": 3, "b": 9]``

.. jme:function:: satisfy(names,definitions,conditions,maxRuns)

    Each variable name in ``names`` should have a corresponding definition expression in ``definitions``.
    ``conditions`` is a list of expressions which you want to evaluate to ``true``.
    The definitions will be evaluated repeatedly until all the conditions are satisfied, or the number of attempts is greater than ``maxRuns``.
    If ``maxRuns`` isn't given, it defaults to 100 attempts.

    .. note::
        This function is deprecated, and retained only for backwards compatibility.
        Use :jme:func:`make_variables` instead.

    **Example**:
        * ``satisfy([a,b,c],[random(1..10),random(1..10),random(1..10)],[b^2-4*a*c>0])``

.. jme:function:: sum(numbers)

    Add up a list of numbers

    **Example**:
        * ``sum([1,2,3])`` → ``6``

.. jme:function:: product(list1,list2,...,listN) or product(list, n)

    Cartesian product of lists.
    In other words, every possible combination of choices of one value from each given list.

    If one list and a number are given, then the ``n``-th Cartesian power of the list is returned: the Cartesian product of ``n`` copies of the list.

    **Example**:
        * ``product([1,2],[a,b])`` → ``[ [1,a], [1,b], [2,a], [2,b] ]``
        * ``product([1,2],2)`` → ``[ [1,1], [1,2], [2,1], [2,2] ]``

.. jme:function:: zip(list1,list2,...,listN)

    Combine two (or more) lists into one - the Nth element of the output is a list containing the Nth elements of each of the input lists.

    **Example**:
        * ``zip([1,2,3],[4,5,6])`` → ``[ [1,4], [2,5], [3,6] ]``

.. jme:function:: combinations(collection,r)

    All ordered choices of ``r`` elements from ``collection``, without replacement.

    **Example**:
        * ``combinations([1,2,3],2)`` → ``[ [1,2], [1,3], [2,3] ]``

.. jme:function:: combinations_with_replacement(collection,r)

    All ordered choices of ``r`` elements from ``collection``, with replacement.

    **Example**:
        * ``combinations([1,2,3],2)`` → ``[ [1,1], [1,2], [1,3], [2,2], [2,3], [3,3] ]``

.. jme:function:: permutations(collection,r)

    All choices of ``r`` elements from ``collection``, in any order, without replacement.

    **Example**:
        * ``permutations([1,2,3],2)`` → ``[ [1,2], [1,3], [2,1], [2,3], [3,1], [3,2] ]``

.. _jme-fns-dictionaries:

Dictionaries
------------

.. jme:function:: dict[key]

    Get the value corresponding to the given key string in the dictionary ``d``.

    If the key is not present in the dictionary, an error will be thrown.

    **Example**:
        * ``["a": 1, "b": 2]["a"]`` → ``1``

.. jme:function:: get(dict,key,default)

    Get the value corresponding to the given key string in the dictionary.

    If the key is not present in the dictionary, the ``default`` value will be returned.

    **Examples**:
        * ``get(["a":1], "a", 0)`` → ``1``
        * ``get(["a":1], "b", 0)`` → ``0``

.. jme:function:: dict(a:b, c:d, ...) 
        dict(pairs)

    Create a dictionary with the given key-value pairs.
    Equivalent to ``[ .. ]``, except when no key-value pairs are given: ``[]`` creates an empty *list* instead.

    You can alternately pass a list of pairs of the form ``[key, value]``, to transform a list into a dictionary.

    **Examples**:
        * ``dict()``
        * ``dict("a": 1, "b": 2)``
        * ``dict([ ["a",1], ["b",2] ])``

.. jme:function:: keys(dict)

    A list of all of the given dictionary's keys.

    **Example**:
        * ``keys(["a": 1, "b": 2, "c": 1])`` → ``["a","b","c"]``

.. jme:function:: values(dict)
              values(dict,keys)

    A list of the values corresponding to each of the given dictionary's keys.

    If a list of keys is given, the values corresponding to those keys are returned, in the same order.

    **Examples**:
        * ``values(["a": 1, "b": 2, "c": 1])`` → ``[1,2,1]``
        * ``values(["a": 1, "b": 2, "c": 3], ["b","a"])`` → ``[2,1]``

.. jme:function:: items(dict)

    A list of all of the ``[key,value]`` pairs in the given dictionary.

    **Example**:
        * ``values(["a": 1, "b": 2, "c": 1])`` → ``[ ["a",1], ["b",2], ["c",1] ]``

.. _jme-fns-sets:

Sets
----

.. jme:function:: set(a,b,c,...) or set([elements])

    Create a set with the given elements.
    Either pass the elements as individual arguments, or as a list.

    **Examples**:
        * ``set(1,2,3)``
        * ``set([1,2,3])``

.. jme:function:: union(a,b)

    Union of sets ``a`` and ``b``

    **Examples**:
        * ``union(set(1,2,3),set(2,4,6))`` → ``set(1,2,3,4,6)``
        * ``set(1,2,3) or set(2,4,6)`` → ``set(1,2,3,4,6)``

.. jme:function:: intersection(a,b)

    Intersection of sets ``a`` and ``b``, i.e. elements which are in both sets.

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

    **Examples**:
        * ``random(1..5)``
        * ``random([1,2,4])``
        * ``random(1,2,3)``

.. jme:function:: deal(n)

    Get a random shuffling of the integers :math:`[0 \dots n-1]`

    **Example**:
        * ``deal(3)`` → ``[2,0,1]``

.. jme:function:: shuffle(x) or shuffle(a..b)

    Random shuffling of list or range.

    **Examples**:
        * ``shuffle(["a","b","c"])`` → ``["c","b","a"]``
        * ``shuffle(0..4)`` → ``[2,3,0,4,1]``

.. _jme-fns-control-flow:

Control flow
------------

.. jme:function:: award(a,b)

    Return ``a`` if ``b`` is ``true``, else return ``0``.

    **Example**:
        * ``award(5,true)`` → ``5``

.. jme:function:: if(p,a,b)

    If ``p`` is ``true``, return ``a``, else return ``b``.
    Only the returned value is evaluated.

    **Example**:
        * ``if(false,1,0)`` → ``0``

.. jme:function:: switch(p1,a1,p2,a2, ..., pn,an,d)

    Select cases.
    Alternating boolean expressions with values to return, with the final argument representing the default case.
    Only the returned value is evaluated.

    **Examples**:
        * ``switch(true,1,false,0,3)`` → ``1``
        * ``switch(false,1,true,0,3)`` → ``0``
        * ``switch(false,1,false,0,3)`` → ``3``

.. jme:function:: assert(bool, value)

    If ``bool`` is ``false``, then return ``value``, otherwise don't evaluate ``value`` and return ``false``.
    This is intended for use in marking scripts, to apply marking feedback only if a condition is met.

    **Example**:
        * ``assert(studentAnswer<=0, correct("Student answer is positive"))``

.. jme:function:: try(expression, name, except)

    Try to evaluate ``expression``.
    If it is successfully evaluated, return the result.
    Otherwise, evaluate ``except``, with the error message available as ``name``.

    **Examples**:
        * ``try(eval(expression("x+")),err, "Error: "+err)`` → ``"Error: Not enough arguments for operation <code>+</code>"``
        * ``try(1+2,err,0)`` → ``3``

.. _jme-fns-html:

HTML
----

.. jme:function:: html(x)

    Parse string ``x`` as HTML.

    **Example**:
        * ``html('<div>Text!</div>')``

.. jme:function:: isnonemptyhtml(str)

    Does ``str`` represent a string of HTML containing text?
    Returns false for the empty string, or HTML elements with no text content.

    **Examples**:
        * ``isnonemptyhtml("<p>Yes</p>")`` → ``true``
        * ``isnonemptyhtml("<p></p>")`` → ``false``

.. jme:function:: table(data), table(data,headers)

    Create an HTML with cell contents defined by ``data``, which should be a list of lists of data, and column headers defined by the list of strings ``headers``.

    **Examples**:
        * ``table([[0,1],[1,0]], ["Column A","Column B"])``
        * ``table([[0,1],[1,0]])``

.. jme:function:: image(url)

    Create an HTML `img` element loading the image from the given URL.
    Images uploaded through the resources tab are stored in the relative URL `resources/images/<filename>.png`, where `<filename>` is the name of the original file.

    **Examples**:
        * ``image('resources/images/picture.png')``
        * ``image(chosenimage)``
        * `Question using randomly chosen images <https://numbas.mathcentre.ac.uk/question/1132/using-a-randomly-chosen-image/>`_.

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

    **Example**:
        * ``json_decode(' {"a": 1, "b": [2,true,"thing"]} ')`` → ``["a": 1, "b": [2,true,"thing"]]``

.. jme:function:: json_encode(data)

    Convert the given object to a JSON string.

    Numbers, strings, booleans, lists, and dictionaries are converted in a straightforward manner.
    Other data types may behave unexpectedly.

    **Example**:
        * ``json_encode([1,"a",true])`` → ``'[1,"a",true]'``

.. _jme-fns-subexpressions:

Sub-expressions
---------------

.. jme:function:: expression(string)

    Parse a string as a JME expression.
    The expression can be substituted into other expressions, such as the answer to a mathematical expression part, or the ``\simplify`` LaTeX command.

    ``parse(string)`` is a synonym for ``expression(string)``.

    **Example**:
        * `A question using randomly chosen variable names <https://numbas.mathcentre.ac.uk/question/20358/randomise-variable-names-expression-version/>`_.

.. jme:function:: eval(expression, values)

    Evaluate the given sub-expression.

    If ``values`` is given, it should be a dictionary mapping names of variables to their values.

    **Example**:
        * ``eval(expression("1+2"))`` → ``3``
        * ``eval(expression("x+1"), ["x":1])`` → ``2``

.. jme:function:: args(expression)

    Returns the arguments of the top-level operation of ``expression``, as a list of sub-expressions.
    If ``expression`` is a data type other than an operation or function, an empty list is returned.

    Binary operations only ever have two arguments.
    For example, ``1+2+3`` is parsed as ``(1+2)+3``.

    **Examples**:
        * ``args(expression("f(x)"))`` → ``[expression("x")]``
        * ``args(expression("1+2+3"))`` → ``[expression("1+2"), expression("3")]``
        * ``args(expression("1"))`` → ``[]``

.. jme:function:: type(expression)

    Returns the name of the :ref:`data type <jme-data-types>` of the top token in the expression, as a string.

    **Examples**:
        * ``type(x)`` → ``"name"``
        * ``type(1)`` → ``"number"``
        * ``type(x+1)`` → ``"op"``
        * ``type(sin(x))`` → ``"function"``

.. jme:function:: name(string)

    Construct a :data:`name` token with the given name.

    **Example**:
        * ``name("x")`` → ``x``

.. jme:function:: string(name)

    Return the given variable name as a string.

    **Example**:
        * ``string(x)`` → ``"x"``

.. jme:function:: op(name)

    Construct an operator with the given name.

    **Example**:
        * ``op("+")`` → ``+``

.. jme:function:: exec(op, arguments)

    Returns a sub-expression representing the application of the given operation to the list of arguments.

    **Example**:
        * ``exec(op("+"), [2,1])`` → ``expression("2+1")``
        * ``exec(op("-"), [2,name("x")])`` → ``expression("2-x")``

.. jme:function:: findvars(expression)

    Return a list of all unbound variables used in the given expression.
    Effectively, this is all the variables that need to be given values in order for this expression to be evaluated.

    *Bound variables* are those defined as part of operations which also assign values to those variables, such as ``map`` or ``let``.

    **Examples**:
        * ``findvars(expression("x+1"))`` → ``[x]``
        * ``findvars(expression("x + x*y"))`` → ``[x,y]``
        * ``findvars(expression("map(x+2, x, [1,2,3])"))`` → ``[]``

.. jme:function:: simplify(expression,rules)

    Apply the given simplification rules to ``expression``, until no rules apply.

    ``rules`` is a list of names of rules to apply, given either as a string containing a comma-separated list of names, or a list of strings.

    Unlike the `\\simplify`` command in content areas, the ``basic`` rule is not turned on by default.

    See :ref:`simplification-rules` for a list of rules available.

    **Examples**:
        * ``simplify(expression("1*x+cos(pi)","unitfactor"))`` → ``expression("x+cos(pi)")``
        * ``simplify(expression("1*x+cos(pi)"),["basic","unitfactor","trig"])`` → ``expression("x-1")``

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

    **Examples**:
        * ``canonical_compare(a,b)`` → ``-1``
        * ``canonical_compare(f(y),g(x))`` → ``1``
        * ``canonical_compare(f(x),g(x))`` → ``-1``
        * ``canonical_compare("a","b")`` → ``0``

.. _jme-fns-pattern-matching:

Pattern-matching sub-expressions
--------------------------------

.. jme:function:: match(expr, pattern)

    If ``expr`` matches ``pattern``, return a dictionary of the form ``["match": boolean, "groups": dict]``, where ``"groups"`` is a dictionary mapping names of matches to sub-expressions.

    See ``pattern-matching`` for more on matching mathematical expressions.

    If you don't need to use any parts of the matched expression, use :jme:func:`matches` instead.

    **Examples**:
        * ``match(expression("x+1"),"?;a + ?;b")`` → ``["match": true, "groups": ["a": expression("x"), "b": expression("1")])``
        * ``match(expression("sin(x)", "?;a + ?;b")`` → ``["match": false, "groups": []]``
        * ``match(expression("x+1"),"1+?;a")`` → ``["match": true, "groups": ["a": expression("x")]]``

.. jme:function:: matches(expr, pattern)

    Return ``true`` if ``expr`` matches ``pattern``.

    Use this if you're not interested in capturing any parts of the matched expression.

    **Examples**:
        * ``matches(expression("x+1"),"?;a + ?;b")`` → ``true``
        * ``match(expression("sin(x)", "?;a + ?;b")`` → ``false``

.. jme:function:: replace(pattern, replacement, expr)

    Replace occurrences of ``pattern`` in ``expr`` with the expression created by substituting the matched items into ``replacement``.

    **Examples**:
        * ``replace("?;x + ?;y", "x*y", expression("1+2"))`` → ``expression("1*2")``
        * ``replace("?;x + ?;y", "f(x,y)", expression("1+2+3"))`` → ``expression("f(f(1,2),3)")``
        * ``replace("0*?", "0", expression("0*sin(x) + x*0 + 2*cos(0*pi)"))`` → ``expression("0 + x*0 + 2*cos(0)")``

.. _jme-fns-data-types:

Identifying data types
----------------------

.. jme:function:: type(x)

    Returns the name of the :ref:`data type <jme-data-types>` of ``x``.

    **Example**:
        * ``type(1)`` → ``"number"``

.. jme:function:: x isa type

    Returns ``true`` if ``x`` is of the :ref:`data type <jme-data-types>` ``type``.

    **Examples**:
        * ``1 isa "number"`` → ``true``
        * ``x isa "name"`` → ``true`` (if ``x`` is not defined in this scope)
        * ``x isa "number"`` → ``true`` (if ``x`` has a numerical value in this scope)

.. jme:function:: infer_variable_types(expression)

    Attempt to infer the types of free variables in the given expression.

    There can be more than one valid assignment of types to the variables in an expression.
    For example, in the expression ``a+a``, the variable ``a`` can be any type which has a defined addition operation.

    Returns a list of possible assignments of types to variables.
    Each assignment is a dictionary mapping variable names to the name of its type.
    If a variable name is missing from the dictionary, the algorithm can't establish any constraint on it.

    **Example**:
        * ``infer_variable_types(expression("x^2"))`` → ``[ ["x": "number"] ]``
        * ``infer_variable_types(expression("union(a,b)"))`` → ``[ ["a": "set", "b": "set"] ]``
        * ``infer_variable_types(expression("k*det(a)"))`` → ``[ [ "k": "number", "a": "matrix" ], [ "k": "matrix", "a": "matrix" ], [ "k": "vector", "a": "matrix" ] ]``

.. _jme-fns-inspecting-the-scope:

Inspecting the evaluation scope
-------------------------------

.. jme:function:: definedvariables()

    Returns a list containing the names of every variable defined in the current scope, as strings.

.. jme:function:: isset(name)

    Returns ``true`` if the variable with the given name has been defined in the current scope.

.. jme:function:: unset(names, expression)

    Temporarily remove the named variables, functions and rulesets from the scope, and evaluate the given expression.

    ``names`` is a dictionary of the form ``["variables": list, "functions": list, "rulesets": list]``.
