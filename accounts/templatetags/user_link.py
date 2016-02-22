from django import template

register = template.Library()

@register.inclusion_tag('links/user.html')
def user_link(user,text=None,new_window=False):
    if text is None:
        text = user.get_full_name()
    return {'user': user, 'text': text, 'new_window': new_window}
