Running a personal instance of the editor on Windows
====================================================

These are outline instructions on setting up the Numbas editor on a PC
running Windows, for personal use. 
For instances where multiple users need access to the editor, we recommend following the
:doc:`Ubuntu <ubuntu-web>` installation instructions.

The Numbas editor uses `Django <https://www.djangoproject.com/>`_, a
web framework written in the Python programming language. 
Django has many configuration options, which we won't detail here. 
For more information, consult `the Django documentation <https://docs.djangoproject.com/en/2./>`_.

Installation
------------

#.  Install Python 3 from `python.org/download <http://python.org/download/>`_.

    .. warning::
    
        If you already have two versions of Python installed on your PC, the command ``python`` might run the wrong version. The easiest way of making sure you use the right one is to create a virtual environment. 
        Here's how to do that::

            pip3 install virtualenv
            virtualenv -p python3 numbas_venv
            numbas_venv\Scripts\activate
    
        You'll need to activate the virtual environment each time you want to use it.

#.  You can either download static copies of the Numbas software, or
    get a version-tracked copy which is easier to update through git.
    If you're using git, you'll need to install `Git for Windows <https://git-scm.com/downloads>`_ first.

#.  Either download the Numbas runtime tools `from GitHub <https://github.com/numbas/Numbas/archive/master.zip>`__
    and extract to a folder called ``numbas_runtime``, or use git to clone the repository::

        git clone git://github.com/numbas/Numbas.git numbas_runtime

#.  Either download the Numbas editor `from GitHub <https://github.com/numbas/editor/archive/master.zip>`__
    and extract to a folder called ``numbas_editor``, or use git to clone the repository::

        git clone git://github.com/numbas/editor.git numbas_editor

#.  Install all the required Python modules::

        pip3 install -r numbas_editor/requirements.txt
        pip3 install -r numbas_runtime/requirements.txt

Configuration
-------------

- Run the "first setup" script::
  
    cd numbas_editor
    python first_setup.py

  This will configure the editor based on your answers to a few
  questions, and write the file ``numbas/settings.py``.

  The default answers for most of the questions apply only to Linux
  systems; make the appropriate changes using the paths described in
  the earlier steps.

  If you've followed these instructions exactly, you should use the following
  values:

  ============================================  ============================
  Path of the Numbas compiler                   ``../numbas_runtime``
  Which database engine are you using?          ``sqlite3``
  Where are static files stored?                ``editor/static``
  Where are uploaded files stored?              ``media/``
  Where are preview exams stored?               ``editor/static/previews/``
  Base URL of previews                          ``/static/previews/``
  Python command                                ``python``
  Title of the Site                             ``Numbas``
  Allow new users to register themselves?       ``Y``
  Address to send emails from:                  (you can leave this blank)
  What domain will the site be accessed from?   ``localhost``
  ============================================  ============================

  If you make any mistakes, you can run the script again, or edit
  ``numbas/settings.py`` directly.

- Start the server::
  
    python manage.py runserver

- Open http://localhost:8000 in your web browser.

Ongoing maintenance
-------------------

If you used git to clone the runtime and editor repositories, run the
following commands to update your installation::

    cd numbas_editor
    git pull origin master
    python manage.py migrate
    pip install -r requirements.txt
    cd ../numbas_runtime
    git pull origin master
    pip install -r requirements.txt

The admin site, where you can manually edit entries in the database,
is at http://localhost:8000/admin.
