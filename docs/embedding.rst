Embedding Numbas content in other pages
=======================================

Numbas can be used as a generic library in any webpage, providing a ``<numbas-exam>`` custom HTML element which will load and display a Numbas exam.

To do this, first download a standalone copy of a Numbas question or exam.
It doesn't matter which exam or question you download.
If you want to include single questions in your page, download a question so that the single-question theme is used.

Setting up the page
-------------------

The files :file:`numbas.js` and :file:`numbas.css` contain the JavaScript logic and CSS stylesheets.
You should load :file:`numbas.js` in your page, and make sure that :file:`numbas.css` is accessible.

Inside :file:`index.html`, there is a large ``<template>`` element with the ID ``numbas-exam-template``.
Copy all of this into your page, and change the URL in the ``<style id="numbas-style">`` tag to the URL of your copy of :file:`numbas.css`.

.. note::
   At the moment, the default Numbas theme uses an icon font for the tick, cross and warning feedback symbols.
   Due to a browser limitation, the definition of the icon font can't be inside the custom element, so you have to copy it across to your main page's stylesheet.

   From :file:`numbas.css`, copy the ``@font-face`` block defining ``font-family: 'FontAwesome'`` into your page's stylesheet.

   In the future we will replace the icon font with SVG symbols which won't have this limitation, and this step won't be needed.

Now you are ready to include Numbas content in your page.

Embedding a Numbas exam
-----------------------

Wherever you want to embed Numbas content, write a ``<numbas-exam>`` tag with the following attributes:

``source_url``
    The URL of the .exam file defining the question or exam.
    You can get this from the :guilabel:`Download source` link in the Numbas editor.

    It is possible to load published .exam files directly from the Numbas editor, but it's best to take a copy of the file yourself.

    Or instead of using this attribute, you can include a ``<script type="application/numbas-exam">`` tag inside the ``<numbas-exam>`` tag with the content of the .exam file.

``noload``
    If this is present, then the exam doesn't load automatically when the page loads.

    This is a good idea if you have lots of 

``scorm``
    If this is set to ``false``, then the exam will not try to use the SCORM API in the containing page.

    If you have multiple Numbas exams in the same page and a SCORM API, make sure to set ``scorm="false"`` on all, or all but one, of the ``<numbas-exam>`` elements in the page, so that they don't conflict with each other.

``template``
    The ID of the ``<template>`` element that contains the templates for Numbas to generate HTML.
    If you omit this, the ID ``numbas-exam-template`` is used.

Extension data
--------------

If the exam uses any extensions, you must tell Numbas how to find the extension's files by adding a ``<script type="application/json" slot="extension-data">`` element inside ``<numbas-exam>``.

You must obtain a copy of the files for each extension used and put them somewhere that can be accessed from your page.
If you download a standalone .zip of the exam from the editor, all of the extension files are included in a directory called ``extensions``, and the data JSON is in the file :file:``extensions/extensions.json``.

The extension data JSON has the following format::

    {
        (The extension's name): {
            "root": (The root URL of the extension's files),
            "javascripts": (a list of filenames of all JavaScript files needed by the extension, relative to the root),
            "stylesheets": (a list of filenames of all CSS files needed by the extension, relative to the root)
        }
    }
