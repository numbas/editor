from django.contrib import messages
from django.views import generic
from django.core.urlresolvers import reverse, reverse_lazy
from django.shortcuts import redirect, render_to_response
from django import http
from django.core.exceptions import PermissionDenied

from editor.models import Project, ProjectAccess
import editor.forms
import editor.views.editoritem

class MustBeMemberMixin(object):
    def dispatch(self, request, *args, **kwargs):
        self.project = self.get_project()
        if not self.project.can_be_viewed_by(request.user):
            return render_to_response('project/must_be_member.html', self.get_context_data())
        return super(MustBeMemberMixin, self).dispatch(request, *args, **kwargs)

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
        context['member_of_project'] = self.request.user == project.owner or ((not self.request.user.is_anonymous()) and ProjectAccess.objects.filter(project=project, user=self.request.user).exists())
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
        context['watching_project'] = project.watching_non_members.filter(pk=self.request.user.pk).exists()
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
    form_class = editor.forms.ProjectAccessFormset

    def get_context_data(self, **kwargs):
        context = super(ManageMembersView, self).get_context_data(**kwargs)
        context['add_member_form'] = editor.forms.AddMemberForm({'project':self.object.pk, 'adding_user':self.request.user})
        return context

    def post(self, request, *args, **kwargs):
        return super(ManageMembersView, self).post(request, *args, **kwargs)


    def form_invalid(self, form):
        return super(ManageMembersView, self).form_invalid(form)

    def form_valid(self, form):
        return super(ManageMembersView, self).form_valid(form)

    def get_success_url(self):
        return reverse('project_settings_members', args=(self.get_object().pk,))

class AddMemberView(ProjectContextMixin, SettingsPageMixin, generic.CreateView):
    model = ProjectAccess
    form_class = editor.forms.AddMemberForm
    template_name = 'project/add_member.html'
    settings_page = 'members'

    def get_project(self):
        return Project.objects.get(pk=self.kwargs['project_pk'])

    def get_success_url(self):
        return reverse('project_settings_members', args=(self.object.project.pk,))

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
        new_owner = form.instance.owner
        if new_owner != project.owner:
            ProjectAccess.objects.filter(project=project, user=new_owner).delete()
            ProjectAccess.objects.create(project=project, user=project.owner, access='edit')
        
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

class CommentView(MustBeMemberMixin, editor.views.generic.CommentView):
    model = Project

    def get_comment_object(self):
        return self.get_object()

class WatchProjectView(generic.detail.SingleObjectMixin, generic.View):
    model = Project

    def get(self, request, *args, **kwargs):
        project = self.get_object()
        user = self.request.user
        if not project.public_view:
            return http.response.HttpResponseForbidden("This project is not publicly accessible.")

        project.watching_non_members.add(user)

        messages.info(self.request, 'You\'re now watching {}. Any activity on this project will show up on your timeline.'.format(project.name))

        return redirect(project.get_absolute_url())

class UnwatchProjectView(generic.detail.SingleObjectMixin, generic.View):
    model = Project

    def get(self, request, *args, **kwargs):
        project = self.get_object()
        user = self.request.user
        if not project.public_view:
            return http.response.HttpResponseForbidden("This project is not publicly accessible.")

        project.watching_non_members.remove(user)

        messages.info(self.request, 'You\'re not watching {} any more.'.format(project.name))

        return redirect(project.get_absolute_url())

class LeaveProjectView(ProjectContextMixin, MustBeMemberMixin, generic.DeleteView):
    model = ProjectAccess
    template_name = 'project/leave.html'
    context_object_name = 'projectaccess'

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
            obj = queryset.get(project=project, user=self.request.user)
        except queryset.model.DoesNotExist:
            raise http.Http404("You don't have access to this project.")

        return obj

    def get_success_url(self):
        return reverse('editor_index')
