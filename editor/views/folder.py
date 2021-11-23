from django import http
from django.contrib import messages
from django.views import generic
from django.urls import reverse
from django.utils.translation import ngettext
from django.shortcuts import redirect
from django.template.loader import render_to_string

import editor.forms
from editor.models import Folder, Project
import editor.views
import editor.views.generic
from editor.views.generic import ProjectQuerysetMixin

class MustBeEditorMixin(editor.views.generic.CanEditMixin):
    def get_access_object(self):
        folder = self.get_object()
        return folder.project

class MoveFolderView(MustBeEditorMixin, generic.FormView):
    form_class = editor.forms.MoveFolderForm

    def get_parent(self):
        pk = self.request.POST.get('parent')
        parent = Folder.objects.get(pk=pk)

    def get_access_object(self):
        return self.get_project()

    def get_project(self):
        project_pk = self.request.POST.get('project')
        return Project.objects.get(pk=project_pk)

    def form_invalid(self,form):
        if self.request.is_ajax():
            return http.JsonResponse(form.errors, status=400)

    def form_valid(self, form):
        form.save()

        parent = form.cleaned_data['parent']
        project = form.cleaned_data['project']
        folders = form.cleaned_data['folders']
        items = form.cleaned_data['items']
        if parent:
            folder_name = parent.name
            folder_url = parent.get_absolute_url()
        else:
            folder_name = project.name
            folder_url = reverse('project_browse',args=(project.pk,''))

        if self.request.is_ajax():
            num_moved = len(folders) + len(items)
            message = render_to_string('folder/moved_message.html',{
                'folder_name': folder_name, 
                'folder_url': folder_url,
                'num_moved': num_moved,
            })
            data = {
                'ok': True, 
                'folder_name': folder_name, 
                'folder_url': folder_url, 
                'message': message,
                'items_moved': [item.pk for item in items],
                'folders_moved': [folder.pk for folder in folders],
            }
            return http.JsonResponse(data,status=200)
        else:
            return redirect(self.get_success_url())

    def get_success_url(self):
        parent = self.get_parent()
        if parent:
            return parent.get_absolute_url()
        else:
            project = self.get_project()
            return reverse('project_browse',args=(project.pk,''))

class MoveProjectView(editor.views.generic.CanEditMixin, ProjectQuerysetMixin, generic.FormView):
    form_class = editor.forms.BrowseMoveProjectForm

    def get_access_object(self):
        project_pk = self.request.POST.get('from_project')
        return Project.objects.get(pk=project_pk)

    def form_valid(self, form):
        self.form = form
        form.save()
        num_folders = form.cleaned_data.get('folders').count()
        num_items = form.cleaned_data.get('items').count()
        messages.success(self.request, "Moved {} {} and {} {} from {}.".format(
            num_folders,
            ngettext('folder','folders',num_folders),
            num_items,
            ngettext('item','items',num_items),
            self.get_project().name
            )
        )
        return super().form_valid(form)

    def form_invalid(self, form):
        print(form.errors)
        print(self.get_form_kwargs())
        return redirect(reverse('project_browse',args=(self.get_project().pk,'')))

    def get_success_url(self):
        return reverse('project_browse',args=(self.form.cleaned_data.get('project').pk,''))

class RenameFolderView(MustBeEditorMixin, generic.UpdateView):
    model = Folder
    template_name = 'folder/rename.html'
    form_class = editor.forms.RenameFolderForm

    def get_success_url(self):
        return self.object.get_absolute_url()

class DeleteFolderView(MustBeEditorMixin, generic.DeleteView):
    model = Folder
    template_name = 'folder/delete.html'

    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        for folder in self.object.folders.all():
            folder.parent = self.object.parent
            folder.save()
        for item in self.object.items.all():
            item.folder = self.object.parent
            print(item,item.folder)
            item.save()

        return super().delete(request,*args,**kwargs)

    def get_success_url(self):
        if self.object.parent:
            return self.object.parent.get_absolute_url()
        else:
            return reverse('project_browse',args=(self.object.project.pk,''))
