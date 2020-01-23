More complicated mathematical expressions
-----------------------------------------

Until now, you’ve only written very simple mathematical expressions, where the randomised variables could be substituted in without any changes to the surrounding symbols.
Often, this isn’t the case; for such occasions, there is the ``\simplify`` command.

``\simplify`` is a special LaTeX command which takes an expression in :ref:`JME syntax <jme>`, like ``\var`` does, but rather than evaluating it to a number, tidies it up using a set of :ref:`simplification rules <simplification-rules>`. 

Let’s add another part to the question, using ``\simplify`` to present a quadratic equation with random coefficients, and ask the student to factorise it.

Add a new part and set its type to :ref:`Mathematical expression <mathematical-expression>`. 

This part will be constructed in reverse - we’ll generate the roots of the equation randomly, and use those to calculate the coefficients of the quadratic shown to the student.
This way, the question is guaranteed to have a nice answer.

Add two new variables ``x0`` and ``x1``::

    x0 = random(-9..9)

    x1 = random(-9..9 except x0)

The ``except`` operator in the definition of ``x1`` ensures that it doesn’t take the same value as ``x0``, so the quadratic doesn’t have repeated roots.

It's a good idea to add descriptions to your variable definitions to explain what they represent and how they’re generated.

A reasonable description for ``x0`` would be:

    A root of the quadratic equation. 
    Chosen not to be zero.

A reasonable description for ``x1`` would be:

    The other root of the quadratic equation. 
    Not the same as ``x1``.

Now the *Prompt* for the part might go something like this:

    Factorise $x^2 + \\var{x0+x1}x + \\var{x0*x1}$.

But that can produce unnatural expressions, like these:

.. image:: screenshots/question/12.png
    :alt: The expression "x^2 + -3x + -4".

.. image:: screenshots/question/13.png
    :alt: The expression "x^2 + 0x + -8".

In the first, only a subtraction sign should be shown; in the second the x term should be omitted.

Rewrite the prompt using the ``\simplify`` command:

    Factorise $\\simplify{ x^2 + {x0+x1}*x + {x0*x1} }$

The command takes an expression in :ref:`JME` syntax.
The expressions between curly braces are evaluated to numbers using the defined variables, and then the whole expression is rearranged to produce something that looks more natural.

.. note:: For more on what exactly the ``\simplify`` command does, see :ref:`Simplification rules <simplification-rules>`.

Click on the part’s :guilabel:`Marking` tab and set the :term:`Correct answer` to::

    (x+{x0})(x+{x1})

(Again, expressions in curly braces are evaluated as numbers when the question is run.)

Numbas marks *Mathematical expression* parts by choosing a random sample of points on which to evaluate them, and comparing the result given by the student’s answer with that given by the :term:`Correct answer`.
Because it doesn’t pay any attention to the form of the student’s answer, it has no way of distinguishing between the factorised and expanded forms of our quadratic - the student could just enter the same expression they’re given and it would be marked correct.

To prevent this, you can specify a :ref:`pattern restrictions <pattern-restriction>` to constrain the form of the student’s answer.

Go to the part’s :guilabel:`Restrictions` tab and enter ``(x + ?`?)(x + ?`?) `| (x + ?`?)^2`` in the :guilabel:`Pattern student's answer must match` field.
This accepts either the product of two linear factors, or a single linear factor, squared.

Click :guilabel:`Test Run` and check that your question is marked correctly.

That’s it for this tutorial.
You’ve created a very simple Numbas question asking the student to enter some numbers and a mathematical expression, with randomised parameters and neatly rendered maths.
If you got lost along the way, you can compare what you’ve got with `this question we prepared earlier <https://numbas.mathcentre.ac.uk/question/670/numbas-tutorial-arithmetic/>`_.



