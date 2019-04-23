Writing your first question
===========================

In this tutorial you will learn about the structure and features of a Numbas question by creating a simple arithmetic test, starting with basic functionality and elaborating on that as we cover the more advanced tools available.

We've embedded screencasts of someone running through this tutorial at the start of each section.
You might like to follow along with the video while reading the tutorial.

To begin, let's make a question asking the student to add two numbers.

Log in to the Numbas editor and, in the :guilabel:`Create` box, click on the :guilabel:`Question` link.

.. image:: screenshots/question/1.png
    :alt: The "create a question" link on the homepage is highlighted.

You will be prompted to give your question a name, and to assign it to a project.
As this is your first question you will probably want to use the default project, which is your own workspace.

.. image:: screenshots/question/2.png
    :alt: The "create a new question" form.

The structure of a question
---------------------------

.. raw:: html

    <iframe src="https://player.vimeo.com/video/167127611" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

You are taken to the *editing page* for your new question.
It is worth spending a few moments finding your way around this page.

At the top of the page are the question's name and, above that, a link to the project which it belongs to.
Below are options to run, give feedback and download the question.
Below this there are options to navigate through the various steps involved in editing a question.

In the :guilabel:`Admin` box there are links to copy or delete the question.
And in the :guilabel:`Metadata` box you can manage how your question is organised in the Numbas database.

.. image:: screenshots/question/3.png
    :alt: The question editor, showing "My first question".

In the centre is the main editing interface.
Before moving any further, let's change your question name from "My First Question" to something more descriptive so that you can find it later.
Type "Numbas tutorial: arithmetic" in the :guilabel:`Name` field.

.. image:: screenshots/question/4.png
    :alt: The input box to edit the name of the question, showing "Numbas tutorial: arithmetic".

Every Numbas question consists of three sections: :ref:`Statement <statement>`, :ref:`Parts <parts>`, and :ref:`Advice <advice>`.
In the Statement, the context for the question is given to the student.
Parts are where the student enters their answers.
A question can have one or more parts, each of which is one of several types, depending on what kind of input you want from the student.
Finally, the optional Advice section can be used to give a full solution to the question, which the student can request to see if they're stuck. 

Each of these sections of the editor can be accessed from the links in the sidebar, or you can use the buttons at the bottom of each section to guide you through in a logical order.

Let's make a question with a short statement, one part asking for a number to be entered, and a little bit of advice.

A very basic arithmetic question
--------------------------------

We’re going to ask the student to add together the numbers :math:`3` and :math:`5`.
If you are still on the Settings page, click on the :guilabel:`Statement` button at the bottom, or on the :guilabel:`Statement` link in the sidebar.
Type 

    What is 3+5?

in the :guilabel:`Question statement` box.

.. image:: screenshots/question/5.png
    :alt: The question statement box, containing the text "What is 3+5?"

Click on the :guilabel:`Test Run` button.
Your question will open in a new browser window.
There is a statement, but nowhere to enter an answer.
We need to create a number entry part.
Go back to the editing window and click on :guilabel:`Parts` in the sidebar, or follow the navigation buttons at the bottom of the page, skipping past :guilabel:`Variables`, which we will consider later.

Once on the Parts page, click on the :guilabel:`Add a part` button, and select :ref:`Number entry <number-entry>`.

.. image:: screenshots/question/6.png
    :alt: The "Add a part" drop-down, with "Number entry" selected.

Every part has a :term:`Prompt`, which you can use to ask the student for the particular answer the part assesses.
We’ve already asked our question in the question’s statement, so we can leave this part’s prompt empty.
Instead, click on the :guilabel:`Marking` link, where you’ll state the correct answer for the part.

.. image:: screenshots/question/7.png
    :alt: The "marking settings" tab, with 8 entered in the minimum and maximum value fields.

Enter ``1`` in the Marks field, so the student is given one mark if their answer is marked correct.
*Number entry* parts are marked by checking if the student’s answer is within the range defined by the :term:`Minimum accepted value` and :term:`Maximum accepted value` fields.
For this question the answer is exactly :math:`8`, so put that in both fields.

Now press :guilabel:`Test Run` again to try out the question.
If you put ``8`` in the entry box and press :guilabel:`Submit part`, the answer is marked correct; any other number is marked incorrect.

To finish off this question, add a solution to the *Advice* section.
There isn’t much to explain for this particular question, so just click on the :guilabel:`Advice` tab and enter

    3+5 = 8

in the box.

Now click :guilabel:`Test Run` again; if you press the :guilabel:`Reveal answers` button at the bottom of the question page, the number input is filled in with the correct answer, and the advice text you wrote is displayed at the bottom.

.. image:: screenshots/question/8.png
    :alt: The question, after the student has submitted an answer and then revealed 

You have created your first complete question! 

.. topic:: Things to try before moving on:

    * Enter a decimal number as the correct answer, and set the minimum and maximum accepted values to allow an error of plus or minus :math:`0.005`.
    * Look at :ref:`the documentation for the Number entry part <number-entry>` and try out the precision restrictions.

Better maths display and randomised numbers
-------------------------------------------

.. raw:: html

    <iframe src="https://player.vimeo.com/video/167131067" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

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
   
    * Add two new variables ``c`` and ``d``, and change the second part to use them instead of ``a`` and ``b``.
    * Make sure that ``a`` and ``b`` don’t both take the same value by using the ``except`` operator in the definition of ``b``.
    * Add a solution for the second part to the *Advice* section.

More complicated mathematical expressions
-----------------------------------------

.. raw:: html

    <iframe src="https://player.vimeo.com/video/167137075" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

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

It’s a good idea to add comments to your variable definitions to explain what they represent and how they’re generated.
A comment starts with two forward slashes ``//`` and continues until the end of the line.

A reasonable comment for ``x0`` would be:

    A root of the quadratic equation. 
    Chosen not to be zero.

A reasonable comment for ``x1`` would be:

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

What next?
----------

Now you've written your own question, you'll probably want to dive into more advanced topics.
Here are some things you could try next:

* :ref:`Set up a project <collaboration>` so you can collaborate with your colleagues.
* If you've got an idea of something you'd like to do, the :ref:`how-do-i` section probably contains an example showing you how to do it.
* Look at `the question highlights on the Numbas blog <https://www.numbas.org.uk/blog/category/question-highlights/>`_ for some inspiration.
* Start writing your own questions!
