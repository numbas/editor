import json
from django.db.models import Q
from django.contrib.auth.models import User
from django.views.generic import ListView
from django.http import Http404, HttpResponse

def find_users(name=''):
    q = Q()

    #first part - search on full name
    for word in name.split(' '):
        q &= (Q(first_name__icontains=word) | Q(last_name__icontains=word))

    #second part - search on username
    q |= Q(username__icontains=name)

    users = User.objects.filter(q).distinct()
    return users

class UserSearchView(ListView):
    
    """Search users."""
    
    model=User
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps(context['object_list']),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404
    
    def get_queryset(self):
        try:
            search_term = self.request.GET['q']
            users = find_users(name=search_term)
        except KeyError:
            users = User.objects.all()
        return [{"name": u.get_full_name(), "username": u.username, "id": u.id} for u in users]
    
