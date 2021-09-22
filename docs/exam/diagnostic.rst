.. _diagnostic-mode:

Diagnostic mode
***************

.. note::

    The diagnostic mode is still in active development.
    As of June 2021, it has not been used on real students yet.
    The feature has been made available so that interested users can guide the development of this mode.

The diagnostic mode for exams selects the questions to show to the student based on their respones to previous questions.

Use diagnostic mode for:

* A test to identify students' strengths and weaknesses at the start of a course;
* A mastery-based assessment of a whole course, with a bank of material for students to complete at their own pace.

A diagnostic-mode exam has an associated *knowledge graph*, consisting of *topics* and *learning objectives*.

Topics represent individual areas of knowledge that you would like to assess.
Each topic can depend on, or lead to, other topics.

Learning objectives are collections of topics.
A topic can belong to one learning objective, more than one, or none at all.

The behaviour of a diagnostic test is controlled by the exam's :ref:`diagnostic algorithm <diagnostic-algorithm>`.

The algorithm has access to the exam's knowledge graph as well as a :dfn:`state` object, which it is able to modify.

When a diagnostic test starts, the algorithm selects the first question to show the student.

While the student is answering a question, they can submit answers to each part and get feedback determined by the exam's feedback settings.

At any time, the student can click the :guilabel:`Move to the next question` button.

The diagnostic algorithm produces a list of options for the next question, based on the student's answers to the current question and the state.

If there are no options, the exam ends.

If there is only one option, it is selected automatically and the student is shown the corresponding question.

If there is more than one option, the student is shown each of them, as well as some prompt text.

When the student selects an option, they are moved to the next question, and the previous question is locked.

The output of a diagnostic test is a list of *progress* items, each with a name and measures of progress and credit.
The list of items is defined by the diagnostic algorithm.

.. _diagnostic-algorithm:

Diagnostic algorithms
^^^^^^^^^^^^^^^^^^^^^

The diagnostic algorithm is a script written in JME syntax.

Some notes are required.

The algorithm can define more notes, which are evaluated when needed.

You can use a built-in algorithm or write your own.
If you use a built-in algorithm, you can extend it, replacing the definitions of some notes with your own.

Built-in algorithms
-------------------

DIAGNOSYS
=========

The aim of the DIAGNOSYS algorithm is to efficiently establish which topics the student understands, and which they don't.

The test chooses topics at random.

When the student answers a question on a topic, it is marked as either "passed" or "failed".
If the topic is "passed", then all topics it depends on are also marked as "passed".
If the topics is "failed", then all topics it leads to are also marked as "failed".
When every topic is either "passed" or "failed", the exam ends.

Each topic is tested at most once.

The progress list gives an item for each learning objective, as well as a total item. 
The ``progress`` for each item is the proportion of corresponding topics that have been visited, and the ``credit`` is the proportion of topics that are "passed".

Mastery
=======

The aim of the Mastery algorithm is to repeatedly test topics until the student passes them.
Once all topics are passed, the exam ends.

The topics are visited in order.
A topic is passed once all the questions in that topic are answered correctly.

Within a topic, the questions are placed in a queue.
If the student answers a question correctly, it is removed from the queue.
If the student answers a question incorrectly, it is moved back to the end of the queue.

The progress list contains items for the current topic, all learning objectives, and a total for the whole exam.

Writing a diagnostic algorithm
------------------------------

A diagnostic algorithm is a passage of code consisting of notes.

A note is a :ref:`variable name <variable-names>` followed by a colon, and then a JME expression.

Notes are separated by a gap of one or more blank lines.



Variables available to the diagnostic algorithm
===============================================

.. data:: topics

    A :data:`dict` of topics defined in the exam, mapping topic names to :data:`dict` objects containing data about the topic.

    A topic object has the following attributes: 

    * ``name`` - a :data:`string` giving the name of the topic.
    * ``learning_objectives`` - a :data:`list` of the names of the learning objectives the topic belongs to.
    * ``depends_on`` - a :data:`list` of the names of the topics this one depends on.
    * ``leads_to`` - a :data:`list` of the names of the topics this one leads to (the topics that depend on this one).
    * ``questions`` - a :data:`list` of :data:`dict` objects representing questions. Each question object has a :data:`string` attribute ``topic`` giving the name of the topic it belongs to, and a :data:`number` attribute ``number``, giving the position of the question in the topic's list.

.. data:: learning_objectives

    A :data:`list` object of learning objectives defined in the exam. 
    Each entry is a :data:`dict` with the following attributes:

    * ``name`` - a :data:`string` giving the name of the learning objective.
    * ``description`` - a :data:`string` describing the learning objective.

.. data:: state

    The current value of the ``state`` object.
    This value can take any form.

.. data:: current_topic

    The name of the topic that the current question belongs to.

.. data:: current_question

    A :data:`dict` object representing the current question.
    The object has the following attributes:

    * ``name`` - a :data:`string` giving the name of the question.
    * ``number`` - a :data:`number` giving the number of the question in the exam. The first question shown to the student is ``0``, and the next is ``1``, and so on.
    * ``credit`` - a :data:`number` representing the credit awarded to the student for this question. A value of ``1`` represents full marks, and ``0`` represents zero marks.
    * ``marks`` - a :data:`number` representing the number of marks available for the question.


Diagnostic algorithm required notes
===================================

The following notes must be defined in a diagnostic algorithm.
They are evaluated at different times during the exam.

.. data:: state

    Produces the initial value of the ``state`` object.

    This value can take any form.

    Evaluated before the exam starts.

.. data:: first_question

    Get the first question to show the student.

    The returned value should be an element of a topic's ``questions`` list: a :data:`dict` with attributes ``topic`` and ``number``.

    Evaluated when the student begins the exam.

.. data:: progress

    Produce a summary of the student's progress: a :data:`list` of items, each with a name, and measures of progress and credit.

    Evaluated when the exam begins, and whenever the student submits an answer or moves to another question.

.. data:: feedback
   :noindex:

    Get a block of feedback text to show to the student, both during the exam and after it has ended.

    During the exam, in the default theme the feedback is shown above the question statement.
    At the end of the exam, the feedback is shown underneath the progress items.

    Evaluated when the exam begins, and whenever the student submits an answer or moves to another question.

.. data:: after_exam_ended

    Update the ``state`` after the exam ends.

    Evaluated when the exam ends: when the student clicks the :guilabel:`End exam` button, or the :data:`next_actions` note produces no actions.

.. data:: next_actions

    Get the list of actions to offer the student when leaving a question.

    Evaluated when the student clicks the :guilabel:`Move to the next question` button.
