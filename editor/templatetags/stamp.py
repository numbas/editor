from django.template import Library
from editor.models import STAMP_STATUS_CHOICES

register = Library()

@register.inclusion_tag('stamp.html')
def stamp(status):
    label = ''
    if status=='draft':
        return {'status': 'draft', 'label': 'Draft'}
    for s_status, s_label in STAMP_STATUS_CHOICES:
        if status == s_status:
            label = s_label
    return {'status': status, 'label': label}
