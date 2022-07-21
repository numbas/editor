import os
from zipfile import ZipFile

from django import http
from django.views import generic
from django.urls import reverse
from django.shortcuts import redirect

from editor.models import Extension
from editor import forms
from editor.views.generic import AuthorRequiredMixin, CanViewMixin
from editor.views import editable_package

class ExtensionViewMixin:
    upload_file_form_class = forms.ReplaceExtensionFileForm

class CreateView(generic.CreateView):
    """ Create an extension """

    model = Extension
    form_class = forms.CreateExtensionForm
    template_name = 'extension/create.html'

    def get_form_kwargs(self):
        kwargs = super(CreateView, self).get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return reverse('extension_edit_source', args=(self.object.pk,))

class UploadView(generic.CreateView):
    """ Upload an extension """

    model = Extension
    form_class = forms.UploadExtensionForm
    template_name = 'extension/upload.html'

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return reverse('extension_edit_source', args=(self.object.pk,))

class UpdateView(ExtensionViewMixin,editable_package.UpdateView):
    model = Extension
    form_class = forms.UpdateExtensionForm

    def get_success_url(self):
        return reverse('extension_list_profile', args=(self.request.user.pk,))

class EditView(ExtensionViewMixin,editable_package.EditView):
    model = Extension
    form_class = forms.EditExtensionForm
    replace_form_class = forms.ReplaceExtensionFileForm
    success_view = 'extension_edit_source'

class ReplaceFileView(ExtensionViewMixin,editable_package.ReplaceFileView):
    model = Extension
    form_class = forms.ReplaceExtensionFileForm
    success_view = 'extension_edit_source'

class DeleteFileView(ExtensionViewMixin,editable_package.DeleteFileView):
    model = Extension
    form_class = forms.ExtensionDeleteFileForm
    success_view = 'extension_edit_source'

class AccessView(ExtensionViewMixin,editable_package.AccessView):
    model = Extension
    form_class = forms.IndividualAccessFormset
    single_form_class = forms.AddExtensionAccessForm
    success_view = 'extension_access'

class AddAccessView(ExtensionViewMixin,editable_package.AddAccessView):
    form_class = forms.AddExtensionAccessForm

    def get_package(self):
        return Extension.objects.get(pk=self.kwargs['extension_pk'])

    def get_success_url(self):
        return reverse('extension_access', args=(self.object.object.pk,))

class DocumentationView(ExtensionViewMixin,editable_package.DocumentationView):
    model = Extension

class DownloadView(CanViewMixin, generic.DetailView):
    model = Extension

    def get(self, request, *args, **kwargs):
        extension = self.get_object()
        response = http.HttpResponse(content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="{}.zip"'.format(extension.location)
        zf = ZipFile(response,'w')
        for fname in extension.filenames():
            zf.write(os.path.join(extension.extracted_path,fname), fname)
        return response

class DeleteView(AuthorRequiredMixin, generic.DeleteView):
    model = Extension
    template_name = 'extension/delete.html'

    def get_success_url(self):
        return reverse('extension_list_profile', args=(self.request.user.pk,))
