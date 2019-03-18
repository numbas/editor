.. _number-entry:

Number entry
^^^^^^^^^^^^

Number entry parts ask the student to enter a number, which is marked if it is in a specified range.
    
You can find `the number entry part's built-in marking algorithm at GitHub <https://github.com/numbas/Numbas/blob/master/marking_scripts/numberentry.jme>`_.

Marking
#######

.. glossary::
    Minimum accepted value
        The smallest value accepted as correct.

    Maximum accepted value
        The largest value accepted as correct.

    Precision restriction
        You can insist that the student gives their answer to a particular number of decimal places or significant figures. 
        For example, if you want the answer to be given to 3 decimal places, :math:`3.1` will fail this restriction, while :math:`3.100` will pass. 

        The minimum and maximum answer are both rounded off to the same precision as the student used, or the required precision - whichever is greater. 
        If the student's answer is between the rounded-off minimum and maximum, then it is marked correct.
        Finally, if the student's answer is not given to the required precision, the penalty is applied.

        If the precision doesn't matter, select :guilabel:`None`.

    Allow the student to enter a fraction?
        This option is only available when no precision restriction is applied, since they apply to decimal numbers. 
        If this is ticked, the student can enter a ratio of two whole numbers, e.g. ``-3/8``, as their answer.

    Must the fraction be reduced?
        This option only applies when "Allow the student to enter a fraction" is ticked. 
        If this is ticked, the student must enter their fractional answer reduced to lowest terms. 
        For example, consider a part whose correct answer is :math:`5/4`. 
        If this is ticked, ``10/8`` will be marked as incorrect.

    Show fraction input hint?
        If this is ticked and :term:`Must the fraction be reduced?` is ticked, then text explaining that the student must reduce their fraction to lowest terms is shown next to the input box.

    Display the correct answer as a fraction?
        This option is only available when no precision restriction is applied. 
        If this is ticked, the correct answer to the part will be rendered as a fraction of two whole numbers instead of a decimal. 
        For example, if the answer is :math:`0.5`, it will be displayed as ``1/2`` instead of ``0.5``.

    Require trailing zeros?
        This option only applies when a precision restriction is selected. 
        If this is ticked, the student must add zeros to the end of their answer (when appropriate) to make it represent the correct precision. 
        For example, consider a part whose correct answer is :math:`1.4`, and you want the student's answer to be correct to three decimal places. 
        If "Require trailing zeros?" is ticked, only the answer :math:`1.400` will be marked correct. 
        If it is not ticked, any of :math:`1.4`, :math:`1.40` or :math:`1.400` will be marked as correct. 
        If *too many* zeros are used, e.g. :math:`1.4000`, the answer is marked as incorrect.

    Partial credit for wrong precision
        This option only applies when a precision restriction is selected. 
        If the student does not give their answer to the required precision, they only get this much of the available credit for the part.

    Message if wrong precision
        This option only applies when a precision restriction is selected. 
        If the student does not give their answer to the required precision, they are given this feedback message.
        
    Show precision restriction hint?
        If this is ticked, then some text describing the rounding the student must perform is shown next to the input box. 
        For example, "round your answer to 3 decimal places".

    Allowed notation
        The styles of number notation that the student can use to enter their answer.
        There are different ways of writing numbers, based on culture and context.
        Tick an option to allow the student to use that style in their answer.
        Note that some styles conflict with each other: for example, ``1.234`` is a number between 1 and 2 in English, while it's the integer 1234 in French. 
        The student's answer will be interpreted using the first allowed style for which it is a valid representation of a number.
        See :ref:`number-notation` for more on styles of notation.

    Correct answer style
        The style of number notation to use when displaying the student's answer.


Marking settings
################

This part type provides the following properties to the :data:`settings` object:

.. data:: minvalue

    :term:`Minimum accepted value`, as a :data:`number`.

.. data:: maxvalue

    :term:`Maximum accepted value`, as a :data:`number`.

.. data:: correctAnswerFraction

    :term:`Display the correct answer as a fraction?`

.. data:: allowFractions
    :noindex:

    :term:`Allow the student to enter a fraction?`

.. data:: mustBeReduced

    :term:`Must the fraction be reduced?`

.. data:: mustBeReducedPC

    The proportion of credit to award if the student's answer is a non-reduced fraction.

.. data:: notationStyles

    A :data:`list` of the styles of notation to allow, other than ``<digits>.<digits>``.
    See :ref:`number-notation`.

.. data:: displayAnswer
    :noindex:

    A representative correct answer to display, as a :data:`number`.

.. data:: precisionType

    The type of precision restriction to apply, as set by :term:`Precision restriction`.
    One of ``"none"``, ``"dp"``, or ``"sigfig"``.

.. data:: strictPrecision

    :term:`Require trailing zeros?`

.. data:: precision

    The number of decimal places or significant figures to require.

.. data:: precisionPC

    The proportion of credit to award if the student's answer is not given to the required precision.

.. data:: precisionMessage

    A message to display in the marking feedback if the student's answer was not given to the required precision.
