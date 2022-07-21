Setting up a development environment
====================================

These instructions will describe how to set up a development environment for the Numbas runtime and editor.

.. todo::

    Include a screencast of me going through these steps?

Pre-requisites
--------------

Create a directory named ``numbas``, which you'll use to store all the git repositories and other files associated with the development environment.

You'll need Python 3.8 or later and the version control tool *git*.

Windows
*******

#.  Install Python 3 from `python.org/download <http://python.org/download/>`_.

#.  Install `Git for Windows <https://git-scm.com/downloads>`_.

#.  Install GNU ``make``.
    One way of doing this is through the `chocolatey <https://community.chocolatey.org/packages/make>`__ package manager.
    
    ``make`` is also included with `Cygwin <https://www.cygwin.com/>`__.

Ubuntu
******

#.  Install Git and Python 3 using the packaging system:

    .. code-block:: console
        
        $ apt install git python3

Mac
***

Python 3 is pre-installed on MacOS.

Most versions of MacOS also have git pre-installed.
If not, it's included with XCode, or you can follow the instructions at `git-scm.com <https://git-scm.com/book/en/v2/Getting-Started-Installing-Git#_installing_on_macos>`__.

Set up a Python virtual environment
-----------------------------------

It's a good idea to use a Python virtual environment during development work, to avoid conflicts with any other projects you're working on.

If you don't already have the ``virtualenv`` package installed, install it:

.. code-block:: console

    $ pip3 install virtualenv

Then, create a virtual environment:

.. code-block:: console

    $ virtualenv -p python3 numbas_venv

To activate it on Linux or Mac:

.. code-block:: console
    
    $ source numbas_venv/bin/activate

To activate it on Windows:

.. code-block:: batch

    > numbas_venv\Scripts\activate

You'll need to activate the virtual environment each time you open a new terminal.

Clone the repositories
----------------------

#.  The Numbas runtime compiler:

    .. code-block:: console

        $ git clone https://github.com/numbas/Numbas compiler

#.  The Numbas editor:

    .. code-block:: console

        git clone https://github.com/numbas/editor editor

Install required Python packages
--------------------------------

Both the compiler and editor have lists of packages that they require.
There is a separate file listing packages required to build the editor documentation.

Install all of these:

.. code-block:: console

    $ pip3 install -r editor/requirements.txt
    $ pip3 install -r editor/requirements-docs.txt
    $ pip3 install -r compiler/requirements.txt

Set up the editor
-----------------

Run the "first setup" script:

.. code-block:: console
  
    $ cd numbas_editor
    $ python first_setup.py

This will configure the editor based on your answers to a few questions, and write the file ``numbas/settings.py``.

Answer ``Y`` to the first question, "Is this installation for development?", and then enter details for your admin account.

If you make any mistakes, you can run the script again, or edit ``numbas/settings.py`` directly.

Run the editor server
---------------------

The editor is a `Django <https://www.djangoproject.com/>`__ app.

There is a script called ``manage.py`` which provides a variety of tools, including a development server.

Run:

.. code-block:: console

    $ python manage.py runserver

Open http://localhost:8000 in your web browser.

The editor should now be usable: try creating a question and running it.
