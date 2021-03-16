from django import http
from django.views import generic
from django.urls import reverse
from django.shortcuts import redirect

from editor.models import KnowledgeGraph
from editor.forms import NewKnowledgeGraphForm, UpdateKnowledgeGraphForm
from editor.views.generic import AuthorRequiredMixin, CanEditMixin

import json

class CreateView(generic.CreateView):
    model = KnowledgeGraph
    form_class = NewKnowledgeGraphForm
    template_name = 'knowledge_graph/create.html'

    def get_form_kwargs(self):
        kwargs = super(CreateView, self).get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return self.object.get_absolute_url()


class UpdateView(generic.UpdateView, CanEditMixin):
    model = KnowledgeGraph
    form_class = UpdateKnowledgeGraphForm
    template_name = 'knowledge_graph/edit.html'
    context_object_name = 'knowledge_graph'

    edit_required_methods = ['POST']

    def get_form_kwargs(self):
        kwargs = super(UpdateView, self).get_form_kwargs()
        if self.request.is_ajax and self.request.method == 'POST':
            kwargs.update({
                'data': json.loads(self.request.POST['json'])
            })
        return kwargs

    def form_valid(self, form):
        form.save()
        return http.HttpResponse(json.dumps(self.form_valid_response_dict(form)), content_type='application/json')
    
    def form_valid_response_dict(self, form):
        return {
            'result': 'success',
            'topics': [{'pk': t.pk, 'name': t.name} for t in form.topics],
            'learning_objectives': [{'pk': lo.pk, 'name': lo.name} for lo in form.learning_objectives],
        }

    def form_invalid(self, form):
        status = {
            "result": "error",
            "message": "Something went wrong...",
            "traceback": traceback.format_exc(),
            "form_errors": json.dumps(form.errors),
        }
        return http.HttpResponseServerError(json.dumps(status),
                                       content_type='application/json')

    def get_success_url(self):
        return self.object.get_absolute_url()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        context['editable'] = self.object.can_be_edited_by(self.request.user)
        context['json'] = self.object.as_json()

        return context
