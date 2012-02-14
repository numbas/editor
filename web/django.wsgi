import os, sys
sys.path.append('/srv/www/numbas.mas.ncl.ac.uk80')
sys.path.append('/srv/www/numbas.mas.ncl.ac.uk80/numbas')
os.environ['DJANGO_SETTINGS_MODULE'] = 'numbas.settings'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()
