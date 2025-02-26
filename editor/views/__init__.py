from accounts.util import find_users, user_json
from collections import defaultdict
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Q, Sum, When, Case, IntegerField
from django.http import Http404, HttpResponse
from django.template.loader import get_template
from django.urls import reverse
from django.utils.timezone import now
from django.views.generic import TemplateView, ListView
from editor.models import SiteBroadcast, EditorItem, NewQuestion, NewExam, Project, Extension, Theme, CustomPartType, TimelineItem, Tip
import json
from random import shuffle, randint
import re

def request_is_ajax(request):
    return request.headers.get('x-requested-with') == 'XMLHttpRequest' or 'application/json' in request.headers.get('accept','')

class HomeView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super(HomeView, self).get_context_data(**kwargs)
        context['navtab'] = 'home'
        context['sticky_broadcasts'] = SiteBroadcast.objects.visible_now().filter(sticky=True)

        num_tips = Tip.objects.count()
        if num_tips>0:
            n = randint(0,num_tips-1)
            context['tip'] = Tip.objects.all()[n]

        return context

class TermsOfUseView(TemplateView):
    template_name = 'terms_of_use.html'
class PrivacyPolicyView(TemplateView):
    template_name = 'privacy_policy.html'

class GlobalStatsView(TemplateView):
    template_name = 'global_stats.html'

    def get_context_data(self, **kwargs):
        context = super(GlobalStatsView, self).get_context_data(**kwargs)
        t = now()
        periods = [
            timedelta(days=1),
            timedelta(days=7),
            timedelta(days=30),
            timedelta(days=365),
        ]
        context['recent_data'] = [
            {
                'created': EditorItem.objects.filter(created__gt=t-d).count(),
                'modified': EditorItem.objects.filter(last_modified__gt=t-d).count(),
                'users_joined': User.objects.filter(date_joined__gt=t-d).count(),
                'users_active': User.objects.filter(timelineitems__date__gt=t-d).distinct().count(),
            }
            for d in periods
        ]

        active_users = User.objects.filter(is_active=True)

        context['counts'] = {
            'questions': NewQuestion.objects.count(),
            'public_questions': NewQuestion.objects.filter(editoritem__published=True).count(),
            'exams': NewExam.objects.count(),
            'public_exams': NewExam.objects.filter(editoritem__published=True).count(),
            'open_access_items': EditorItem.objects.filter(licence__can_reuse=True,published=True).count(),
            'projects': Project.objects.filter(personal_project_of=None).count(),
            'public_projects': Project.objects.filter(public_view=True).count(),
            'extensions': Extension.objects.count(),
            'themes': Theme.objects.count(),
            'custom_part_types': CustomPartType.objects.count(),
            'users': active_users.count(),
            'user_domains': len(set(u.email.split('@')[1] for u in active_users if '@' in u.email)),
        }
        word_cloud_items = EditorItem.objects.filter(last_modified__gt=now()-timedelta(days=90))
        if not settings.EVERYTHING_VISIBLE:
            word_cloud_items = word_cloud_items.filter(published=True)
        context['word_cloud'] = word_cloud(word_cloud_items)
        return context

def word_cloud(items):
    all_words = defaultdict(lambda: 0)
    stopwords = 'and,are,for,from,how,that,the,this,was,what,when,where,question,exam,copy,one,two,three,four,five,six,seven,eight,nine,ten'.split(',')
    for e in items:
        words = [re.sub(r'\W*(\w.*?)\W*$',r'\1',w.lower()) for w in re.split(r'\s',e.name)]
        words = [w for w in words if len(w)>2 and w not in stopwords and not re.search(r'(\d|\'s)',w) and re.match(r'\w+',w)]
        for w in words:
            all_words[w] += 1

    counts = defaultdict(lambda: 0)
    for k,v in all_words.items():
        if k[-1]=='s' and k[:-1] in all_words:
            k = k[:-1]
        counts[k] += v

    if not counts:
        return []
    top = max(counts.values())
    chart = sorted([(k,v) for k,v in counts.items() if v>=top*0.1],key=lambda x:x[1])[:100]
    mean = sum(v for k,v in chart)/len(chart)
    chart = [(x[0],(x[1]/mean)**(1/3),i*1.618*360) for i,x in enumerate(chart)]
    shuffle(chart)
    return chart

class ExploreView(TemplateView):
    template_name = 'explore.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['items'] = EditorItem.objects.filter(published=True).order_by('-published_date')[:3]
        context['projects'] = Project.objects.filter(public_view=True).annotate(num_items=Sum(Case(When(items__published=True,then=1),default=0,output_field=IntegerField()))).order_by('-num_items').exclude(num_items=0)[:3]
        return context

class TopSearchView(ListView):
    def render_to_response(self, context, **response_kwargs):
        if request_is_ajax(self.request):
            return HttpResponse(json.dumps(context['object_list']),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404
    
    def get_queryset(self):
        search_term = self.request.GET['q']
        items = []

        most_of_each = 5

        users = find_users(name=search_term)[:most_of_each]
        items += [user_json(u) for u in users]

        projects = Project.objects.filter(Project.filter_can_be_viewed_by(self.request.user)).filter(name__icontains=search_term)[:most_of_each]
        for p in projects:
            items.append({
                'id': p.pk,
                'profile': reverse('project_index',args=(p.pk,)),
                'name': p.name,
                'autocomplete_entry': get_template('autocomplete/project.html').render({'project':p}),
            })
        return items
