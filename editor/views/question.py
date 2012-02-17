import json
import os
import uuid

from django.conf import settings
from django.core.urlresolvers import reverse
from django.forms.models import model_to_dict
from django.shortcuts import render
from django.views.generic import CreateView, DeleteView, UpdateView

from editor.models import Question
from editor.views.generic import SaveContentMixin

class QuestionCreateView(CreateView, SaveContentMixin):
    
    """Create a question."""
    
    model = Question
    template_name = 'question/new.html'
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        self.object.filename = str(uuid.uuid4())
        return self.write_content(settings.GLOBAL_SETTINGS['QUESTION_SUBDIR'],
                                  form)
        
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.slug,))
    
    
class QuestionDeleteView(DeleteView):
    
    """Delete a question."""
    
    model = Question
    template_name = 'question/delete.html'
    
    def get_success_url(self):
        return reverse('question_index')


class QuestionUpdateView(UpdateView, SaveContentMixin):
    
    """Edit a question."""
    
    model = Question
    template_name = 'question/edit.html'
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        return self.write_content(settings.GLOBAL_SETTINGS['QUESTION_SUBDIR'],
                                  form)
    
    def get_context_data(self, **kwargs):
        context = super(QuestionUpdateView, self).get_context_data(**kwargs)
        context['question_JSON'] = json.dumps(model_to_dict(self.object))
        return context
    
#    def get(self, request, *args, **kwargs):
#        self.object = self.get_object()
#        form_class = self.get_form_class()
#        form = self.get_form(form_class)
#        try:
#            questionfile = open(os.path.join(settings.GLOBAL_SETTINGS['REPO_PATH'], settings.GLOBAL_SETTINGS['QUESTION_SUBDIR'], self.object.filename), 'r')
#            self.object.content = questionfile.read()
#            questionfile.close()
#        except IOError:
#            error = "Could not read from exam file."
#            return render(self.request, self.template_name, {'form': form, 'error': error, 'object': self.object})
#        return self.render_to_response(self.get_context_data(form=form))
        
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.slug,))