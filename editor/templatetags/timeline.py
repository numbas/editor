from django.template import Library
from editor.models import Timeline

register = Library()

@register.filter
def can_delete_timeline_item(user, item):
    return item.can_be_deleted_by(user)

@register.filter
def visible_to(items, user):
    if user.is_anonymous:
        return items
    else:
        return items.exclude(hidden_by=user)

@register.inclusion_tag('timeline/timeline.html', takes_context=True)
def timeline(context, items, **kwargs):
    items_per_page = kwargs.get('per_page', 10)
    timeline = Timeline(items, context['user'], items_per_page)
    request = context.get('request')
    page_number = request.GET.get('page', 1)
    return {
        'timeline': timeline, 
        'page': timeline.pages.get_page(page_number),
        'request': request,
        'include_object_link': context.get('include_object_link', False),
    }
