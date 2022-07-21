Building the documentation
##########################

Editor documentation
--------------------

The editor documentation is written using `Sphinx <https://www.sphinx-doc.org/en/master/>`__.

In the editor repository, run:

.. code-block:: console

    $ make docs_html

The documentation is written to a folder called ``build-docs``, inside the editor folder.

To view the documentation, start a static file server here, on a different port to the editor:

.. code-block:: console

    $ cd editor/build-docs
    $ python -m http.server 8004

And open http://localhost:8004.

Runtime JavaScript API documentation
------------------------------------

The API documentation for the Numbas runtime is built using `jsdoc <usejsdoc.org/>`__.

One way of installing jsdoc, assuming you have `nodejs <https://nodejs.org/en/>`__ installed, is:

.. code-block:: console

    $ npm install -g jsdoc

Next, clone the repository containing the template files.
If the compiler is in a directory ``numbas/compiler``, then clone the template repository to ``numbas/numbas-jsdoc-template``:

.. code-block:: console

    $ git clone https://github.com/numbas/numbas-jsdoc-template

To rebuild the API documentation, in the compiler directory run:

.. code-block:: console

    $ make docs

The documentation HTML is written to a folder called ``build-docs``, inside the compiler folder.

To view the documentation, start a static file server here, on a different port to the editor:

.. code-block:: console

    $ cd compiler/build-docs
    $ python -m http.server 8005

And open http://localhost:8005.

