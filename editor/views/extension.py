from django.views import generic
from django.core.urlresolvers import reverse

from editor.models import Extension
from editor.forms import NewExtensionForm, UpdateExtensionForm
from editor.views.generic import AuthorRequiredMixin

class CreateView(generic.CreateView):
    """ Create an extension """

    model = Extension
    form_class = NewExtensionForm
    template_name = 'extension/create.html'

    def get_form_kwargs(self):
        kwargs = super(CreateView, self).get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return reverse('profile_extensions', args=(self.request.user.pk,))

class UpdateView(AuthorRequiredMixin, generic.UpdateView):
    """ Edit an extension """

    model = Extension
    form_class = UpdateExtensionForm
    template_name = 'extension/edit.html'

    def get_success_url(self):
        return reverse('profile_extensions', args=(self.request.user.pk,))

class DeleteView(AuthorRequiredMixin, generic.DeleteView):
    model = Extension
    template_name = 'extension/delete.html'

    def get_success_url(self):
        return reverse('profile_extensions', args=(self.request.user.pk,))
