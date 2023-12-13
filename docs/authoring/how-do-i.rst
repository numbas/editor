.. _how-do-i:

###########
How do I...
###########

This section largely draws from `the "How-tos" project <https://numbas.mathcentre.ac.uk/project/697/>`__ on the numbas.mathcentre.ac.uk editor, where we gather example questions created to demonstrate authoring techniques.

If you've got a question that isn't answered here, try asking on `the Numbas users mailing list <https://groups.google.com/forum/#!forum/numbas-users>`__.

.. contents:: :local:

******************
Delivering an exam
******************

.. _delay-results:

Delay showing students scores until a certain date
--------------------------------------------------

    This is only possible when delivering the exam through the `Numbas LTI provider <https://docs.numbas.org.uk/lti/>`__.

    First, turn off the feedback options :term:`Show current score?` and :term:`Show answer state?`, so students don't get any feedback while completing the exam.

    Then, set :term:`Reveal answers to all questions` to :guilabel:`When entering in review mode`.

    Finally, after uploading the exam to the Numbas LTI provider, set the :guilabel:`Allow students to review attempt from` setting to the date and time after which you'd like to allow students to see their scores and feedback.

    When a student completes the exam, they won't see any feedback.
    Once the chosen time has passed, the student will be able to re-enter the exam in review mode and see their scores and full feedback.

Print a hard copy of an exam
----------------------------

    You can use the :guilabel:`Printable worksheet` :ref:`theme <themes>` to create a version of a Numbas exam that you can print immediately, or to a PDF file.

    .. raw:: html

        <iframe src="https://player.vimeo.com/video/528786881" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>


********************************
Images, diagrams and other media
********************************

.. _include-an-image:

Include an image
-----------------------

    It's best practice to attach images to questions so that they're distributed with the final compiled exam, rather than linking to images stored on a webserver. 

    When editing a content area, click on the :guilabel:`Insert/Edit Image` button. 
    You can then either pick an image you've already uploaded, or click the :guilabel:`Choose file` button to upload an image from your computer.

    You can resize images and add a title attribute by selecting the image in the content area and clicking on the :guilabel:`Insert/Edit Image` button.

    .. raw:: html

        <iframe src="https://player.vimeo.com/video/167083433" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>


.. _embed-a-video:

Embed a video
------------------

    Upload your video to somewhere like YouTube or Vimeo. 
    Including videos in downloaded exam packages is a terrible idea, so we discourage that. 

    Click the :guilabel:`Embed image/video` button, and paste in the URL of your video.

    .. raw:: html

        <iframe src="https://player.vimeo.com/video/167082427" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>


.. _embed-a-diagram:

Include an interactive diagram
-----------------------------------

    There are a few ways of including an interactive diagram in a Numbas question. 

    `JSXGraph <https://jsxgraph.org>`__ is a JavaScript library for creating interactive diagrams.
    There is :ref:`an extension <jsxgraph-extension>` which allows you to create JSXGraph diagrams using JME or JavaScript code.

    `GeoGebra <https://www.geogebra.org>`__ applets are much easier to create and use, but are loaded from `geogebra.org <https://www.geogebra.org>`__ so the student must have internet access in order to use any questions containing GeoGebra applets.
    For more information, see the page on the :ref:`GeoGebra extension <geogebra-extension>`.

    `Eukleides <https://numbas.github.io/numbas-extension-eukleides/docs/>`__ is a Numbas extension designed to easily produce accessible, dynamic diagrams.
    Interactivity is limited to dragging points, which can be used to construct the rest of the diagram.

    .. todo::

        Redo this video

        .. raw:: html

            <iframe src="https://player.vimeo.com/video/174512376" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

Substitute random variables into an image
-----------------------------------------

    Text inside an SVG image follows the same variable substitution rules as prose text: expressions enclosed in curly braces are evaluated and replaced with the resulting string.

    Pay attention to the text alignment options when designing your image: randomly generated values are usually not the same width as the expressions they replace.

    See the question `Volume of a swimming pool <https://numbas.mathcentre.ac.uk/question/18295/volume-of-a-swimming-pool/>`__ for an example of an SVG image with variables substituted into text.


Show one of several images based on a random variable
-----------------------------------------------------

See the question `Using a randomly chosen image <https://numbas.mathcentre.ac.uk/question/1132/using-a-randomly-chosen-image/>`__ for an example of one method.


Display a random line in a GeoGebra applet
------------------------------------------

A neat way to create a random line is to randomly pick the positions of two points on the line.

Create two points in your GeoGebra worksheet, and a line between those two points.
Set the positions of the points in the parameters to the :jme:func:`geogebra_applet` function.

See `this example question <https://numbas.mathcentre.ac.uk/question/22835/a-randomised-line-in-a-geogebra-worksheet-set-the-positions-of-two-points/>`__.


Use student input in a JSXGraph diagram
---------------------------------------

`This question <https://numbas.mathcentre.ac.uk/question/2223/use-student-input-in-a-jsxgraph-diagram/>`__ shows how to construct a line corresponding to an equation given by the student.




**********************
Appearance and display
**********************

.. _change-how-the-question-looks:

Change how the question looks
----------------------------------

You can use the formatting tools in the question editor to style your text. 
However, if you repeat the same styles over and over, or want to change aspects of the layout such as space between elements or decoration, you'll need to write some CSS.

CSS is a language for defining how things should look - there's `a good introduction at Khan Academy <https://www.khanacademy.org/computing/computer-programming/html-css/intro-to-css/>`__. 
In the Numbas editor, you can add CSS rules to a question in the :ref:`preamble` section.

The following questions demonstrate how to use CSS to change the look of a Numbas question:

* `Style a table of sales figures <https://numbas.mathcentre.ac.uk/question/2717/style-a-table-of-sales-figures/>`__ - CSS rules apply a fixed-width font for figures, and put a line before the final row.
* `Use CSS to style parallel translation <https://numbas.mathcentre.ac.uk/question/5599/use-css-to-style-parallel-translation/>`__ - CSS classes "english" and "cymraeg" apply different background colours to English and Welsh portions of text.
* `More space between multiple choice answers <https://numbas.mathcentre.ac.uk/question/5307/more-space-between-multiple-choice-answers/>`__ - a single CSS rule adds a bit more empty space underneath each choice.


Set an attribute on an HTML element based on the value of a question variable
-----------------------------------------------------------------------------

Use the :guilabel:`Source code` view in a content area to edit its HTML code.
You can set the value of an attribute on an HTML tag to the result of a JME expression by prefixing the attribute's name with ``eval-``.
Variables are substituted into the attribute's value using curly braces.

For example, this tag will have its ``class`` attribute set to the value of the variable ``classes``::

    <div eval-class="{classes}">

See `this example question <https://numbas.mathcentre.ac.uk/question/18650/set-an-html-element-s-attributes-based-on-a-question-variable/>`__.


********
Notation
********

Use :math:`j` as the imaginary unit
-----------------------------------

In the :ref:`question-constants` tab of the question editor, turn off ``i``, and define a new constant with :guilabel:`Name` ``j``, :guilabel:`Value` ``sqrt(-1)`` and :guilabel:`LaTeX` ``j``.

*************
Question text
*************

.. _conditional-visibility:

Show one of several blocks of text based on a random variable
------------------------------------------------------------------

Suppose you have a random variable ``a``, which has the value 1,2 or 3, corresponding to three different scenarios. 
First, write out the text for each scenario. 

.. image:: /_static/how_do_i/conditional_visibility.png
    :alt: The conditional visibility button on the toolbar of the content editor

There is a button in the :ref:`rich text editor <content-areas>` labelled :guilabel:`Conditional visibility`. 
This allows you to give an expression (in :ref:`JME` syntax) which dictates whether or not the selected text is shown. 
For each scenario, select the corresponding text and click on the :guilabel:`Conditional visibility` button. 
Enter ``a=1`` for the first block, ``a=2`` for the second, and ``a=3`` for the third.

When you run the question, only the block of text corresponding to the value of ``a`` is shown.

You can see an example of this technique in the question `Conditional visibility <https://numbas.mathcentre.ac.uk/question/7711/conditional-visibility/>`__.


Display a dollar sign
--------------------------

Because the dollar symbol is used to delimit portions of LaTeX maths, you need to escape dollar signs intended for display by placing a backslash before them -- that is, write ``\$``. 

See `this example question <https://numbas.mathcentre.ac.uk/question/4528/displaying-a-dollar-sign/>`__.


Use random names for people in question statements
--------------------------------------------------

Whenever you have a named person in a question, you should try to randomise the name.
It doesn't really matter what people are called in word problems, but it can have a bad effect on students' perceptions of the world if the plumber's always called Gary and the nurse is always called Julie.

We've written a "random person" extension which makes it easy to randomly pick a name for a person, and use the correct pronouns.

There's `documentation on the extension's GitHub repository <https://github.com/numbas/numbas-extension-random-person>`__, and `an example question <https://numbas.mathcentre.ac.uk/question/23094/the-random-person-extension/>`__ showing how to use it most effectively.


Randomise the names of variables in an expression
-------------------------------------------------

Suppose you want the student to solve an equation in terms of some variables, but you want to change the names of those variables each time the question is run.
There are a couple of ways of achieving this. 

One straightforward method is to use the :jme:func:`expression` command to substitute variable names, randomly generated as strings, into JME expressions as variables. 
See `this example question <https://numbas.mathcentre.ac.uk/question/20358/randomise-variable-names-expression-version/>`__.


Use commas or spaces to separate powers of 1,000 in numbers
-----------------------------------------------------------

By default, numbers substituted into question text do not have any separators between powers of 1,000.
When working with real-world data, separating blocks of figures can improve readability.
Use the :jme:func:`formatnumber` function to render numbers following one of the supported :ref:`number-notation` styles.

`This example question <https://numbas.mathcentre.ac.uk/question/26873/use-formatnumber-to-separate-powers-of-1000-with-commas/>`__ shows the :jme:func:`formatnumber` function in use.


Show amounts of money with trailing zeros
-----------------------------------------

Use the :jme:func:`currency` function to ensure that amounts of money are displayed as you'd expect: the figure is either a whole number or given to two decimal places, and the appropriate symbol for the unit of currency is shown before or after the figure.

See `this example question <https://numbas.mathcentre.ac.uk/question/26875/show-amounts-of-currency-with-trailing-zeros/>`__.


Pad a number with leading zeros
-------------------------------

Convert the number to a string, then use the :jme:func:`lpad` function to add zeros to the start until it's the desired length.

For example, to pad a number :math:`n` so that it's four digits long, use ``lpad(string(n), 4, '0')``.

See `this example question <https://numbas.mathcentre.ac.uk/question/31466/pad-with-leading-zeros/>`__.


*****
LaTeX
*****

Include a randomised LaTeX command
---------------------------------------

If you want to include a LaTeX command in a string variable, remember that backslashes and curly braces in strings must be escaped, unless the string is marked as :jme:func:`safe`.
That means you should type two backslashes where you'd normally type one, and add a backslash before each left or right curly brace, for example ``\\frac\{1\}\{2\}`` produces the LaTeX ``\frac{1}{2}``.
You need to do this because the backslash is used as an escape character in strings so you can include quote marks, which would normally end the string. 
(For example, ``"he said \"hello\" to me"``)

If the string is wrapped in :jme:func:`safe`, then you don't need to escape curly braces, but you do still need to double each backslash. For example, ``safe("\\frac{1}{2}")``.

If you substitute a string variable into a mathematical expression using ``\var``, it's normally assumed to represent plain text and displayed using the plain text font. 
If your string is really a partial LaTeX expression, you must mark it as such by wrapping it in ``latex()``, e.g. ``\var{latex(mystring)}``.

See `this example question <https://numbas.mathcentre.ac.uk/question/10342/displaying-a-randomised-latex-command/>`__.

The majority of the time, substituting raw LaTeX into a question is not the neatest way of achieving what you want.
It's often possible to achieve the desired effect by good use of the :ref:`simplify <simplification-rules>` command.

However, if you do need to substitute raw LaTeX code into question text for some reason, the :jme:func:`latex` command is normally what you want.

See `this example question <https://numbas.mathcentre.ac.uk/question/22489/how-to-substitute-randomised-raw-latex-into-question-text/>`__, which shows how different methods of substituting a string into question text end up being displayed.

Display a set of tuples
-----------------------

:jme:data:`list` values are normally displayed in LaTeX using square brackets.
To display them as tuples, enclosed with parentheses, you can use ``latex('(' + join(tuple,',') + ')')``.

See `this example question <https://numbas.mathcentre.ac.uk/question/88926/display-tuples-in-latex/>`__.

Show the components of a vector as multiples of basis vectors
-------------------------------------------------------------

Given a vector ``a``, you can render it in LaTeX as a sum of multiples of basis vectors :math:`\boldsymbol{i}`, :math:`\boldsymbol{j}` and :math:`\boldsymbol{k}` as follows::

    \simplify{ {a[0]}*v:i + {a[1]}*v:j + {a[2]}*v:k }

See `this example question <https://numbas.mathcentre.ac.uk/question/92566/show-a-vector-in-terms-of-the-standard-unit-vectors/>`__.

Display a surd
--------------

Suppose you have a number :math:`n` which you wish to display as a surd, for example :math:`\sqrt{3}`.

If :math:`n` can be written as a surd, then :math:`n^2` is an integer, so ``\simplify{ sqrt({n^2}) }`` will produce the desired rendering.

When :math:`n` itself is an integer, the :term:`sqrtSquare` simplification rule will rewrite the above expression to just :math:`n`.

`This example question <https://numbas.mathcentre.ac.uk/question/45958/displaying-surd-fractions/>`__ shows how to display surd fractions.

Customise the LaTeX rendering of a particular variable name
-----------------------------------------------------------

In the :ref:`JavaScript API <javascript-apis>`, there's a dictionary of special cases for rendering variable names at ``Numbas.jme.display.specialNames``.

For example, to render the name ``hbar`` as :math:`\hbar`, in the question preamble set::

    Numbas.jme.display.specialNames['hbar'] = ['\\hbar'];

See `this example question <https://numbas.mathcentre.ac.uk/question/72909/custom-latex-rendering-for-a-variable-name/>`__.

Render plain text inside LaTeX
------------------------------

To render a string of plain text, use the ``\text`` LaTeX macro. For example::

    \frac{\text{amount of stuff}}{15 \times(\text{stuff quotient})} = x

produces :math:`\frac{\text{amount of stuff}}{15 \times(\text{stuff quotient})} = x`.

See `this example question <https://numbas.mathcentre.ac.uk/question/8396/use-text-in-latex-to-get-the-plain-text-font/>`__.

*******
Marking
*******

Mark an equation
----------------

See the section in the mathematical expression part's documentation on :ref:`marking an equation <marking-an-equation>`.

Mark a percentage
-----------------

`This question <https://numbas.mathcentre.ac.uk/question/92170/mark-a-percentage/>`__ shows how to use the *quantity with units* custom part type to makr a percentage given by the student.

Check that the student has simplified a polynomial fraction
-----------------------------------------------------------

`This question <https://numbas.mathcentre.ac.uk/question/19088/pattern-matching-student-s-answer-is-a-fraction/>`__ uses pattern-matching to check that the student's answer is in the form :math:`\frac{x+?}{?}`. 
In combination with the normal mathematical expression marking algorithm, this confirms that the student has simplified a fraction of the form :math:`\frac{x+a}{x+b}`.


Check that the student has factorised a quadratic expression
------------------------------------------------------------

`This question <https://numbas.mathcentre.ac.uk/question/3737/pattern-matching-factorise-an-equation/>`__ uses :ref:`pattern-matching <pattern-matching>` to check that the student's answer is the product of two factors.
In combination with the normal mathematical expression marking algorithm, this confirms that the student has factorised the expression.

Limit the number of times a student can submit an answer
--------------------------------------------------------

It's a principle of the design of Numbas that students can submit answers to each question part as many times as they like.
The student might accidentally submit, or change their mind.

In summative assessments, there is the possibility that students could gain an unfair advantage by changing their answer after seeing that it is incorrect.
To avoid this, use the :ref:`exam feedback settings <exam-feedback>` so that the student doesn't receive any feedback until the exam is over.

In an :ref:`explore mode <explore-mode>` question, you can use an information-only part to give the student feedback about a part that they have just answered, and give them the opportunity to try again, up to a predefined limit.
See `this example question <https://numbas.mathcentre.ac.uk/question/87356/allow-more-attempts-at-a-part-if-the-student-gets-it-wrong-up-to-a-limit/>`__.

Allow "this is impossible" as a response to a prompt
----------------------------------------------------

You can use a :ref:`gap-fill <gap-fill>` part with a :ref:`custom marking algorithm <part-marking-algorithm>` to show both an answer input box, and a tick box that the student can use to say that the given task is impossible.

See `this example question <https://numbas.mathcentre.ac.uk/question/87350/tick-box-for-this-is-impossible/>`__.

Ask the student to fill in a table of values
--------------------------------------------

The "Spreadsheet" custom part type provided by the spreadsheets extension lets you give the student a table to fill in.

See `this example question <https://numbas.mathcentre.ac.uk/question/150943/fill-in-a-table-of-values/>`__ which asks the student to fill in a table of values for a quadratic function.

*******************
Variable generation
*******************

Make sure generated variables satisfy a condition
-------------------------------------------------

A common pattern is that you would like to generate parameters for a system such that the solution variables have "nice" values from a certain set.
For example, you'd like to generate a quadratic equation with random coefficients, and you'd like the solutions to be integers.

In cases like these, you can usually work backwards: pick values for the solutions, and then pick the other values so that those values are satisfied.

In `this example question <https://numbas.mathcentre.ac.uk/question/150949/solve-a-pair-of-simultaneous-equations/>`__, the student must solve a pair of simultaneous equations in $x$ and $y$.
If picking integer coefficients completely at random for these equations, then the equations might have no solution, or have a non-integer solution.
Instead, in the example, the values of $x$ and $y$ are picked first, and then their coefficients on the left-hand side can be chosen freely.
The constant terms on the right-hand sides of the equations are then entirely determined.

In cases where it's not clear how to work backwards from a good solution, you can use the :ref:`variable testing <variable-testing>` tools to specify a condition that the question's variables must satisfy, and Numbas will re-generate sets of values until the condition is satisfied.

Generate a random list of unique numbers
----------------------------------------

Suppose you want to pick a list of numbers from a given range, but don't want any repeats. 

Use the :jme:func:`shuffle` function to put the numbers in random order, then take as many as you need from the front of the resulting list.
The example below picks three distinct numbers between 0 and 10::

    shuffle(0..10)[0..3]

See `this example question <https://numbas.mathcentre.ac.uk/question/20932/randomly-pick-a-list-of-unique-numbers/>`__.


Generate a random number excluding some number
----------------------------------------------

Suppose you want to generate a random number from a range, excluding some number in the range. Use the :jme:func:`random` function with the :jme:func:`except` operator. In this example, we generate a random positive or negative number in the range -5 to 5 by excluding 0 from a range::

    random(-5..5 except 0)

Assign several variables corresponding to a scenario
----------------------------------------------------

A simple way of randomising a question, particularly when working with real-world data, is to come up with a number of distinct scenarios.
Use the :data:`dictionary` data type to list the values of variables corresponding to each scenario, then pick randomly from a list of these dictionaries.

See `this example question <https://numbas.mathcentre.ac.uk/question/26868/use-a-dictionary-to-set-several-variables-corresponding-to-a-scenario/>`__.

`This more sophisticated example <https://numbas.mathcentre.ac.uk/question/18705/use-dictionaries-to-store-structured-data/>`__ combines lists of names with JSON data to construct a table of data about people's hobbies.


Load JSON data
--------------

`JSON <https://www.json.org/>`__ is a commonly-used format to store data in a way that is easy for both people and computers to read. 

The following questions show how to use large JSON data sets in Numbas questions:

* `Items from the Cooper-Hewitt collection <https://numbas.mathcentre.ac.uk/question/18690/loading-json-data-cooper-hewitt-collection/>`__, with associated images.
* `Data about members of the Scottish Parliament <https://numbas.mathcentre.ac.uk/question/18691/loading-json-data-scottish-msps/>`__.


*****
Maths
*****

Find the factors of a number
---------------------------------

If your number is small enough - as a rule of thumb, at most 5 digits - the easiest way to list all the factors of a number :math:`N` is to check each lower number for divisibility by :math:`N`::

    filter(x|n, x, 1..n)

See `this example question <https://numbas.mathcentre.ac.uk/question/23616/show-all-the-factors-of-a-number/>`__.


Find the prime factorisation of a number
----------------------------------------

Primality testing is a difficult topic, but if your number is small enough it's easiest just to check against a hard-coded list of prime numbers.
The following produces a list of pairs ``[prime, power]`` for the prime-power factors of the number ``n``::

    filter(x[1]>0,x,zip(primes,factorise(n)))
    
See `this example question <https://numbas.mathcentre.ac.uk/question/23612/show-the-prime-factorisation-of-a-number/>`__, which also produces LaTeX code to show the factorisation.


Randomly give two of hypotenuse, opposite, and adjacent side of a triangle
--------------------------------------------------------------------------

`This question <https://numbas.mathcentre.ac.uk/question/23209/randomly-give-two-of-hypotenuse-opposite-and-adjacent-side-of-a-triangle/>`__ shows how to randomly generate a Pythagorean triple - a right-angled triangle with integer-length sides - and randomly show two of the lengths to the student. 
The student is asked to calculate the length of the third side.


Take a logarithm to a randomly-chosen base.
-------------------------------------------

The built-in JME functions :jme:func:`ln` and :jme:func:`log` compute logarithms to base :math:`e` and :math:`10`, respectively.
:jme:func:`log` can take a second parameter defining the base. 
For example::

    log(x,3)

Computes :math:`\log_3(x)`.

`This example question <https://numbas.mathcentre.ac.uk/question/14700/log-to-an-arbitrary-base/>`__ shows how to ask the student to enter a mathematical expression containing a logarithm to a randomly-chosen base, or with an unbound variable as the base.


**********
JavaScript
**********

Define a recursive function
---------------------------

While custom functions can't easily refer to other custom functions defined in the question, they can contain nested function definitions.
You can use this to define a recursive function, and then call it immediately.

See `this example question <https://numbas.mathcentre.ac.uk/question/87373/recursive-js-function/>`__, which computes factorials recursively.

Do something at a certain stage in the question's progress
----------------------------------------------------------

The ``question`` object has a ``signals`` attribute, which you can use in the :ref:`question preamble <preamble>` to wait for certain events.

Here are some examples:

* `HTMLAttached <https://numbas.mathcentre.ac.uk/question/59188/on-html-attached/>`__ - When the question's HTML has been displayed in the page.
* `adviceDisplayed <https://numbas.mathcentre.ac.uk/question/65285/do-something-in-javascript-when-the-advice-is-displayed/>`__ - When the question advice is displayed.
