from django.views import generic

from editor.models import Project

class ProjectContextMixin(object):
    model = Project
    context_object_name = 'project'

    def get_context_data(self,**kwargs):
        context = super(ProjectContextMixin,self).get_context_data(**kwargs)
        context['in_project'] = self.get_object()
        return context

class IndexView(ProjectContextMixin,generic.DetailView):
    template_name = 'project/index.html'

class ManageMembersView(ProjectContextMixin,generic.UpdateView):
    template_name = 'project/manage_members.html'
