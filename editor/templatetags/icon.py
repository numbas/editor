from django.template import Library
from django.template.loader import render_to_string

register = Library()

@register.inclusion_tag('iconic-svg.html')
def icon(icon,size=15):
    return {'icon': icon, 'size': size}
