from django import template

register = template.Library()

@register.inclusion_tag('user_link.html')
def user_link(user,text=None):
    if text is None:
        text = user.get_full_name()
    return {'user': user, 'text': text}
