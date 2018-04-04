from django.views.generic import TemplateView
from editor.models import SiteBroadcast

class HomeView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super(HomeView, self).get_context_data(**kwargs)
        context['navtab'] = 'home'
        context['sticky_broadcasts'] = SiteBroadcast.objects.visible_now().filter(sticky=True)
        return context

class TermsOfUseView(TemplateView):
    template_name = 'terms_of_use.html'
