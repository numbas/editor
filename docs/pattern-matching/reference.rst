.. _pattern-matching-reference:

Pattern-matching syntax
-----------------------

Patterns are written in JME syntax, but there are extra operators available to specify what does or doesn't match.

The pattern-matching algorithm uses a variety of techniques to match different kinds of expression.

**Data elements** such as numbers, strings, booleans are matched by comparison: a pattern consisting of a single data element matches only that exact element.

A pattern consisting of a **function application** function application ``f(arguments...)`` matches any expression consisting of an application of exactly that function, and whose arguments, considered as a sequence, match the sequence of patterns ``arguments``.
There are some special functions which match differently.
If the same group name is captured by more than one argument, then all the groups captured under that name are gathered into a list.

A pattern consisting of a sequence of terms joined by a binary **operator**, or a single term with a unary operator applied, is considered as a sequence. 
If a way of matching up the terms in the input expression with the terms in the pattern can be found, considering quantifiers and the properties of commutativity and associativity, then the expression matches the pattern.
If the same group name is captured by more than one argument, then all the groups captured under that name are gathered into a sequence joined by the operator being matched.

A pattern consisting of a **list** matches any expression consisting of a single list, whose elements match the elements of the list in the pattern.
Quantifiers allow you to write a pattern which matches lists with different numbers of terms.



Special names
#############

.. jme:variable:: ?

    Matches anything.

.. jme:variable:: $n

    Matches a number.

    This only matches single number tokens, not expressions which would evaluate to a number, such as ``-3`` (unary negation) or ``sqrt(2)``.

    This does not match unary negation, but does match negative numbers which have been substituted into an expression.
    To robustly match a positive or negative number, use ```+- $n``.

    You can use the following annotations to restrict the kinds of numbers that are matched:

    * ``real`` - has no imaginary part.
    * ``complex`` - has a non-zero imaginary part.
    * ``imaginary`` - has a non-zero imaginary part and zero real part.
    * ``positive`` - real and strictly greater than 0.
    * ``nonnegative`` - real and greater than or equal to 0.
    * ``negative`` - real and less than 0.
    * ``nonone`` - any number other than 1.
    * ``nonzero`` - any number other than 0.
    * ``integer`` - an integer.
    * ``decimal`` - written with at least one digit after the decimal place, or any real number with a fractional part.
    * ``rational`` - an integer, or the division of one integer by another. 
      This doesn't only match a single token - it's equivalent to the pattern ``integer:$n / integer:n`?``.

    **Examples**:
        * ``real:$n`` matches ``3`` and ``pi`` but not ``4+i`` or ``sqrt(2)``.
        * ``complex:$n`` matches ``1+2i`` and ``i`` but not ``3``.
        * ``decimal:$n`` matches ``4.1`` and ``2.0`` but not ``2``.
        * ``rational:$n`` matches ``3/4`` and ``2`` but not ``4.1``.

.. jme:variable:: $v

    Matches any variable name.

.. jme:variable:: $z

    Match nothing.
    Use this as the right-hand side of a ``+`` or ``*`` operation to force the pattern-matcher to match a sum or product, respectively, when the pattern would otherwise only contain one term, due to use of a quantifier.

    **Example**:
        * ``($n `| $v)`+ + $z`` matches a sum of any length consisting of numbers or variable names, such as ``3 + x + 1 + 2 + y``.

Arithmetic Operators
####################

.. jme:function:: `+- X
    :keywords: either, or, plus, minus
    :op: `+-

    Match either ``X`` or ``-X``

.. jme:function:: `*/ X
    :keywords: either, or, times, divide, multiply
    :op: `*/

    Match either ``X`` or ``1/X``

    **Example**:
        * ``$n * (`*/ $n)`` matches either the product or the quotient of two numbers, such as ``3*4`` or ``6/2``.

Combining patterns
##################

.. jme:function:: A `| B
    :keywords: either, or
    :op: `|

    Match either ``A`` or ``B``.

    **Example**:
        * ``x*x `| x^2`` matches two different ways of writing "x squared".

.. jme:function:: A `& B
    :keywords: and, both
    :op: `&

    The expression must match both ``A`` and ``B``.

    **Example**:
        * ``? = ? `& m_uses(x)`` matches an equation which contains the variable ``x`` somewhere.

.. jme:function:: `! X
    :keywords: not, except, negate
    :op: `!

    Match anything *except* ``X``.

    **Example**:
        * ```! m_uses(x)`` matches any expression which does not use the variable ``x``.

.. jme:function:: X `where C
    :keywords: condition, where, match
    :op: `where

    The expression must match ``X``, and then the condition ``C`` is evaluated, with any names corresponding to groups captured in ``X`` substituted in.
    If the condition ``C`` evaluates to ``true``, the expression matches this pattern.

    **Example**:
        * ``$n;x + $n;y `where x+y=5`` matches the sum of two numbers which add up to a total of 5.

.. jme:function:: macros `@ X
    :keywords: substitute
    :op: `@

    ``macros`` is a dictionary of patterns.
    The macros are substituted into ``X`` to produce a new pattern, which the expression must match.

    **Example**:
        * ``["x": a `| b] `@ ["trig": sin(x) `| cos(x) `| tan(x)] `@ trig*trig + trig*trig`` matches ``sin(a)*cos(b) + cos(a)*sin(b)``.

Capturing named groups
######################

The *capturing operator* ``;`` attaches to a part of a pattern, and captures the part of the input expression matching that pattern under the given name.

.. jme:function:: X;g
    :keywords: capture, name, group
    :op: ;

    Capture the input expression in the group named ``g`` if it matches the pattern ``X``.

    **Example**:
        * ``$n;a`` captures a number as ``a``. 
          For the expression ``15``, ``a=15``.
        * ``$n;a + $n;b`` captures two numbers ``a`` and ``b``. 
          For the expression ``3+4``, ``a=3`` and ``b=4``.
        * ``(x-$?;root);term`` when matched against the expression ``x-2`` captures ``root = 2`` and ``term = x-2``.

.. jme:function:: X;g:v
    :keywords: capture, name, group, default
    :op: :

    Match ``X``, and capture the value ``v`` in the group named ``g``.

    You can use this to provide a default value for a value that's missing or implied, for example a coefficient of :math:`-1` in :math:`-x`.

    **Example**:
        * ``(`+- $n);a * x `| x;a:1 `| -x;a:-1`` captures the coefficient of ``x`` as ``a``. 
          When the expression is ``-x``, ``a = -1``.

.. jme:function:: X;=g
    :keywords: capture, name, group, same, identical, equal, equivalent
    :op: ;=

    Match ``X`` only if it's identical to every other occurrence captured under the name ``g``.

    **Example**:
        * ``?;=t + ?;=t`` matches two copies of the same thing, added together. 
          It matches ``1 + 1``, ``x+x`` and ``sin(x*pi) + sin(x*pi)``, but not ``1+2`` or ``x+y``. 
          When the expression is ``2x + 2x``, ``t = 2x``.

Quantifiers
###########

Quantifiers are used to capture terms that may appear a variable number of times in a sequence.

.. jme:function:: X `?
    :keywords: one, none, quantifier, optional
    :op: `?

    Either one occurrence of ``X`` or none.

    **Example**:
        * ``$n`? * x`` matches ``x`` and ``5x``.

.. jme:function:: X `: Y
    :keywords: quantifier, default, optional
    :op: `:

    If the expression matches ``X``, match that, otherwise match as the default value ``Y``.

    In a sequence, this acts the same as the ```?`` quantifier, additionally capturing the default value ``Y`` if ``X`` does not appear in the sequence.

    **Example**:
        * ``($n `: 1);coefficient * x`` matches ``x`` and ``5x``, and captures ``coefficient`` as ``1`` when it's omitted.
        * ``x^(? `: 1);p`` captures any power of ``x`` as ``p``, setting ``p=1`` when the power is omitted.

.. jme:function:: X `*
    :keywords: optional, some, any, all, quantifier, several
    :op: `*

    Any number of occurrences of ``X``, or none.

    **Examples**:
        * ``x * integer:$n`*`` matches the product of ``x`` and any number of integers, such as ``x``, ``x*5`` or ``x*2*3``, but not ``x*x`` or ``x*x*5``.
        * ``[$n `*]`` matches a list containing any number of numbers, such as ``[]``, ``[1]`` or ``[6,2]``.

.. jme:function:: X `+
    :keywords: some, all, many, several, quantifier
    :op: `+

    At least one occurrence of ``X``.

    **Example**:
        * ``x * integer:$n`+`` matches the product of ``x`` and at least one integer, such as ``x*5`` or ``x*5*6``, but not ``x``.

Matching modes
##############

The following functions change the way the matcher works.

.. glossary::

    Allow other terms
        
        When matching an associative operation, allow the presence of terms which don't match the pattern, as long as there are other terms which do satisfy the pattern.
        This allows you to write patterns which pick out particular parts of sums and products, for example, while ignoring the rest.
        This is equivalent to adding something like ``+ ?`*`` to the end of every sum, and likewise for other associative operations.

    Use commutativity

        When matching an associative operation, allow the terms to appear in any order.
        A sequence matches if an ordering of the terms which satisfies the pattern can be found.

        For non-symmetric operators with converses, such as :math:`\lt` and :math:`\leq`, also match the converse relation, reversing the order of the operands.

    Use associativity

        For an associative operator :math:`\circ`, sequences of terms such as :math:`a \circ b \circ c` will be considered together.

        If this mode is not enabled, terms are not gathered into sequences before trying to match, so :math:`(a \circ b) \circ c` is not considered to be the same as :math:`a \circ (b \circ c)`.

    Gather as a list

        For an associative operator, when the same name is captured by multiple terms, the resulting captured group for that name is a list whose elements are the captured subexpressions from each term.

        If this mode is not enabled, the subexpressions from each term are joined together by the associative operator.
        This doesn't always make sense, particularly if the group captures only portions of each term.

    Strict inverse

        If this mode is not enabled, then ``a-b`` is matched as if it's ``a+(-b)``, and ``a/b`` is matched as if it's ``a*(1/b)``.
        This makes matching sums of terms that may have negative coefficients easier.

        If this mode is enabled, then the behaviour described above is not used.

.. jme:function:: m_exactly(X)
    :keywords: others, terms, only

    Turn off :term:`allow other terms` mode when matching ``X``.

.. jme:function:: m_commutative(X)
    :keywords: order

    Turn on :term:`use commutativity` mode when matching ``X``.

.. jme:function:: m_noncommutative(X)
    :keywords: commutative, order

    Turn off :term:`use commutativity` mode when matching ``X``.

.. jme:function:: m_associative(X)
    :keywords: order, bracket, parentheses

    Turn on :term:`use associativity` mode when matching ``X``.

.. jme:function:: m_nonassociative(X)
    :keywords: order, bracket, associativity, parentheses

    Turn off :term:`use associativity` mode when matching ``X``.

.. jme:function:: m_strictinverse(X)
    :keywords: inverse, unary, plus, minus

    Turn on :term:`strict inverse` mode when matching ``X``.

.. jme:function:: m_gather(X)
    :keywords: list

    Turn on :term:`gather as a list` mode when matching ``X``.

.. jme:function:: m_nogather(X)
    :keywords: list

    Turn off :term:`gather as a list` mode when matching ``X``.

Special conditions
##################

.. jme:function:: m_type(type)
    :keywords: condition, type

    Match any item with the given :ref:`data type <jme-data-types>`.

    **Example**:
        * ``m_type("string")`` matches ``"hi"``, ``"5,000"`` and ``"x"`` but not ``1``, ``true`` or ``x``.

.. jme:function:: m_func(name,arguments)
    :keywords: condition, function

    Match a function whose name, as a string, matches the given pattern, and whose arguments, considered as a :data:`list`, match the given pattern.

    **Example**:
        * ``m_func(?, [?,?])`` matches any function of two variables.

.. jme:function:: m_op(name,operands)
    :keywords: condition, operator

    Match a binary or unary operator whose name, as a string, matches the given pattern, and whose operands, considered as a :data:`list`, match the given pattern.

    Note that any properties of matched operators, such as commutativity or associativity, aren't exploited with this matching method.

.. jme:function:: m_uses(name)
    :keywords: condition, variable, has, uses

    Match if the expression uses the variable with the given name as a free variable.

    **Example**:
        * ``m_uses(x)`` matches ``x``, ``1+x`` and ``sin(x/2)`` but not ``y``, ``4-2``, or ``map(2x,x,[1,2,3])``.

.. jme:function:: m_anywhere(X)
    :keywords: condition, anywhere, recursive, deep

    Match if a sub-expression matching the pattern ``X`` can be found anywhere inside the input expression.

    The :term:`Allow other terms` mode is turned on when matching ``X``. 
    You can turn it off as needed with :jme:func:`m_exactly`.

    **Example**:
        * ``m_anywhere(sin(?))`` matches ``sin(x)`` and ``sin(pi/2) + cos(pi/2)`` but not ``tan(x)``.
