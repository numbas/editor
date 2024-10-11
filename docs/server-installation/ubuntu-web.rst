Installing the Numbas editor on Ubuntu
======================================

These are outline instructions on setting up the Numbas editor with a
backend MySQL database.

The Numbas editor uses `Django <https://www.djangoproject.com/>`_, a
web framework written in the Python programming language. 
Django has many configuration options, which we won't detail here. 
For more information, consult `the Django documentation <https://docs.djangoproject.com/en/2.1/>`_.

.. note::

    The following instructions are for a server running Ubuntu 24.04 or newer.

Essential package installation
------------------------------

#.  Install required packages using the ``apt`` packaging system::

        apt install nginx git-core mysql-server \
        mysql-common python3 acl libmysqlclient-dev python3-dev \
        supervisor python3-pip python3-virtualenv pkg-config

Virtualenv
----------

Rather than rely on the system-wide Python executable and libraries, a more flexible
approach is to use `virtualenv <https://virtualenv.pypa.io>`_, which is a tool to create an isolated Python environment.

#.  Create a user group which will have access to the virtualenv, and
    add yourself to it::
    
        groupadd numbas
        usermod your_username -a -G numbas,www-data
        
    You might need to start a new terminal, or log out and back in, for the group change to take effect.

#.  Create the virtualenv in a suitable location::
  
        mkdir /opt/numbas_python
        setfacl -dR -m g:numbas:rwx /opt/numbas_python
        virtualenv -p python3 /opt/numbas_python

#.  Activate the virtualenv::

        source /opt/numbas_python/bin/activate
        
    (This ensures that subsequent python packages are installed in this isolated environment, and not in the system environment.)

Database
--------

#.  Open the MySQL client::

        mysql

#.  Create a MySQL database called ``numbas_editor``::

        create database numbas_editor;

#.  Create a database user and grant privileges on ``numbas_editor``
    database, with a password of your choice::

        create user 'numbas_editor'@'localhost' identified by 'password';
        grant all privileges on numbas_editor.* to 'numbas_editor'@'localhost';

Create directories and set permissions
--------------------------------------

#.  Create the following directories outside the web root, so they're
    not accessible to the public::
  
        mkdir /srv/numbas{,/compiler,/editor,/media,/previews,/static}

#.  Set the correct ownership and permissions::
    
        cd /srv/numbas
        chmod 2770 media previews
        chmod 2750 compiler static
        chgrp www-data compiler media previews static
        setfacl -dR -m g::rwX media previews
        setfacl -dR -m g::rX compiler static

Clone the editor and compiler repositories
------------------------------------------

#.  Clone the Numbas repository::

        git clone https://github.com/numbas/Numbas /srv/numbas/compiler

#.  Clone the editor under the webroot directory::

        git clone https://github.com/numbas/editor /srv/numbas/editor

#.  Install the Python module dependencies of the editor (in the virtualenv)::

        pip install -r /srv/numbas/editor/requirements.txt
        pip install -r /srv/numbas/compiler/requirements.txt
        pip install mysqlclient gunicorn

Configuration
-------------

#.  Run the "first setup" script::
    
        cd /srv/numbas/editor
        python first_setup.py

    This will configure the editor based on your answers to a few
    questions, and write the file ``numbas/settings.py``.

    If you've been following these instructions exactly, you can
    accept the defaults for each question.

    If you make any mistakes, you can run the script again, or edit
    ``numbas/settings.py`` directly.

#.  Create the supervisor, gunicorn and nginx config files and enable the site.

    -  Make a directory for log files::

        mkdir /var/log/numbas_editor
        chown www-data:www-data /var/log/numbas_editor

    -  Edit ``/srv/numbas/editor/web/gunicorn.conf.py`` with these contents::

        # Serve on port 8001
        bind = "0.0.0.0:8001"
        # Number of worker processes to run. Increase when there is more traffic.
        workers = 1
        # Access log - records incoming HTTP requests
        accesslog = "/var/log/numbas_editor/numbas_editor_access.log"
        # Error log - records Gunicorn server goings-on
        errorlog = "/var/log/numbas_editor/numbas_editor_error.log"
        # Whether to send Django output to the error log 
        capture_output = True
        # How verbose the Gunicorn error logs should be 
        loglevel = "info"

    -  Edit ``/etc/supervisor/conf.d/numbas_editor.conf`` with these contents::

        [program:numbas_editor]
        command=/opt/numbas_python/bin/gunicorn -c /srv/numbas/editor/web/gunicorn.conf.py web.wsgi:application
        directory=/srv/numbas/editor/
        user=www-data
        autostart=true
        autorestart=true
        stopasgroup=true
        environment=DJANGO_SETTINGS_MODULE=numbas.settings
        numprocs=1

    -  Overwrite ``/etc/nginx/sites-enabled/default`` with these contents::

        server {
            listen 80; 

            client_max_body_size 100M;

            location = /favicon.ico { access_log off; log_not_found off; }
            location /static/ {
                alias /srv/numbas/static/;
            }
            location /media/ {
                alias /srv/numbas/media/;
            }
            location /numbas-previews {
                alias /srv/numbas/previews/;
                add_header 'Access-Control-Allow-Origin' '*';
            }

            location / {
                include proxy_params;
                proxy_pass http://localhost:8001;
                proxy_read_timeout 120s;
            }
        }


    -  Restart supervisor and nginx::

        systemctl restart nginx supervisor

#.  Point a web browser at the server hosting the editor.

Ongoing maintenance
-------------------

To keep the editor up to date, run the following script::

    source /opt/numbas_python/bin/activate
    cd /srv/numbas/compiler
    git pull origin master
    pip install -r requirements.txt
    cd /srv/numbas/editor
    git pull origin master
    python manage.py migrate
    python manage.py collectstatic --noinput
    pip install -r requirements.txt
    supervisorctl restart numbas_editor

Note that if any changes are made to the editor code, including
editing the settings files, then for the web server to recognise
these changes you must either run the command ``touch web/django.wsgi``,
or restart the Apache server.
