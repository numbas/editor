from django.template import Library
from django.template.loader import render_to_string

register = Library()

@register.inclusion_tag('helplink.html')
def helplink(url,subject):
    return {'url': url, 'subject': subject}

