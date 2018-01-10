from django.conf import settings
from django.contrib.sites.models import Site

def global_settings(request):
    return {
        'HELP_URL': settings.GLOBAL_SETTINGS['HELP_URL'],
        'ALLOW_REGISTRATION': settings.ALLOW_REGISTRATION,
        'CAN_LOGOUT': settings.CAN_LOGOUT,
        'CAN_CHANGE_PASSWORD': settings.CAN_CHANGE_PASSWORD,
        'SITE_TITLE': settings.SITE_TITLE,
        'MATHJAX_URL': settings.MATHJAX_URL,
        'NUMBAS_LOCALES': settings.GLOBAL_SETTINGS['NUMBAS_LOCALES'],
        'DOCS_URL': settings.DOCS_URL,
    }

def site_root(request):
    site = Site.objects.get_current()
    protocol = 'https' if request.is_secure() else 'http'
    return {
        'SITE_ROOT': '{}://{}'.format(protocol, site.domain)
    }
