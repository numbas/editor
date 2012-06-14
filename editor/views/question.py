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
from copy import deepcopy

from django.db.models import Q
from django.core.urlresolvers import reverse
from django.http import Http404, HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django.views.generic import CreateView, DeleteView, ListView, UpdateView, View
from django.views.generic.detail import SingleObjectMixin
from django.forms import model_to_dict

from editor.forms import NewQuestionForm, QuestionForm
from editor.models import Question,Extension
from editor.views.generic import PreviewView, ZipView, SourceView

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
        content = request.FILES['file'].read()
        self.object = Question(content=content)
        self.object.author = self.request.user
        self.object.save()

        return HttpResponseRedirect(self.get_success_url())

    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk, self.object.slug) )


class QuestionCopyView(View, SingleObjectMixin):

    """ Copy a question and redirect to its edit page. """

    model = Question

    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
            q2 = deepcopy(q)
            q2.id = None
            q2.filename = None
            q2.author = request.user
            q2.save()
            q2.set_name("%s's copy of %s" % (q2.author.first_name,q.name))
        except (Question.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return HttpResponseRedirect(reverse('question_edit', args=(q2.pk,q2.slug)))


class QuestionDeleteView(DeleteView):
    
    """Delete a question."""
    
    model = Question
    template_name = 'question/delete.html'
    
    def get_success_url(self):
        return reverse('question_index')


class QuestionUpdateView(UpdateView):
    
    """Edit a question or view as non-editable if not author."""
    
    model = Question
    
    def get_template_names(self):
        self.object = self.get_object()
        if self.request.user == self.object.author or self.request.user.is_superuser:
            return 'question/editable.html'
        else:
            return 'question/noneditable.html'

    def post(self, request, *args, **kwargs):
        self.data = json.loads(request.POST['json'])
        self.user = request.user

        self.object = self.get_object()
        question_form = QuestionForm(self.data, instance=self.object)

        if question_form.is_valid():
            return self.form_valid(question_form)
        else:
            return self.form_invalid(question_form)
        
    def form_valid(self, form):
        self.object = form.save(commit=False)

        self.object.edit_user = self.user

        self.object.save()

        status = {"result": "success", "url": self.get_success_url()}
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
        context['extensions'] = json.dumps([model_to_dict(e) for e in Extension.objects.all()])
        if self.request.user == self.object.author or self.request.user.is_superuser:
            context['editable'] = True
        else:
            context['editable'] = False
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
        question_objects = Question.objects.filter(Q(name__icontains=search_term) | Q(tags__name__istartswith=search_term))
        return [q.summary() for q in question_objects]
    
