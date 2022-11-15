.. _match-text-pattern:

Match text pattern
^^^^^^^^^^^^^^^^^^

Use a text pattern part when you want the student to enter short, non-mathematical text.
    
You can find `the match text pattern part's built-in marking algorithm at GitHub <https://github.com/numbas/Numbas/blob/master/marking_scripts/patternmatch.jme>`_.

Marking
#######

.. glossary::
    Match test
        The test to use to decide if the student's answer is correct.

        * The :guilabel:`Regular expression` test checks that the student's answer matches the regular expression given in :term:`Answer pattern`.
        * The :guilabel:`Exact match` test marks the student's answer as correct only if it is exactly the same as the text given in :term:`Answer pattern`. 
          Space characters are removed from the start and end of the student's answer as well as the answer pattern before comparison.

    Answer pattern
        The text or pattern the student must match.

        When :term:`Match test` is :guilabel:`Regular expression`, this is a `regular expression <https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Regular_Expressions>`_ defining the strings to be accepted as correct. 
        If there are several valid answers, separate them with a ``|`` character.
        If you're using the full regular expression functionality, note that ``^`` and ``$`` are automatically added to the start and end of the answer pattern to ensure that the student's whole answer matches the pattern.

        You can substitute variables, the same as in content areas, by enclosing expressions in curly braces, e.g. ``{answervar}``. 

    Display answer
        A representative correct answer string to display to the student, in case they press the :guilabel:`Reveal answers` button. 
        You can substitute variables by enclosing expressions in curly braces, the same as in content areas.

    Must the answer be in the correct case?
        If this is ticked, the capitalisation of the student's answer must match that of the answer pattern.
        If it doesn't, partial credit (defined using the slider below the checkbox) will be awarded.


Marking settings
################

The ``studentAnswer`` parameter is a :data:`string` value, containing the string that the student typed in the answer box.

This part type provides the following properties to the :data:`settings` object:

.. data:: correctAnswer
    :noindex:

    The :term:`Answer pattern` string.

.. data:: displayAnswer

    The :term:`Display answer` string.

.. data:: caseSensitive

    :term:`Must the answer be in the correct case?`

.. data:: partialCredit

    The proportion of credit to award if the answer is correct except for the case.

.. data:: matchMode

    The :term:`Match test` setting: either ``"regex"`` or ``"exact"``.


Examples
########

A question in the Numbas demo demonstrates a variety of ways of using 'match text pattern' parts.

`Numbas demo: match text pattern part type <https://numbas.mathcentre.ac.uk/question/66183/numbas-demo-match-text-pattern-part-type/>`_

In the following examples, the variable ``name`` has the value ``Epictetus``

Regular expressions
-------------------

+------------------------------+-----------------------+------------------------------+----------+
| Correct answer               | Must be correct case? | Student answer               | Correct? |
+------------------------------+-----------------------+------------------------------+----------+
| ``Hello``                    | ✓                     | ``Hello``                    | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``Hello``                    | ✓                     | ``hello``                    | ✗        |
+------------------------------+-----------------------+------------------------------+----------+
| ``Hello``                    | ✗                     | ``hello``                    | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``Hello|Hi``                 | ✓                     | ``Hi``                       | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``(ab)+``                    | ✓                     | ``ababab``                   | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``[^d]+``                    | ✓                     | ``abcefgh``                  | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``[^d]+``                    | ✓                     | ``abcdefgh``                 | ✗        |
+------------------------------+-----------------------+------------------------------+----------+
| ``{name}``                   | ✓                     | ``Epictetus``                | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``{name}( {name})+``         | ✓                     | ``Epictetus Epictetus``      | ✓        |
+------------------------------+-----------------------+------------------------------+----------+

Exact match
-----------

+------------------------------+-----------------------+------------------------------+----------+
| Answer pattern               | Must be correct case? | Student answer               | Correct? |
+------------------------------+-----------------------+------------------------------+----------+
| ``Hello``                    | ✓                     | ``Hello``                    | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``Hello``                    | ✓                     | ``hello``                    | ✗        |
+------------------------------+-----------------------+------------------------------+----------+
| ``Hello|Hi``                 | ✓                     | ``Hi``                       | ✗        |
+------------------------------+-----------------------+------------------------------+----------+
| ``Hello|Hi``                 | ✓                     | ``Hello|Hi``                 | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``{name}``                   | ✓                     | ``Epictetus``                | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``{name}``                   | ✓                     | ``epictetus``                | ✗        |
+------------------------------+-----------------------+------------------------------+----------+
| ``{name}``                   | ✗                     | ``epictetus``                | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
| ``{name} Jr.``               | ✓                     | ``Epictetus Jr.``            | ✓        |
+------------------------------+-----------------------+------------------------------+----------+
