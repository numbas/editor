from django import http
from django.views import generic
from django.urls import reverse
from django.shortcuts import redirect
from django.template.loader import render_to_string

import editor.forms
from editor.models import Folder, Project
import editor.views

class MustBeEditorMixin(editor.views.project.MustBeEditorMixin):
    def get_project(self):
        folder = self.get_object()
        return folder.project

class MoveFolderView(editor.views.project.MustBeEditorMixin, generic.FormView):
    form_class = editor.forms.MoveFolderForm

    def get_parent(self):
        pk = self.request.POST.get('parent')
        parent = Folder.objects.get(pk=pk)

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
                'items_moved': len(items),
                'folders_moved': len(folders),
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
