from django import template

register = template.Library()

@register.inclusion_tag('links/user.html')
def user_link(user,text=None,new_window=False):
    if text is None:
        text = user.get_full_name()
    return {'user': user, 'text': text, 'new_window': new_window}

@register.inclusion_tag('links/user_thumbnail.html')
def user_thumbnail(user,size=None,glyphicon_size=None,link=False):
    avatar = user.userprofile.avatar
    if glyphicon_size is None:
        glyphicon_size = size
    context = {'user': user, 'size': size, 'glyphicon_size': glyphicon_size, 'link': link}
    if not avatar:
        context['has_avatar'] = False
    else:
        context['has_avatar'] = True
        context['image_url'] = user.userprofile.avatar.url if size is None else user.userprofile.avatar.thumbnail(size)
    return context
