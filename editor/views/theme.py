import os
from zipfile import ZipFile

from django import http
from django.views import generic
from django.urls import reverse
from django.shortcuts import redirect

from editor.models import Theme, ThemeAccess
from editor import forms
from editor.views.generic import AuthorRequiredMixin, CanViewMixin
from editor.views import editable_package

class CreateView(generic.CreateView):
    """ Create a theme """

    model = Theme
    form_class = forms.CreateThemeForm
    template_name = 'theme/create.html'

    def get_form_kwargs(self):
        kwargs = super(CreateView, self).get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return reverse('theme_edit_source', args=(self.object.pk,))

class UploadView(generic.CreateView):
    """ Upload a theme """

    model = Theme
    form_class = forms.UploadThemeForm
    template_name = 'theme/upload.html'

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return reverse('theme_edit_source', args=(self.object.pk,))

class UpdateView(editable_package.UpdateView):
    model = Theme
    form_class = forms.UpdateThemeForm

    def get_success_url(self):
        return reverse('theme_list_profile', args=(self.request.user.pk,))

class EditView(editable_package.EditView):
    model = Theme
    form_class = forms.EditThemeForm
    success_view = 'theme_edit_source'

class DeleteFileView(editable_package.DeleteFileView):
    model = Theme
    form_class = forms.ThemeDeleteFileForm
    success_view = 'theme_edit_source'

class AccessView(editable_package.AccessView):
    model = Theme
    form_class = forms.ThemeAccessFormset
    single_form_class = forms.AddThemeAccessForm
    success_view = 'theme_access'

class AddAccessView(editable_package.AddAccessView):
    model = ThemeAccess
    form_class = forms.AddThemeAccessForm

    def get_package(self):
        return Theme.objects.get(pk=self.kwargs['theme_pk'])

    def get_success_url(self):
        return reverse('theme_access', args=(self.object.theme.pk,))

class DocumentationView(editable_package.DocumentationView):
    model = Theme

class DownloadView(CanViewMixin, generic.DetailView):
    model = Theme

    def get(self, request, *args, **kwargs):
        theme = self.get_object()
        response = http.HttpResponse(content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="{}.zip"'.format(theme.slug)
        zf = ZipFile(response,'w')
        for fname in theme.filenames():
            zf.write(os.path.join(theme.extracted_path,fname), fname)
        return response

class DeleteView(AuthorRequiredMixin, generic.DeleteView):
    model = Theme
    template_name = 'theme/delete.html'

    def get_success_url(self):
        return reverse('profile_themes', args=(self.request.user.pk,))
