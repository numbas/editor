from django.template import Library
from django.template.loader import render_to_string

register = Library()

@register.inclusion_tag('iconic-svg.html')
def icon(icon,size=15):
    return {'icon': icon, 'size': size}

admin_icons = {
    'preview': 'media-play',
    'copy': 'plus',
    'basket': 'basket',
    'delete': 'x',
}

@register.inclusion_tag('admin-icon.html')
def admin_icon(kind):
    return {'kind': kind, 'icon': admin_icons[kind]}
