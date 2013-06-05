from django import template

register = template.Library()

@register.filter('can_be_edited_by')
def can_be_edited_by(object,user):
    return object.can_be_edited_by(user)
