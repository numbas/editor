from django.views import generic
from django.core.urlresolvers import reverse

from editor.models import CustomPartType, CUSTOM_PART_TYPE_PUBLIC_CHOICES, CUSTOM_PART_TYPE_INPUT_WIDGETS
from editor.forms import NewCustomPartTypeForm, UpdateCustomPartTypeForm
from editor.views.generic import AuthorRequiredMixin

class CreateView(generic.CreateView):
    model = CustomPartType
    form_class = NewCustomPartTypeForm
    template_name = 'custom_part_type/create.html'

    def get_form_kwargs(self):
        kwargs = super(CreateView, self).get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return self.object.get_absolute_url()

class UpdateView(generic.UpdateView):
    model = CustomPartType
    form_class = UpdateCustomPartTypeForm
    template_name = 'custom_part_type/edit.html'
    context_object_name = 'part_type'

    def get_success_url(self):
        return self.object.get_absolute_url()

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)

        context['editable'] = self.object.can_be_edited_by(self.request.user)
        context['item_json'] = self.object.as_json()
        context['CUSTOM_PART_TYPE_PUBLIC_CHOICES'] = [{'name': value, 'niceName': label} for value, label in CUSTOM_PART_TYPE_PUBLIC_CHOICES]
        context['CUSTOM_PART_TYPE_INPUT_WIDGETS'] = [{'name': value, 'niceName': label} for value, label in CUSTOM_PART_TYPE_INPUT_WIDGETS]

        return context

class DeleteView(AuthorRequiredMixin, generic.DeleteView):
    model = CustomPartType
    template_name = 'custom_part_type/delete.html'

    def get_success_url(self):
        return reverse('profile_custom_part_types', args=(self.request.user.pk,))
