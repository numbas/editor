#Copyright 2012 Newcastle University
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import json
import traceback

from django.conf import settings
from django.core.urlresolvers import reverse
from django.forms.models import model_to_dict
from django.http import Http404, HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django.template import loader, Context
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from editor.forms import NewQuestionForm, QuestionForm
from editor.models import Question
from editor.views.generic import CompileObject, PreviewView, ZipView, SourceView

from examparser import ExamParser, ParseError

class QuestionPreviewView(PreviewView):
    
    """Compile question as a preview and return its URL."""
    
    model = Question
    
    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
        except (Question.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.preview(q)

class QuestionZipView(ZipView):

    """Compile a question as a SCORM package and return the .zip file"""

    model = Question

    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
            scorm = 'scorm' in request.GET
        except (Question.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.download(q,scorm)

class QuestionSourceView(SourceView):

    """Compile a question as a SCORM package and return the .zip file"""

    model = Question

    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
        except (Question.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.source(q)

class QuestionCreateView(CreateView):
    
    """Create a question."""
    
    model = Question
    form_class = NewQuestionForm
    template_name = 'question/new.html'
    
    def form_valid(self, form):
        self.object = form.save()
        return HttpResponseRedirect(self.get_success_url())
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk,
                                              self.object.slug,))
    
class QuestionUploadView(CreateView):
    
    """Upload a .exam file representing a question"""

    model = Question

    def post(self, request, *args, **kwargs):
        self.object = Question(content=request.POST['content'])
        self.object.save()

        return HttpResponseRedirect(self.get_success_url())

    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk, self.object.slug) )

class QuestionDeleteView(DeleteView):
    
    """Delete a question."""
    
    model = Question
    template_name = 'question/delete.html'
    
    def get_success_url(self):
        return reverse('question_index')


class QuestionUpdateView(UpdateView):
    
    """Edit a question."""
    
    model = Question
    template_name = 'question/edit.html'
    
    def post(self, request, *args, **kwargs):
        data = json.loads(request.POST['json'])
        data['tags'] = json.dumps(data['tags'])

        self.object = self.get_object()
        question_form = QuestionForm(data, instance=self.object)
        if question_form.is_valid():
            return self.form_valid(question_form)
        else:
            return self.form_invalid(question_form)
        
    def form_valid(self, form):
        self.object = form.save()
        status = {"result": "success"}
        return HttpResponse(json.dumps(status), content_type='application/json')
        
    def form_invalid(self, form):
        status = {
            "result": "error",
            "message": "Something went wrong...",
            "traceback": traceback.format_exc(),}
        return HttpResponseServerError(json.dumps(status),
                                       content_type='application/json')
    
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
    
