.. _gap-fill:

Gap-fill
^^^^^^^^

Gap-fill parts allow you to include answer inputs inline with the prompt text, instead of at the end of the part.

The :dfn:`gaps` are sub-parts. 
Include them in text by clicking on the :guilabel:`Insert gap` button on the toolbar, and entering the number of the gap you want to insert in the dialog box. 
You can double-click on a gap placeholder to change its number.

To insert a gap in the plain text editor, type the gap's number between two square brackets, e.g. ``[[0]]`` for the first gap.
    
You can find `the gap-fill part's built-in marking algorithm at GitHub <https://github.com/numbas/Numbas/blob/master/marking_scripts/gapfill.jme>`_.

Marking
#######

.. glossary::
    Sort student's answers before marking?
        If ticked, then the student's answers will be put in ascending order before the gaps are marked.
        The lowest answer will be submitted against the first gap, and so on.
        Because the order of marking might not correspond with the order in which the gaps are shown to the student, no feedback icon is shown next to the gap input boxes, only in the feedback summary for the whole part.

The ``studentAnswer`` marking parameter is a :data:`list` value, containing the string the student's answers to each of the gaps.

This part type provides one property to the :data:`settings` object:

.. data:: sortAnswers

    See :term:`Sort student's answers before marking?`

Example
#######

A question in the Numbas demo demonstrates a variety of ways of using gap-fill parts.

`Numbas demo: gap-fill part type <https://numbas.mathcentre.ac.uk/question/66231/numbas-demo-gap-fill-part-type/>`_
