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

import time
import calendar

from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.db import transaction
from django.forms import model_to_dict
from django.http import Http404, HttpResponse
from django import http
from django.shortcuts import redirect
from django.views import generic
from django.views.generic.detail import SingleObjectMixin
from django.views.generic.edit import FormMixin
from django.template.loader import render_to_string
from django.conf import settings
from django.core import serializers

import reversion

from django_tables2.config import RequestConfig

from editor.forms import NewQuestionForm, QuestionForm, QuestionSetAccessForm, QuestionSearchForm, QuestionHighlightForm
from editor.models import Question,Extension,Image,QuestionAccess,QuestionHighlight,EditorTag,Licence
import editor.views.generic
from editor.views.errors import forbidden
from editor.views.user import find_users
from editor.tables import QuestionTable, QuestionHighlightTable
from editor.views.version import version_json

from accounts.models import UserProfile

from numbasobject import NumbasObject

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

        exam_object = NumbasObject(content)
        self.qs = []
        for q in exam_object.data['questions']:
            question = NumbasObject(data=q,version=exam_object.version)
            qo = Question(
                content = str(question), 
                author = self.request.user
            )
            qo.save()
            extensions = Extension.objects.filter(location__in=exam_object.data['extensions'])
            qo.extensions.add(*extensions)
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
            if not q.can_be_copied_by(request.user):
                return http.HttpResponseForbidden("You may not copy this question.")
            q2 = deepcopy(q)
            q2.id = None
            q2.author = request.user
            q2.save()
            q2.set_name("%s's copy of %s" % (q2.author.first_name,q.name))
            q2.copy_of = q
            q2.resources = q.resources.all()
            q2.extensions = q.extensions.all()
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
        if self.object.can_be_deleted_by(self.request.user):
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
        self.can_delete = obj.can_be_deleted_by(self.request.user)
        self.can_copy = obj.can_be_copied_by(self.request.user)
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

        with transaction.atomic(), reversion.create_revision():
            self.object = form.save(commit=False)
            self.object.metadata = json.dumps(self.object.metadata)
            self.object.extensions.clear()
            self.object.extensions.add(*form.cleaned_data['extensions'])

            self.object.edit_user = self.user

            resource_pks = [res['pk'] for res in self.resources]
            self.object.resources = Image.objects.filter(pk__in=resource_pks)

            self.object.save()

            reversion.set_user(self.user)

        version = reversion.get_for_object(self.object)[0]

        status = {"result": "success", "url": self.get_success_url(), "version": version_json(version,self.user)}
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
        self.object.get_parsed_content()

        extensions = Extension.objects.filter(public=True) | self.object.extensions.all()
        if not self.request.user.is_anonymous():
            extensions |= Extension.objects.filter(author=self.request.user) 

        context['extensions'] = [e.as_json() for e in Extension.objects.all()]

        context['editable'] = self.editable
        context['can_delete'] = self.can_delete
        context['can_copy'] = self.can_copy
        context['navtab'] = 'questions'

        if not self.request.user.is_anonymous():
            context['starred'] = self.request.user.userprofile.favourite_questions.filter(pk=self.object.pk).exists()
        else:
            context['starred'] = False
    
        context['access_rights'] = [{'id': qa.user.pk, 'name': qa.user.get_full_name(), 'access_level': qa.access} for qa in QuestionAccess.objects.filter(question=self.object)]

        versions = [version_json(v,self.user) for v in reversion.get_for_object(self.object)]

        licences = [licence.as_json() for licence in Licence.objects.all()]

        question_json = context['question_json'] = {
            'questionJSON': json.loads(self.object.as_json()),
            'editable': self.editable,

            'licences': licences,

            'numbasExtensions': context['extensions'],

            'previewURL': reverse('question_preview', args=(self.object.pk, self.object.slug)),
            'previewWindow': str(calendar.timegm(time.gmtime())),
            'starred': context['starred'],

            'versions': versions,
        }
        if self.editable:
            question_json['public_access'] = self.object.public_access
            question_json['access_rights'] = context['access_rights']
            context['versions'] = reversion.get_for_object(self.object)

        part_type_path = 'question/part_types/'+('editable' if self.editable else 'noneditable')
        context['partNames'] = [
            ( name, '{}/{}.html'.format(part_type_path,name) ) 
            for name in 
            'jme','gapfill','numberentry','patternmatch','1_n_2','m_n_2','m_n_x','matrix'
        ]

        return context
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk,self.object.slug))

class RevertView(generic.UpdateView):
    model = Question
    
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.question = self.get_object()

        if not self.question.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        try:
            self.version = reversion.models.Version.objects.get(pk=kwargs['version'])
        except ObjectDoesNotExist:
            raise Http404

        self.version.revision.revert()

        return redirect(reverse('question_edit', args=(self.question.pk,self.question.slug)))

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
            profile = self.request.user.userprofile
            context['favourites'] = profile.favourite_questions.all()
            context['recents'] = Question.objects.filter(author=self.request.user).order_by('-last_modified')
        
        context['highlights'] = QuestionHighlight.objects.all().order_by('-date')

        context['navtab'] = 'questions'

        tags = list(EditorTag.objects.filter(official=True))
        tags.sort(key=EditorTag.used_count)
        numtags = len(tags)
        #mad magic to get approximate quartiles
        tag_counts = [(t,(4*s)//numtags) for t,s in zip(tags,range(numtags))]
        tag_counts.sort(key=lambda x:x[0].name.upper())

        context['officialtags'] = tag_counts

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

        questions = Question.objects.viewable_by(self.request.user)

        search_term = form.cleaned_data.get('query')
        if search_term:
            questions = questions.filter(Q(name__icontains=search_term) | Q(metadata__icontains=search_term) | Q(tags__name__istartswith=search_term)).distinct()

        author = form.cleaned_data.get('author')
        if author:
            questions = questions.filter(author__in=find_users(author))

        tags = form.cleaned_data.get('tags')
        if len(tags):
            for tag in tags:
                questions = questions.filter(tags__name__in=[tag])

        usage = form.cleaned_data.get('usage')
        usage_filters = {
            "any": Q(),
            "reuse": Q(licence__can_reuse=True),
            "modify": Q(licence__can_reuse=True, licence__can_modify=True),
            "sell": Q(licence__can_reuse=True, licence__can_sell=True),
            "modify-sell": Q(licence__can_reuse=True, licence__can_modify=True, licence__can_sell=True),
        }
        if usage in usage_filters:
            questions = questions.filter(usage_filters[usage])

        filter_copies = form.cleaned_data.get('filter_copies')
        if filter_copies:
            questions = questions.filter(copy_of=None)

        questions = questions.distinct()

        return questions
        
    def get_context_data(self, **kwargs):
        context = super(SearchView, self).get_context_data(**kwargs)
        context['form'] = self.form

        return context

class FavouritesView(ListView):
    template_name = 'question/favourites.html'

    def get_queryset(self):
        return self.request.user.userprofile.favourite_questions.all()

class HighlightsView(ListView):
    model = QuestionHighlight
    template_name = 'question/highlights.html'
    table_class = QuestionHighlightTable
    per_page = 5

    def get_queryset(self):
        highlights = QuestionHighlight.objects.all()
        return highlights

class RecentQuestionsView(ListView):
    def get_queryset(self):
        return [q.summary() for q in Question.objects.filter(author=self.request.user).order_by('-last_modified')]

    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps(context['object_list'][:10]),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404

class JSONSearchView(SearchView):
    
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

        profile = request.user.userprofile
        starred = request.POST.get('starred') == 'true'
        if starred:
            profile.favourite_questions.add(question)
        else:
            profile.favourite_questions.remove(question)
        profile.save()

        return HttpResponse('ok!')

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')
