from django.conf import settings
from django.contrib.sites.models import Site
from urllib.parse import urlunparse

def global_settings(request):
    return {
        'HELP_URL': settings.GLOBAL_SETTINGS['HELP_URL'],
        'ALLOW_REGISTRATION': settings.ALLOW_REGISTRATION,
        'CAN_LOGOUT': settings.CAN_LOGOUT,
        'CAN_CHANGE_PASSWORD': settings.CAN_CHANGE_PASSWORD,
        'SITE_TITLE': settings.SITE_TITLE,
        'MATHJAX_URL': settings.MATHJAX_URL,
        'NUMBAS_LOCALES': settings.GLOBAL_SETTINGS['NUMBAS_LOCALES'],
        'URL_PREFIX': getattr(settings,'URL_PREFIX','/'),
        'CSS_VARIABLES': getattr(settings, 'CSS_VARIABLES',
            {
                'brand-color': '#acdeff',
            }
        ),
    }

def site_root_url(request):
    return urlunparse((request.scheme, request.get_host(), '', '', '', ''))

def site_root(request):
    return {
        'SITE_ROOT': site_root_url(request)
    }
