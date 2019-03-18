.. _matrix-entry:

Matrix entry
^^^^^^^^^^^^

Matrix entry parts ask the student to enter a matrix of numbers. 
Marks are awarded if every cell in the student's answer is equal to the corresponding cell in the correct answer, within the allowed margin of error.
    
You can find `the matrix entry part's built-in marking algorithm at GitHub <https://github.com/numbas/Numbas/blob/master/marking_scripts/matrixentry.jme>`_.

Marking
#######

.. glossary::
    Correct answer
        The expected answer to the part. 
        This is a JME expression which must evaluate to a :data:`matrix`.

    Number of rows
        The default number of rows in the student's answer field.

    Number of columns
        The default number of columns in the student's answer field.

    Allow student to change size of matrix?
        If this is ticked, then the student can change the number of rows or columns in their answer. 
        Use this if you don't want to give a hint about the dimensions of the answer.

    Margin of error allowed in each cell
        If the absolute difference between the student's value for a particular cell and the correct answer's is less than this value, then it will be marked as correct.

    Gain marks for each correct cell?
        If this is ticked, the student will be awarded marks according to the proportion of cells that are marked correctly. 
        If this is not ticked, they will only receive the marks for the part if they get every cell right. 
        If their answer does not have the same dimensions as the correct answer, they are always awarded zero marks.

    Precision restriction
        You can insist that the student gives their answer to a particular number of decimal places or significant figures. 
        For example, if you want the answer to be given to 3 decimal places, :math:`3.1` will fail this restriction, while :math:`3.100` will pass. 

        The cells of the correct answer are rounded off to the maximum precision as the student used in any of their cells, or the required precision - whichever is greater. 
        If the student's answer is within the specified tolerance of the rounded-off correct value, it is classed as correct.
        Finally, if any of the cells in the student's answer are not given to the required precision, the penalty is applied.

        If the precision doesn't matter, select :guilabel:`None`.

    Allow the student to enter fractions?
        This option is only available when no precision restriction is applied, since they apply to decimal numbers. 
        If this is ticked, the student can enter a ratio of two whole numbers, e.g. ``-3/8``, as their answer.

    Display numbers in the correct answer as fractions?
        If this is ticked, then non-integer numbers in the correct answer will be displayed as fractions instead of decimals.

    Require trailing zeros?
        This option only applies when a precision restriction is selected. 
        If this is ticked, the student must add zeros to the end of their answer (when appropriate) to make it represent the correct precision. 
        For example, consider a part whose correct answer is :math:`1.4`, and you want the student's answer to be correct to three decimal places. 
        If "Require trailing zeros?" is ticked, only the answer :math:`1.400` will be marked correct. 
        If it is not ticked, any of :math:`1.4`, :math:`1.40` or :math:`1.400` will be marked as correct. 
        If *too many* zeros are used, e.g. :math:`1.4000`, the answer is marked as incorrect.

    Partial credit for wrong precision
        This option only applies when a precision restriction is selected. 
        If the student does not give all of the cells in their answer to the required precision, they only get this much of the available credit for the part.

    Message if wrong precision
        This option only applies when a precision restriction is selected. 
        If the student does not give all of the cells in their answer to the required precision, they are given this feedback message.
 
Marking settings
################

This part type provides the following properties to the :data:`settings` object:

.. data:: correctAnswer
    :noindex:

    The correct answer to the part, as set in :term:`Correct answer`.

.. data:: numRows

    The default :term:`Number of rows` in the student's answer.

.. data:: numColumns

    The default :term:`Number of columns` in the student's answer.

.. data:: allowResize

    :term:`Allow student to change size of matrix?`

.. data:: tolerance

    :term:`Margin of error allowed in each cell`

.. data:: markPerCell

    :term:`Gain marks for each correct cell?`

.. data:: allowFractions
    :noindex:

    :term:`Allow the student to enter fractions?`

.. data:: precisionType
    :noindex:

    The type of precision restriction to apply: one of ``"none"``, ``"dp"`` or ``"sigfig"``, as set in :term:`Precision restriction`.

.. data:: precision
    :noindex:

    The number of decimal places or significant figures to require.

.. data:: precisionPC
    :noindex:

    The proportion of credit to award if any cell is not given to the required precision.

.. data:: precisionMessage
    :noindex:

    A message to display in the marking feedback if any cell in the student's answer was not given to the required precision.

.. data:: strictPrecision
    :noindex:

    :term:`Require trailing zeros?`

