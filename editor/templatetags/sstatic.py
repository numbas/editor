""" 
from https://bitbucket.org/ad3w/django-sstatic/src/4401a4bc3058618dfc2eafaee6a23d287a99ede5/sstatic/templatetags/sstatic.py?at=default 
modified by Christian Perfect, 2014/09/01
"""

import os

from django import template
from django.conf import settings


register = template.Library()

@register.simple_tag
def sstatic(path):
    '''
    Returns absolute URL to static file with versioning.
    '''
    if path.startswith(settings.STATIC_URL):
        full_path = os.path.join(settings.STATIC_ROOT, path[len(settings.STATIC_URL):])
    elif path.startswith(settings.MEDIA_URL):
        full_path = os.path.join(settings.MEDIA_ROOT, path[len(settings.MEDIA_URL):])
    else:
        full_path = os.path.join(settings.STATIC_ROOT, path)
        path = settings.STATIC_URL + path
    try:
        # Get file modification time.
        mtime = os.path.getmtime(full_path)
        return '%s?%s' % (path, mtime)
    except OSError:
        # Returns normal url if this file was not found in filesystem.
        return path
