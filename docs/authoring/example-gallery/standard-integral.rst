Apply a standard integral
-------------------------

Calculus students are typically given a table of 'standard integrals', which they can apply when they identify a suitable function in an integration.

`This leaflet from mathcentre <https://www.mathcentre.ac.uk/resources/Engineering%20maths%20first%20aid%20kit/latexsource%20and%20diagrams/8_7.pdf>`_ contains a typical table of standard integrals.

Planning
########

What does this question assess?
===============================

We'd like to establish whether the student can recognise a function with a standard integral and produce the appropriate integral.

This is a prerequisite skill for more complicated integration methods such as integration by parts or integration by substitution.

What does the student have to do?
=================================

Some ideas:

* Show a table of integrals with some blanks that the student must fill in. 
* Pick the integral of a given function from a list of expressions.
* Show a function, and ask the student to write its integral.

We'll go with the last option, since it gives the student the most scope to come up with the answer on their own.

They'll be shown the definition of a function :math:`f(x)`.
They must write the integral :math:`F(x) = \int f(x) \, \mathrm{d}x` with a constant of integration :math:`C`.

How might the student get the answer wrong?
===========================================

They might:

* differentiate instead of integrating;
* forget the constant of integration;
* use a different letter for the constant of integration;
* apply the wrong integral from a table of standard integrals.

We could detect these mistakes and give appropriate feedback.
Other errors such as typos will be handled by Numbas' standard feedback routines.

Sketch the structure of the question
====================================

The statement will define :math:`f(x)`, which has been chosen from the list of standard integrals.
We could give an expression involving several terms, such as :math:`e^{4x} + \sin(2x) + x^5`, but if the student makes an error with any one of the terms it will be hard to award partial credit.
A later question could assess this kind of expression once we've established that the student can apply the standard integrals individually.

There will be a single :ref:`mathematical expression <mathematical-expression>` part, with a prompt to write the integral of :math:`f(x)`.

We must decide whether to explicitly tell the student to use :math:`C` as the constant of integration.
If we do, then the student is less likely to forget it - a common mistake when performing an indefinite integral.
If we don't, then we have to do some work when marking to establish which variable name they have used, and compare it with the expected answer.
This could be assessed in a separate question, so for convenience we'll tell the student to use :math:`C`.

The correct answer is the integral corresponding to the chosen function, with a constant :math:`C` added on.

We will add :ref:`alternative answers <alternative-answers>` corresponding to the expressions we'd expect to see if the student differentiated instead of integrating, or forgot the constant of integration.

The advice section could show the table of standard integrals, or just mention that this function is in the table the student has already been given, and then identify the given function along with its integral.

Implementation
##############

Create a new question called *Recognise and apply a standard integral*, in :guilabel:`Show all parts` mode.

We will build the question up in stages, adding complexity as we go.

The simplest version of this question
=====================================

To begin with, let's make a non-randomised version of the question. In the :ref:`statement <statement>`, write::

    Let $f(x) = x^3$.

Then create a :ref:`mathematical expression <mathematical-expression>` part, with the following prompt::

    What is $\int f(x) \, \mathrm{d}x$?

    Use $C$ for the constant of integration.

On the :guilabel:`Marking settings` tab, set the :term:`correct answer <Correct answer>` to ``x^4/4 + C``.

Next, we'll make alternative answers for each of the mistakes we expect to see.
Click the :guilabel:`Add an alternative answer` button under this part on the right-hand side of the screen.

In :guilabel:`Marking settings`, under :term:`correct answer <Correct answer>`, write ``x^4/4``.
This alternative will be used if the student forgets to include the constant of integration but otherwise applies the correct standard integral.
You might want to give some partial credit if the student makes this mistake - enter ``0.5`` in :guilabel:`Marks` to award half a mark.

In :guilabel:`Feedback message`, under :guilabel:`Message if this alternative is used`, write::

    Did you forget to include a constant of integration?

Add another alternative, with correct answer ``3x^2`` for the case when the student differentiates instead of integrating.
A student with a mechanical understanding of the rules might add on a constant of integration to this, so add a third alternative with correct answer ``3x^2 + C``.

It's a good idea to name alternatives so you can see from the parts list what each one is for.
Name the first alternative "Forgot constant of integration" and the other two "Differentiated - no constant" and "Differentiated - with constant".
These names aren't shown to the student.

Finally, in the question's :ref:`Advice <advice>` tab, write a short explanation of the answer::

    $f(x) = x^3$.

    From the table of standard integrals, the integral of $x^k$ with respect to $x$ when $k \neq -1$ is $\frac{1}{k+1} x^{k+1}$.

    This is an indefinite integral, so we add an arbitrary constant of integration $C$.
    
    Here, $k = 3$.

    So 

    \[ \int f(x) \, \mathrm{d}x = \frac{1}{3+1} x^{3+1} + C = \frac{1}{4} x^4 + C \]

Try this question out by clicking :guilabel:`Run`.

This question works, but it only ever asks about one function, so isn't a good assessment of the whole table of standard integrals.
We could randomly choose from 

Introduce randomisation
=======================

An easy way to add randomisation into this question is to randomise the power of :math:`x`.
We'll define a :ref:`variable <variables>` ``k`` to represent the exponent, so the student has to integrate :math:`x^k`.

In the :guilabel:`Variables` tab, click :guilabel:`Add a variable`.

In the :guilabel:`Name` field, write ``k``, and from the :guilabel:`Data type` drop-down, pick "Random number from a range".

The range of values that :math:`k` can take needs to be carefully chosen:

* The case :math:`k = 0` corresponds to :math:`f(x) = x^0 = 1`, which students typically memorise as .
* The case :math:`k = 1` corresponds to :math:`f(x) = x^1 = x`, which doesn't look quite the same as other cases.
* The case :math:`k = -1` has integral :math:`\ln(x)`, which students typically memorise as a separate rule.

Fill out the :guilabel:`Value` field so it reads "A random number between ``2`` and ``9`` (inclusive) with step size ``1``".

Now we need to use this variable throughout the question.

Change the statement to::

    Let $f(x) = \simplify{ x^{k} }$.

Change the term:`correct answer` for the mathematical expression part to ``1/{k+1} * x^{k+1} + C``, and make corresponding changes to the alternative answers.

Finally, change the advice to::

    $f(x) = \simplify{ x^{k} }$.

    From the table of standard integrals, the integral of $x^k$ with respect to $x$ when $k \neq -1$ is $\frac{1}{k+1} x^{k+1}$.

    Here, $k = \var{k}$.

    This is an indefinite integral, so we add an arbitrary constant of integration $C$.

    So

    \[ \int f(x) \, \mathrm{d}x = \simplify[basic]{ 1/({k}+1) * x^({k} + 1)} + C = \simplify{ 1/{k+1} * x^{k+1} + C \]

Try this question out by clicking :guilabel:`Run`.
Confirm that everything works as you'd expect for different values of :math:`k`.

.. note::

    We've had to substitute randomised values in LaTeX maths notation.
    It's not as straightforward as you might expect; see the page on :ref:`simplification-rules` for more detail.

We have introduced some randomisation but we're still only asking about one entry in the table of standard integrals.

Choose the function to integrate from a list
============================================

Let's make the question randomly choose one of :math:`e^{kx}`, :math:`x^k`, :math:`\cos(kx)` or :math:`sin(kx)` as the function to integrate.

There are two ways of doing this, each with their own benefits and drawbacks.

The first way is to work throughout the question with a long expression of the form :math:`c_1 e^{kx} + c_2x^k + c_3\cos(kx) + c_4\sin(kx)`, and define the :math:`c_i` coefficients so that only one of them has the value ``1``, and the rest ``0``.
The simplifier will remove the terms with zero coefficient, leaving just one term to integrate.
It's easy to set up the question variables for this but you have to write out the long expression in terms of :math:`c_i` throughout the question, making it hard to read as a question author.
If we want to add more options for functions, the expression gets even longer.

The second way is to use JME :data:`expression` variables to represent the function and its integral, and randomly pick one from a list.
These are easier to use in question text and marking settings but need some more work at the variable generation stage.

We also need to think again about the definition of the variable :math:`k`, because each of these functions behaves differently as :math:`k` changes.
Fortunately, these functions all behave similarly when :math:`k \gt 1`, as we've already chosen, so the definition of :math:`k` doesn't need to change.

Method 1: Zero coefficients for unwanted terms
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

We want four coefficients, only one of which should have the value ``1``.

Define a variable named ``c`` with the following JME code::

    shuffle([1,0,0,0])

This will produce a :data:`list` with one one and three zeros, in random order.

Change the question statement to::

    Let $f(x) = \simplify{ {c[0]} * e^({k}x) + {c[1]} * x^{k} + {c[2]} * cos({k}x) + {c[3]}*sin({k}x) }$.

Change the :term:`correct answer` for the mathematical expression part to::

    {c[0]} * (1/{k}) * e^({k}x) + {c[1]} * (1/{k+1}) * x^{k+1} + {c[2]} * (1/{k}) * sin({k}x) + {c[3]} * (-1/{k}) * cos({k}x)

Make corresponding changes to the alternative answers and the advice.

To add another option for the function, we would have to add another zero to the list used in ``c``, and add another term to each occurrence of the long expression.

You can see `a completed example of this method at numbas.mathcentre.ac.uk <https://numbas.mathcentre.ac.uk/question/68978/recognise-and-apply-a-standard-integral-random-coefficients-version/>`__.

Method 2: Sub-expressions
^^^^^^^^^^^^^^^^^^^^^^^^^

We want to randomly pick a function from a list of options, and substitute in the coefficient ``k``.

Each option has three parts: the function to present as :math:`f(x)`, its integral, and its derivative.
(The derivative will be used for the alternative answer which catches the case where the student differentiates instead of integrating)

Define a variable ``scenarios``, with the following :guilabel:`JME code` definition::

    [
      [ "x^k",      "1/(k+1)*x^(k+1)", "k^x^(k-1)"   ],
      [ "e^(k*x)",  "1/k * e^(k*x)",   "k*e^(k*x)"   ],
      [ "sin(k*x)", "-1/k * cos(k*x)", "k*cos(k*x)"  ],
      [ "cos(k*x)", "1/k * sin(k*x)",  "-k*sin(k*x)" ]
    ] 

This variable has four entries, each of which is a list containing three strings of JME code.

Next, a variable ``scenario`` will pick one of these at random::

    random(scenarios)

Construct a sub-expression representing :math:`f(x)` by defining a variable named ``function`` as follows::

    substitute(
        ["k": k],
        expression(scenario[0])
    )

This takes the first element in the chosen ``scenario``, converts it to a :data:`expression` value, then substitutes the value of ``k`` into it.

Check that the variable preview shows an expression such as ``e^(2x)`` for the value of ``function``.

Add two more variables, ``integral`` and ``derivative``, with definitions similar to that of ``function`` but using ``scenario[1]`` and ``scenario[2]`` respectively.

Change the question statement::

    Let $f(x) = \var{function}$.

Set the correct answer for the mathematical expression part to::

    {integral} + C

Make corresponding changes to the alternative answers.

For the advice, it would be helpful to give the student the generic form of their function, as it would appear in the table of standard integrals.
For this, define a new variable ``generic_function``::

    expression(scenario[0])

and another variable ``generic_integral``::

    expression(scenario[1])

Finally, rewrite the advice::

    $f(x) = \var{ {function} }$.

    The integral of $\var{generic_function}$ with respect to $x$ is $\var{generic_integral}$.

    This is an indefinite integral, so we add an arbitrary constant of integration $C$.

    Here, $k = \var{k}$, so

    \[ \int f(x) \, \mathrm{d}x = \var{ {integral} } + C \] 

You can see `a completed example of this method at numbas.mathcentre.ac.uk <https://numbas.mathcentre.ac.uk/question/68977/recognise-and-apply-a-standard-integral-subexpressions-version/>`__.

Evaluation
##########

This question shows the student a randomly-chosen function to integrate, and gives appropriate feedback in response to some common mistakes.

This question uses:

* A :ref:`mathematical expression part <mathematical-expression>` to mark an expression entered by the student.
* The ``\var`` and ``\simplify`` commands to `substitute randomised values into LaTeX code <simpification-rules>`.
* :ref:`Alternative answers <alternative-answers>` to recognise answers corresponding to common mistakes and give appropriate feedback.
* :ref:`JME Sub-expressions <jme-fns-subexpressions>` to randomly choose from a list of available functions, and substitute in a randomised value.

For students who have trouble answering this question, you could add an :ref:`information only <information-only>` part as a :term:`step <Steps>` containing either a link to the table of standard integrals, or the table itself.

A good question to follow this one might give the student an expression involving multiple terms to integrate, or use variables other than :math:`x` to check the depth of the student's understanding of symbolic integration.
