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

from django.core.urlresolvers import reverse
from django.db.models import Q
from django.forms import model_to_dict
from django.http import Http404, HttpResponse, HttpResponseRedirect, HttpResponseServerError, HttpResponseForbidden
from django.shortcuts import redirect
from django.views.generic import CreateView, DeleteView, ListView, UpdateView, View
from django.views.generic.detail import SingleObjectMixin

from editor.forms import NewQuestionForm, QuestionForm
from editor.models import Question,Extension,Image
from editor.views.generic import PreviewView, ZipView, SourceView
from editor.views.user import find_users

from accounts.models import UserProfile

from examparser import ExamParser, ParseError, printdata

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
            try:
                profile = UserProfile.objects.get(user=request.user)
                q.locale = profile.language
            except Exception:
                pass

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
            try:
                profile = UserProfile.objects.get(user=request.user)
                q.locale = profile.language
            except Exception:
                pass

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

    def get(self, request, *args, **kwargs):
        self.object = Question()
        self.object.author = request.user
        self.object.save()
        return redirect(self.get_success_url())

    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk,
                                              self.object.slug,))
 
 
class QuestionUploadView(CreateView):
    
    """Upload a .exam file representing a question"""

    model = Question

    def post(self, request, *args, **kwargs):
        content = request.FILES['file'].read()

        data = ExamParser().parse(content)
        self.qs = []
        for q in data['questions']:
            qo = Question(
                content = printdata(q), 
                author = self.request.user
            )
            qo.save()
            self.qs.append(qo)

        return HttpResponseRedirect(self.get_success_url())

    def get_success_url(self):
        if len(self.qs)==1:
            q = self.qs[0]
            return reverse('question_edit', args=(q.pk, q.slug) )
        else:
            return reverse('question_index')


class QuestionCopyView(View, SingleObjectMixin):

    """ Copy a question and redirect to its edit page. """

    model = Question

    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
            q2 = deepcopy(q)
            q2.id = None
            q2.author = request.user
            q2.save()
            q2.set_name("%s's copy of %s" % (q2.author.first_name,q.name))
            q2.resources = q.resources.all()
            q2.save()
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
        return 'question/editable.html' if self.object.can_be_edited_by(self.request.user) else 'question/noneditable.html'


    def post(self, request, *args, **kwargs):
        self.user = request.user
        self.object = self.get_object()

        if not self.object.can_be_edited_by(self.user):
            return HttpResponseForbidden()

        self.data = json.loads(request.POST['json'])
        self.resources = self.data['resources']
        del self.data['resources']
        question_form = QuestionForm(self.data, instance=self.object)

        if question_form.is_valid():
            return self.form_valid(question_form)
        else:
            return self.form_invalid(question_form)
        
    def form_valid(self, form):
        self.object = form.save(commit=False)
        self.object.metadata = json.dumps(self.object.metadata)

        self.object.edit_user = self.user

        resource_pks = [res['pk'] for res in self.resources]
        self.object.resources = Image.objects.filter(pk__in=resource_pks)

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
        context['editable'] = self.object.can_be_edited_by(self.request.user)
        context['navtab'] = 'questions'
        return context
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk,self.object.slug))
    
    
class QuestionListView(ListView):
    
    """List of questions."""
    
    model=Question
    template_name='question/index.html'

    def get_context_data(self, **kwargs):
        context = super(QuestionListView, self).get_context_data(**kwargs)
        context['progresses'] = Question.PROGRESS_CHOICES
        context['navtab'] = 'questions'
        return context
    
    
class QuestionSearchView(ListView):
    
    """Search questions."""
    
    model=Question
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps({'object_list':context['object_list'],'page':context['page'],'id':context['id']}),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404

    def get_context_data(self, **kwargs):
        context = super(QuestionSearchView,self).get_context_data(**kwargs)
        try:
            context['page'] = self.request.GET['page']
        except KeyError:
            context['page'] = 1
            pass
        try:
            context['id'] = self.request.GET['id']
        except KeyError:
            pass
        return context
    
    def get_queryset(self):
        questions = Question.objects.all()
        try:
            search_term = self.request.GET['q']
            questions = questions.filter(Q(name__icontains=search_term) | Q(metadata__icontains=search_term) | Q(tags__name__istartswith=search_term)).distinct()
        except KeyError:
            pass

        try:
            mine = self.request.GET['mine'] == 'true'
            if mine:
                questions = questions.filter(author=self.request.user.pk)
        except KeyError:
            mine = False

        try:
            if not mine:
                author_term = self.request.GET['author']
                authors = find_users(author_term)
                if len(authors) == 0:
                    return []
                else:
                    questions = questions.filter(author__in=authors).distinct()
        except KeyError:
            pass

        try:
            progress = self.request.GET['progress']
            if progress!='':
                questions = questions.filter(progress=progress)
        except KeyError:
            pass

        try:
            descending = '-' if self.request.GET['descending']=='true' else ''
            order_by = self.request.GET['order_by']
            if order_by == 'name':
                questions = questions.order_by(descending+'slug')
            elif order_by == 'author':
                questions = questions.order_by(descending+'author__first_name',descending+'author__last_name')
            elif order_by == 'progress':
                questions = questions.order_by(descending+'progress')
            elif order_by == 'last_modified':
                questions = questions.order_by(descending+'last_modified')
        except KeyError:
            pass

        return [q.summary(user=self.request.user) for q in questions]
    
