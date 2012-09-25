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

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.forms.models import model_to_dict
from django.http import Http404, HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django.shortcuts import render,redirect
from django.utils.decorators import method_decorator
from django.views.generic import CreateView, DeleteView, FormView, ListView, UpdateView, View
from django.views.generic.detail import SingleObjectMixin

from editor.forms import ExamForm, NewExamForm, ExamSearchForm
from editor.models import Exam, Question
from editor.views.generic import PreviewView, ZipView, SourceView
from editor.views.user import find_users

from examparser import ExamParser, ParseError, printdata

class ExamPreviewView(PreviewView):
    
    """Compile an exam as a preview and return its URL."""
    
    model = Exam
    operation = None
    
    def get(self, request, *args, **kwargs):
        try:
            e = self.get_object()
        except (Exam.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.preview(e)


class ExamZipView(ZipView):

    """Compile an exam as a SCORM package and return the .zip file"""

    model = Exam
    operation = None

    def get(self, request, *args, **kwargs):
        try:
            e = self.get_object()
            scorm = 'scorm' in request.GET
        except (Exam.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.download(e,scorm)


class ExamSourceView(SourceView):

    """Return the .exam version of an exam"""

    model = Exam
    operation = None

    def get(self, request, *args, **kwargs):
        try:
            e = self.get_object()
        except (Exam.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.source(e)
    
    
class ExamCreateView(CreateView):
    
    """Create an exam."""
    
    model = Exam
    form_class = NewExamForm

    def get(self, request, *args, **kwargs):
        self.object = Exam()
        self.object.author = request.user
        self.object.save()
        return redirect(self.get_success_url())

    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk,
                                          self.object.slug,))
    
    
class ExamUploadView(CreateView):
    
    """Upload a .exam file representing an exam"""

    model = Exam

    def post(self, request, *args, **kwargs):
        content = request.FILES['file'].read()
        self.object = Exam(content=content)

        if not self.object.content:
            return

        self.object.author = self.request.user
        self.object.save()

        data = ExamParser().parse(self.object.content)

        qs = []
        for q in data['questions']:
            qo = Question(
                content = printdata(q), 
                author = self.object.author
            )
            qo.save()
            qs.append(qo)
        self.object.set_questions(qs)

        return HttpResponseRedirect(self.get_success_url())

    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk, self.object.slug) )


class ExamCopyView(View, SingleObjectMixin):

    """ Copy an exam and redirect to to the copy's edit page. """

    model = Exam

    def get(self, request, *args, **kwargs):
        try:
            e = self.get_object()
            e2 = deepcopy(e)
            e2.id = None
            e2.filename = None
            e2.author = request.user
            e2.save()
            e2.set_questions(e.questions.all())
            e2.set_name("%s's copy of %s" % (e2.author.first_name,e.name))
        except (Exam.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return HttpResponseRedirect(reverse('exam_edit', args=(e2.pk,e2.slug)))


class ExamDeleteView(DeleteView):
    
    """Delete an exam."""
    
    model = Exam
    template_name = 'exam/delete.html'
    
    def get_success_url(self):
        return reverse('exam_index')
    
    
class ExamUpdateView(UpdateView):
    
    """Edit an exam."""
    
    model = Exam
    template_name = 'exam/edit.html'
    
#    @method_decorator(login_required)
#    def dispatch(self, *args, **kwargs):
#        return super(ExamUpdateView, self).dispatch(*args, **kwargs)
    
    def get_template_names(self):
        self.object = self.get_object()
        return 'exam/editable.html' if self.object.can_be_edited_by(self.request.user) else 'exam/noneditable.html'

    def post(self, request, *args, **kwargs):
        self.user = request.user

        self.object = self.get_object()

        if not self.object.can_be_edited_by(self.user):
            return HttpResponseForbidden()

        data = json.loads(request.POST['json'])

        self.questions = data['questions']
        del data['questions']

        exam_form = ExamForm(data, instance=self.object)

        if exam_form.is_valid():
            return self.form_valid(exam_form)
        else:
            return self.form_invalid(exam_form)
    
    def form_valid(self, form):
        self.object = form.save(commit=False)

        self.object.set_questions(question_ids=self.questions)
        self.object.edit_user = self.user

        self.object.save()

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
        context = super(ExamUpdateView, self).get_context_data(**kwargs)
        exam_dict = model_to_dict(self.object)
        exam_dict['questions'] = [q.summary() for q in self.object.get_questions()]
        context['exam_JSON'] = json.dumps(exam_dict)
        context['themes'] = settings.GLOBAL_SETTINGS['NUMBAS_THEMES']
        context['editable'] = self.object.can_be_edited_by(self.request.user)
        return context

    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk,self.object.slug,))
    
    
class ExamSearchView(ListView):
    
    """Search exams."""
    
    model=Exam

    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps(context),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404
    
    def get_context_data(self, **kwargs):
        context = super(ExamSearchView,self).get_context_data(**kwargs)
        try:
            context['page'] = self.request.GET['page']
        except KeyError:
            pass
        try:
            context['id'] = self.request.GET['id']
        except KeyError:
            pass

        return context

    def get_queryset(self):
        exams = Exam.objects.all()
        try:
            search_term = self.request.GET['q']
            exams = exams.filter(Q(name__icontains=search_term)).distinct()
        except KeyError:
            pass

        try:
            mine = self.request.GET['mine'] == 'true'
            if mine:
                exams = exams.filter(author=self.request.user.pk)
        except KeyError:
            mine = False

        try:
            if not mine:
                author_term = self.request.GET['author']
                authors = find_users(author_term)
                exams = exams.filter(author__in=authors).distinct()
        except KeyError:
            pass

        return [q.summary(user=self.request.user) for q in exams]

    
    
class ExamListView(ListView):
    model=Exam
    template_name='exam/index.html'
