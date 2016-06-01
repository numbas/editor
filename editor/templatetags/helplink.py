from django.template import Library
from django.template.loader import render_to_string

register = Library()

@register.inclusion_tag('helplink.html')
def helplink(url,**kwargs):
    return {'url': url, 'subject': kwargs.get('subject')}

