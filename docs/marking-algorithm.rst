.. _marking-algorithm:

Marking algorithms
==================

Every :ref:`question part <parts>` has a :dfn:`marking algorithm`, which is is responsible for:

    * Rejecting the student's answer if it's invalid. 
      If the answer is rejected, no credit or feedback will be given and the student must change their answer before resubmitting.
    * If the student's answer is valid, assigning credit and giving feedback messages.

The :dfn:`credit` for a part is the proportion of the marks available which should be awarded to the student.
The total marks available are set by the question author, and might be reduced if the student reveals :term:`steps`, or if this part is a gap in a :ref:`gap-fill <gap-fill>` part.

The :dfn:`feedback messages` shown to the student are strings of text shown after the part has been marked.
These might only become visible to the student after they have finished the exam, so don't rely on feedback messages to convey information that students might need in subsequent parts.

The marking algorithm comprises a set of :dfn:`marking notes` written in :ref:`jme` syntax, which are evaluated similarly to :ref:`question variables <variables>`.

Two marking notes are required: 

.. data:: mark

    The ``mark`` note should award credit and provide feedback based on the student's answer.
    If the student's answer is invalid, ``mark`` should :jme:func:`fail`. 


.. data:: interpreted_answer

    The ``interpreted_answer`` note should produce a value representing the student's answer to this part, which can be used by other parts with :ref:`adaptive marking <adaptive-marking>`.

Each note evaluates to a value, and also produces a list of :dfn:`feedback items`, which modify the amount of credit awarded or give a message to the student. 
When a feedback item modifies the amount of credit awarded, a message describing the number of marks awarded or taken away from the previous total is displayed to the student.

If a note fails, either because it applies the :jme:func:`fail` function or an error is thrown while it is evaluated, it will produce no value and no feedback items.
Any notes referring to a failed note also fail.
If the ``mark`` or ``interpreted_answer`` notes fail, the student's answer is rejected and the student must change their answer before resubmitting.

Like question variables, marking notes can refer to each other.
When another note is referred to in another note's definition, its value is substituted in.
To apply another note's feedback items, use :jme:func:`apply`.

.. _marking-algorithm-variables:

Variables available to marking algorithms
-----------------------------------------

The following variables are available for use by marking algorithms:

.. data:: path

    The path to this part, in the form ``pN(gN|sN)``.
    The first part (part a) has path ``p0``.
    As an example, the second gap in part c would have path ``p2g1``.

.. data:: studentAnswer

    The student's answer to the part.
    The :ref:`data type <jme-data-types>` of this value depends on the part of the type.
    See :ref:`the list of standard part type values <part_type_variable_replacement>`, and :ref:`custom part type answer input methods <custom-part-type-answer-input-methods>` for details on the data types produced by different part types.

.. data:: settings

    A :data:`dict` of the part's settings.

    For built-in parts, see the relevant :ref:`part type <part-types>`'s documentation.
    For :ref:`custom part types <custom-part-types>` this is all of the :ref:`settings <custom-part-type-settings>` defined in the part.

.. data:: marks

    The number of :term:`marks` available for this part.

.. data:: partType

    The type of this part, as a :data:`string`.

.. data:: gaps

    A :data:`list` of the :ref:`gaps <gap-fill>` belonging to this part.
    Each element in the list is a :data:`dict` of the same variables that would be available in the gap's own marking algorithm.

.. data:: steps

    A :data:`list` of the :term:`steps` belonging to this part.
    Each element in the list is a :data:`dict` of the same variables that would be available in the gap's own marking algorithm.

.. data:: input_options

    (Only for :ref:`custom part types <custom-part-types>`)

    A :data:`dict` of the options for the part's :ref:`answer input method <custom-part-type-answer-input-methods>`.

.. _jme-marking-functions:

Marking-specific JME functions
------------------------------

All the built-in :ref:`JME functions <jme-functions>` are available in marking notes, as well as the following functions specifically to do with marking:

.. jme:function:: correct(message)
    :keywords: award, credit, right

    Set the credit to 1 and give the feedback message ``message``. 
    If ``message`` is omitted, the default "Your answer is correct" message for the current locale is used.

.. jme:function:: incorrect(message)
    :keywords: credit, wrong

    Set the credit to 0 and give the feedback message ``message``. 
    If ``message`` is omitted, the default "Your answer is incorrect" message for the current locale is used.

.. jme:function:: correctif(condition)
    :keywords: condition, award, credit, right, wrong

    If ``condition`` evaluates to ``true``, set the credit to 1 and give the default feedback message. 
    Otherwise, set the credit to 0 and give the default feedback message.

    Equivalent to ``if(condition,correct(),incorrect())``.

.. jme:function:: set_credit(credit, message)
    :keywords: award, credit, score

    Set the credit to ``credit``, and give the feedback message ``message``. 
    The message should explain why the credit was awarded.

.. jme:function:: add_credit(credit, message)
    :keywords: award, credit, score
    
    Add ``credit`` to the current total, to a maximum of 1, and give the feedback message ``message``. 
    The message should explain why the credit was awarded.

    If ``credit`` is negative, credit is taken away, to a minimum of 0.

.. jme:function:: sub_credit(credit, message)
    :keywords: subtract, credit, score, penalty, penalise

    Subtract ``credit`` from the current total and give the feedback message ``message``.
    The message should explain why the credit was taken away.

.. jme:function:: multiply_credit(proportion, message)
    :keywords: penalty, credit, score

    Multiply the current credit by ``proportion`` and give the feedback message ``message``.
    The message should explain why the credit was modified.

    This operation is displayed to the student as an absolute change in marks awarded, not a multiplication. 
    For example, if the student already had 2 marks and `multiply_credit(0.5,message)` was applied, the message displayed would be along the lines of "1 mark was taken away".

.. jme:function:: end()
    :keywords: stop

    End the marking here. 
    Any feedback items produced after this one are not applied.

    This is most useful as a way of stopping marking once you've decided the student's answer is incorrect partway through a multi-step marking process.

.. jme:function:: fail(message)
    :keywords: error

    Reject the student's answer as invalid, set the credit to 0 and give the feedback message ``message``.
    The message should explain why the student's answer was rejected.

    The marking ends here.

    Since the student might not see the feedback message until the exam is over, you should also use :jme:func:`warn` to add a warning message next to the input field describing why the student's answer was rejected.

.. jme:function:: warn(message)
    :keywords: warning, feedback, message

    Show a warning next to the answer input.
    This does not affect credit or stop the running of the marking algorithm.

.. jme:function:: feedback(message)
    :keywords: message, comment

    Give the feedback message ``message``, without modifying the credit awarded.

.. jme:function:: positive_feedback(message)
    :keywords: message, comment, tick

    Give the feedback message ``message``, without modifying the credit awarded, but with a positive annotation (a green tick in the default theme).

.. jme:function:: negative_feedback(message)
    :keywords: message, comment, cross

    Give the feedback message ``message``, without modifying the credit awarded, but with a negative annotatin (a red cross in the default theme).

.. jme:function:: x ; y
    :keywords: then
    :op: ;

    Add feedback items generated by ``x`` to those generated by ``y``, and return ``y``.

    This is a way of chaining multiple feedback items together.

    **Example**:
        * ``incorrect() ; end()`` - mark the student's answer as incorrect, then end marking.
        * ``apply(note1) ; apply(note2)`` - apply feedback generated by ``note1``, then feedback generated by ``note2``.

.. jme:function:: apply(feedback)
    :keywords: concatenate, add, feedback, substitute

    If ``feedback`` is the name of a marking note, apply its feedback items to this note.

    If ``feedback`` is a list of feedback items generated by a function such as :jme:func:`submit_part`, apply them to this note.

    **Examples**:
        * ``apply(validNumber)`` - add the feedback from the note ``validNumber`` to this note.
        * ``apply([submit_part(gaps[0]["path"]), submit_part(gaps[1]["path"])])`` - mark the first two gaps and add their feedback to this note.

.. jme:function:: apply_marking_script(name, studentanswer, settings, marks)
    :keywords: run, evaluate, marking

    Apply the marking script with the given name, with the given values of the variables ``studentanswer`` and ``settings`` and with ``marks`` marks available.

    Any feedback items generated by the marking script are applied to this note.

    The built-in marking scripts are stored in the `marking_scripts <https://github.com/numbas/Numbas/tree/master/marking_scripts>`_ folder of the Numbas source repository.
    Use the name of the script without the ``.jme`` extension as the ``name`` parameter of this function.

    **Example**:
        * ``apply_marking_script("numberentry",studentAnswer,settings+["minvalue":4,"maxvalue":5],1)`` - mark this part using the :ref:`number entry <number-entry>` part's marking script, but with the minimum and maximum accepted values set to 4 and 5.

.. jme:function:: submit_part(path,[answer])
    :keywords: part, mark, validate

    Submit the part with the given path. 
    If ``answer`` is given, the answer stored for that part is overwritten with the given value.
    Returns a dictionary of the following form::

        [
            "answered": has the student given a valid answer to the part?,
            "credit": credit awarded for the part,
            "marks": number of marks awarded,
            "feedback": feedback items generated by the part's marking algorithm
        ]

    :ref:`Custom part types <custom-part-types>` can't depend on other parts being available. 
    However, you might want to allow the question author to provide the path of another part, or do something with this part's gaps or steps, whose paths are listed in :data:`gaps` and :data:`steps`.

.. jme:function:: mark_part(path, studentanswer)
    :keywords: part, mark, validate
    
    Mark the part with the given path, using the given value for ``studentanswer``.

    Returns a dictionary of the following form::

        [
            "valid": is the given answer a valid answer to the part?,
            "credit": credit awarded for the part,
            "marks": number of marks awarded,
            "feedback": feedback items generated by the part's marking algorithm,
            "states": a dictionary mapping the name of each marking note to a list of feedback items,
            "state_valid": a dictionary mapping the name of each marking note to a boolean representing whether that note failed,
            "values": a dictionary mapping the name of each marking note to its value
        ]

    This function is most useful in a custom marking algorithm for a gap-fill part, when you want to reassign the student's answers to each of the gaps.
    For example, in a part with two number entry gaps, you could ensure that the lowest answer is marked by the first gap, and the highest answer is marked by the second.
    This would allow the student to enter their answers in any order, and the question author to set the expected answer for the first and second gaps to the lowest and highest correct answers, respectively.

.. jme:function:: concat_feedback(items, scale, [strip_messages])
    :keywords: join, add, feedback, apply

    Apply the given list of feedback items (generated by :jme:func:`submit_part` or :jme:func:`mark_part`) to this note, scaling the credit awarded by ``scale``.

    If ``strip_messages`` is ``true``, then all messages are stripped from the feedback items, leaving only items which modify the credit awarded.

    **Example**:
        * Mark gap 0, and award credit proportional to the number of marks available::

            let(result,mark_part(gaps[0]["path"],studentanswer[0]),
                concat_feedback(result["feedback"], result["marks"])
            )

Pre-submit tasks
----------------

Some Numbas extensions provide functions to perform tasks that take a long time, such as fetching a resource from the internet, or running code submitted by the student.

When you have a long-running task depending on the student's answer that must be completed before the marking algorithm can run, you can run it as a :dfn:`pre-submit task`.

A marking algorithm's pre-submit tasks are defined in a note called ``pre_submit``.
This note must produce a list of :data:`promise` values, each resolving to a dictionary of values.
All the usual :ref:`marking algorithm variables <marking-algorithm-variables>` are available to this note.
These values are then collected into a :data:`dict` value called ``pre_submit``, available to the rest of the marking algorithm.

The marking algorithm runs once all of the tasks have finished.
In the mean time, the part shows no feedback.

Tasks should be deterministic: they are assumed to produce the same results for identical student answers.
The results of tasks are cached, so the tasks will only be run when the student's answer changes.

When an attempt at an exam is resumed, the cached results of any pre-submit tasks are used, so the tasks don't have to run again.

Example
#######

This example demonstrates the mechanics of pre-submit tasks by performing the otherwise-pointless task "wait for a while".

The student's answer will determine the number of seconds to wait.

First, define a JavaScript function ``wait(time)`` which performs the task of waiting:

.. code-block:: javascript

    var promise = new Promise(function(resolve,reject) {
      setTimeout(function() {
        resolve({
          seconds_waited: new Numbas.jme.types.TNum(time)
        })
      },time*1000);
    });
    return new Numbas.jme.types.TPromise(promise);

Then add the ``pre_submit`` note to the marking algorithm of a number entry part::

    pre_submit:
        [ wait(studentAnswer) ]

Next, add a feedback line to the ``mark`` note to show the value returned by the task::

    mark:
        feedback("I waited {pre_submit['seconds_waited']} seconds before marking your answer.");
        apply(base_mark)

When you run this question, note that the first time you submit a given number, there is a wait before the feedback is shown.
If you submit the same answer again, the feedback is shown immediately, because the result of the task was cached.
