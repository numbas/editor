from django.template import Library
from django.conf import settings

register = Library()

@register.inclusion_tag('helplink.html')
def helplink(url, **kwargs):
    return {'url': url, 'subject': kwargs.get('subject'), 'DOCS_URL': settings.DOCS_URL}
