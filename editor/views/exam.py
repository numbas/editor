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
import uuid
import traceback
from copy import deepcopy
import operator

from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.template.loader import render_to_string
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.db import transaction
from django.forms.models import model_to_dict
from django.http import Http404, HttpResponse, HttpResponseRedirect, HttpResponseServerError, HttpResponseForbidden
from django import http
from django.shortcuts import render,redirect
from django.utils.decorators import method_decorator
from django.views import generic
from django.views.generic.detail import SingleObjectMixin
from examparser import ParseError

import reversion

import time
import calendar

from django_tables2.config import RequestConfig

from editor.forms import ExamForm, NewExamForm, ExamSearchForm,ExamSetAccessForm, ExamSearchForm, ExamHighlightForm
from editor.tables import ExamTable, ExamHighlightTable
from editor.models import NewExam, EditorItem, Access
from editor.models import Exam, Question, ExamAccess, ExamHighlight, Theme, Licence, Extension, STAMP_STATUS_CHOICES
import editor.views.editoritem
import editor.views.generic
from editor.views.errors import forbidden
from editor.views.user import find_users
from editor.views.version import version_json
from editor.views.timeline import timeline_json

from numbasobject import NumbasObject

class PreviewView(editor.views.editoritem.PreviewView):
    
    """Compile an exam as a preview and return its URL."""
    
    model = NewExam
    
    def get(self, request, *args, **kwargs):
        try:
            e = self.get_object()
        except (NewExam.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.preview(e.editoritem)


class ZipView(editor.views.editoritem.ZipView):

    """Compile an exam as a SCORM package and return the .zip file"""

    model = NewExam

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
            return self.download(e.editoritem,scorm)


class SourceView(editor.views.editoritem.SourceView):

    """Return the .exam version of an exam"""

    model = NewExam

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
            return self.source(e.editoritem)
    
    
class CreateView(generic.CreateView):
    
    """Create an exam."""
    
    model = NewExam
    form_class = NewExamForm

    def get(self, request, *args, **kwargs):
        ei = EditorItem()
        ei.author = request.user
        ei.name = 'Unititled Exam'
        ei.save()
        self.object = NewExam()
        self.object.editoritem = ei
        self.object.locale = request.user.userprofile.language
        self.object.save()

        return redirect(self.get_success_url())

    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk,
                                          self.object.editoritem.slug,))
    
    
class UploadView(generic.CreateView):
    
    """Upload a .exam file representing an exam"""

    model = Exam

    def post(self, request, *args, **kwargs):
        self.files = request.FILES.getlist('file')
        for file in self.files:
            try:
                content = file.read().decode('utf-8')
            except UnicodeDecodeError:
                return self.not_exam_file()
            self.object = Exam(content=content)

            if not self.object.content:
                return

            self.object.author = self.request.user

            try:
                self.object.save()
            except ParseError:
                return self.not_exam_file()

            exam_object = NumbasObject(source=self.object.content)

            qs = []
            for q in exam_object.data['questions']:
                question = NumbasObject(data=q,version=exam_object.version)
                qo = Question(
                    content = str(question), 
                    author = self.object.author
                )
                qo.save()
                extensions = Extension.objects.filter(location__in=exam_object.data['extensions'])
                qo.extensions.add(*extensions)
                qs.append(qo)
            self.object.set_questions(qs)

        return HttpResponseRedirect(self.get_success_url())

    def not_exam_file(self):
        messages.add_message(self.request, messages.ERROR, render_to_string('notexamfile.html'))
        return HttpResponseRedirect(reverse('exam_index'))

    def get_success_url(self):
        if len(self.files)==1:
            return reverse('exam_edit', args=(self.object.pk, self.object.slug) )
        else:
            return reverse('exam_index')


class CopyView(generic.View, SingleObjectMixin):

    """ Copy an exam and redirect to to the copy's edit page. """

    model = NewExam

    def get(self, request, *args, **kwargs):
        try:
            e = self.get_object()
            if not e.editoritem.can_be_copied_by(request.user):
                return HttpResponseForbidden("You may not copy this exam.")

            e2 = deepcopy(e)
            e2.id = None

            ei2 = e.editoritem.copy()
            ei2.author = request.user
            ei2.set_name("%s's copy of %s" % (e2.editoritem.author.first_name,e.editoritem.name))
            ei2.save()

            e2.editoritem = ei2
            e2.save()

            e2.set_questions(e.questions.all())
            e2.custom_theme = e.custom_theme

        except (Exam.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return HttpResponseRedirect(reverse('exam_edit', args=(e2.pk,e2.editoritem.slug)))


class DeleteView(generic.DeleteView):
    
    """Delete an exam."""
    
    model = NewExam
    template_name = 'exam/delete.html'
    
    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.editoritem.can_be_deleted_by(self.request.user):
            self.object.delete()
            return http.HttpResponseRedirect(self.get_success_url())
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
    
    def get_success_url(self):
        return reverse('editor_index')
    
    
class UpdateView(generic.UpdateView):
    
    """Edit an exam."""
    
    model = NewExam
    template_name = 'exam/edit.html'
    form_class = ExamForm
    
    def get_template_names(self):
        self.object = self.get_object()
        return 'exam/editable.html' if self.object.editoritem.can_be_edited_by(self.request.user) else 'exam/noneditable.html'

    def post(self, request, *args, **kwargs):
        self.user = request.user

        self.object = self.get_object()

        if not self.object.editoritem.can_be_edited_by(self.user):
            return HttpResponseForbidden()

        data = json.loads(request.POST['json'])
        theme = data['theme']
        if theme['custom']:
            data['custom_theme'] = theme['path']
            data['theme'] = ''
        else:
            data['custom_theme'] = None
            data['theme'] = theme['path']

        self.questions = data['questions']
        del data['questions']

        exam_form = ExamForm(data, instance=self.object)

        if exam_form.is_valid():
            return self.form_valid(exam_form)
        else:
            return self.form_invalid(exam_form)
    
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.object = self.get_object()
        if not self.object.editoritem.can_be_viewed_by(request.user):
            return forbidden(request)
        else:
            if not self.user.is_anonymous():
                self.user.notifications.filter(target_object_id=self.object.pk).mark_all_as_read()

            return super(UpdateView,self).get(request,*args,**kwargs)

    def form_valid(self, form):
        with transaction.atomic(), reversion.create_revision():
            self.object = form.save(commit=False)

            self.object.set_questions(question_ids=self.questions)
            self.object.edit_user = self.user

            self.object.save()

            reversion.set_user(self.user)

        version = reversion.get_for_object(self.object)[0]

        status = {"result": "success", "version": version_json(version,self.user)}
        return HttpResponse(json.dumps(status), content_type='application/json')
        
    def form_invalid(self, form):
        status = {
            "result": "error",
            "message": "Something went wrong...",
            "errors": str(form.errors),
            "traceback": traceback.format_exc(),}
        return HttpResponseServerError(json.dumps(status),
                                       content_type='application/json')
        
    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        self.object.editoritem.get_parsed_content()
        exam_dict = self.object.edit_dict()
        if self.request.user.is_authenticated():
            exam_dict['recentQuestions'] = [q.summary() for q in Question.objects.filter(author=self.request.user).order_by('-last_modified')[:10]]
            exam_dict['basketQuestions'] = [q.summary() for q in self.request.user.userprofile.question_basket.all()]
        else:
            exam_dict['recentQuestions'] = []
            exam_dict['basketQuestions'] = []
        context['exam_JSON'] = json.dumps(exam_dict)
        custom_themes = Theme.objects.filter(public=True) | Theme.objects.filter(author=self.object.editoritem.author)
        if self.object.custom_theme:
            custom_themes |= Theme.objects.filter(pk=self.object.custom_theme.pk)
        context['themes'] = [{'name': x[0], 'path': x[1], 'custom': False} for x in settings.GLOBAL_SETTINGS['NUMBAS_THEMES']] + [{'name': theme.name, 'path': theme.pk, 'custom': True} for theme in custom_themes]
        context['locales'] = sorted([{'name': x[0], 'code': x[1]} for x in settings.GLOBAL_SETTINGS['NUMBAS_LOCALES']],key=operator.itemgetter('name'))
        context['editable'] = self.object.editoritem.can_be_edited_by(self.request.user)
        context['can_delete'] = self.object.editoritem.can_be_deleted_by(self.request.user)
        context['can_copy'] = self.object.editoritem.can_be_copied_by(self.request.user)
        context['navtab'] = 'exams'

        if self.request.user.is_authenticated():
            profile = self.request.user.userprofile
        else:
            profile = None

        versions = [version_json(v,self.user) for v in reversion.get_for_object(self.object)]

        licences = [licence.as_json() for licence in Licence.objects.all()]

        editor_json = {
            'editable': self.object.editoritem.can_be_edited_by(self.request.user),
            'examJSON': exam_dict,
            'themes': sorted(context['themes'],key=operator.itemgetter('name')),
            'locales': context['locales'],
            'licences': licences,
            'previewURL': reverse('exam_preview',args=(self.object.pk,self.object.editoritem.slug)),
            'previewWindow': str(calendar.timegm(time.gmtime())),
            'versions': versions,
            'timeline': timeline_json(self.object.editoritem.timeline,self.user),
        }
        if profile:
            editor_json.update({
                'starred': self.object.fans.filter(pk=profile.pk).exists(),
            })

        if editor_json['editable']:
            editor_json.update({
                'public_access': self.object.editoritem.public_access,
                'access_rights': [{'id': ea.user.pk, 'name': ea.user.get_full_name(), 'access_level': ea.access} for ea in Access.objects.filter(item=self.object.editoritem)],
            })
            if profile:
                editor_json.update({
                    'preferred_locale': profile.language,
                })

        context['editor_json'] = editor_json

        context['access_rights'] = [{'id': ea.user.pk, 'name': ea.user.get_full_name(), 'access_level': ea.access} for ea in Access.objects.filter(item=self.object.editoritem)]

        context['versions'] = reversion.get_for_object(self.object)

        context['stamp_choices'] = STAMP_STATUS_CHOICES

        return context

    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk,self.object.slug,))

class RevertView(generic.UpdateView):
    model = Exam
    
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.exam = self.get_object()

        if not self.exam.editoritem.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        try:
            self.version = reversion.models.Version.objects.get(pk=kwargs['version'])
        except ObjectDoesNotExist:
            raise Http404

        self.version.revision.revert()

        return redirect(reverse('exam_edit', args=(self.exam.pk,self.exam.slug)))

    
class HighlightView(generic.FormView):
    template_name = 'exam/highlight.html'
    form_class = ExamHighlightForm

    def get_initial(self):
        initial = super(HighlightView,self).get_initial()

        self.exam = Exam.objects.get(pk=self.kwargs.get('pk'))

        try:
            eh = ExamHighlight.objects.get(exam=self.exam, picked_by=self.request.user)
            initial['note'] = eh.note
        except ObjectDoesNotExist:
            initial['note'] = u''

        return initial

    def form_valid(self, form):
        note = form.cleaned_data.get('note')

        self.object, new = ExamHighlight.objects.get_or_create(exam=self.exam, picked_by=self.request.user)
        self.object.note = note
        self.object.save()

        return super(HighlightView,self).form_valid(form)

    def get_success_url(self):
        return reverse('exam_edit', args=(self.exam.pk,self.exam.slug))

    def get_context_data(self, **kwargs):
        context = super(HighlightView, self).get_context_data(**kwargs)
        
        context['exam'] = self.exam

        return context

class IndexView(generic.TemplateView):

    template_name = 'exam/index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)

        if self.request.user.is_authenticated():
            profile = self.request.user.userprofile
            context['favourites'] = profile.favourite_exams.all()
            context['recents'] = Exam.objects.filter(author=self.request.user).order_by('-last_modified')
        
        context['highlights'] = ExamHighlight.objects.all().order_by('-date')

        context['navtab'] = 'exams'

        return context
    
    
class ListView(generic.ListView):
    model=Exam
    table_class = ExamTable

    def make_table(self):
        config = RequestConfig(self.request, paginate={'per_page': 10})
        results = self.table_class(self.object_list)
        config.configure(results)

        return results

    def get_context_data(self, **kwargs):
        context = super(ListView, self).get_context_data(**kwargs)
        context['navtab'] = 'exams'
        context['results'] = self.make_table()

        return context

class SearchView(ListView):
    
    """Search exams."""
    template_name='exam/search.html'

    def get_queryset(self):

        form = self.form = ExamSearchForm(self.request.GET)
        form.is_valid()

        exams = Exam.objects.all()

        search_term = form.cleaned_data.get('query')
        if search_term:
            exams = exams.filter(Q(name__icontains=search_term) | Q(metadata__icontains=search_term)).distinct()

        author_term = form.cleaned_data.get('author')
        if author_term:
            authors = find_users(author_term)
            exams = exams.filter(author__in=authors).distinct()

        usage = form.cleaned_data.get('usage')
        usage_filters = {
            "any": Q(),
            "reuse": Q(licence__can_reuse=True),
            "modify": Q(licence__can_reuse=True, licence__can_modify=True),
            "sell": Q(licence__can_reuse=True, licence__can_sell=True),
            "modify-sell": Q(licence__can_reuse=True, licence__can_modify=True, licence__can_sell=True),
        }
        if usage in usage_filters:
            exams = exams.filter(usage_filters[usage])

        only_ready_to_use = form.cleaned_data.get('only_ready_to_use')
        if only_ready_to_use:
            exams = exams.filter(current_stamp__status='ok')

        exams = [e for e in exams if e.editoritem.can_be_viewed_by(self.request.user)]

        return exams

    def get_context_data(self, **kwargs):
        context = super(SearchView,self).get_context_data(**kwargs)
        context['form'] = self.form

        return context

class FavouritesView(ListView):
    template_name = 'exam/favourites.html'

    def get_queryset(self):
        return self.request.user.userprofile.favourite_exams.all()

class HighlightsView(ListView):
    model = ExamHighlight
    template_name = 'exam/highlights.html'
    table_class = ExamHighlightTable
    per_page = 5

    def get_queryset(self):
        highlights = ExamHighlight.objects.all()
        return highlights

    
class SetAccessView(generic.UpdateView):
    model = Exam
    form_class = ExamSetAccessForm

    def get_form_kwargs(self):
        kwargs = super(SetAccessView,self).get_form_kwargs()
        kwargs['data'] = self.request.POST.copy()
        kwargs['data'].update({'given_by':self.request.user.pk})
        return kwargs

    def form_valid(self, form):
        exam = self.get_object()

        if not exam.editoritem.can_be_edited_by(self.request.user):
            return http.HttpResponseForbidden("You don't have permission to edit this exam.")

        self.object = form.save()

        return HttpResponse('ok!')

    def form_invalid(self,form):
        return HttpResponse(form.errors.as_text())

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class ShareLinkView(generic.RedirectView):
    permanent = False

    def get_redirect_url(self, *args,**kwargs):
        try:
            e = Exam.objects.get(share_uuid=kwargs['share_uuid'])
        except ValueError,Exam.DoesNotExist:
            raise Http404

        access = kwargs['access']

        user = self.request.user
        if access=='view':
            has_access = e.editoritem.can_be_viewed_by(user)
        elif access=='edit':
            has_access = e.editoritem.can_be_edited_by(user)
            
        if not has_access:
            try:
                ea = ExamAccess.objects.get(exam=e,user=user)
            except ExamAccess.DoesNotExist:
                ea = ExamAccess(exam=e, user=user,access=access)
            ea.access = access
            ea.save()

        return reverse('exam_edit',args=(e.pk,e.slug))

class SetStarView(generic.UpdateView):
    model = Exam

    def post(self, request, *args, **kwargs):
        exam = self.get_object()

        profile = request.user.userprofile
        starred = request.POST.get('starred') == 'true'
        if starred:
            profile.favourite_exams.add(exam)
        else:
            profile.favourite_exams.remove(exam)
        profile.save()

        return HttpResponse('ok!')

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class StampView(editor.views.generic.StampView):
    model = Exam

class CommentView(editor.views.generic.CommentView):
    model = Question

def question_lists(request):
    if not request.is_ajax():
        raise Http404

    user = request.user
    if user.is_anonymous():
        recent, basket = [], []
    else:
        recent = user.userprofile.recent_questions
        basket = user.userprofile.question_basket.all()

    lists = {
        'recent': recent,
        'basket': basket
    }
    out = {k: [q.summary() for q in qs] for k,qs in lists.items()}

    return HttpResponse(json.dumps(out),
                        content_type='application/json')
