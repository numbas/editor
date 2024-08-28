import os
from zipfile import ZipFile
from pathlib import Path

from django import http
from django.conf import settings
from django.views import generic
from django.urls import reverse
from django.shortcuts import redirect

from editor.models import Theme
from editor import forms
from editor.views.generic import AuthorRequiredMixin, CanViewMixin
from editor.views import editable_package

DEFAULT_THEME_ROOT = Path(settings.GLOBAL_SETTINGS['NUMBAS_PATH']) / 'themes' / 'default'

class ThemeViewMixin:
    upload_file_form_class = forms.ReplaceThemeFileForm

    def get_filename(self):
        filename = super().get_filename()
        return self.place_filename(filename)

    def place_filename(self, filename):
        if filename is None:
            return None

        extension_dirs = {
            '.md': '',
            '.txt': '',
            '.js': 'files/scripts',
            '.html': 'templates',
            '.xslt': 'templates',
            '': '',
        }
        dirname = extension_dirs.get(Path(filename).suffix,'files/resources')
        if not filename.startswith(dirname):
            filename = Path(dirname) / filename
        return str(filename)

    def get_default_filenames(self):
        filenames = []
        for root,dirs,files in os.walk(DEFAULT_THEME_ROOT):
            for f in files:
                filenames.append(str(Path(root).relative_to(DEFAULT_THEME_ROOT) / f))
        return sorted(filenames)

    def get_context_data(self,**kwargs):
        context = super().get_context_data(**kwargs)
        context['default_files'] = self.get_default_filenames()
        return context

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

class UpdateView(ThemeViewMixin,editable_package.UpdateView):
    model = Theme
    form_class = forms.UpdateThemeForm

    def get_filename(self):
        return None

    def get_success_url(self):
        return reverse('theme_list_profile', args=(self.request.user.pk,))

class EditView(ThemeViewMixin,editable_package.EditView):
    model = Theme
    form_class = forms.EditThemeForm
    replace_form_class = forms.ReplaceThemeFileForm
    success_view = 'theme_edit_source'

    def get_initial(self):
        initial = super().get_initial()

        if self.request.GET.get('load_from_default'):
            filename = initial['filename']

            path = Path(DEFAULT_THEME_ROOT / filename)
            initial['source'] = self.load_source(path, package_path=Path(DEFAULT_THEME_ROOT))

        return initial

class ReplaceFileView(ThemeViewMixin,editable_package.ReplaceFileView):
    model = Theme
    form_class = forms.ReplaceThemeFileForm
    success_view = 'theme_edit_source'

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        if 'files' in kwargs:
            for k,f in kwargs['files'].items():
                kwargs['data'] = kwargs['data'].copy()
                kwargs['data'].update({
                    'filename': self.place_filename(f.name)
                })
        return kwargs

class DeleteFileView(ThemeViewMixin,editable_package.DeleteFileView):
    model = Theme
    form_class = forms.ThemeDeleteFileForm
    success_view = 'theme_edit_source'

class AccessView(ThemeViewMixin,editable_package.AccessView):
    model = Theme
    form_class = forms.IndividualAccessFormset
    single_form_class = forms.AddThemeAccessForm
    success_view = 'theme_access'

class AddAccessView(ThemeViewMixin,editable_package.AddAccessView):
    form_class = forms.AddThemeAccessForm

    def get_package(self):
        return Theme.objects.get(pk=self.kwargs['theme_pk'])

    def get_success_url(self):
        return reverse('theme_access', args=(self.object.object.pk,))

class DocumentationView(ThemeViewMixin,editable_package.DocumentationView):
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
        return reverse('theme_list_profile', args=(self.request.user.pk,))
