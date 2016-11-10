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

from editor.forms import ExamForm, NewExamForm, UploadExamForm
from editor.models import NewExam, NewQuestion, EditorItem, Access
import editor.models
from editor.models import Theme, Licence, Extension, STAMP_STATUS_CHOICES
import editor.views.editoritem
import editor.views.generic
from editor.views.errors import forbidden
from editor.views.user import find_users

from accounts.util import user_json

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
        except (NewExam.DoesNotExist, TypeError) as err:
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
        except (NewExam.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.source(e.editoritem)
    
    
class CreateView(editor.views.editoritem.CreateView):
    form_class = NewExamForm
    template_name = 'exam/new.html'

    def make_exam(self,form):
        ei = form.save()
        ei.set_licence(ei.project.default_licence)
        ei.locale = ei.project.default_locale
        ei.save()
        self.exam = NewExam()
        self.exam.editoritem = ei
        return self.exam

    def form_valid(self, form):
        with transaction.atomic(), reversion.create_revision():
            self.make_exam(form)
            self.exam.save()

        return redirect(self.get_success_url())

    def get_success_url(self):
        return reverse('exam_edit', args=(self.exam.pk,
                                          self.exam.editoritem.slug,))
    
class UploadView(editor.views.editoritem.CreateView):
    
    """Upload a .exam file representing an exam"""

    model = NewExam
    form_class = UploadExamForm
    template_name = 'exam/upload.html'

    def form_valid(self, form):
        exam_file = form.cleaned_data.get('file')

        content = exam_file.read().decode('utf-8')
        project = form.cleaned_data.get('project')

        ei = EditorItem(content=content,author=self.request.user,project=project)
        ei.locale = project.default_locale

        ei.save()
        ei.set_licence(project.default_licence)

        exam = NewExam()
        exam.editoritem = ei
        exam.save()

        exam_object = NumbasObject(source=content)

        qs = []
        for q in exam_object.data['questions']:
            question_object = NumbasObject(data=q,version=exam_object.version)

            qei = EditorItem(
                content = str(question_object),
                author = ei.author
            )
            qei.set_licence(ei.licence)
            qei.project = ei.project
            qei.save()

            qo = NewQuestion()
            qo.editoritem = qei
            qo.save()

            extensions = Extension.objects.filter(location__in=exam_object.data['extensions'])
            qo.extensions.add(*extensions)
            qs.append(qo)
        exam.set_questions(qs)

        self.exam = exam

        return HttpResponseRedirect(self.get_success_url())

    def not_exam_file(self):
        messages.add_message(self.request, messages.ERROR, render_to_string('notexamfile.html'))
        return HttpResponseRedirect(reverse('exam_index'))

    def get_success_url(self):
        return self.exam.get_absolute_url() 

class CopyView(editor.views.editoritem.CopyView):

    """ Copy an exam """

    model = NewExam

class DeleteView(generic.DeleteView):
    
    """Delete an exam."""
    
    model = NewExam
    template_name = 'exam/delete.html'
    
    def do_delete(self):
        self.object.editoritem.delete()
        return http.HttpResponseRedirect(self.get_success_url())

    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.editoritem.can_be_deleted_by(self.request.user):
            return self.do_delete()
        elif self.request.user.is_superuser:
            if not self.request.POST.get('confirmed'):
                return self.response_class(
                    request=self.request,
                    template='editoritem/superuser_confirm_delete.html',
                    context=self.get_context_data(object=self.object),
                    using=self.template_engine
                )
            else:
                return self.do_delete()
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
    
    def get_success_url(self):
        return reverse('editor_index')
    
    
class UpdateView(editor.views.editoritem.BaseUpdateView):

    model = NewExam
    form_class = ExamForm
    template_name = 'exam/edit.html'

    def pre_save(self,form):
        pass

    def post(self, request, *args, **kwargs):
        super(UpdateView,self).post(request,*args,**kwargs)

        theme = self.data['theme']
        if theme['custom']:
            self.data['custom_theme'] = theme['path']
            self.data['theme'] = ''
        else:
            self.data['custom_theme'] = None
            self.data['theme'] = theme['path']

        self.questions = self.data['questions']
        del self.data['questions']

        exam_form = ExamForm(self.data, instance=self.object)

        if exam_form.is_valid():
            return self.form_valid(exam_form)
        else:
            return self.form_invalid(exam_form)
 
    def pre_save(self,form):
        self.object.set_questions(question_ids=self.questions)

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)

        exam_dict = self.item_json['itemJSON']
        if self.request.user.is_authenticated():
            exam_dict['recentQuestions'] = [q.summary() for q in NewQuestion.objects.filter(editoritem__author=self.request.user).order_by('-editoritem__last_modified')[:10]]
            exam_dict['basketQuestions'] = [q.summary() for q in self.request.user.userprofile.question_basket.all()]
        else:
            exam_dict['recentQuestions'] = []
            exam_dict['basketQuestions'] = []

        custom_themes = Theme.objects.filter(public=True) | Theme.objects.filter(author=self.object.editoritem.author)
        if self.object.custom_theme:
            custom_themes |= Theme.objects.filter(pk=self.object.custom_theme.pk)
        context['themes'] = ([{'name': x[0], 'path': x[1], 'custom': False} for x in settings.GLOBAL_SETTINGS['NUMBAS_THEMES']] + 
                             [{'name': theme.name, 'path': theme.pk, 'custom': True} for theme in custom_themes])

        context['locales'] = sorted([{'name': x[0], 'code': x[1]} for x in settings.GLOBAL_SETTINGS['NUMBAS_LOCALES']],key=operator.itemgetter('name'))

        if self.request.user.is_authenticated():
            profile = self.request.user.userprofile
        else:
            profile = None

        self.item_json.update({
            'themes': sorted(context['themes'],key=operator.itemgetter('name')),
            'locales': context['locales'],
        })

        if self.item_json['editable'] and profile:
            self.item_json.update({
                'preferred_locale': profile.language,
            })

        return context

    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk,self.object.editoritem.slug,))

class RevertView(generic.UpdateView):
    model = EditorItem
    
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.exam = self.get_object()
        item = exam.editoritem

        if not self.item.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        try:
            self.version = reversion.models.Version.objects.get(pk=kwargs['version'])
        except ObjectDoesNotExist:
            raise Http404

        self.version.revision.revert()

        exam = NewExam.objects.get(pk=self.exam.pk)

        return redirect(reverse('exam_edit', args=(exam.pk,exam.editoritem.slug)))

class CompareView(generic.TemplateView):
    template_name = "exam/compare.html"

class ShareLinkView(editor.views.generic.ShareLinkView):
    permanent = False
    model = NewExam

class StampView(editor.views.generic.StampView):
    model = NewExam

class CommentView(editor.views.generic.CommentView):
    model = NewExam

    def get_comment_object(self):
        return self.get_object().editoritem

class SetRestorePointView(editor.views.generic.SetRestorePointView):
    model = NewExam

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
