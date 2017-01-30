from django.template import Library

register = Library()

@register.inclusion_tag('helplink.html')
def helplink(url, **kwargs):
    return {'url': url, 'subject': kwargs.get('subject')}
