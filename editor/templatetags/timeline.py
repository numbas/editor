from django.core.serializers import serialize
import json
from django.template import Library

register = Library()

@register.filter
def can_delete_timeline_item(user,item):
    return item.can_be_deleted_by(user)
