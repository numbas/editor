from django import template
from django.urls import reverse

register = template.Library()

@register.inclusion_tag('links/user.html')
def user_link(user, text=None, new_window=False):
    if text is None:
        text = user.get_full_name() if user.is_active else 'Deactivated user'
    return {'user': user, 'text': text, 'new_window': new_window}

@register.inclusion_tag('links/user_thumbnail.html')
def user_thumbnail(user, size=None, glyphicon_size=None, link=False, full_name=None, url=None):
    if size is None:
        size = 20
    if glyphicon_size is None:
        glyphicon_size = size

    context = {
        'size': size, 
        'glyphicon_size': glyphicon_size, 
        'link': link,
        'full_name': full_name,
        'has_avatar': False,
        'active': True,
        'url': url
    }

    if full_name is None:
        context['full_name'] = user.get_full_name()

    if user:
        context['full_name'] = user.get_full_name()
        if user.is_active:
            if url is None:
                url = reverse('view_profile',args=(user.pk,))
            context['url'] = url
            avatar = user.userprofile.avatar
            context.update({
                'user': user, 
                'link': link, 
                'active': user.is_active
            })
            if not avatar:
                context['has_avatar'] = False
            else:
                context['has_avatar'] = True
                context['image_url'] = user.userprofile.avatar.url if size is None else user.userprofile.avatar.thumbnail(size)
        else:
            context.update({
                'link': False,
                'has_avatar': False,
                'user': user,
                'active': False
            })

    return context

@register.inclusion_tag('links/user_thumbnail.html')
def contributor_thumbnail(contributor, size=None, glyphicon_size=None, link=False):
    if contributor.user:
        return user_thumbnail(contributor.user,size,glyphicon_size,link)
    else:
        return user_thumbnail(None,size,glyphicon_size,link,full_name=contributor.name, url=contributor.profile_url)
