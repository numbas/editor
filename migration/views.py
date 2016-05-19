from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.utils.http import urlencode
from django.shortcuts import render
from django.views import generic
from editor.models import EditorItem,NewExam,NewQuestion,Project,Licence
from .forms import MigrateEditorItemFormset,ApplyToAllItemsForm
from django.core.paginator import Paginator

class IndexView(generic.TemplateView):
    template_name = 'migration/index.html'

    def get_context_data(self,*args,**kwargs):
        context = super(IndexView,self).get_context_data(*args,**kwargs)

        context['projects_complete'] = self.request.user.userprofile.projects().count()>1
        num_published = context['num_published'] = self.request.user.own_items.filter(published=True).count()
        context['publish_complete'] = num_published>0

        return context

class PagedItemsMixin(object):
    def get_items(self):

        queryset = self.request.user.own_items.all()

        in_project = self.request.GET.get('in_project')
        if in_project:
            self.in_project = Project.objects.get(pk=in_project)
            queryset = queryset.filter(project=self.in_project)
        else:
            self.in_project = None

        query = self.query = self.request.GET.get('query','')
        if query:
            queryset = queryset.filter(name__contains=query)

        paginator = self.paginator = Paginator(queryset,50)
        if self.request.method=='GET':
            self.page = self.request.GET.get('page',1)
        else:
            self.page = 1
        self.page_objects = paginator.page(self.page)
        queryset = queryset.filter(id__in=[e.id for e in self.page_objects])

        self.query_string = '?'+urlencode({'query':self.query,'project':self.in_project.pk if self.in_project else '','page':self.page})

        return queryset

    def get_context_data(self,*args,**kwargs):
        context = super(PagedItemsMixin,self).get_context_data(*args,**kwargs)

        context['paginator'] = self.paginator
        context['page'] = self.page_objects
        context['query'] = self.query
        context['in_project'] = self.in_project
        context['apply_to_all_form'] = apply_to_all_form = ApplyToAllItemsForm(prefix='apply-all')
        context['query_string'] = self.query_string
        apply_to_all_form.fields['project'].queryset = self.request.user.userprofile.projects().order_by('name')
        return context

    def get_success_url(self):
        return reverse('migrate_items')+self.query_string
    
class MigrateItemsView(PagedItemsMixin,generic.UpdateView):
    template_name = 'migration/migrate_editoritems.html'
    model = EditorItem
    form_class = MigrateEditorItemFormset

    def get_form_kwargs(self):
        args = super(MigrateItemsView,self).get_form_kwargs()
        
        queryset = self.get_items()
        args.update({'queryset':queryset})

        return args

    def get_form(self):
        form = super(MigrateItemsView,self).get_form()
        for subform in form:
            subform.fields['project'].queryset = self.request.user.userprofile.projects().order_by('name')
        return form

    def get_object(self,queryset=None):
        return self.request.user

    def form_valid(self,form):
        print("valid")
        print(form.save())
        for eform in form:
            eform.instance.set_licence(eform.cleaned_data['licence'])
            eform.instance.save()
        return HttpResponseRedirect(self.get_success_url())
