import os
import mistune
from datetime import datetime
from io import BytesIO
from zipfile import ZipFile
import mimetypes

from django import http
from django.contrib import messages
from django.views import generic
from django.urls import reverse
from django.utils.timezone import make_aware
from django.shortcuts import redirect

from editor import forms
from editor.views.generic import AuthorRequiredMixin, CanEditMixin, CanViewMixin, forbidden_response


class ShowPackageFilesMixin:

    def get_package_filenames(self):
        package = self.get_object()
        filenames = list(package.filenames())
        filenames.sort()
        return filenames

    def get_context_data(self,**kwargs):
        context = super().get_context_data(**kwargs)
        context['filenames'] = self.get_package_filenames()
        context['upload_file_form'] = self.upload_file_form_class(instance=self.get_object())
        return context

class UpdateView(ShowPackageFilesMixin,AuthorRequiredMixin, generic.UpdateView):
    """ Edit an editable_package's metadata """

    template_name = 'editable_package/edit.html'

    def get_context_data(self,**kwargs):
        context = super().get_context_data(**kwargs)
        context['options_active'] = True
        return context

class EditView(ShowPackageFilesMixin, CanViewMixin, generic.UpdateView):
    """ Edit an package's source code """
    template_name = 'editable_package/edit_source.html'

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.is_binary = False
        self.is_image = False

    def dispatch(self,request,*args,**kwargs):
        package = self.get_object()
        if not package.editable:
            return forbidden_response(self.request,"This package is not editable.")
        return super().dispatch(request,*args,**kwargs)

    def get_initial(self):
        initial = super().get_initial()

        package = self.get_object()

        filename = initial['filename'] = self.get_filename()

        try:
            path = os.path.join(package.extracted_path,filename)
            self.mime_type, _ = mimetypes.guess_type(path)
            with open(path,encoding='utf-8') as f:
                source = f.read()
                self.is_binary = False
        except FileNotFoundError as e:
            source = ''
        except UnicodeDecodeError as e:
            with open(path,'rb') as f:
                source = f.read()
                self.is_binary = True
        initial['source'] = source

        return initial

    def get_filename(self):
        package = self.get_object()
        d = self.request.GET if self.request.method.lower()=='get' else self.request.POST
        filename = d.get('filename')
        if not filename:
            filename = package.main_filename
        return filename

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        package = self.get_object()

        context['editable'] = package.can_be_edited_by(self.request.user)

        filename = context['filename'] = self.get_filename()
        path = os.path.join(package.extracted_path,filename)
        context['exists'] = os.path.exists(path)
        if context['exists']:
            stat = os.stat(path)
            context['last_modified'] = make_aware(datetime.fromtimestamp(stat.st_mtime))
        _,ext = os.path.splitext(filename)
        context['fileext'] = ext

        filenames = context['filenames']
        if not context['exists']:
            filenames.append(filename)
        filenames.sort()
        context['filenames'] = filenames

        context['is_binary'] = self.is_binary
        context['is_image'] = self.mime_type is not None and self.mime_type.split('/')[0]=='image'
        context['mime_type'] = self.mime_type
        context['file_url'] = package.url_for(filename)
        _, context['filename_without_directories'] = os.path.split(filename)
        context['replace_form'] = self.replace_form_class(initial={'filename': filename}, instance=package)

        return context

    def form_valid(self,form):
        if not self.object.can_be_edited_by(self.request.user):
            return forbidden_response(self.request, "You may not edit this package.")

        messages.info(self.request,
            "The file <code>{filename}</code> has been saved. "
            "If you're editing any items using this {package_noun}, you'll need to reload the editor for changes to take effect."
            .format(filename=self.get_filename(), package_noun=self.object.package_noun)
        )
        return super().form_valid(form)

    def get_success_url(self):
        return reverse(self.success_view, args=(self.get_object().pk,))+'?filename='+self.get_filename()

class ReplaceFileView(CanEditMixin, generic.UpdateView):
    template_name = 'editable_package/replace_file.html'
    def get_success_url(self):
        return reverse(self.success_view, args=(self.get_object().pk,))+'?filename='+self.filename

    def form_valid(self,form):
        self.filename = form.cleaned_data.get('filename')
        return super().form_valid(form)

class DeleteFileView(CanEditMixin, generic.UpdateView):
    template_name = 'editable_package/delete_file.html'

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
        return reverse(self.success_view, args=(self.get_object().pk,))

class AccessView(ShowPackageFilesMixin, AuthorRequiredMixin, generic.UpdateView):
    template_name = 'editable_package/access.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['access_active'] = True
        context['add_access_form'] = self.single_form_class({self.model.package_noun:self.object.pk, 'adding_user':self.request.user})
        return context

    def get_success_url(self):
        return reverse(self.success_view, args=(self.get_object().pk,))

class AddAccessView(generic.CreateView):
    def dispatch(self, request, *args, **kwargs):
        package = self.get_package()
        if request.user != package.author:
            return forbidden_response("You may not grant other users access to this package.")
        return super().dispatch(request,*args,**kwargs)

class DocumentationView(CanViewMixin, generic.DetailView):
    template_name = 'editable_package/documentation.html'

    def get(self,request,*args,**kwargs):
        # check readme exists
        # check external doc URL
        package = self.get_object()
        if hasattr(package,'url') and package.url:
            return redirect(package.url)
        return super().get(request,*args,**kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        package = self.get_object()
        readme_filename = package.readme_filename
        readme_path = os.path.join(package.extracted_path,readme_filename)
        if readme_filename is None or not os.path.exists(readme_path):
            content = "The author of this package has not written any documentation yet."
        else:
            with open(readme_path,encoding='utf-8') as f:
                content = f.read()

            _,ext = os.path.splitext(readme_filename)
            if ext=='.md':
                content = mistune.markdown(content)

        context['content'] = content

        return context

