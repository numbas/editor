.. _planning-a-question:

Planning a question
-------------------

Designing a good question is a skill.
It's important to think about what you want to achieve with a question and how you'll implement it, before starting to write.

This page contains some guidance on effectively planning a Numbas question.

What does the question assess?
==============================

Identify the particular skill or piece of knowledge that the question
assesses.

"Complex numbers" is not precise enough. "Recall the definition of a
complex conjugate and find the conjugate of a given number in Cartesian
form" is.

Make this the title of the question.

Can the student:

-  Recall a fact or definition? (e.g. natural numbers are positive; the
   SUVAT equations)

-  Perform a calculation, or follow an algorithm, accurately (e.g.
   square a number, rearrange an equation, find the GCD of two numbers)

-  Select an appropriate technique (e.g. complete the square or use the
   formula to factorise a quadratic; do the right kind of hypothesis
   test)

-  Reason about a situation (e.g. this number ends in 4, so it’s
   divisible by 2; the value of this function changes sign between :math:`x=a`
   and :math:`x=b`, so it must have a root somewhere in between)

..

   (This is not an exhaustive list)

What does the student have to do?
=================================

Think how the student could demonstrate that they can do what the
question is assessing. 
This could be:

-  Perform a calculation or apply an algorithm (e.g. round a number to 3
   decimal places; calculate a p-value)

-  Give an example with certain properties (e.g. write down an odd
   number; write a non-singular matrix with integer components)

-  Make a decision (e.g. say if ":math:`f(x) > 0` for all :math:`x`" is true; say
   whether a statement is always/sometimes/never correct; pick the right
   distribution to model "number of phone calls made in an hour")

-  Identify something (e.g. write down the :math:`x`-component of vector
   :math:`(3,2,4)`; enter the symbol that has been used to represent "distance
   travelled")

..

   (This is not an exhaustive list)

Try to ask the most efficient question possible to assess the thing
you’re assessing. 
For example, if you’re assessing whether the studentcan classify a 
stationary point, do they really need to differentiate a complicated 
polynomial with seven terms, or could you just give them the value 
of the derivative at the stationary point?

How might the student get the answer wrong?
===========================================

Try to identify incorrect answers that the student could give, and what
misconceptions or mistakes could cause them.

For example, when differentiating :math:`\cos(2x)`, the student could:

-  Forget the minus sign: :code:`2sin(2x)`

-  Not apply the chain rule: :code:`-sin(2x)`

-  Integrate instead of differentiating: :code:`1/2 sin(2x)`

-  Recall the wrong derivative entirely: :code:`2tan(2x)`

-  A typo: :code:`-2sinn(2x)`

How does your feedback help the student identify what error they’ve
made? Rather than explicitly looking for common errors, you can often
design the question in a way that makes it easier for the student to see
what went wrong. 
Most of the time, a student will be able to identify their error by 
looking over their answer after seeing it’s incorrect.

However, make sure the student *can* enter reasonable incorrect answers.
For example, an expression in :math:`x` might simplify down to a single
number, but if the input is a "number entry" part, students who get
something wrong and still have an :math:`x` term left can’t submit their
answer.

An invalid answer is one that you wouldn’t expect a student to believe
is correct. 
For example, an unmatched set of brackets is invalid in the
vast majority of situations because it’s vastly more likely to be the
result of a typo than a misunderstanding. 
It’s OK to prevent a student from submitting an invalid answer.

Don’t try to account for every possible error the student could make –
there are too many.

Could you ask more questions to more precisely identify the student’s
error, or help them catch it? For example, do the same computation two
ways; after rearranging an equation, substitute values for x into both
versions to check they give the same result.

Ideally, you should minimise the opportunity for the student to make
mistakes or misconceptions not directly relevant to the thing the
question is assessing. 
For example, when assessing integrating :math:`1/x`, a
student might not know the syntax for a logarithm. 
You could give hints or reminders to avoid these mistakes.

Sketch the structure of the question
====================================

What information do you need to give the student before asking any
questions?

How many parts do you need? What kind of inputs?

Can any of the parts be broken into steps? If you’re asking the student
to apply a formula that they should recall, a hint giving them the
formula allows them to proceed even if they’ve forgotten it.

Implement the question in Numbas
================================

Get a minimal version of the question working in Numbas. 
Don’t worry about randomisation at first.

At this point, you might realise that it’s hard to mark the answer you
want using the built-in tools. 
Or, when you try the question yourself, you might spot something that makes 
the question much easier, or harder, than you want.

Be prepared for the advice section to take far longer to write than the
rest of the question.

You might think of another way of assessing the same thing.

Pay attention to detail
=======================

Make sure you’ve given the student all the information they need to
answer the question. 
It’s easy to forget to give a student a formula that you’re not 
expecting them to recall, or to fail to explicitly name a variable.

Make sure you use full sentences and use correct grammar.

Think about randomisation
=========================

What parts of the question can be randomised?

The question shouldn’t become hugely easier or harder for different sets
of random variables.
Try to pick values that all produce roughly the same level of challenge.

You can easily spend a very long time playing with randomisation.

Often, it's much easier to work a question "backwards". 
The classic example is factorising a quadratic: if you want integer 
roots, it’s easier to pick the roots first and then calculate the 
coefficients of the expanded expression, than to go the other way.

Run the question a few times to see the kinds of random values you get.

Do the boring admin bits
========================

Fill in the description field. 
Select topics covered and ability level.

Write descriptions for all the question variables. 
Make sure all the variables have easily understood names.

roofread, looking for spelling mistakes.
