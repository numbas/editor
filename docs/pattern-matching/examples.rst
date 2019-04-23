.. _pattern-matching-examples:

Pattern-matching examples
=========================

The following examples demonstrate different features of the pattern-matching syntax, and particular behaviours that might not be immediately obvious.

In the following, the :term:`Use commutativity` and :term:`Use associativity` modes are enabled, and :term:`Allow other terms` is disabled, unless otherwise specified.

Match exactly the expression ``1+2``::

    1 + 2
    
If commutativity is enabled, ``2 + 1`` will also match this pattern.
Whitespace and brackets are ignored when they don't change the meaning of the expression, so ``1+2``, ``1  + 2`` and ``(1)+(2)`` all match this pattern.

Any power of 2::

    2^?

Forbid decimals anywhere (so only allow integers)::

    `!m_anywhere(decimal:$n)

A sum consisting of any number of fractions, all over the same denominator, which is captured as ``d``::

    (`+-( $n/($n;=d) ))`* + $z

Ensure that there are no unexpanded brackets::

    `! m_anywhere(?*(? + ?`+))

The sum of two positive integers::

    positive:$n + positive:$n

A product of at least two factors, where no factor is numerically equal to 1::

    m_nogather(
        ?;factors*?`+;factors 
        `where 
        all(map(not numerical_compare(x,expression("1")),x,factors))
    )


This is a fairly cheap way of checking that a number or expression has been decomposed into factors (assuming it's not already irreducible).
Note that it doesn't check that the expression has been fully factorised: for example, ``4*6`` matches this pattern.

Complete the square::

    (x+$n)^2+$n`?

A number of the form :math:`a \cdot e^{\theta i}`, where the coefficient :math:`a` is optional, and the power can be any multiple or fraction of :math:`i`::

    ($n`? `: 1)*e^(((`*/ `+- $n)`*;x)*i)

The following expressions all match this pattern: ``e^i``, ``2e^(pi*i)``, ``e^(i * 2/3 pi)``.

A complex number in the form :math:`a + ib`, allowing for either the real or imaginary part to be omitted, and zero by default. 
The real part is captured as ``re`` and the imaginary part as ``im``::

    ((`+-real:$n)`? `: 0);re + ((`+-i*real:$n`?)`? `: 0);im

A polynomial with integer coefficients::

    `+- ((`*/ $n)`*  * ($v);=base^?`? `| $n/$n`?)`* + $z
    
The base of the polynomial is captured as ``base``.

A fraction with rational denominator: disallow square roots or non-integer powers in the denominator::

    `+- ? / (`!m_anywhere(sqrt(?) `| ?^(`! `+-integer:$n)))

A sum of fractions, where no denominator is numerically equivalent to 1 and no numerator is numerically equivalent to 0::

    m_nogather(m_gather(`+- (?;tops/?;bottoms));fractions`* + $z) 
    `where 
        len(fractions)>1 
        and all(map(not numerical_compare(x,expression("1")),x,bottoms)) 
        and all(map(not numerical_compare(x,expression("0")),x,tops))

This pattern could be used to establish that a student has decomposed an expression into partial fractions.
