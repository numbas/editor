.. _explore-mode:

Explore mode
************

The "explore" parts mode allows the creation of adaptive questions.

.. todo::
   More writing to motivate explore mode
   
   Distinction between part definition and part instance

Scoring
=======

The student's scores for each part they visit are collected into pre-defined :guilabel:`Objectives`.
The student's total score for the question is the sum of their objectives minus any penalties accrued for visiting parts, or the question's :guilabel:`Maximum mark`, whichever is lower.

.. glossary::

   Maximum mark
      The maximum mark the student can be awarded for this question.
      If the total obtained by adding up the scores for the objectives and taking away penalties exceeds this amount, this amount is awarded instead.

   Show objectives
      If :guilabel:`Always` is chosen, all objectives are shown in the score breakdown table.
      
      If :guilabel:`When active` is chosen, only objectives corresponding to parts that the student has visited are shown.

   Show penalties
      If :guilabel:`Always` is chosen, all penalties are shown in the score breakdown table.

      If :guilabel:`When active` is chosen, only penalties which have been applied are shown.

Objectives
----------

Each objective has a :guilabel:`Name`, which is shown to the student, and a :guilabel:`Limit`.
Students can accumulate marks toward an objective up to the limit.

Use the limit to restrict how many marks the student can earn for performing a certain task.

.. _explore-penalties:

Penalties
---------

Each penalty has a :guilabel:`Name`, which is shown to the student, and a :guilabel:`Limit`.
Each time the student chooses a :ref:`next part` option which applies a penalty, the defined number of marks is added to the corresponding penalty, up to the limit.

The penalty is not re-applied each time the student revisits an instance of a part.

Use the limit to avoid over-penalising the student for taking a particular option repeatedly.

.. _next-parts:

Next parts
==========

Each part has a :guilabel:`Next parts` tab, where you define which parts the student can visit next.

To add an option, click the :guilabel:`Add a next part option` button, and select a part.

.. todo::
   More explanation of what next parts can do

.. glossary::

   Label
      The label on the button shown to the student.
      If you leave this blank, the next part's name is used.
      You might want to change the label so you don't reveal the destination, or to differentiate two options which lead to the same part.

   Lock this part?
      If ticked, the current part will be locked when the student chooses this next part option.
      The student will not be able to change or resubmit their answer to this part.

      If not ticked, the student can come back to this part and change their answer.

      Use this if a subsequent part would reveal information which the student could use to improve their answer to this part, and you don't want them to do that.

   Availability
      Define when the option is available to the student.
      
      * :guilabel:`Always` - always available.
      * :guilabel:`When answer submitted` - available once the student has submitted a valid answer to this part, whether it's correct or not
      * :guilabel:`When unanswered or incorrect` - available if the student hasn't submitted an answer, or if they've submitted an incorrect answer. Unavailable once they submit a correct answer.
      * :guilabel:`When incorrect` - available after the student submits an incorrect answer.
      * :guilabel:`When correct` - available once the student submits a correct answer.
      * :guilabel:`Depending on expression` - available if the :term:`Available if` expression evaluates to ``true``.

   Available if
      This field is only shown when :term:`Availability` is set to :guilabel:`Depending on expression`.

      Write a JME expression which evaluates to ``true`` when the option should be available to the student, and ``false`` otherwise.

      The following variables are defined during the evaluation of this expression:
      
      * all question variables;
      * the values of any marking notes produced by this part's :ref:`marking algorithm <marking-algorithm>`;
      * ``credit``, a :data:`number` between 0 and 1 corresponding to the amount of credit awarded for this part;
      * ``answered``, a :data:`boolean` representing whether the student has submitted a valid answer.

   Penalty to apply when visited
      If you want to apply a penalty when the student chooses this option, select the name of a :ref:`penalty <explore-penalties>` here.

   Amount of penalty
      The number of marks to add to the chosen penalty.

      Only shown if :term:`Penalty to apply when visited` is not "None".

Variable replacements
---------------------

When the student selects a next part option, you can replace the values of question variables before the part instance is created.

.. todo::
   Motivate replacing variables

Click :guilabel:`Add a variable replacement` to define a new variable replacement.

For each replacement, you must select the name of the variable you want to replace, and then define what it's replaced with, from the following options:

.. glossary::
   Student's answer
      The student's answer to this part, drawn from the :data:`interpreted_answer` marking note.

   Credit awarded
      The amount of credit awarded to the student for this part, a :data:`number` between 0 and 1.

   JME expression
      The variable's value is replaced with the result of the given :ref:`JME` expression.

      The following variables are defined during the evaluation of the expression:

      * all question variables;
      * the values of any marking notes produced by this part's :ref:`marking algorithm <marking-algorithm>`.
