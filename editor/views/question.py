from django.conf import settings
from django.core.urlresolvers import reverse
from django.views.generic import CreateView, UpdateView
from editor.models import Question
from editor.views.generic import SaveContent
import os
import uuid

class QuestionCreateView(CreateView, SaveContent):
    model = Question
    template_name = 'question/new.html'
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        self.object.filename = str(uuid.uuid4())
        return self.write_content(form, settings.GLOBAL_SETTINGS['QUESTION_SUBDIR'])
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.slug,))


class QuestionUpdateView(UpdateView, SaveContent):
    model = Question
    template_name = 'question/edit.html'
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        return self.write_content(form, settings.GLOBAL_SETTINGS['QUESTION_SUBDIR'])
    
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        try:
            questionfile = open(os.path.join(settings.GLOBAL_SETTINGS['REPO_PATH'], settings.GLOBAL_SETTINGS['QUESTION_SUBDIR'], self.object.filename), 'r')
            self.object.content = questionfile.read()
            questionfile.close()
        except IOError:
            self.object.content = "Could not read from question file."
            
        form_class = self.get_form_class()
        form = self.get_form(form_class)
        return self.render_to_response(self.get_context_data(form=form))
        
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.slug,))