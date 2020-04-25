
Installing the Numbas editor on Ubuntu Server
=============================================

These are outline instructions on setting up the Numbas editor with a
backend MySQL database.

The Numbas editor uses `Django <https://www.djangoproject.com/>`_, a
web framework written in the Python programming language. 
Django has many configuration options, which we won't detail here. 
For more information, consult `the Django documentation <https://docs.djangoproject.com/en/2.1/>`_.

.. note::

    The following instructions are for a server running Ubuntu Xenial (16.04) or newer.

Essential package installation
------------------------------

Packages that would be installed as part of a standard Ubuntu install
are not listed.

#.  Install Apache, Git, Apache WSGI module, MySQL, Python 3 and Pip using the ``apt`` packaging system::

        
        sudo apt udpate
        (optionaly do: sudo apt upgrade)
        sudo apt-get install apache2 apache2-dev git-core mysql-server \
        mysql-common python3 acl libmysqlclient-dev python-dev \
        libapache2-mod-wsgi-py3 python-tk tcl-dev tk-dev python3-pip

#.  Enable ``mod_wsgi``, if it's not already:: 
    
        sudo a2enmod wsgi


Cretae user and groups
----------------------

Rather than rely on the system-wide Python executable and libraries, a more flexible
approach is to use `virtualenv <http://www.virtualenv.org/>`_, which is a tool to create an isolated Python environment.

#.  Create a user group which will have access to the virtualenv, and
    add yourself to it::

        sudo adduser --disabled-password numbas_editor        
        sudo groupadd numbas
        sudo usermod numbas_editor -a -G numbas,www-data
        
Database
--------

#.  Secure the MySQL database::

        sudo mysql_secure_installation



#.  Open the MySQL client::

        sudo mysql

#.  Create a MySQL database called ``numbas_editor``::

        create database numbas_editor;

#.  Create a database user and grant privileges on ``numbas_editor``
    database, with a password of your choice::

        grant all privileges on numbas_editor.* to 'numbas_editor'@'localhost' identified by 'password';


Create directories and set permissions
--------------------------------------

#.  Create the following directories outside the web root, so they're
    not accessible to the public::
  
        sudo mkdir /srv/www
        sudo mkdir /srv/numbas
        sudo mkdir /srv/numbas/compiler
        sudo mkdir /srv/numbas/media
        sudo mkdir /srv/numbas/previews
        sudo mkdir /srv/numbas/static

#.  Set the correct ownership and permissions::
    
        sudo chmod 2770 /srv/www
        sudo chgrp www-data /srv/www

        cd /srv/numbas
        sudo chmod 2770 media previews
        sudo chmod 2750 compiler static
        sudo chgrp www-data compiler media previews static
        sudo chmod g+rwX media previews compiler static



Install Virtualenv
------------------

#.  Install virtualenv:: 
    
        sudo pip3 install virtualenv

#.  Create the virtualenv in a suitable location::
  
        sudo mkdir /opt/python
        sudo chown root.numbas /opt/python 
        sudo chmod grwx /opt/python 

       

Perform as numbas_editor
------------------------

#.  Become numbas_editor::

        sudo su numbas_editor

#.  Create the virtualenv::

        virtualenv /opt/python/numbas-editor

#.  Activate the virtualenv::

        source /opt/python/numbas-editor/bin/activate
        
    (This ensures that subsequent python packages are installed in this isolated environment, and not in the system environment.)

#.  Clone the Numbas repository::

        git clone git://github.com/numbas/Numbas /srv/numbas/compiler

#.  Clone the editor under the webroot directory::

        git clone git://github.com/numbas/editor /srv/www/numbas_editor

#.  Install the Python module dependencies of the editor (in the virtualenv)::

        pip install -r /srv/www/numbas_editor/requirements.txt
        pip install -r /srv/numbas/compiler/requirements.txt
        pip install mysqlclient mod_wsgi

#.  Run the "first setup" script::

        cd /srv/www/numbas_editor
        python first_setup.py

    This will configure the editor based on your answers to a few
    questions, and write the file ``numbas/settings.py``.

    If you've been following these instructions exactly, you can
    accept the defaults for each question.

    If you make any mistakes, you can run the script again, or edit
    ``numbas/settings.py`` directly.


#.    Edit ``numbas/settings.py`` to set the host correctly::


      set ALLOWED_HOSTS = ['www.example.com']
       
    
Setup Apache
------------

#.  Download https://./apache2_ubuntu.conf to ``/etc/apache2/sites-available/numbas_editor.conf``. Then edit the file and change the lines containing ``ServerName`` and ``ServerAdmin`` 


#. Enable the configuration::
      
            sudo a2ensite numbas_editor.conf
            sudo service apache2 reload

#.  Point a web browser at the server hosting the editor.


Ongoing maintenance
-------------------

To keep the editor up to date, run the following script::

    source /opt/python/numbas-editor/bin/activate
    cd /srv/numbas/compiler
    git pull origin master
    pip install -r requirements.txt
    cd /srv/www/numbas_editor
    git pull origin master
    python manage.py migrate
    python manage.py collectstatic --noinput
    pip install -r requirements.txt
    touch web/django.wsgi

Note that if any changes are made to the editor code, including
editing the settings files, then for the web server to recognise
these changes you must either run the command ``touch web/django.wsgi``,
or restart the Apache server.
