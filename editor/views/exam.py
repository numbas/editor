import json
import traceback
import operator
from pathlib import Path
import zipfile

from django.core.exceptions import ObjectDoesNotExist
from django.core.files import File
from django.core.files.storage import default_storage
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.models import User
from django.template.loader import render_to_string
from django.urls import reverse, resolve, Resolver404
from django.db import transaction
from django.http import Http404, HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django import http
from django.shortcuts import redirect
from django.views import generic

import reversion

from editor.forms import ExamForm, NewExamForm, UploadExamForm
from editor.models import NewExam, NewQuestion, EditorItem, Resource
import editor.models
from editor.models import Theme, Extension, Contributor
from editor.views import request_is_ajax
import editor.views.editoritem
import editor.views.generic
from editor.views.errors import forbidden

from examparser.numbasobject import NumbasObject

class PreviewView(editor.views.editoritem.PreviewView):
    """Compile an exam as a preview."""
    model = NewExam

class PreviewFileView(editor.views.editoritem.PreviewFileView):
    """Show a file from a preview."""
    model = NewExam

    def get_resource(self, file):
        obj = self.object
        return Resource.objects.filter(questions__in=obj.questions.all(), filename=file).first()

class EmbedView(editor.views.editoritem.EmbedView):
    """Compile an exam and show it as an embed."""
    model = NewExam

class ZipView(editor.views.editoritem.ZipView):
    """Compile an exam as a SCORM package and return the .zip file"""
    model = NewExam


class SourceView(editor.views.editoritem.SourceView):
    """Return the .exam version of an exam"""
    model = NewExam
    
    
class CreateView(editor.views.editoritem.CreateView):
    form_class = NewExamForm
    template_name = 'exam/new.html'

    def make_exam(self, form):
        ei = form.save()
        ei.set_licence(ei.project.default_licence)
        ei.locale = ei.project.default_locale
        ei.save()
        self.exam = NewExam()

        self.exam.editoritem = ei
        self.exam.locale = self.request.user.userprofile.language
        return self.exam

    def form_valid(self, form):
        with transaction.atomic(), reversion.create_revision():
            self.make_exam(form)
            self.exam.save()
            reversion.set_user(self.exam.editoritem.author)

        return redirect(self.get_success_url())

    def get_success_url(self):
        return reverse('exam_edit', args=(self.exam.pk,
                                          self.exam.editoritem.slug,))+'?new=true'
    
class UploadView(editor.views.editoritem.CreateView):
    
    """Upload a .exam file representing an exam"""

    model = NewExam
    form_class = UploadExamForm
    template_name = 'exam/upload.html'

    def form_valid(self, form):
        exam_file = form.cleaned_data.get('file')

        is_zipfile = zipfile.is_zipfile(exam_file)

        if is_zipfile:
            with zipfile.ZipFile(exam_file) as z:
                with z.open('source.exam') as zf:
                    content = zf.read().decode('utf-8')
        else:
            exam_file.seek(0)
            content = exam_file.read().decode('utf-8')

        project = self.project = form.cleaned_data.get('project')

        self.exam_object = NumbasObject(source=content)
        question_groups = self.exam_object.data.get('question_groups',[])

        self.resources =  {}
        if is_zipfile:
            with zipfile.ZipFile(exam_file) as z:
                for filename,path in self.exam_object.data.get('resources',[]):
                    zippath = 'resources/'+filename
                    short_filename = filename

                    if short_filename.startswith('question-resources/'):
                        short_filename = short_filename[len('question-resources/'):]

                    with z.open(zippath) as zf:
                        resource = Resource.objects.create(
                            filename=short_filename,
                            owner = self.request.user,
                            file=File(zf)
                        )
                        self.resources[filename] = resource

        if exam_file.name.startswith('question-') and len(question_groups) == 1 and len(question_groups[0]['questions'])==1:
            q = self.exam_object.data['question_groups'][0]['questions'][0]
            qo = self.make_question(q)
            return HttpResponseRedirect(qo.get_absolute_url())

        ei = self.ei = EditorItem(content=content, author=self.request.user, project=project)
        ei.locale = project.default_locale

        ei.save()
        ei.set_licence(project.default_licence)
        obj = ei.get_parsed_content()

        contributors = obj.data.get('contributors',[])
        self.add_contributors(ei,contributors)

        exam = NewExam()
        exam.editoritem = ei
        exam.save()

        groups = []
        for group in question_groups:
            qs = []
            for q in group.get('questions',[]):
                qo = self.make_question(q)

                qs.append(qo.pk)


            groups.append(qs)
        exam.set_question_groups(groups)

        self.exam = exam

        return HttpResponseRedirect(self.get_success_url())

    def add_contributors(self,item,contributor_data):
        root = self.request.build_absolute_uri('/')
        for c in contributor_data:
            if c['profile_url'][:len(root)] == root:
                rest = c['profile_url'][len(root):]
                try:
                    match = resolve(rest)
                    if match.url_name != 'view_profile':
                        raise Resolver404()
                    pk = match.kwargs['pk']
                    user = User.objects.get(pk=pk)
                    Contributor.objects.create(item=item,user=user)
                except (Resolver404,User.DoesNotExist):
                    Contributor.objects.create(item=item,name=c['name'],profile_url=c['profile_url'])
            else:
                Contributor.objects.create(item=item,name=c['name'],profile_url=c['profile_url'])

    def make_question(self, q):
        question_object = NumbasObject(data=q, version=self.exam_object.version)

        qei = EditorItem(
            content=str(question_object),
            author=self.request.user
        )
        qei.set_licence(self.project.default_licence)
        qei.project = self.project
        qei.save()

        qei.tags.set([t.strip() for t in q.get('tags',[])])

        qo = NewQuestion()
        qo.editoritem = qei
        qo.save()

        extensions = Extension.objects.filter(location__in=q.get('extensions',[]))
        qo.extensions.set(extensions)

        resources = [self.resources[filename] for filename in q.get('resources',[]) if filename in self.resources]
        qo.resources.set(resources)

        contributors = q.get('contributors',[])
        self.add_contributors(qei,contributors)

        return qo

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

    def form_valid(self, form):
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

    def get(self, request, *args, **kwargs):
        if super(EditorItem,self.object.editoritem).can_be_viewed_by(request.user) and getattr(settings,'EXAM_ACCESS_REQUIRES_QUESTION_ACCESS',False):
            for q in self.object.questions.all():
                if not q.editoritem.can_be_viewed_by(request.user):
                    return forbidden(request,message="Sorry, you're not allowed to see this. This exam contains one or more questions that you don't have access to.")
        return super().get(request,*args,**kwargs)

    def post(self, request, *args, **kwargs):
        super(UpdateView, self).post(request, *args, **kwargs)

        theme = self.data['theme']
        if theme['custom']:
            self.data['custom_theme'] = theme['path']
            self.data['theme'] = ''
        else:
            self.data['custom_theme'] = None
            self.data['theme'] = theme['path']

        self.question_groups = self.data['question_groups']
        del self.data['question_groups']

        exam_form = ExamForm(self.data, instance=self.object)

        if exam_form.is_valid():
            return self.form_valid(exam_form)
        else:
            return self.form_invalid(exam_form)
 
    def pre_save(self, form):
        deleted_questions = []
        question_groups = []
        for group in self.question_groups:
            ok = [q.pk for q in NewQuestion.objects.filter(pk__in=group)]
            deleted = [pk for pk in group if pk not in ok]
            deleted_questions += deleted
            question_groups.append([pk for pk in group if pk in ok])
        self.deleted_questions = deleted_questions
        self.object.set_question_groups(question_groups)

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)

        self.item_json['is_new'] = self.request.GET.get('new',False)

        exam_dict = self.item_json['itemJSON']
        if self.request.user.is_authenticated:
            exam_dict['recentQuestions'] = [q.summary() for q in NewQuestion.objects.filter(editoritem__author=self.request.user).order_by('-editoritem__last_modified')[:10]]
            exam_dict['basketQuestions'] = [q.summary() for q in self.request.user.userprofile.question_basket.all()]
        else:
            exam_dict['recentQuestions'] = []
            exam_dict['basketQuestions'] = []

        custom_themes = Theme.objects.filter(Theme.filter_can_be_viewed_by(self.request.user))
        if self.object.custom_theme:
            custom_themes |= Theme.objects.filter(pk=self.object.custom_theme.pk)
        context['themes'] = ([{'name': x[0], 'path': x[1], 'custom': False} for x in settings.GLOBAL_SETTINGS['NUMBAS_THEMES']] + 
                             [{'name': theme.name, 'path': theme.pk, 'custom': True} for theme in custom_themes])

        context['locales'] = sorted([{'name': x[0], 'code': x[1]} for x in settings.GLOBAL_SETTINGS['NUMBAS_LOCALES']], key=operator.itemgetter('name'))

        if self.request.user.is_authenticated:
            profile = self.request.user.userprofile
        else:
            profile = None

        network, network_hidden_items = self.object.editoritem.network(user=self.request.user)
        context['network'] = network
        context['network_hidden_items'] = network_hidden_items
        context['other_versions_exist'] = self.item_json['other_versions_exist'] = len(network) > 1
        self.item_json['editing_history_used'] = self.object.editoritem.comments.exists() or self.object.editoritem.restore_points.exists()

        self.item_json.update({
            'themes': sorted(context['themes'], key=lambda x: (x['path'] != 'default', x['name'].lower())),
            'locales': context['locales'],
        })

        if self.item_json['editable'] and profile:
            self.item_json.update({
                'preferred_locale': profile.language,
            })

        return context

    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.pk, self.object.editoritem.slug,))

    def form_valid_response_dict(self, form):
        d = super(UpdateView,self).form_valid_response_dict(form)
        d.update({
            'deleted_questions': self.deleted_questions
        })
        return d


class RevertView(generic.UpdateView):
    model = EditorItem
    
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.exam = self.get_object()
        item = self.exam.editoritem

        if not item.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        try:
            self.version = reversion.models.Version.objects.get(pk=kwargs['version'])
        except ObjectDoesNotExist:
            raise Http404

        self.version.revision.revert()

        exam = NewExam.objects.get(pk=self.exam.pk)

        return redirect(reverse('exam_edit', args=(exam.pk, exam.editoritem.slug)))

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

def question_lists(request, pk):
    if not request_is_ajax(request):
        raise Http404

    exam = NewExam.objects.get(pk=pk)
    exam_questions = exam.questions.all()

    user = request.user
    if user.is_anonymous:
        recent, basket = [], []
    else:
        recent = user.userprofile.recent_questions
        basket = user.userprofile.question_basket.all()

    lists = {
        'recent': recent,
        'basket': basket,
        'exam_questions': exam_questions
    }
    out = {k: [q.summary() for q in qs] for k, qs in lists.items()}

    return HttpResponse(json.dumps(out),
                        content_type='application/json')

class OfflineAnalysisView(PreviewView):
    template_name = 'editoritem/embed.html'

    def get_exam_url(self):
        return self.get_preview_url() + '/analysis.html'

    def render_to_response(self, context):
        return redirect(self.get_exam_url())
