import django
from django.conf import settings
from django.template.defaultfilters import stringfilter
from django import template

import re

import bleach

ALLOWED_TAGS = getattr(settings, 'SANITIZER_ALLOWED_TAGS', [])
ALLOWED_ATTRIBUTES = getattr(settings, 'SANITIZER_ALLOWED_ATTRIBUTES', [])
ALLOWED_STYLES = getattr(settings, 'SANITIZER_ALLOWED_STYLES', [])

register = template.Library()

def heading_fix_filter(lowest_level=3):
    class HeadingFixFilter(bleach.html5lib_shim.Filter):
        def __iter__(self):
            token_buffer = []

            start_level = lowest_level
            for token in super().__iter__():
                if token["type"] in ["StartTag", "EndTag"]:
                    m = re.match(r'^h(\d)$',token["name"])
                    if m:
                        n = int(m.group(1))
                        start_level = min(n,start_level)

            shift = max(0,lowest_level - start_level)
            print("Shift",shift, lowest_level, start_level)
            rewrite_tags = {}
            for i in range(0,7):
                j = min(6,i+shift)
                rewrite_tags[f'h{i}'] = f'h{j}'

            for token in super().__iter__():
                if token["type"] in ["StartTag", "EndTag"]:
                    if token["name"] in rewrite_tags:
                        token["name"] = rewrite_tags[token["name"]]
                yield token    
                
    return HeadingFixFilter

@stringfilter
def sanitize_shift_headings(value,lowest_level=3):
    '''
    Sanitizes strings according to SANITIZER_ALLOWED_TAGS,
    SANITIZER_ALLOWED_ATTRIBUTES and SANITIZER_ALLOWED_STYLES variables in
    settings.
    Shifts heading tags so the lowest level is `lowest_level`
    '''
    if isinstance(value, str):
        c = bleach.sanitizer.Cleaner(tags=ALLOWED_TAGS + ['h1','h2','h3','h4','h5','h6'],
                             attributes=ALLOWED_ATTRIBUTES, 
                             styles=ALLOWED_STYLES, strip=True,
                             filters=[heading_fix_filter(lowest_level)])
        return c.clean(value)
    return value

register.filter('strip_html_shift_headings', sanitize_shift_headings)
