from django.template import Library

register = Library()

@register.filter
def is_explore(item):
    if '"partsMode": "explore"' in item:
        return True
    else:
        return False