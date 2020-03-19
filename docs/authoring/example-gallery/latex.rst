Better maths display and randomised numbers
-------------------------------------------

Now let’s add another part to the question, asking the student to multiply two numbers.

Add another *Number entry* part to your question.
Now that we have two parts, it doesn’t make sense to ask for the answer to the first part in the question statement, so remove the text from the *Statement* and put it back in the first part’s *Prompt*.

.. image:: screenshots/question/9.png
    :alt: The part prompt editor, containing the text "What is 3+5?"

Now, for the second part’s *Prompt*, enter:

    What is 3*5?

And set the correct answer to ``15``.
When you :guilabel:`Test Run` the question, you should be immediately offended by the unattractiveness of the rendering of the multiplication **3*5**.
Mathematical notation is distinct from normal text and needs to be treated separately.
For this reason, Numbas uses *LaTeX* to mark up mathematical notation.

.. note::
    
    While LaTeX is wonderfully expressive, it has quite a steep learning curve; if you’re not familiar with it, see :ref:`LaTeX notation`.

Replace the *Prompt* for the second part with

    What is $3 \\times 5$?

The dollar symbols delimit the LaTeX notation.
Now when you :guilabel:`Test Run` the question again, you will see neatly typeset maths:

.. image:: screenshots/question/10.png
    :alt: The prompt for the second part, with the mathematical notation rendered using LaTeX

For consistency, go back and change the prompt for the first part to:

    What is $3 + 5$?

The most important feature of computer-based assessment is the ability to dynamically generate questions which are different every time they are run.
In Numbas this is achieved using variables.

Let’s change the question so that the two numbers to be added are picked at random.

Click on the :guilabel:`Variables` link.
Click on the :guilabel:`Add a variable` button.
Every variable needs a name and a definition.
The definition is given in JME syntax.

.. note:: For information on what constitutes a valid variable name, see :ref:`Variable names <variable-names>`.

For more on JME syntax, see :ref:`the JME reference <jme>`.

Call this variable ``a``, and give it the definition::

    random(1..9)

The variable will take a random whole-number value between :math:`1` and :math:`9` (inclusive).

To the right of the variable's name, a possible value for the variable is displayed.
You can get a feel for what values a variable can take by pressing the :guilabel:`Regenerate values` button a few times.

Add a second variable called ``b`` and give it the same definition. 

.. image:: screenshots/question/11.png
    :alt: The definition of the variable b.

The next step is to use these variables to define the prompts and acceptable values for both parts.

Change the prompt for the first part to

    What is $\\var{a} + \\var{b}$?

``\var{}`` is a special LaTeX command which inserts the calculated value of the given expression directly into the LaTeX.
It doesn’t do anything to cancel out redundant terms or symbols - more on that later.

Now go to the :guilabel:`Marking` tab and change both accepted values to ``a+b``. 

Click :guilabel:`Test Run` to see how your changes have affected the question.
You can use the :guilabel:`Try another question like this one` button to regenerate the question without having to go back to the editor.

Now your question has nicely rendered maths and uses randomised numbers.

.. topic:: Things to try before moving on:
   
    * Make sure that ``a`` and ``b`` don’t both take the same value by using the ``except`` operator in the definition of ``b``.
    * Add a solution for the second part to the *Advice* section.


