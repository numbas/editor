.. _mathematical-expression:

Mathematical expression
^^^^^^^^^^^^^^^^^^^^^^^

Mathematical expression parts require the student to enter an algebraic expression, using :ref:`JME <jme>` syntax.

These parts are marked by picking a sample of random values for the free variables in the expression, and evaluating both the student's answer and the correct answer on those values.
If the two expressions agree on enough inputs, then they are considered to be equivalent and the student's answer is marked as correct.

For questions where the student is asked to rearrange an expression, just evaluating both answers won't detect the difference - you want to look at the *form* of the student's answer, as well as the values it produces.
Use a :ref:`pattern restriction <pattern-restriction>` to check that the student's answer is in the form you want.
    
You can find `the mathematical expression part's built-in marking algorithm at GitHub <https://github.com/numbas/Numbas/blob/master/marking_scripts/jme.jme>`_.

Marking
#######

.. glossary::
    Correct answer
        The expected answer to the part. 
        Question variables (or, more broadly, JME expressions which should be evaluated to a single value when the question is generated), can be included by enclosing them in curly braces.

        If the answer is an equation, see the note on :ref:`marking-an-equation`.

    Show preview of student's answer?
        If ticked, a rendering of the student's answer in mathematical notation is displayed beside the input box. 
        You should leave this on unless you expect the answer to be very simple and need the space - the feedback about how their answer is interpreted is very useful to students.

    Answer simplification rules
        :ref:`Simplification rules <simplification-rules>` to apply to the correct answer, if it is displayed to the student (for example, after clicking the :guilabel:`Reveal answers` button). 
        This shouldn't affect marking.
        
        If this field is empty,  the following rules are applied: ``basic``, ``unitFactor``, ``unitPower``, ``unitDenominator``, ``zeroFactor``, ``zeroTerm``, ``zeroPower``, ``collectNumbers``, ``zeroBase``, ``constantsFirst``, ``sqrtProduct``, ``sqrtDivision``, ``sqrtSquare``, ``otherNumbers``.

    Expression is case-sensitive?
        If ticked, then the student's answer and the correct answer will be considered case-sensitively.

        If not ticked, then names which are exactly the same when converted to lower-case will be considered as representing the same variable or function.

        See :ref:`jme-case-sensitivity <case-sensitivity>` in the JME reference.


.. _mathematical-expression-restrictions:

Restrictions
############

The :guilabel:`Restrictions` tab provides several methods for restricting the form of the student's answer.

.. _pattern-restriction:

Pattern restriction
-------------------

.. glossary::

    Pattern student's answer must match
        The student's answer must match the given :ref:`pattern <pattern-matching>`.
        If it does not, then a penalty is applied.

        You can use this to ensure the student's answer is in a particular form.

        See :ref:`pattern-matching-examples` for examples of patterns which ensure the expression is in particular forms.

    Part of expression to mark
        If :guilabel:`Whole expression` is selected, then the student's entire expression is compared against the :term:`correct answer`.
        If the name of a subexpression captured by the pattern is selected, then only the subexpression captured in the student's answer is compared against the corresponding sub-expression in the correct answer.
        
        You can use this to mark answers which could not otherwise be marked using the standard marking algorithm, for example function definitions or equations where one side is fixed, such as :math:`y = f(x)`.

    Partial credit for not matching pattern
        If the student's answer does not match the given pattern, their score is multiplied by this percentage.

.. _mathematical-expression-variable-options:

Variables
---------

.. glossary::

    Warn if student uses an unexpected variable name?
        If this is ticked, all variable names used in the student's are checked against the variable names used in the :term:`correct answer <Correct answer>`.
        The first variable name which is not used in the correct answer will trigger a warning. 
        You can use this option to prevent students incorrectly entering answers such as ``xy``, which is interpreted as a single variable, when they mean ``x*y``, the product of two variables.

    Force single letter variable names?
        If this is ticked, long variable names will be interpreted as implicit multiplication of variables with single-letter names. 
        For example, ``xyz`` will be interpreted as ``x * y * z``.
        Digits, primes and single-letter underscores are still valid in variable names: ``a'x12y_z`` will be interpreted as ``a' * x12 * y_z``.
        Greek letters are considered to be a single letter: ``pix`` will be interpreted as ``pi * x``.

        This option is recommended when the expected answer for the part only uses single-letter variable names, so that students who don't always use the multiplication symbol aren't caught out.

    Allow unknown function names?
        If this is not ticked, the application of a function that is not defined in JME will be reinterpreted.
        If the function name can be split into several shorter names, each of which is defined in JME, it will be: for example, ``lnabs(x)`` will be interpreted as ``ln(abs(x))``.
        Function names are recognised from right to left. 
        Any remaining characters are interpreted as implicit multiplication by a variable.
        For example, ``xsin(x)`` will be interpreted as ``x * sin(x)``.

        Use this option if you want to allow students to use implicit multiplication with function names, without any spaces.

    Use implicit function composition?
        If this is ticked, the multiplication symbol (or implicit multiplication) will be interpreted as function composition when the right-hand side is a function application with one argument, and the left-hand side is the name of a function defined in JME.
        For example, ``ln * abs(x)`` and ``ln abs(x)`` will be interpreted as ``ln(abs(x))``.

String restrictions
-------------------

.. note::

    String restrictions are an unreliable method of restricting the form of a student's answer.
    They are deprecated and retained only for backwards compatibility; use a pattern restriction instead.

Before string restrictions are applied, surplus brackets and whitespace are removed, and spaces are inserted between some operations, to minimise the possibility of the length restrictions being triggered for the wrong reasons.

.. glossary::

    Minimum length restriction
        If the student's answer contains fewer than this many characters, the penalty is applied. 
        A value of zero means no restriction is applied. 
        See the comment above on how the length is calculated.

    Maximum length restriction
        If the student's answer contains more than this many characters, the penalty is applied. 
        A value of zero means no restriction is applied.
        The student's answer is tidied up slightly so that things like extra or missing space characters don't affect the calculated length.
        All spaces are removed, and then spaces are inserted between binary operations.
        For example, the answer ``1+x`` (three characters) is marked as ``1 + x`` (five characters). 

    Required strings
        If the student's answer doesn't contain all of these strings, the penalty is applied.

    Forbidden strings
        If the student's answer contains any of these strings, the penalty is applied.

Accuracy
########

These settings define the range of points over which the student's answer will be compared with the correct answer, and the method used to compare them.

For each of the variables in the :term:`correct answer`, a value is chosen at random.
How this value is chosen depends on the type of the variable: for example, in the expression :math:`k \det(A)`, the variable :math:`A` must be a matrix, and :math:`k` can be assumed to be a number. 
The system can usually infer the type of each variable and pick an appropriate value automatically.

Numbers are chosen uniformly at random from the defined :term:`checking range <checking range start>`.
Matrices and vectors have entries chosen uniformly at random from the defined checking range.

Care must be taken if the :term:`correct answer` has a singularity or is undefined for some values of the variables.
Either set the :term:`checking range <checking range start>` to a safe interval on which the expression is always defined, or write a :ref:`variable value generator <variable-value-generators>`.

.. glossary::
    Checking type
        The rule to use to compare the student's answer with the correct answer.
        In the lines below, :math:`x` represents the value of the student's answer at a particular point and :math:`y` represents the value of the correct answer, while :math:`\delta` is the value of the checking accuracy property.

        * Absolute difference.
          Fail if :math:`\left| x-y \right| > \delta`.
        * Relative difference.
          Fail if :math:`\left| \frac{x}{y} - 1 \right| > \delta`.
        * Decimal points.
          :math:`x` and :math:`y` are rounded to :math:`\delta` decimal places, and the test fails if the rounded values are unequal.
        * Significant figures.
          :math:`x` and :math:`y` are rounded to :math:`\delta` significant figures, and the test fails if the rounded values are unequal.

    Checking accuracy
        The parameter for the checking type.

    Points to check
        The number of comparisons to make between the student's answer and the correct answer.

    Maximum no. of failures
        If the comparison fails this many times or more, the student's answer is marked as wrong.

    Checking range start
        The minimum value sample points can take.

    Checking range end
        The maximum value sample points can take.

.. _variable-value-generators:

Variable value generators
-------------------------

Variable value generators override the default method used to pick values for variables when comparing the correct answer with the student's answer.

A text field for each variable used in the :term:`correct answer` appears in this section.
If left blank, the default value generator will be used.
To override it, enter a :ref:`JME` expression producing a value for the variable.
The variable ``vRange`` represents the :term:`checking range <checking range start>` defined for this part: a continuous interval between the :term:`checking range start` and :term:`checking range end`.

The expression for each variable can be written in terms of the other variables, as long as there are no circular dependencies.
The values will be evaluated in order, like :ref:`question variables <variables>`.

.. _marking-an-equation:

Marking an equation
###################

If the :term:`correct answer` is an equation, such as :math:`A = 6t` or :math:`x^2 + y^2 = 1`, it will produce a :data:`boolean` value, representing whether the values of the variables constitute a solution of the equation.

Two equations are equivalent if they have the same solution sets. 
For example, the equations :math:`y=2x` and :math:`y-2x=0` are equivalent because exactly the same sets of :math:`(x,y)` pairs satisfy them both.
We can make a fairly confident decision about whether two equations are equivalent by checking that they agree on a few randomly-chosen values.

We need to check both solutions and non-solutions of the expected equation.
If we don't check any solutions, then an equation which can never be satisfied would be marked correct. 
Conversely, if we don't check any non-solutions, then an equation which holds for any input would be marked correct.

It's extremely unlikely that randomly-chosen values for the variables will satisfy any given equation, so you need to change the way values are chosen to produce solutions about half of the time, using :ref:`variable value generators <variable-value-generators>`.

For example, in a part with correct answer :math:`x^2+y^2=1`, the expression ``random(sqrt(1-x^2), random(vRange))`` for the variable :math:`y` will produce a solution of the equation roughly half of the time.
By setting the :term:`points to check` to a big enough number, say 10, we can be reasonably confident that the student's answer is equivalent to the expected answer.

See `this example question <https://numbas.mathcentre.ac.uk/question/88275/answer-is-a-differential-equation/>`_ where the correct answer is a differential equation.

Marking settings
################

This part type provides the following properties to the :data:`settings` object:

.. data:: correctAnswer
    :noindex:

    The :term:`Correct answer` to the question. 

.. data:: answerSimplification

    See :term:`Answer simplification rules`.

.. data:: checkingType

    The :term:`Checking type` setting, representing the name of the checking function to use.
    One of ``"absdiff"``, ``"reldiff"``, ``"dp"`` or ``"sigfig"``.
    See :jme:func:`resultsequal`.

.. data:: checkingAccuracy

    See :term:`Checking accuracy`. 

.. data:: failureRate

    See :term:`Maximum no. of failures`.

.. data:: vsetRangeStart

    See :term:`Checking range start`.

.. data:: vsetRangeEnd

    See :term:`Checking range end`.

.. data:: vsetRangePoints

    See :term:`Points to check`.

.. data:: valueGenerators

    A dictionary of :ref:`variable value generator expressions <variable-value-generators>`.

.. data:: checkVariableNames

    See :term:`Warn if student uses an unexpected variable name?`

.. data:: mustMatchPattern

    See :term:`Pattern student's answer must match`.

.. data:: mustMatchPC

    The proportion of credit awarded if the student's answer does not match the pattern.

.. data:: mustMatchMessage

    Message to add to marking feedback if the student's answer does not match the pattern.

.. data:: nameToCompare

    The name of the captured subexpression to compare against the corresponding subexpression in the correct answer.
    See :term:`Part of expression to mark`.

.. data:: maxLength

    The maximum length, in characters, of the student's answer, as set in :term:`Maximum length restriction`.

.. data:: maxLengthPC

    The proportion of credit awarded if the student's answer is too long.

.. data:: maxLengthMessage

    Message to add to marking feedback if the student's answer is too long.

.. data:: minLength

    The minimum length, in characters, of the student's answer, as set in :term:`Minimum length restriction`.

.. data:: minLengthPC

    The proportion of credit to award if the student's answer is too short.

.. data:: minLengthMessage

    Message to add to the marking feedback if the student's answer is too short.

.. data:: mustHave

    A list of strings which must be present in the student's answer, as set in :term:`Required strings`.

.. data:: mustHavePC

    The proportion of credit to award if any must-have string is missing.

.. data:: mustHaveMessage

    Message to add to the marking feedback if the student's answer is missing a must-have string.

.. data:: mustHaveShowStrings

    Tell the students which strings must be included in the marking feedback, if they're missing a must-have?

.. data:: notAllowed

    A list of strings which must not be present in the student's answer, as set in :term:`Forbidden strings`.

.. data:: notAllowedPC

    The proportion of credit to award if any not-allowed string is present.

.. data:: notAllowedMessage

    Message to add to the marking feedback if the student's answer contains a not-allowed string.

.. data:: notAllowedShowStrings

    Tell the students which strings must not be included in the marking feedback, if they've used a not-allowed string?

Example
#######

A question in the Numbas demo demonstrates a variety of ways of using mathematical expression parts.

`Numbas demo: mathematical expression part type <https://numbas.mathcentre.ac.uk/question/66159/numbas-demo-mathematical-expression-part-type/>`_
