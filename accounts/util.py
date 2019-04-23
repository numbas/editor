from django.db.models import Q
from django.contrib.auth.models import User
from django.urls import reverse
from django.template.loader import get_template

def find_users(name='',queryset=User.objects):
    q = Q()

    queryset = queryset.filter(is_active=True)

    user = queryset.filter(Q(username=name) | Q(email=name))
    if user.exists():
        return user

    # first part - search on full name
    for word in name.split(' '):
        q &= (Q(first_name__icontains=word) | Q(last_name__icontains=word))

    # second part - search on username
    q |= Q(username__icontains=name)

    users = queryset.filter(q).distinct().order_by('first_name', 'last_name')
    return users

def user_json(user):
    return {
        'id': user.pk, 
        'profile': reverse('view_profile', args=(user.pk,)), 
        'name': user.get_full_name(),
        'link': get_template('links/user_link.html').render({'user':user}),
        'autocomplete_entry': get_template('autocomplete/user.html').render({'user':user}),
    }
