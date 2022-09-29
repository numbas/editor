.. _simplification-rules:

Substituting variables into displayed maths
===========================================

.. attention::
    This page is about substituting variables into *mathematical expressions*. 
    You can substitute text strings into plain text using curly braces; see :ref:`substituting-into-content` for a description of the different methods of substituting variables into question text.

In Numbas, maths is displayed using LaTeX. 
For help with LaTeX, see :ref:`LaTeX notation`.

LaTeX is purely a typesetting language and is ill-suited for representing *meaning* in addition to *layout*. 
For this reason, dynamic or randomised maths expressions must be written in JME syntax and converted to LaTeX. 
Numbas provides two new LaTeX commands to do this for you.

To *substitute* the result of an expression into a LaTeX expression, use the ``\var`` command. 
Its parameter is a JME expression, which is evaluated and then converted to LaTeX.

For example::

    \[ \var{2^3} \]

produces::

    \[ 8 \]

and if a variable called x has been defined to have the value 3::

    \[ 2^{\var{x}} \]

produces::

    \[ 2^{3} \]

This simple substitution doesn't always produce attractive results, for example when substituted variables might have negative values. 
If :math:`y=-4`::

\[ \var{x} + \var{y} \]

produces::

    \[ 3 + -4 \]

To deal with this, and other more complicated substitutions, there is the ``\simplify`` command.

The main parameter of the ``\simplify`` command is a JME expression. 
It is not evaluated - it is converted into LaTeX as it stands. 
For example::

    \[ \simplify{ x + (-1/y) } \]

produces::

    \[ x - \frac{1}{y} \]

Variables can be substituted in by enclosing them in curly braces. 
For example::

    \[ \simplify{ {x} / {y} } \]

produces, when :math:`x=2,y=3`::

    \[ \frac{ 2 }{ 3 } \]

The ``\simplify`` command automatically rearranges expressions, according to a set of simplification rules, to make them look more natural. 
Sometimes you might not want this to happen, for example while writing out the steps in a worked solution.

The set of rules to be used is defined in a list enclosed in square brackets before the main argument of the ``\simplify`` command. 
You can control the ``\simplify`` command's behaviour by switching rules on or off.

For example, in::

    \[ \simplify{ 1*x } \]

I have not given a list of rules to use, so they are all switched on. 
The ``unitFactor`` rule cancels the redundant factor of 1 to produce::

    \[ x \]

while in::

    \[ \simplify[!unitFactor]{ 1*x } \]

I have turned off the unitFactor rule, leaving the expression as it was::

    \[ 1 x \]

When a list of rules is given, the list is processed from left to right. 
Initially, no rules are switched on. 
When a rule's name is read, that rule is switched on, or if it has an exclamation mark in front of it, that rule is switched off.

Sets of rules can be given names in the question's :ref:`rulesets` section, so they can be turned on or off in one go.

.. _jme-display-options:

Display options
***************

The ``\simplify`` and ``\var`` commands take an optional list of settings, separated by commas. 
These affect how certain elements, such as numbers or vectors, are displayed.

The following display options are available:

.. glossary::

    fractionNumbers
        This rule doesn't rewrite expressions, but tells the maths renderer that you'd like non-integer numbers to be displayed as fractions instead of decimals.

        **Example:** ``\var[fractionNumbers]{0.5}`` produces :math:`\frac{1}{2}`.

    mixedFractions
        Improper fractions (with numerator larger than the denominator) are displayed in mixed form, as an integer next to a proper fraction.

        **Example:** ``\var[fractionNumbers,mixedFractions]{22/7}`` produces :math:`3 \frac{1}{7}`.

    flatFractions
        Fractions are displayed on a single line, with a slash between the numerator and denominator.

        **Example:** ``\simplify[fractionNumbers]{x/2}`` produces :math:`\left. x \middle/ 2 \right.`.

    rowVector
        This rule doesn't rewrite expressions, but tells the maths renderer that you'd like vectors to be rendered as rows instead of columns.

    matrixCommas
        When not set, the default behaviour is that row-vectors and matrices with one row have commas between horizontally adjacent elements.
        Matrices with more than one row don't have commas.

        When turned on, all matrices and row-vectors have commas between horizontally adjacent elements.

        When turned off, commas are never used between elements of matrices or vectors.

    alwaysTimes
        The multiplication symbol is always included between multiplicands.

        **Example:** ``\simplify[alwaysTimes]{ 2x }`` produces :math:`2 \times x`.

    timesDot
        Use a dot for the multiplication symbol instead of a cross.

        **Example:** ``\simplify[timesDot]{ 2*3 }`` produces :math:`2 \cdot 3`.

    timesSpace
        Instead of drawing a cross between terms being multiplied, just leave a small space.

        **Example:** ``\simplify[timesSpace]{ x*(x+1) }`` produces :math:`x \; (x + 1)`.

    bareMatrices
        Matrices are rendered without parentheses.

        **Example:** ``\var[bareMatrices]{ id(3) }`` produces :math:`\begin{matrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{matrix}`.
        

Simplification rules
********************

As well as the display options, the ``\simplify`` command takes an optional list of names of simplification rules to use, separated by commas.
These rules affect how the command rearranges the expression you give it.

Lists of simplification rule names are read from left to right, and rules are added or removed from the set in use as their names are read. 
To include a rule, use its name, e.g. ``unitfactor``. 
To exclude a rule, put an exclamation mark in front of its name, e.g. ``!unitfactor``.

Rule names are not case-sensitive: any mix of lower-case or upper-case works. 

To turn all built-in rules on, use the name ``all``. 
To turn all built-in rules off, use ``!all``.

**Note:** Because they can conflict with other rules, the :term:`canonicalOrder` and :term:`expandBrackets` rules are not included in ``all``. 
You must include them separately.

If you don't give a list of options, e.g. ``\simplify{ ... }``, all the built-in rules are used.
If you give an empty list of options, e.g. ``\simplify[]{ ... }``, **no** rules are used.

For example, the following code::

    \simplify[all,!collectNumbers,fractionNumbers]{ 0.5*x + 1*x^2 - 2 - 3 }

turns on every rule, but then turns off the ``collectNumbers`` rule, so every rule *except* ``collectNumbers`` can be applied.
Additionally, the display option ``fractionNumbers`` is turned on, so the ``0.5`` is displayed as :math:`\frac{1}{2}`.

Altogether, this produces the following rendering: :math:`\frac{1}{2} x + x^2 - 2 - 3`.

`This example question <https://numbas.mathcentre.ac.uk/question/78727/control-how-expressions-are-simplified-simplify/>`__ shows how to control the simplification process by specifying which rules to use.

The following simplification rules are available:

.. _simplification-rule-glossary:

.. glossary::

    basic
        These rules are always turned on, even if you give an empty list of rules. 
        They must be actively turned off, by including ``!basic`` in the list of rules.
        See `this behaviour in action <https://numbas.mathcentre.ac.uk/question/22839/when-does-the-basic-ruleset-get-turned-on/>`_.

        * ``+x`` → ``x`` (get rid of unary plus)
        * ``x+(-y)`` → ``x-y`` (plus minus = minus)
        * ``x-(-y)`` → ``x+y`` (minus minus = plus)
        * ``-(-x)`` → ``x`` (unary minus minus = plus)
        * ``-x`` → ``eval(-x)`` (if unary minus on a complex number with negative real part, rewrite as a complex number with positive real part)
        * ``x+y`` → ``eval(x+y)`` (always collect imaginary parts together into one number)
        * ``-x+y`` → ``-eval(x-y)`` (similarly, for negative numbers)
        * ``(-x)/y`` → ``-(x/y)`` (take negation to left of fraction)
        * ``x/(-y)`` → ``-(x/y)``
        * ``(-x)*y`` → ``-(x*y)`` (take negation to left of multiplication)
        * ``x*(-y)`` → ``-(x*y)``
        * ``x+(y+z)`` → ``(x+y)+z`` (make sure sums calculated left-to-right)
        * ``x-(y+z)`` → ``(x-y)-z``
        * ``x+(y-z)`` → ``(x+y)-z``
        * ``x-(y-z)`` → ``(x-y)+z``
        * ``(x*y)*z`` → ``x*(y*z)`` (make sure multiplications go right-to-left)
        * ``n*i`` → ``eval(n*i)`` (always collect multiplication by :math:`i`)
        * ``i*n`` → ``eval(n*i)``

    unitFactor
        Cancel products of 1

        * ``1*x`` → ``x``
        * ``x*1`` → ``x``

    unitPower
        Cancel exponents of 1

        * ``x^1`` → ``x``

    unitDenominator
        Cancel fractions with denominator 1

        * ``x/1`` → ``x``

    zeroFactor
        Cancel products of zero to zero

        * ``x*0`` → ``0``
        * ``0*x`` → ``0``
        * ``0/x`` → ``0``

    zeroTerm
        Omit zero terms

        * ``0+x`` → ``x``
        * ``x+0`` → ``x``
        * ``x-0`` → ``x``
        * ``0-x`` → ``-x``

    zeroPower
        Cancel exponents of 0

        * ``x^0`` → ``1``

    powerPower
        Collect numerical powers of powers.

        The rule belows is only applied if ``n`` and ``m`` are numbers.

        * ``(x^n)^m`` → ``x^eval(n*m)``

    noLeadingMinus
        Rearrange expressions so they don't start with a unary minus

        * ``-x+y`` → ``y-x``
        * ``-0`` → ``0``

    collectNumbers
        Collect together numerical (as opposed to variable) products and sums. 
        The rules below are only applied if ``n`` and ``m`` are numbers.
    
        * ``-x-y`` → ``-(x+y)`` (collect minuses)
        * ``n+m`` → ``eval(n+m)`` (add numbers)
        * ``n-m`` → ``eval(n-m)`` (subtract numbers)
        * ``n+x`` → ``x+n`` (numbers go to the end of expressions)
        * ``(x+n)+m`` → ``x+eval(n+m)`` (collect number sums)
        * ``(x-n)+m`` → ``x+eval(m-n)``
        * ``(x+n)-m`` → ``x+eval(n-m)``
        * ``(x-n)-m`` → ``x-eval(n+m)``
        * ``(x+n)+y`` → ``(x+y)+n`` (numbers go to the end of expressions)
        * ``(x+n)-y`` → ``(x-y)+n``
        * ``(x-n)+y`` → ``(x+y)-n``
        * ``(x-n)-y`` → ``(x-y)-n``
        * ``n*m`` → ``eval(n*m)`` (multiply numbers)
        * ``x*n`` → ``n*x`` (numbers go to left hand side of multiplication, unless :math:`n=i`)
        * ``m*(n*x)`` → ``eval(n*m)*x``

    simplifyFractions
        Cancel fractions to lowest form.
        The rules below are only applied if ``n`` and ``m`` are numbers and :math:`gcd(n,m) > 1`.

        * ``n/m`` → ``eval(n/gcd(n,m))/eval(m/gcd(n,m))`` (cancel simple fractions)
        * ``(n*x)/m`` → ``(eval(n/gcd(n,m))*x)/eval(m/gcd(n,m))`` (cancel algebraic fractions)
        * ``n/(m*x)`` → ``eval(n/gcd(n,m))/(eval(m/gcd(n,m))*x)``
        * ``(n*x)/(m*y)`` → ``(eval(n/gcd(n,m))*x)/(eval(m/gcd(n,m))*y)``
        * ``(a/(b/c))`` → ``(a*c)/b``


    zeroBase
        Cancel any power of zero

        * ``0^x`` → ``0``

    constantsFirst
        Numbers go to the left of multiplications

        * ``x*n`` → ``n*x``
        * ``x*(n*y)`` → ``n*(x*y)``

    sqrtProduct
        Collect products of square roots

        * ``sqrt(x)*sqrt(y)`` → ``sqrt(x*y)``

    sqrtDivision
        Collect fractions of square roots

        * ``sqrt(x)/sqrt(y)`` → ``sqrt(x/y)``

    sqrtSquare
        Cancel square roots of squares, and squares of square roots

        * ``sqrt(x^2)`` → ``x``
        * ``sqrt(x)^2`` → ``x``
        * ``sqrt(n)`` → ``eval(sqrt(n))``   (if ``n`` is a square number)

    trig
        Simplify some trigonometric identities

        * ``sin(n)`` → ``eval(sin(n))`` (if ``n`` is a multiple of :math:`\frac{\pi}{2}`)
        * ``cos(n)`` → ``eval(cos(n))`` (if ``n`` is a multiple of :math:`\frac{\pi}{2}`)
        * ``tan(n)`` → ``0`` (if ``n`` is a multiple of :math:`\pi`)
        * ``cosh(0)`` → ``1``
        * ``sinh(0)`` → ``0``
        * ``tanh(0)`` → ``0``

    otherNumbers
        Evaluate powers of numbers.
        This rule is only applied if ``n`` and ``m`` are numbers.

        * ``n^m`` → ``eval(n^m)``

    cancelTerms
        Collect together and cancel terms.
        Like :term:`collectNumbers`, but for any kind of term.

        * ``x +x`` → ``2*x``
        * ``(z+n*x) - m*x`` → ``z + eval(n-m)*x``
        * ``1/x + 3/x`` → ``4/x``

    cancelFactors
        Collect together powers of common factors.

        * ``x * x`` → ``x^2``
        * ``(x+1)^6 / (x+1)^2`` → ``(x+1)^4``

    collectLikeFractions
        Collect together fractions over the same denominator.

        * ``x/3 + 4/3`` → ``(x+4)/3``

    canonicalOrder
        Rearrange the expression into a "canonical" order, using :jme:func:`canonical_compare`.

        **Note:** This rule can not be used at the same time as :term:`noLeadingMinus` - it can lead to an infinite loop.

    expandBrackets
        Expand out products of sums.

        * ``(x+y)*z`` → ``x*z + y*z``
        * ``3*(x-y)`` → ``3x - 3y``

    rationalDenominators
        Multiply top and bottom of fractions so that there are no square roots in the denominator.

        * ``1/sqrt(2)`` → ``sqrt(2)/2``

    reduceSurds
        Extract square numbers or factors from square roots.

        * ``sqrt(12)`` → ``2*sqrt(3)``
        * ``sqrt(x^2 * y^5)`` → ``x * y^2 * sqrt(y)``

.. _display_only_functions:

Display-only JME functions
**************************

There are a few "virtual" JME functions which can not be evaluated, but allow you to express certain constructs for the purposes of display, while interacting properly with the simplification rules.

.. jme:function:: int(expression, variable)
    :keywords: integrate, integral, indefinite

    An indefinite integration, with respect to the given variable.

    * ``int(x^2+2,x)`` → :math:`\displaystyle{\int \! x^2+2 \, \mathrm{d}x}`
    * ``int(cos(u),u)`` → :math:`\displaystyle{\int \! \cos(u) \, \mathrm{d}u}`

.. jme:function:: defint(expression, variable,lower bound, upper bound)
    :keywords: integrate, integral, definite

    A definite integration between the two given bounds.

    * ``defint(x^2+2,x,0,1)`` → :math:`\displaystyle{\int_{0}^{1} \! x^2+2 \, \mathrm{d}x}`
    * ``defint(cos(u),u,x,x+1)`` → :math:`\displaystyle{\int_{x}^{x+1} \! \cos(u) \, \mathrm{d}u}`

.. jme:function:: diff(expression, variable, n)
    :keywords: differentiate, derivative, calculus

    :math:`n`-th derivative of expression with respect to the given variable

    * ``diff(y,x,1)`` → :math:`\frac{\mathrm{d}y}{\mathrm{d}x}`
    * ``diff(x^2+2,x,1)`` → :math:`\frac{\mathrm{d}}{\mathrm{d}x} \left (x^2+2 \right )`
    * ``diff(y,x,2)`` → :math:`\frac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}}`

.. jme:function:: partialdiff(expression, variable, n)
    :keywords: differentiate, derivative, calculus

    :math:`n`-th partial derivative of expression with respect to the given variable

    * ``partialdiff(y,x,1)`` → :math:`\frac{\partial y}{\partial x}`
    * ``partialdiff(x^2+2,x,1)`` → :math:`\frac{\partial }{\partial x} \left (x^2+2 \right )`
    * ``partialdiff(y,x,2)`` → :math:`\frac{\partial{2}y}{\partial x^{2}}`

.. jme:function:: sub(expression,index)
    :keywords: subscript

    Add a subscript to a variable name. 
    Note that variable names with constant subscripts are already rendered properly -- see :ref:`variable-names` -- but this function allows you to use an arbitray index, or a more complicated expression.

    * ``sub(x,1)`` → :math:`x_{1}`
    * ``sub(x,n+2)`` → :math:`x_{n+2}`

    The reason this function exists is to allow you to randomise the subscript. 
    For example, if the index to be used in the subscript is held in the variable ``n``, then this::

        \simplify{ sub(x,{n}) }

    will be rendered as 

        :math:`x_{1}`

    when ``n = 1``.

.. jme:function:: sup(expression,index)
    :keywords: superscript

    Add a superscript to a variable name.
    Note that the simplification rules to do with powers won't be applied to this function, since it represents a generic superscript notation, rather than the operation of raising to a power.

    * ``sup(x,1)`` → :math:`x^{1}`
    * ``sup(x,n+2)`` → :math:`x^{n+2}`
