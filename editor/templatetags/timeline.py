from django.template import Library
from editor.models import Timeline

register = Library()

@register.filter
def can_delete_timeline_item(user, item):
    return item.can_be_deleted_by(user)

@register.filter
def visible_to(items, user):
    if user.is_anonymous():
        return items
    else:
        return items.exclude(hidden_by=user)

@register.inclusion_tag('timeline/timeline.html', takes_context=True)
def timeline(context, items, **kwargs):
    return {
        'timeline': Timeline(items, context['user']), 
        'request': context.get('request'),
        'include_object_link': context.get('include_object_link', False),
        'timeline_items_per_page': kwargs.get('per_page', 10),
    }
