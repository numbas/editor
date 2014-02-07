""" 
from https://bitbucket.org/ad3w/django-sstatic/src/4401a4bc3058618dfc2eafaee6a23d287a99ede5/sstatic/templatetags/sstatic.py?at=default 
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
    full_path = os.path.join(settings.STATIC_ROOT, path)
    try:
        # Get file modification time.
        mtime = os.path.getmtime(full_path)
        return '%s%s?%s' % (settings.STATIC_URL, path, mtime)
    except OSError as e:
        # Returns normal url if this file was not found in filesystem.
        return '%s%s' % (settings.STATIC_URL, path)

