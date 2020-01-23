import os
import mistune
from datetime import datetime
from io import BytesIO
from zipfile import ZipFile

from django import http
from django.contrib import messages
from django.views import generic
from django.urls import reverse
from django.utils.timezone import make_aware
from django.shortcuts import redirect

from editor.models import Extension, ExtensionAccess
from editor import forms
from editor.views.generic import AuthorRequiredMixin, CanEditMixin, CanViewMixin, forbidden_response

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
        return reverse('profile_extensions', args=(self.request.user.pk,))

class UpdateView(AuthorRequiredMixin, generic.UpdateView):
    """ Edit an extension's metadata """

    model = Extension
    form_class = forms.UpdateExtensionForm
    template_name = 'extension/edit.html'

    def get_context_data(self,**kwargs):
        context = super().get_context_data(**kwargs)
        context['options_active'] = True
        return context

    def get_success_url(self):
        return reverse('profile_extensions', args=(self.request.user.pk,))

class EditView(CanViewMixin, generic.UpdateView):
    """ Edit an extension's source code """
    model = Extension
    form_class = forms.EditExtensionForm
    template_name = 'extension/edit_source.html'

    def dispatch(self,request,*args,**kwargs):
        extension = self.get_object()
        if not extension.editable:
            return forbidden_response(self.request,"This extension is not editable.")
        return super().dispatch(request,*args,**kwargs)

    def get_initial(self):
        initial = super().get_initial()

        extension = self.get_object()

        filename = initial['filename'] = self.get_filename()

        try:
            path = os.path.join(extension.extracted_path,filename)
            with open(path,encoding='utf-8') as f:
                source = f.read()
        except FileNotFoundError as e:
            source = ''

        initial['source'] = source

        return initial

    def get_filename(self):
        extension = self.get_object()
        d = self.request.GET if self.request.method.lower()=='get' else self.request.POST
        filename = d.get('filename',extension.script_filename)
        return filename

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        extension = self.get_object()

        context['editable'] = extension.can_be_edited_by(self.request.user)

        filename = context['filename'] = self.get_filename()
        path = os.path.join(extension.extracted_path,filename)
        context['exists'] = os.path.exists(path)
        if context['exists']:
            stat = os.stat(path)
            context['last_modified'] = make_aware(datetime.fromtimestamp(stat.st_mtime))
        _,ext = os.path.splitext(filename)
        context['fileext'] = ext

        return context

    def form_valid(self,form):
        if not self.object.can_be_edited_by(self.request.user):
            return forbidden_response(self.request, "You may not edit this extension.")

        messages.info(self.request,
            "The file <code>{filename}</code> has been saved. "
            "If you're editing any questions using this extension, you'll need to reload the editor for changes to take effect."
            .format(filename=self.get_filename())
        )
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('extension_edit_source', args=(self.get_object().pk,))+'?filename='+self.get_filename()

class DeleteFileView(CanEditMixin, generic.UpdateView):
    model = Extension
    template_name = 'extension/delete_file.html'
    form_class = forms.ExtensionDeleteFileForm

    def get_filename(self):
        d = self.request.GET if self.request.method.lower()=='get' else self.request.POST
        filename = d.get('filename')
        return filename

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args,**kwargs)
        context['filename'] = self.get_filename()
        return context

    def get_initial(self):
        initial = super().get_initial()
        filename = initial['filename'] = self.get_filename()
        return initial

    def get_success_url(self):
        return reverse('extension_edit_source', args=(self.get_object().pk,))

class AccessView(AuthorRequiredMixin, generic.UpdateView):
    model = Extension
    template_name = 'extension/access.html'
    form_class = forms.ExtensionAccessFormset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['access_active'] = True
        context['add_access_form'] = forms.AddExtensionAccessForm({'extension':self.object.pk, 'adding_user':self.request.user})
        return context

    def get_success_url(self):
        return reverse('extension_access', args=(self.get_object().pk,))

class AddAccessView(generic.CreateView):
    model = ExtensionAccess
    form_class = forms.AddExtensionAccessForm

    def dispatch(self, request, *args, **kwargs):
        extension = self.get_extension()
        if request.user != extension.author:
            return forbidden_response("You may not grant other users access to this extension.")
        return super().dispatch(request,*args,**kwargs)

    def get_extension(self):
        return Extension.objects.get(pk=self.kwargs['extension_pk'])

    def get_success_url(self):
        return reverse('extension_access', args=(self.object.extension.pk,))

class DocumentationView(CanViewMixin, generic.DetailView):
    model = Extension
    template_name = 'extension/documentation.html'

    def get(self,request,*args,**kwargs):
        # check readme exists
        # check external doc URL
        extension = self.get_object()
        if extension.url:
            return redirect(extension.url)
        return super().get(request,*args,**kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        extension = self.get_object()
        readme_filename = extension.readme_filename
        if readme_filename is None:
            content = "The author of this extension has not written any documentation yet."
        else:
            with open(os.path.join(extension.extracted_path,readme_filename)) as f:
                content = f.read()

            _,ext = os.path.splitext(readme_filename)
            if ext=='.md':
                content = mistune.markdown(content)

        context['content'] = content

        return context

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
        return reverse('profile_extensions', args=(self.request.user.pk,))
