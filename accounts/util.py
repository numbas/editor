from django.db.models import Q
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.template.loader import get_template
from django.template import Context

def find_users(name=''):
    q = Q()

    user = User.objects.filter(Q(username=name) | Q(email=name))
    if user.exists():
        return user

    # first part - search on full name
    for word in name.split(' '):
        q &= (Q(first_name__icontains=word) | Q(last_name__icontains=word))

    # second part - search on username
    q |= Q(username__icontains=name)

    users = User.objects.filter(q).distinct()
    return users

def user_json(user):
    return {
        'id': user.pk, 
        'profile': reverse('view_profile', args=(user.pk,)), 
        'name': user.get_full_name(),
        'link': get_template('links/user_link.html').render(Context({'user':user})),
        'autocomplete_entry': get_template('autocomplete/user.html').render(Context({'user':user})),
    }
