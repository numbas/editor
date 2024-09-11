.. _exam-accessibility-statement:

.. title:: Accessibility statement for Numbas exams

Accessibility statement for Numbas exams
========================================

Numbas should be accessible to everyone who needs to or would like to use it.

Accessibility is an important consideration during the design and development process.
We regularly test Numbas against a variety of accessibility requirements.

This statement was first prepared in October 2019 and last updated in September 2023.

.. contents:: Table of Contents
   :depth: 2
   :local:

What’s covered by this statement
--------------------------------

The Numbas runtime, as seen by students, using the default theme.

What’s not covered by this statement
------------------------------------

This statement does not cover the Numbas editor or Numbas LTI tool provider.

This statement does not cover the text content of questions written using Numbas - the question author is responsible for ensuring it's accessible.

Authors often embed content such as videos in Numbas questions.
Apart from these, the Numbas interface doesn’t include any videos or sound effects.

Numbas supports custom interface themes and extensions to provide new functionality.
Themes and extensions developed by the Numbas team are designed with the same accessibility considerations as the main Numbas system, but third-party themes and extensions are the responsibility of their authors.

Compliance with standards
-------------------------

Numbas satisfies all of the criteria of WCAG 2.1 Level AA, and all of the criteria of WCAG 2.1 Level AAA except :ref:`2.2.4: Interruptions <exam-vpat-wcag-2-2-4>`, :ref:`3.1.3: Unusual Words <exam-vpat-wcag-3-1-3>` and :ref:`3.1.5: Reading Level <exam-vpat-wcag-3-1-5>`, which are **partially supported**.

See :ref:`the accessibility conformance report <exam-vpat>` for more detail.

Particular accessibility requirements we’ve designed around
-----------------------------------------------------------

-  Still usable when zoomed to 200%.
-  Colour is never used as the sole means of conveying information.
-  Ensure a colour contrast ratio of at least 7:1 (WCAG level AAA) throughout the interface.
-  The interface can be navigated entirely with the keyboard.
-  All content on the page is screen-readable, with sensible descriptions.
-  No animations.
-  Layout is responsive and usable on screens with a variety of resolutions, including mobile devices.

Compatibility with browsers
---------------------------

We aim for compatibility with at least 95% of browsers currently in use.

More detail on minimum supported versions of different browsers is given in `our feature compatibility table <https://somethingorotherwhatever.com/can-i-also-use/?settings=https://raw.githubusercontent.com/numbas/Numbas/master/can-i-also-use-settings.json>`__.

Accessibility guide
-------------------

Page navigation
~~~~~~~~~~~~~~~

The first link on the page skips to the main content that is currently displayed. 
During an exam this link goes to the start of the current question's content.

The navigation sidebar contains buttons to move between questions, as well as a score summary, a button to change the display options, and a button to pause the exam, if enabled.
The final button in the navigation area is labelled :guilabel:`End exam` and will end the exam after a confirmation dialog.

On narrow screens, the navigation sidebar is hidden and instead a smaller navigation bar is shown at the top of the page.
This contains buttons to move to the previous or next question, an :guilabel:`End exam` button, and a button to show the sidebar, with an icon of three horizontal lines.
To hide the sidebar again, click anywhere outside the sidebar.

During an exam, there is a single level 1 header at the top of the navigation area, containing the exam's name.
Within the navigation area, each question group has a level 2 header.

The :guilabel:`main` landmark holds the content of the current question, and is labelled with the question's name in a level 2 header.
Each question part has a level 3 header, labelled with the part's name.

When the question's expected answers have been revealed, there may be a final :guilabel:`Advice` section with a level 3 header at the end of the question content, just before the :guilabel:`Question controls` navigation area.

Numbas exams are often presented inside a frame, to enable communication with the host virtual learning environment.
There is usually no content on the page other than the Numbas exam frame.

Interacting with a question
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Each question is separated into three areas: introductory "question statement" text, one or more parts, and "Advice", which is only shown when the answers to the parts have been revealed.

The statement text is at the top of the question, followed by a separator.
There is typically no interactive content in the question statement.

Each question part begins with a level 4 header, then some prompt text, typically followed by an input control to enter your answer.
Answer inputs can be text boxes, radio buttons, select boxes, or sometimes more complicated interfaces such as interactive diagrams.
The input control for a part is labelled with the part it corresponds to, for example :guilabel:`Answer to part a`.

When the answer is a mathematical expression, a rendering of your expression in conventional mathematical notation is displayed after the input box.
This rendering updates immediately whenever your answer changes.

If the answer you have entered is invalid, a box with an explanation of the error is shown next to the input box, as long as the input is focused.
Screenreaders will read this explanation as soon as it appears.
You can dismiss this explanation by pressing the :kbd:`Escape` key or by moving focus out of the input box.

After the answers to a question have been revealed, there is often a box showing the expected answer after each input.

After the prompt text and input controls is a button labelled :guilabel:`Save answer`.
Clicking this button causes your answer to be marked.
Once your answer has been marked, the label for the button changes to :guilabel:`Answer saved`.
Most exams will also automatically submit your answer after you move away from a part that you have entered an answer for.
You may be shown some immediate feedback after the :guilabel:`Save answer` button, and your score for the part.

You may submit answers as many times as you like.

Some parts are *gap-fills*, with one or more input controls interspersed with the text.
You can submit the part after filling on only one input, but normally you must enter an answer in every input in order to complete the part.

At the end of the question is a navigation area, containing buttons to submit all the parts in the question, your total score for the question, a button labelled :guilabel:`Try another question like this one`, and a button labelled :guilabel:`Reveal answers`.
Some of these elements may not be shown, depending on the exam's settings.

The :guilabel:`Try another question like this one` first shows a confirmation dialog, then removes the current question and displays a similar one, starting from scratch.

The :guilabel:`Reveal answers` button also shows a confirmation dialog, then reveals all the expected answers to the parts, and the :guilabel:`Advice` section.
You may not change your answers to any of the parts after revealing answers.

The Advice section usually contains a worked solution to the whole question.

How to adapt Numbas to your needs
---------------------------------

Change the colours of text and the page background
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Click the :guilabel:`Display options` button to change the colour of text and the page's background.

Your browser's colour picker is used. 
In most browsers, you can pick a colour by clicking on a colour wheel, or by typing a colour value in hexadecimal or RGB format.


Changing the size of text
~~~~~~~~~~~~~~~~~~~~~~~~~

Use your browser’s zoom setting to change the size of text and interface elements.
This is often under ‘Zoom’ in the browser’s settings menu; you can also zoom in or out by pressing ``Ctrl +`` or ``Ctrl -`` on the keyboard (``Cmd +`` or ``Cmd -`` on Macs).
Mobile users can use a pinch gesture to zoom in and out.

Enlarging images
~~~~~~~~~~~~~~~~

You can click on an image to enlarge it to nearly fill the screen.
Click outside the image or press the :kbd:`Escape` key to return to the main interface.

Navigating with a keyboard
~~~~~~~~~~~~~~~~~~~~~~~~~~

In most browsers, pressing the :kbd:`Tab` key will move focus between interactive elements in the display.

Numbas uses the `MathJax accessibility extensions <https://docs.mathjax.org/en/v2.7-latest/misc/accessibility-features.html>`__ to provide interactive exploration of mathematical notation.

Printing a Numbas exam
~~~~~~~~~~~~~~~~~~~~~~

The default Numbas theme contains a print stylesheet which your browser can use to produce a printed version of an exam. 
After starting a Numbas exam, use your browser’s :guilabel:`Print` feature.

Using a screenreader
~~~~~~~~~~~~~~~~~~~~

A screenreader such as VoiceOver, `NVDA <https://www.nvaccess.org/>`__, JAWS or Orca will read all of the content in a Numbas exam.
We’ve tested Numbas with VoiceOver, NVDA and Orca.

When you submit an answer, the score and any feedback messages will be read out.

While entering an answer, if your input is invalid, a warning message will be read out.

Mathematical notation is made accessible to a screenreader by the `MathJax accessibility extensions <https://docs.mathjax.org/en/v2.7-latest/misc/accessibility-features.html>`__.

Who to contact if you have problems or want to give feedback
------------------------------------------------------------

Students should contact their instructor, in the first instance.

Instructors and authors of Numbas content can contact us through any of the following:

-  Email numbas@ncl.ac.uk.
-  File an issue on `the Numbas GitHub repository <https://github.com/numbas/Numbas/issues>`__.
-  Post on `the numbas-users group <https://groups.google.com/forum/#!forum/numbas-users>`__.
