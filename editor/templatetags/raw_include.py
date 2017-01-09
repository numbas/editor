"""
from https://djangosnippets.org/snippets/10574/
"""
from django import template
from django.conf import settings
from django.utils.safestring import mark_safe
from django.contrib.staticfiles import finders
from django.contrib.staticfiles.storage import staticfiles_storage

register = template.Library()

@register.simple_tag
def raw_include(path):
    if settings.DEBUG:
        absolute_path = finders.find(path)
        if absolute_path is None:
            raise Exception("raw_include: couldn't find file {}".format(path))
        f = open(absolute_path,encoding='utf-8')
    else:
        f = staticfiles_storage.open(path)
    content = f.read()
    return mark_safe(content)
