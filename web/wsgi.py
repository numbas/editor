import os, sys
sys.path.append('/srv/numbas/editor')
os.environ['DJANGO_SETTINGS_MODULE'] = 'numbas.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
