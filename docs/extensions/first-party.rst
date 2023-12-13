First-party extensions
======================

The following extensions were developed by the Numbas team:

Interactive diagrams
********************

There are a few extensions which provide functions for drawing dynamic or interactive diagrams.
Each has its own benefits and drawbacks.

:ref:`geogebra-extension` has a graphical editor; the other packages all create diagrams from code.

.. _geogebra-extension:

GeoGebra
--------

The GeoGebra extension provides functions to embed GeoGebra worksheets in a question.

You can:

* Create a GeoGebra worksheet from scratch, or load one from `geogebra.org <https://www.geogebra.org>`_ or a ``.ggb`` file.
* Replace values in the GeoGebra worksheet with values derived from question variables.
* Link the positions of GeoGebra objects to :ref:`number-entry` part inputs.
* Examine the state of the worksheet during a part's marking algorithm.

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-geogebra>`__.

There are `a few questions demonstrating how to use the GeoGebra extension <https://numbas.mathcentre.ac.uk/project/698/browse/Extensions/GeoGebra/>`__ in the 'Demos' project on numbas.mathcentre.ac.uk.

.. _jsxgraph-extension:

JSXGraph
--------

The JSXGraph extension provides functions to create and manipulate interactive diagrams with the JSXGraph library.

You can:

* Use question variables in the construction of diagrams.
* Link diagrams to question part inputs, updating the diagram when the student enters a new answer, and updating the input when the diagram changes.
* Examine the state of a diagram during a part's marking algorithm.

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-jsxgraph>`__.

For help on using JSXGraph, see `the official documentation <https://jsxgraph.org/wp/docs/index.html>`_.

The screencast below shows how to use JSXGraph in a Numbas question:

.. raw:: html

    <iframe src="https://player.vimeo.com/video/631104271" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

There are `a few questions demonstrating how to use the JSXGraph extension <https://numbas.mathcentre.ac.uk/project/698/browse/Extensions/JSXGraph/>`__ in the 'Demos' project on numbas.mathcentre.ac.uk.

.. _eukleides-extension:

Eukleides
---------

The Eukleides extension provides functions to embed diagrams created using the Eukleides language.

Eukleides creates illustrations rather than interactive applets.
While Eukleides diagrams can be animated and support basic interaction by dragging points, if you want more sophisticated interaction then you should consider :ref:`jsxgraph-extension` or :ref:`geogebra-extension`.

Eukleides is particularly good at creating accessible diagrams: each element has an automatically-generated description made available to assistive technology, which you can override with something more specific.
You can also give a description of the entire diagram, equivalent to alt text for a static image.

For more information on how to use the extension, see `its documentation <https://numbas.github.io/numbas-extension-eukleides/>`__.

There are `a few questions demonstrating how to use the Eukleides extension <https://numbas.mathcentre.ac.uk/project/698/browse/Extensions/Eukleides/>`__ in the 'Demos' project on numbas.mathcentre.ac.uk.

Other interactive objects
*************************

.. _spreadsheets-extension:

Spreadsheets
------------

The spreadsheets extension adds a data type, ``spreadsheet``, representing a 2D grid of text cells with styling information, similar to a spreadsheet in a program such as Microsoft Excel.

In the Numbas question editor, this extension adds a "Spreadsheet" variable template type which allows you to load a spreadsheet from an uploaded ``.xlsx`` file.

When inserted into content areas, spreadsheet values are rendered as non-editable grids.

This extension adds a "Spreadsheet" answer input method for custom part types, and a "Spreadsheet" custom part type which asks the student to enter values into a given spreadsheet and compares entries against a completed spreadsheet given by the question author.

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-sheets>`__.

There are `a few questions demonstrating the spreadsheet extension <https://numbas.mathcentre.ac.uk/project/698/browse/Extensions/Spreadsheets/>`__ in the 'Demos' project on numbas.mathcentre.ac.uk.

Coding
******

Programming
-----------

The programming extension adds the ability to run code written in Python or R.

It provides a "Code" custom part type, which takes code written by the student and runs it.
Marking is done by evaluating unit tests after the student's code.

The screencast below shows some examples of the programming extension in use:

.. raw:: html

    <iframe src="https://player.vimeo.com/video/674909236" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-programming/>`__.

Function libraries
******************

.. _stats-extension:

Statistical functions
---------------------

The statistical functions extension provides many new functions for generating samples from random distributions, and calculating statistics.

It is built on the `jStat <https://jstat.github.io/>`_ library and follows its API quite closely. 

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-stats>`__.

Random person
-------------

The "random person" extension provides a collection of functions to generate random people, for use in word problems.

It doesn't really matter what people are called in word problems, but it can have a bad effect on students' perceptions of the world if the plumber's always called Gary and the nurse is always called Julie.
This extension makes it easy to randomly pick names, following the distribution of names and genders in the population of England and Wales.

There is `an example question using this extension <https://numbas.mathcentre.ac.uk/question/65912/numbas-demo-random-person-extension/>`__ in the mathcentre editor.

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-random-person>`__.


Quantities
----------

This extension wraps the `js-quantities <https://github.com/gentooboontoo/js-quantities>`__ library to provide a "quantity with units" data type to Numbas.

It provides a ``quantity`` data type, which represents a scalar amount and a list of units.

There is `an example question using this extension <https://numbas.mathcentre.ac.uk/question/65913/numbas-demo-quantities-with-units/>`__ in the mathcentre editor.

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-quantities>`__.

Linear codes
------------

This extension provides a new data type and some functions to deal with linear codes.

A `collection of questions created using this extension <https://numbas.mathcentre.ac.uk/exam/8394/coding-theory/>`__ is available to reuse.

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-codewords>`__.

Polynomials
-----------

This extension provides a new data type and some functions to deal with rational polynomials.

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-polynomials>`__.

Graph theory
------------

This extension provides some functions for working with and drawing graphs (networks of vertices joined by edges) in Numbas.

For more information on how to use the extension, see `its documentation <https://github.com/numbas/numbas-extension-graph-theory>`__.
