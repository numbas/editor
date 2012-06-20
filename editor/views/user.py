import json
from django.db.models import Q
from django.contrib.auth.models import User
from django.views.generic import ListView
from django.http import Http404, HttpResponse

class UserSearchView(ListView):
    
    """Search users."""
    
    model=User
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps(context),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404
    
    def get_queryset(self):
        search_term = self.request.GET['q'] if 'q' in self.request.GET else ''
        users = User.objects.filter(Q(username__icontains=search_term) | Q(first_name__icontains=search_term) | Q(last_name__icontains=search_term)).distinct()
        return [{"name": u.get_full_name(), "username": u.username, "id": u.id} for u in users]
    

