from django.db.models import Q
from django.contrib.auth.models import User

def find_users(name=''):
    q = Q()

    #first part - search on full name
    for word in name.split(' '):
        q &= (Q(first_name__icontains=word) | Q(last_name__icontains=word))

    #second part - search on username
    q |= Q(username__icontains=name)

    users = User.objects.filter(q).distinct()
    return users
