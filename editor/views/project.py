import urllib.parse

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Sum, When, Case, IntegerField
from django.views import generic
from django.urls import reverse, reverse_lazy
from django.shortcuts import redirect, render
from django import http
from django.core.exceptions import PermissionDenied
from itertools import groupby
from django_tables2.config import RequestConfig

from editor.models import Project, ProjectInvitation, STAMP_STATUS_CHOICES, Folder, IndividualAccess
import editor.forms
import editor.views.editoritem
from editor.tables import ProjectTable, EditorItemTable, BrowseProjectTable

class MustBeMemberMixin(object):
    def dispatch(self, request, *args, **kwargs):
        self.project = self.get_project()
        if not self.project.can_be_viewed_by(request.user):
            self.object = self.project
            return render(request, 'project/must_be_member.html', self.get_context_data())
        return super(MustBeMemberMixin, self).dispatch(request, *args, **kwargs)

    def get_project(self):
        return self.get_object()

class MustBeEditorMixin(object):
    def dispatch(self, request, *args, **kwargs):
        self.project = self.get_project()
        if not self.project.can_be_edited_by(request.user):
            self.object = self.project
            return render(request, 'project/must_be_member.html', self.get_context_data())
        return super().dispatch(request, *args, **kwargs)

    def get_project(self):
        return self.get_object()

class MustBeOwnerMixin(object):
    def dispatch(self, request, *args, **kwargs):
        if request.user != self.get_project().owner:
            raise PermissionDenied
        return super(MustBeOwnerMixin, self).dispatch(request, *args, **kwargs)

class ProjectContextMixin(object):
    model = Project
    context_object_name = 'project'

    def get_project(self):
        return self.get_object()

    def get_context_data(self, **kwargs):
        context = super(ProjectContextMixin, self).get_context_data(**kwargs)
        project = self.get_project()
        context['project'] = project
        context['in_project'] = project is not None
        context['project_editable'] = project.can_be_edited_by(self.request.user)
        context['member_of_project'] = self.request.user == project.owner or ((not self.request.user.is_anonymous) and project.access.filter(user=self.request.user).exists())
        context['watching_project'] = project.watching_users.all().filter(pk=self.request.user.pk).exists()
        return context

class SettingsPageMixin(MustBeMemberMixin):
    def get_context_data(self, **kwargs):
        context = super(SettingsPageMixin, self).get_context_data(**kwargs)
        context['settings_page'] = self.settings_page
        return context

    def form_valid(self, form):
        result = super(SettingsPageMixin,self).form_valid(form)
        messages.add_message(self.request, messages.SUCCESS, 'Your changes have been saved.')
        return result

class CreateView(generic.CreateView):
    model = Project
    template_name = 'project/create.html'
    form_class = editor.forms.ProjectForm
    
    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super(CreateView, self).form_valid(form)

class DeleteView(ProjectContextMixin, MustBeOwnerMixin, generic.DeleteView):
    template_name = 'project/delete.html'
    success_url = reverse_lazy('editor_index')


class IndexView(ProjectContextMixin, MustBeMemberMixin, generic.DetailView):
    model = Project
    template_name = 'project/index.html'

    def get_context_data(self, **kwargs):
        project = self.object = self.get_project()

        context = super(IndexView, self).get_context_data(**kwargs)

        status_counts = {status:len(list(items)) for status,items in groupby(sorted([x[0] if x[0] is not None else 'draft' for x in project.items.values_list('current_stamp__status')]))}
        status_choices = list(STAMP_STATUS_CHOICES)+[('draft','Draft')]
        context['status_counts'] = [(status,label,status_counts.get(status,0)) for status,label in status_choices]
        return context

class OptionsView(ProjectContextMixin, SettingsPageMixin, generic.UpdateView):
    template_name = 'project/options.html'
    form_class = editor.forms.ProjectForm
    settings_page = 'options'

    def get_success_url(self):
        return reverse('project_settings_options', args=(self.get_object().pk,))

class ManageMembersView(ProjectContextMixin, SettingsPageMixin, generic.UpdateView):
    template_name = 'project/manage_members.html'
    settings_page = 'members'
    form_class = editor.forms.IndividualAccessFormset

    def get_invitations_form(self):
        kwargs = {
            'queryset': ProjectInvitation.objects.exclude(applied=True),
            'prefix': 'invitations',
            'instance': self.get_object(),
        }
        cls = editor.forms.ProjectInvitationFormset
        if self.request.method == 'POST':
            return cls(self.request.POST, self.request.FILES, **kwargs)
        else:
            return cls(**kwargs)

    def get_context_data(self, **kwargs):
        context = super(ManageMembersView, self).get_context_data(**kwargs)
        ct = ContentType.objects.get_for_model(self.object)
        context['add_member_form'] = editor.forms.AddMemberForm({'object_content_type': ct.pk, 'object_id': self.object.pk, 'adding_user':self.request.user})
        context['invitations_form'] = self.get_invitations_form()
        return context

    def post(self, request, *args, **kwargs):
        invitations_form = self.get_invitations_form()
        if invitations_form.is_valid():
            invitations_form.save()
        return super(ManageMembersView, self).post(request, *args, **kwargs)

    def form_invalid(self, form):
        return super(ManageMembersView, self).form_invalid(form)

    def form_valid(self, form):
        return super(ManageMembersView, self).form_valid(form)

    def get_success_url(self):
        return reverse('project_settings_members', args=(self.get_object().pk,))

class AddMemberView(ProjectContextMixin, SettingsPageMixin, generic.CreateView):
    model = IndividualAccess
    form_class = editor.forms.AddMemberForm
    template_name = 'project/add_member.html'
    settings_page = 'members'

    def get_project(self):
        return Project.objects.get(pk=self.kwargs['project_pk'])

    def get_success_url(self):
        return reverse('project_settings_members', args=(self.object.object.pk,))

    def form_valid(self, form):
        self.object = form.save()
        if form.invitation:
            messages.info(self.request, 'An email has been sent to {}, inviting them to join {}'.format(form.invitation.email, form.invitation.project))
        return http.HttpResponseRedirect(self.get_success_url())

    def get_context_data(self, *args, **kwargs):
        context = super(AddMemberView, self).get_context_data(*args, **kwargs)
        context['project'] = self.get_project()
        return context

class TransferOwnershipView(ProjectContextMixin, MustBeOwnerMixin, generic.UpdateView):
    template_name = 'project/transfer_ownership.html'
    form_class = editor.forms.ProjectTransferOwnershipForm

    def get_success_url(self):
        return reverse('project_settings_members', args=(self.object.pk,))

    def form_valid(self, form):
        project = self.get_object()
        new_owner = form.cleaned_data['selected_user']
        if new_owner != project.owner:
            IndividualAccess.objects.filter(object=project, user=new_owner).delete()
            IndividualAccess.objects.create(object=project, user=project.owner, access='edit')
        
        return super(TransferOwnershipView, self).form_valid(form)

class SearchView(MustBeMemberMixin, editor.views.editoritem.SearchView):
    template_name = 'project/search.html'

    def get_object(self):
        return Project.objects.get(pk=self.kwargs.get('pk'))

    def dispatch(self, request, pk, *args, **kwargs):
        self.project = self.get_object() 
        return super(SearchView, self).dispatch(request, pk, *args, **kwargs)

    def base_queryset(self):
        return self.project.items.all()

    def get_context_data(self, **kwargs):
        context = super(SearchView, self).get_context_data(**kwargs)
        context['in_project'] = True
        context['project'] = self.project
        return context

class BrowseView(ProjectContextMixin, MustBeMemberMixin, generic.DetailView):
    model = Project
    template_name = 'project/browse.html'

    def get_project(self):
        pk = self.kwargs.get('pk')
        project = self.project = Project.objects.get(pk=pk)
        return project

    def get_folders(self):
        if hasattr(self,'breadcrumbs'):
            return self.breadcrumbs

        project = self.get_project()
        path = self.kwargs.get('path','')[:-1]
        try:
            breadcrumbs = self.breadcrumbs = project.get_folder_breadcrumbs(path)
        except Folder.DoesNotExist:
            raise http.Http404("Folder not found.")
        return breadcrumbs

    def get_folder(self):
        breadcrumbs = self.get_folders()
        return breadcrumbs[-1] if len(breadcrumbs)>0 else None

    def make_table(self):
        project = self.get_project()
        folder = self.get_folder()
        items = folder.items.all() if folder else project.items.filter(folder=None)

        config = RequestConfig(self.request, paginate={'per_page': 100})
        results = BrowseProjectTable(items,order_by_field='order_by')

        order_by = self.request.GET.get('order_by','name')
        if order_by in ('last_modified', 'licence'):
            order_by = '-'+order_by
        results.order_by = order_by

        config.configure(results)

        return results
    
    def get_context_data(self,**kwargs):
        context = super().get_context_data(**kwargs)

        project =  self.get_project()
        folder = context['folder'] = self.get_folder()
        context['breadcrumbs'] = self.get_folders()[:-1]

        if folder:
            subfolders = folder.folders.all()
            context['path'] = folder.path()
        else:
            subfolders = project.folders.filter(parent=None)

        table = context['items'] = context['results'] = self.make_table()

        if table.order_by[0]=='-name':
            subfolders = subfolders.order_by('-name')
        context['subfolders'] = subfolders

        context['num_items'] = table.page.paginator.count + subfolders.count()

        def fix_hierarchy(h):
            return [{'folder': f['folder'].as_json(), 'subfolders': fix_hierarchy(f['subfolders'])} for f in h]

        context['folder_hierarchy'] = fix_hierarchy(project.folder_hierarchy())

        can_edit = context['can_edit'] = project.can_be_edited_by(self.request.user)
        
        if can_edit:
            move_project_form = context['move_project_form'] = editor.forms.BrowseMoveProjectForm()
            move_project_form.fields['project'].queryset = self.request.user.userprofile.projects().order_by('name').exclude(pk=project.pk).distinct()

        return context

class CommentView(MustBeMemberMixin, editor.views.generic.CommentView):
    model = Project

    def get_comment_object(self):
        return self.get_object()

class NewFolderView(ProjectContextMixin, MustBeEditorMixin, generic.CreateView):
    model = Folder
    form_class = editor.forms.NewFolderForm
    template_name = 'project/new_folder.html'

    def get_project(self):
        pk = self.kwargs.get('project_pk')
        project = self.project = Project.objects.get(pk=pk)
        return project

    def get_context_data(self,*args,**kwargs):
        context = super().get_context_data(*args,**kwargs)

        initial = self.get_initial()
        context['parent_name'] = initial['parent'].name if initial['parent'] is not None else initial['project'].name
        
        return context

    def get_initial(self):
        initial = super().get_initial()
        path = self.request.GET.get('path')
        project = initial['project'] = self.get_project()
        parent = project.get_folder(path)
        initial['parent'] = parent
        return initial

    def get_success_url(self):
        if self.object.parent:
            return self.object.parent.get_absolute_url()
        else:
            return reverse('project_browse',args=(self.object.project.pk, ''))

class BaseProjectWatchView(LoginRequiredMixin, generic.detail.SingleObjectMixin, generic.View):
    http_method_names = ['post']
    model = Project

    def post(self, request, *args, **kwargs):
        self.project = self.get_object()
        if not self.project.can_be_viewed_by(request.user):
            raise PermissionDenied("You can not see this project.")

    def valid(self):
        return redirect(self.project.get_absolute_url())

class WatchProjectView(BaseProjectWatchView):
    http_method_names = ['post']
    model = Project

    def post(self, request, *args, **kwargs):
        super().post(request,*args,**kwargs)

        self.project.unwatching_members.remove(request.user)
        self.project.watching_non_members.add(request.user)

        return self.valid()

class UnwatchProjectView(BaseProjectWatchView):
    http_method_names = ['post']
    model = Project

    def post(self, request, *args, **kwargs):
        super().post(request,*args,**kwargs)
        
        self.project.unwatching_members.add(request.user)
        self.project.watching_non_members.add(request.user)

        return self.valid()

class LeaveProjectView(ProjectContextMixin, MustBeMemberMixin, generic.DeleteView):
    model = IndividualAccess
    template_name = 'project/leave.html'
    context_object_name = 'access'

    def dispatch(self, request, *args, **kwargs):
        project = self.get_project()
        if self.request.user == project.owner:
            return http.HttpResponseBadRequest("You can't leave this project - you're the owner. Transfer ownership to someone else first.")
        return super(LeaveProjectView, self).dispatch(request, *args, **kwargs)

    def get_project(self):
        pk = self.kwargs.get(self.pk_url_kwarg)
        project = Project.objects.get(pk=pk)
        return project

    def get_object(self, queryset=None):
        if queryset is None:
            queryset = self.get_queryset()

        project = self.get_project()

        try:
            obj = project.access.get(user=self.request.user)
        except IndividualAccess.DoesNotExist:
            raise http.Http404("You don't have access to this project.")

        return obj

    def get_success_url(self):
        return reverse('editor_index')

class PublicProjectsView(generic.ListView):
    model = Project
    template_name = 'project/public_list.html'
    
    def get_queryset(self):
        query = super(PublicProjectsView,self).get_queryset() \
                .exclude(items=None)
        if not getattr(settings,'EVERYTHING_VISIBLE',False):
            query = query.filter(public_view=True) \
                .annotate(num_items=Sum(Case(When(items__published=True,then=1),default=0,output_field=IntegerField()))) \
                .exclude(num_items=0)
        return query

    def make_table(self):
        config = RequestConfig(self.request, paginate={'per_page': 5})
        results = ProjectTable(self.object_list)

        #order_by = self.form.cleaned_data.get('order_by')
        order_by = self.request.GET.get('order_by','num_items')
        if order_by in ('num_items',):
            order_by = '-'+order_by
        results.order_by = order_by

        config.configure(results)

        return results

    def get_context_data(self, **kwargs):
        context = super(PublicProjectsView,self).get_context_data(**kwargs)
        table = context['results'] = self.make_table()
        context['projects'] = [
            {
                'project': row.record, 
                'num_questions': row.record.items.questions().filter(published=True).count(),
                'num_exams': row.record.items.exams().filter(published=True).count(),
            }
            for row in table.page.object_list
        ]
        return context
