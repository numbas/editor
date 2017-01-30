from django.views import generic
from django.core.urlresolvers import reverse

from editor.models import Theme
from editor.forms import NewThemeForm, UpdateThemeForm
from editor.views.generic import AuthorRequiredMixin

class CreateView(generic.CreateView):
    """ Create a theme """

    model = Theme
    form_class = NewThemeForm
    template_name = 'theme/create.html'

    def get_form_kwargs(self):
        kwargs = super(CreateView, self).get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return reverse('profile_themes', args=(self.request.user.pk,))

class UpdateView(AuthorRequiredMixin, generic.UpdateView):
    """ Edit a theme """

    model = Theme
    form_class = UpdateThemeForm
    template_name = 'theme/edit.html'

    def get_success_url(self):
        return reverse('profile_themes', args=(self.request.user.pk,))

class DeleteView(AuthorRequiredMixin, generic.DeleteView):
    model = Theme
    template_name = 'theme/delete.html'

    def get_success_url(self):
        return reverse('profile_themes', args=(self.request.user.pk,))
