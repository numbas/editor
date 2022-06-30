Running a personal instance of the editor on Ubuntu
===================================================

These are outline instructions on setting up the Numbas editor on a
machine running Ubuntu 16.04+, for personal use. 
For instances where multiple users need access to the editor, we recommend following the
:doc:`Ubuntu web server <ubuntu-web>` installation instructions.

The Numbas editor uses `Django <https://www.djangoproject.com/>`_, a
web framework written in the Python programming language. 
Django has many configuration options, which we won't detail here. 
For more information, consult `the Django documentation <https://docs.djangoproject.com/en/2.1/>`_.

Installation
------------

#.  Install Git and Python 3 using the packaging system::
        
        apt install git python3

    .. warning:: 
    
        If you already have two versions of Python installed on your PC,
        the command ``python`` might run the wrong version. 
        The easiest way of making sure you use the right one is to create a virtual
        environment. 
        Here's how to do that::
        
            pip3 install virtualenv
            virtualenv -p python3 numbas_venv
            source numbas_venv/bin/activate 
        
        You'll need to activate the virtual environment each time you want to use it.

#.  Either download the Numbas runtime tools `from GitHub <https://github.com/numbas/Numbas/archive/master.zip>`__
    and extract to a folder called ``numbas_runtime``, or use `git <https://git-scm.com/>`_ to clone the repository::

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

  The default answers for most of the questions apply only to
  multi-user instances; make the appropriate changes using the paths
  described in the earlier steps.

  If you've followed these instructions exactly, you should use the following
  values:

  ============================================  ============================
  Path of the Numbas compiler                   ``../numbas_runtime``
  Which database engine are you using?          ``sqlite3``
  Where are static files stored?                ``editor/static/``
  Where are uploaded files stored?              ``media/``
  Where are preview exams stored?               ``editor/static/previews/``
  Base URL of previews                          ``/static/previews/``
  Title of the Site                             ``Numbas``
  Allow new users to register themselves?       ``Y``
  Address to send emails from:                  (you can leave this blank)
  What domain will the site be accessed from?   ``localhost``
  ============================================  ============================
  
  If you make any mistakes, you can run the script again, or edit
  ``numbas/settings.py`` directly.

-  Start the server::
  
    python manage.py runserver

-  Open http://localhost:8000 in your web browser.

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
