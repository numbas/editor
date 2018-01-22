from django.template import Library
from django.conf import settings

register = Library()

@register.inclusion_tag('helplink.html')
def helplink(url, **kwargs):
    return {'url': url, 'subject': kwargs.get('subject'), 'HELP_URL': settings.GLOBAL_SETTINGS['HELP_URL']}
