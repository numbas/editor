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
import uuid

from django.conf import settings
from django.core.urlresolvers import reverse
from django.http import Http404, HttpResponseServerError
from django.forms.models import model_to_dict
from django.shortcuts import render
from django.template import loader, Context
from django.views.generic import CreateView, DeleteView, DetailView, FormView, ListView, UpdateView

from editor.forms import ExamForm, NewExamForm, ExamSearchForm
from editor.models import Exam, Question
from editor.views.generic import SaveContentMixin, Preview

class ExamPreviewView(DetailView, Preview):
    
    """Exam preview."""
    
    model = Exam
    
    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            try:
                e = self.get_object()
                request.JSON = json.loads(request.POST['json'])
                questions = [
                    Question.objects.get(
                    pk=q['id']) for q in request.JSON['questions']]
                e.content = request.JSON['content'].rstrip()[:-1]
                t = loader.get_template('temporary.exam')
                c = Context({
                    'exam': e,
                    'questions': questions
                })
            except Exam.DoesNotExist:
                message = 'No such exam exists in the database.'
                return HttpResponseServerError(message)
            return self.preview_compile(t, c, e.filename)
        raise Http404
    
    def get(self, request, *args, **kwargs):
        raise Http404
    
    
class ExamCreateView(CreateView, SaveContentMixin):
    
    """Create an exam."""
    
    model = Exam
    form_class = NewExamForm
    template_name = 'exam/new.html'
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        self.object.content = "{name: %s}" % self.object.name
        self.object.filename = str(uuid.uuid4())
        return self.write_content(settings.GLOBAL_SETTINGS['EXAM_SUBDIR'],
                                  form)
    
    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk,self.object.slug,))
    
        
class ExamDeleteView(DeleteView):
    
    """Delete an exam."""
    
    model = Exam
    template_name = 'exam/delete.html'
    
    def get_success_url(self):
        return reverse('exam_index')
    
    
class ExamUpdateView(UpdateView, SaveContentMixin):
    
    """Edit an exam."""
    
    model = Exam
    template_name = 'exam/edit.html'
    
    def post(self, request, *args, **kwargs):
        request.JSON = json.loads(request.POST['json'])
        self.questions = request.JSON['questions']
        del request.JSON['questions']
        self.object = self.get_object()
        exam_form = ExamForm(request.JSON, instance=self.object)
        if exam_form.is_valid():
            return self.form_valid(exam_form)
        else:
            return self.form_invalid(exam_form)
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        return self.write_content(settings.GLOBAL_SETTINGS['EXAM_SUBDIR'],
                                   form)
        
    def form_invalid(self, form):
        status = {
            "result": "error",
            "message": "Something went wrong...",
            "traceback": traceback.format_exc(),}
        return HttpResponseServerError(json.dumps(status),
                                       content_type='application/json')
        
    def get_context_data(self, **kwargs):
        context = super(ExamUpdateView, self).get_context_data(**kwargs)
        exam_dict = model_to_dict(self.object)
        exam_dict['questions'] = [
            {'id': q.id, 'name':q.name} for q in self.object.get_questions()]
        context['exam_JSON'] = json.dumps(exam_dict)
#        context['exam_JSON'] = serializers.serialize('json', [self.object])
        return context
#    
    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk,self.object.slug,))
    
    
class ExamSearchView(FormView):
    
    """Search for an exam."""
    
    form_class = ExamSearchForm
    template_name = 'exam/search.html'
    
    def form_valid(self, form):
        exam_list = Exam.objects.filter(
            name__icontains=form.cleaned_data['name'])
        return render(self.request, 'exam/index.html', {'exam_list': exam_list})
    
    
class ExamListView(ListView):
    model=Exam
    template_name='exam/index.html'

#    def get_queryset(self):
#        if 'exam' in self.kwargs:
#            print "hello"
#        return Exam.objects.all()
