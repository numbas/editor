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
from copy import deepcopy

import time
import calendar

from django.core.exceptions import ObjectDoesNotExist,ValidationError
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.db import transaction
from django.forms import model_to_dict
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django import http
from django.shortcuts import redirect
from django.views import generic
from django.views.generic.detail import SingleObjectMixin
from django.views.generic.edit import FormMixin
from django.template.loader import render_to_string
from django.conf import settings
from django.core import serializers
from django.contrib import messages

import reversion

from django_tables2.config import RequestConfig

from editor.forms import NewQuestionForm, QuestionForm, SetAccessForm
from editor.models import Project, EditorItem, NewQuestion, Access, Question, Extension, Resource, QuestionAccess, QuestionPullRequest
import editor.views.generic
import editor.views.editoritem
from editor.views.errors import forbidden
from editor.views.user import find_users
from editor.views.version import version_json

from accounts.models import UserProfile
from accounts.util import user_json

from numbasobject import NumbasObject
from examparser import ParseError

class PreviewView(editor.views.editoritem.PreviewView):
    
    """Compile question as a preview and return its URL."""
    
    model = NewQuestion
    
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

            return self.preview(q.editoritem)


class ZipView(editor.views.editoritem.ZipView):

    """Compile a question as a SCORM package and return the .zip file"""

    model = NewQuestion

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

            return self.download(q.editoritem,scorm)


class SourceView(editor.views.editoritem.SourceView):

    """Compile a question as a SCORM package and return the .zip file"""

    model = NewQuestion

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
            return self.source(q.editoritem)


class CreateView(editor.views.editoritem.CreateView):
    
    """Create a question."""
    
    form_class = NewQuestionForm
    template_name = 'question/new.html'

    def form_valid(self, form):
        with transaction.atomic(), reversion.create_revision():
            ei = form.save()
            ei.set_licence(ei.project.default_licence)
            ei.save()
            self.question = NewQuestion()
            self.question.editoritem = ei
            self.question.save()

        return redirect(self.get_success_url())
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.question.pk,
                                              self.question.editoritem.slug,))
 
 
class CopyView(generic.View, SingleObjectMixin):

    """ Copy a question and redirect to its edit page. """

    model = NewQuestion

    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
            if not q.editoritem.can_be_copied_by(request.user):
                return http.HttpResponseForbidden("You may not copy this question.")
            q2 = deepcopy(q)
            q2.id = None

            ei2 = q.editoritem.copy()
            ei2.author = request.user
            ei2.set_name("%s's copy of %s" % (ei2.author.first_name,q.editoritem.name))
            ei2.copy_of = q.editoritem
            ei2.save()

            q2.editoritem = ei2
            q2.save()

            q2.resources = q.resources.all()
            q2.extensions = q.extensions.all()
            q2.save()

        except (NewQuestion.DoesNotExist, TypeError) as err:
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
                return redirect(reverse('question_edit', args=(q2.pk,q2.editoritem.slug)))


class DeleteView(generic.DeleteView):
    
    """Delete a question."""
    
    model = NewQuestion
    template_name = 'question/delete.html'
    
    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.editoritem.can_be_deleted_by(self.request.user):
            self.object.editoritem.delete()
            return http.HttpResponseRedirect(self.get_success_url())
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
    
    def get_success_url(self):
        return reverse('editor_index')


class UpdateView(editor.views.editoritem.BaseUpdateView):

    model = NewQuestion
    form_class = QuestionForm
    template_name = 'question/edit.html'
    
    def post(self, request, *args, **kwargs):
        super(UpdateView,self).post(request,*args,**kwargs)

        self.resources = self.data['resources']
        del self.data['resources']
        question_form = QuestionForm(self.data, instance=self.object)

        if question_form.is_valid():
            return self.form_valid(question_form)
        else:
            return self.form_invalid(question_form)
    
    def pre_save(self,form):
        self.object.editoritem.metadata = json.dumps(self.object.editoritem.metadata)
        self.object.extensions.clear()
        self.object.extensions.add(*form.cleaned_data['extensions'])
        self.object.editoritem.subjects.clear()
        self.object.editoritem.subjects.add(*form.cleaned_data['subjects'])
        self.object.editoritem.topics.clear()
        self.object.editoritem.topics.add(*form.cleaned_data['topics'])

        resource_pks = [res['pk'] for res in self.resources]
        self.object.resources = Resource.objects.filter(pk__in=resource_pks)

    
    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)

        extensions = Extension.objects.filter(public=True) | self.object.extensions.all()

        if not self.request.user.is_anonymous():
            extensions |= Extension.objects.filter(author=self.request.user) 

        extensions = extensions.distinct()

        self.item_json['numbasExtensions'] = context['extensions'] = [e.as_json() for e in extensions]

        self.item_json['resources'] = [r.as_json() for r in self.object.resources.all()]

        part_type_path = 'question/part_types/'
        context['partNames'] = [
            ( name, '{}/{}.html'.format(part_type_path,name) ) 
            for name in 
            'jme','gapfill','numberentry','patternmatch','1_n_2','m_n_2','m_n_x','matrix'
        ]

        return context
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk,self.object.editoritem.slug))


class RevertView(generic.UpdateView):
    model = NewQuestion
    
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.question = self.get_object()

        if not self.question.editoritem.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        try:
            self.version = reversion.models.Version.objects.get(pk=kwargs['version'])
        except ObjectDoesNotExist:
            raise Http404

        self.version.revision.revert()

        return redirect(reverse('question_edit', args=(self.question.pk,self.question.editoritem.slug)))

class CreatePullRequestView(generic.CreateView):
    model = QuestionPullRequest
    template_name = "question/pullrequest.html"
    fields = ['source','destination','comment']

    def form_valid(self, form):
        owner = self.request.user

        source = form.instance.source
        destination = form.instance.destination

        self.pr = QuestionPullRequest(owner=owner,source=source,destination=destination,comment=form.instance.comment)
        try:
            self.pr.full_clean()
        except ValidationError as e:
            return redirect('question_compare',args=(source.pk,destination.pk))

        if self.pr.destination.editoritem.can_be_edited_by(owner):
            self.pr.merge(owner)
            messages.add_message(self.request, messages.SUCCESS, render_to_string('question/pullrequest_accepted_message.html',{'pr':self.pr}))
            return redirect('question_edit',self.pr.destination.pk, self.pr.destination.editoritem.slug)
        else:
            self.pr.save()
            messages.add_message(self.request, messages.INFO, render_to_string('question/pullrequest_created_message.html',{'pr':self.pr}))
            return redirect('question_edit',self.pr.source.pk,self.pr.source.editoritem.slug)

    def get_context_data(self,*args,**kwargs):
        context = super(CreatePullRequestView, self).get_context_data(**kwargs)

        context['source'] = Question.objects.get(pk=self.kwargs['source'])
        context['destination'] = Question.objects.get(pk=self.kwargs['destination'])

        return context

class AcceptPullRequestView(generic.UpdateView):

    model = QuestionPullRequest

    def dispatch(self,request,*args,**kwargs):
        pr = self.get_object()

        if not pr.editoritem.can_be_merged_by(request.user):
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

        messages.add_message(request, messages.SUCCESS, render_to_string('question/pullrequest_accepted_message.html',{'pr':pr}))

        pr.merge(request.user)
        pr.open = False
        pr.save()
        return redirect('question_edit',pr.destination.pk,pr.destination.editoritem.slug)

class RejectPullRequestView(generic.DeleteView):
    
    model = QuestionPullRequest
    
    def delete(self,request,*args,**kwargs):
        pr = self.object = self.get_object()
        if pr.editoritem.can_be_deleted_by(self.request.user):
            pr.reject(self.request.user)

            messages.add_message(request, messages.INFO, render_to_string('question/pullrequest_rejected_message.html',{'pr':pr}))
            return redirect(reverse('question_edit',args=(pr.destination.pk,pr.destination.editoritem.slug))+'#network')

        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
    

class JSONSearchView(editor.views.editoritem.SearchView):
    
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
    
class ShareLinkView(generic.RedirectView):
    permanent = False

    def get_redirect_url(self, *args,**kwargs):
        access = kwargs['access']
        try:
            if access == 'edit':
                q = NewQuestion.objects.get(editoritem__share_uuid_edit=kwargs['share_uuid'])
            elif access == 'view':
                q = NewQuestion.objects.get(editoritem__share_uuid_view=kwargs['share_uuid'])
        except ValueError,Question.DoesNotExist:
            raise Http404

        user = self.request.user
        if access=='view':
            has_access = q.editoritem.can_be_viewed_by(user)
        elif access=='edit':
            has_access = q.editoritem.can_be_edited_by(user)
            
        if not has_access:
            try:
                ea = Access.objects.get(item=q.editoritem,user=user)
            except Access.DoesNotExist:
                ea = Access(item=q.editoritem, user=user,access=access)
            ea.access = access
            ea.save()

        return reverse('question_edit',args=(q.pk,q.editoritem.slug))

class StampView(editor.views.generic.StampView):
    model = NewQuestion

class CommentView(editor.views.generic.CommentView):
    model = NewQuestion

    def get_comment_object(self):
        return self.get_object().editoritem

class SetRestorePointView(editor.views.generic.SetRestorePointView):
    model = NewQuestion
