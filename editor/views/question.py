import json
import uuid

from django.conf import settings
from django.core.urlresolvers import reverse
from django.forms.models import model_to_dict
from django.http import Http404, HttpResponse, HttpResponseServerError
from django.template import loader, Context
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from editor.forms import NewQuestionForm
from editor.models import Question
from editor.views.generic import SaveContentMixin, Preview

class QuestionPreviewView(DetailView, Preview):
    
    """Question preview."""
    
    model = Question
    
    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            try:
                q = self.get_object()
                q.content = request.POST['content']
                t = loader.get_template('temporary.question')
                c = Context({
                    'question': q
                })
            except Question.DoesNotExist:
                message = 'No such question exists in the database.'
                return HttpResponseServerError(message)
            return self.preview_compile(t, c, q.filename)
        raise Http404
    
    def get(self, request, *args, **kwargs):
        raise Http404
    

class QuestionCreateView(CreateView, SaveContentMixin):
    
    """Create a question."""
    
    model = Question
    form_class = NewQuestionForm
    template_name = 'question/new.html'
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        self.object.content = "{name: %s}" % self.object.name
        self.object.filename = str(uuid.uuid4())
        return self.write_content(settings.GLOBAL_SETTINGS['QUESTION_SUBDIR'],
                                  form)
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk,self.object.slug,))
    
    
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
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk,self.object.slug))
    
    
class QuestionListView(ListView):
    
    """List of questions."""
    
    model=Question
    template_name='question/index.html'
    
    
class QuestionSearchView(ListView):
    
    """Search questions."""
    
    model=Question
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps(context),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404
    
    def get_queryset(self):
        search_term = self.request.GET['q']
        question_objects = Question.objects.filter(name__icontains=search_term)
        return [{'id':q.id, 'name':q.name} for q in question_objects]
    
