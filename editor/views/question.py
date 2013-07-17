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

from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.forms import model_to_dict
from django.http import Http404, HttpResponse
from django import http
from django.shortcuts import redirect
from django.views import generic
from django.views.generic.detail import SingleObjectMixin
from django.views.generic.edit import FormMixin
from django.template.loader import render_to_string

from django_tables2.config import RequestConfig

from editor.forms import NewQuestionForm, QuestionForm, QuestionSetAccessForm, QuestionSearchForm, QuestionHighlightForm
from editor.models import Question,Extension,Image,QuestionAccess,QuestionHighlight
import editor.views.generic
from editor.views.errors import forbidden
from editor.views.user import find_users
from editor.tables import QuestionTable, QuestionHighlightTable

from accounts.models import UserProfile

from examparser import ExamParser, ParseError, printdata

class PreviewView(editor.views.generic.PreviewView):
    
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
            return http.HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            try:
                profile = UserProfile.objects.get(user=request.user)
                q.locale = profile.language
            except Exception:
                pass

            return self.preview(q)


class ZipView(editor.views.generic.ZipView):

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
            return http.HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            try:
                profile = UserProfile.objects.get(user=request.user)
                q.locale = profile.language
            except Exception:
                pass

            return self.download(q,scorm)


class SourceView(editor.views.generic.SourceView):

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
            return http.HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.source(q)


class CreateView(generic.CreateView):
    
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
 
 
class UploadView(generic.CreateView):
    
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

        return redirect(self.get_success_url())

    def get_success_url(self):
        if len(self.qs)==1:
            q = self.qs[0]
            return reverse('question_edit', args=(q.pk, q.slug) )
        else:
            return reverse('question_index')


class CopyView(generic.View, SingleObjectMixin):

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
            return http.HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            if self.request.is_ajax():
                return HttpResponse(json.dumps(q2.summary()),content_type='application/json')
            else:
                return redirect(reverse('question_edit', args=(q2.pk,q2.slug)))


class DeleteView(generic.DeleteView):
    
    """Delete a question."""
    
    model = Question
    template_name = 'question/delete.html'
    
    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.can_be_edited_by(self.request.user):
            self.object.delete()
            return http.HttpResponseRedirect(self.get_success_url())
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
    
    def get_success_url(self):
        return reverse('question_index')


class UpdateView(generic.UpdateView):
    
    """Edit a question or view as non-editable if not author."""
    
    model = Question
    
    def get_object(self):
        obj = super(UpdateView,self).get_object()
        self.editable = obj.can_be_edited_by(self.request.user)
        return obj

    def get_template_names(self):
        self.object = self.get_object()
        return 'question/editable.html' if self.editable else 'question/noneditable.html'


    def post(self, request, *args, **kwargs):
        self.user = request.user
        self.object = self.get_object()

        if not self.object.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        self.data = json.loads(request.POST['json'])
        self.resources = self.data['resources']
        del self.data['resources']
        question_form = QuestionForm(self.data, instance=self.object)

        if question_form.is_valid():
            return self.form_valid(question_form)
        else:
            return self.form_invalid(question_form)
        
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.object = self.get_object()
        if not self.object.can_be_viewed_by(request.user):
            return forbidden(request)
        else:
            return super(UpdateView,self).get(request,*args,**kwargs)

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
        return http.HttpResponseServerError(json.dumps(status),
                                       content_type='application/json')
    
    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context['extensions'] = [model_to_dict(e) for e in Extension.objects.all()]
        context['editable'] = self.editable
        context['navtab'] = 'questions'
        if not self.request.user.is_anonymous():
            context['starred'] = self.request.user.get_profile().favourite_questions.filter(pk=self.object.pk).exists()
        else:
            context['starred'] = False
    
        context['access_rights'] = [{'id': qa.user.pk, 'name': qa.user.get_full_name(), 'access_level': qa.access} for qa in QuestionAccess.objects.filter(question=self.object)]

        return context
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk,self.object.slug))

class HighlightView(generic.FormView):
    template_name = 'question/highlight.html'
    form_class = QuestionHighlightForm

    def get_initial(self):
        initial = super(HighlightView,self).get_initial()

        self.question = Question.objects.get(pk=self.kwargs.get('pk'))

        try:
            qh = QuestionHighlight.objects.get(question=self.question, picked_by=self.request.user)
            initial['note'] = qh.note
        except ObjectDoesNotExist:
            initial['note'] = u''

        return initial

    def form_valid(self, form):
        note = form.cleaned_data.get('note')

        self.object, new = QuestionHighlight.objects.get_or_create(question=self.question, picked_by=self.request.user)
        self.object.note = note
        self.object.save()

        return super(HighlightView,self).form_valid(form)

    def get_success_url(self):
        return reverse('question_edit', args=(self.question.pk,self.question.slug))

    def get_context_data(self, **kwargs):
        context = super(HighlightView, self).get_context_data(**kwargs)
        
        context['question'] = self.question

        return context

class IndexView(generic.TemplateView):

    template_name = 'question/index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)

        if self.request.user.is_authenticated():
            profile = self.request.user.get_profile()
            context['favourites'] = profile.favourite_questions.all()
        
        context['highlights'] = QuestionHighlight.objects.all().order_by('-date')

        context['navtab'] = 'questions'

        return context
    
class ListView(generic.ListView):
    
    """List of questions."""
    model = Question
    table_class = QuestionTable
    per_page = 10

    def make_table(self):
        config = RequestConfig(self.request, paginate={'per_page': self.per_page})
        results = self.table_class(self.object_list)
        config.configure(results)

        return results

    def get_context_data(self, **kwargs):
        context = super(ListView, self).get_context_data(**kwargs)
        context['navtab'] = 'questions'
        context['results'] = self.make_table()

        return context
    
class SearchView(ListView):
    template_name = 'question/search.html'

    def get_queryset(self):
        form = self.form = QuestionSearchForm(self.request.GET)
        form.is_valid()

        questions = Question.objects.all()

        search_term = form.cleaned_data.get('query')
        if search_term:
            questions = questions.filter(Q(name__icontains=search_term) | Q(metadata__icontains=search_term) | Q(tags__name__istartswith=search_term)).distinct()

        author = form.cleaned_data.get('author')
        if author:
            questions = questions.filter(author__in=find_users(author))

        progress = form.cleaned_data.get('progress')
        if progress:
            questions = questions.filter(progress=progress)

        tags = form.cleaned_data.get('tags')
        if len(tags):
            for tag in tags:
                questions = questions.filter(tags__name__in=[tag])

        questions = [q for q in questions if q.can_be_viewed_by(self.request.user)]

        return questions
        
    def get_context_data(self, **kwargs):
        context = super(SearchView, self).get_context_data(**kwargs)
        context['progresses'] = Question.PROGRESS_CHOICES
        context['form'] = self.form

        return context

class FavouritesView(ListView):
    template_name = 'question/favourites.html'

    def get_queryset(self):
        return self.request.user.get_profile().favourite_questions.all()

class HighlightsView(ListView):
    model = QuestionHighlight
    template_name = 'question/highlights.html'
    table_class = QuestionHighlightTable
    per_page = 5

    def get_queryset(self):
        highlights = QuestionHighlight.objects.all()
        return highlights

class JSONSearchView(ListView):
    
    """Search questions."""
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps({'object_list':context['object_list'],'page':context['page'],'id':context['id']}),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404

    def get_queryset(self):
        questions = super(JSONSearchView,self).get_queryset()
        return [q.summary() for q in questions]

    def get_context_data(self, **kwargs):
        context = ListView.get_context_data(self,**kwargs)
        context['page'] = self.request.GET.get('page',1)
        context['id'] = self.request.GET.get('id',None)
        return context
    
class SetAccessView(generic.UpdateView):
    model = Question
    form_class = QuestionSetAccessForm

    def form_valid(self, form):
        question = self.get_object()

        if not question.can_be_edited_by(self.request.user):
            return http.HttpResponseForbidden("You don't have permission to edit this question.")

        self.object = form.save()

        return HttpResponse('ok!')

    def form_invalid(self,form):
        return HttpResponse(form.errors.as_text())

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class SetStarView(generic.UpdateView):
    model = Question

    def post(self, request, *args, **kwargs):
        question = self.get_object()

        profile = request.user.get_profile()
        starred = request.POST.get('starred') == 'true'
        print(starred)
        if starred:
            profile.favourite_questions.add(question)
        else:
            profile.favourite_questions.remove(question)
        profile.save()

        return HttpResponse('ok!')

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')
