#Copyright 2015 Newcastle University
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
from operator import itemgetter
import time
import calendar
import re

import os
import subprocess
import traceback

from django.core.servers.basehttp import FileWrapper
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.template.loader import render_to_string
from django.core.urlresolvers import reverse
from django.db.models import Q,Min,Max
from django.db import transaction
from django import http
from django.shortcuts import render,redirect
from django.views import generic
from django.template.loader import get_template
from django.template import RequestContext

import reversion

from django_tables2.config import RequestConfig

from editor.tables import EditorItemTable
from editor.models import EditorItem, Project, Access, Licence
import editor.models
import editor.views.generic
from editor.views.errors import forbidden
from editor.views.user import find_users
from editor.views.timeline import timeline_json
import editor.forms
from accounts.util import user_json

from numbasobject import NumbasObject
from examparser import ParseError

class CreateView(generic.CreateView):
    model = EditorItem

    def get_initial(self):
        data = self.initial.copy()
        data['author'] = self.request.user
        if 'project' in self.request.GET:
            data['project'] = Project.objects.get(pk=int(self.request.GET['project']))
        else:
            data['project'] = self.request.user.userprofile.personal_project
        return data

    def get_form(self):
        form = super(CreateView,self).get_form()
        form.fields['project'].queryset = self.request.user.userprofile.projects()
        return form


class BaseUpdateView(generic.UpdateView):

    """ Base update view for an EditorItem wrapper (i.e. Question or Exam) """

    def get_object(self):
        obj = super(BaseUpdateView,self).get_object()
        self.editable = obj.editoritem.can_be_edited_by(self.request.user)
        self.can_delete = obj.editoritem.can_be_deleted_by(self.request.user)
        self.can_copy = obj.editoritem.can_be_copied_by(self.request.user)
        return obj

    def dispatch(self,request,*args,**kwargs):
        self.user = request.user
        self.object = self.get_object()

        return super(BaseUpdateView,self).dispatch(request,*args,**kwargs)

    def get(self, request, *args, **kwargs):
        if not self.object.editoritem.can_be_viewed_by(request.user):
            return forbidden(request)
        else:
            if not self.user.is_anonymous():
                self.user.notifications.filter(target_object_id=self.object.pk).mark_all_as_read()

            return super(BaseUpdateView,self).get(request,*args,**kwargs)

    def post(self, request, *args, **kwargs):
        if not self.object.editoritem.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        self.data = json.loads(request.POST['json'])

    def pre_save(self):
        """ Do anything that needs to be done before saving the object, after creating self.object from the form """
        raise NotImplementedError

    def form_valid(self, form):
        with transaction.atomic(), reversion.create_revision():
            self.object = form.save(commit=False)
            self.pre_save(form)
            self.object.editoritem.subjects.clear()
            self.object.editoritem.subjects.add(*form.cleaned_data['subjects'])
            self.object.editoritem.topics.clear()
            self.object.editoritem.topics.add(*form.cleaned_data['topics'])
            self.object.editoritem.ability_levels.clear()
            self.object.editoritem.ability_levels.add(*form.cleaned_data['ability_levels'])

            self.object.save()

            reversion.set_user(self.user)

        version = reversion.get_for_object(self.object)[0]

        status = {"result": "success", "url": self.get_success_url()}
        return http.HttpResponse(json.dumps(status), content_type='application/json')

    def form_invalid(self, form):
        status = {
            "result": "error",
            "message": "Something went wrong...",
            "traceback": traceback.format_exc(),}
        return http.HttpResponseServerError(json.dumps(status),
                                       content_type='application/json')

    def get_context_data(self, **kwargs):
        context = super(BaseUpdateView, self).get_context_data(**kwargs)
        self.object.editoritem.get_parsed_content()

        context['item_type'] = self.object.editoritem.item_type

        context['editable'] = self.editable
        context['can_delete'] = self.can_delete
        context['can_copy'] = self.can_copy

        context['access_rights'] = [{'user': user_json(a.user), 'access_level': a.access} for a in Access.objects.filter(item=self.object.editoritem)]

        licences = [licence.as_json() for licence in Licence.objects.all()]

        self.item_json = context['item_json'] = {
            'itemJSON': self.object.edit_dict(),
            'editable': self.editable,
            'item_type': self.object.editoritem.item_type,

            'licences': licences,

            'subjects': [editor.views.generic.subject_json(subject) for subject in editor.models.Subject.objects.all()],
            'topics': [editor.views.generic.topic_json(topic) for topic in editor.models.Topic.objects.all()],
            'ability_frameworks': [editor.views.generic.ability_framework_json(af) for af in editor.models.AbilityFramework.objects.all()],

            'previewURL': reverse('{}_preview'.format(self.object.editoritem.item_type), args=(self.object.pk, self.object.editoritem.slug)),
            'previewWindow': str(calendar.timegm(time.gmtime())),
            'current_stamp': editor.views.generic.stamp_json(self.object.editoritem.current_stamp) if self.object.editoritem.current_stamp else None,
        }

        if self.editable:
            self.item_json['public_access'] = self.object.editoritem.public_access
            self.item_json['access_rights'] = context['access_rights']
            context['versions'] = [] # reversion.get_for_object(self.object)

        context['stamp_choices'] = editor.models.STAMP_STATUS_CHOICES

        return context


class ListView(generic.ListView):
    model = EditorItem
    table_class = EditorItemTable

    def make_table(self):
        config = RequestConfig(self.request, paginate={'per_page': 10})
        results = self.table_class(self.object_list)

        order_by = self.form.cleaned_data.get('order_by')
        if order_by in ('last_modified','licence'):
            order_by = '-'+order_by
        results.order_by = order_by

        config.configure(results)

        return results

    def get_context_data(self, **kwargs):
        context = super(ListView, self).get_context_data(**kwargs)
        context['results'] = self.make_table()

        return context

filter_exam = Q(exam__isnull=False)
filter_question = Q(question__isnull=False)

class SearchView(ListView):
    
    """Search exams."""
    template_name = 'editoritem/search.html'

    def base_queryset(self):
        return EditorItem.objects.filter(EditorItem.filter_can_be_viewed_by(self.request.user))

    def get_queryset(self):

        data = deepcopy(self.request.GET)
        form = self.form = editor.forms.EditorItemSearchForm(data)
        for field in ('usage','item_types','order_by'):
            form.data.setdefault(field,form.fields[field].initial)
        form.is_valid()

        items = self.viewable_items = self.base_queryset()

        # filter based on query
        query = self.query = form.cleaned_data.get('query')
        self.filter_query = Q()
        if query:
            words = [w for w in re.split(r'\s+',query) if w!='']
            for word in words:
                self.filter_query = self.filter_query & (Q(name__icontains=word) | Q(metadata__icontains=word) )
            items = items.filter(self.filter_query)

        # filter based on item type
        item_types = self.item_types = form.cleaned_data.get('item_types',[])
        print(item_types)
        if 'exams' in item_types:
            if 'questions' not in item_types:
                items = items.filter(filter_exam)
        elif 'questions' in item_types:
            items = items.filter(filter_question)

        # filter based on author
        author_term = form.cleaned_data.get('author')
        if author_term:
            authors = find_users(author_term)
            self.filter_authors = Q(author__in=authors)
            items = items.filter(self.filter_authors)
        else:
            self.filter_authors = Q()

        # filter based on subject
        subjects = form.cleaned_data.get('subjects')
        if subjects and len(subjects):
            self.filter_subjects = Q(subjects__in=subjects)
            items = items.filter(self.filter_subjects)
        else:
            self.filter_subjects = Q()

        # filter based on topic
        topics = form.cleaned_data.get('topics')
        if topics and len(topics):
            self.filter_topics = Q(topics__in=topics)
            items = items.filter(self.filter_topics)
        else:
            self.filter_topics = Q()

        # filter based on usage
        usage = form.cleaned_data.get('usage')
        usage_filters = {
            "any": Q(),
            "reuse": Q(licence__can_reuse=True),
            "modify": Q(licence__can_reuse=True, licence__can_modify=True),
            "sell": Q(licence__can_reuse=True, licence__can_sell=True),
            "modify-sell": Q(licence__can_reuse=True, licence__can_modify=True, licence__can_sell=True),
        }
        if usage in usage_filters:
            self.filter_usage = usage_filters[usage]
            items = items.filter(self.filter_usage)
        else:
            self.filter_usage = Q()

        # filter based on ability level
        ability_levels = form.cleaned_data.get('ability_levels')
        if ability_levels.exists():
            d = ability_levels.aggregate(Min('start'),Max('end'))
            start = d['start__min']
            end = d['end__max']
            self.filter_ability_level = Q(ability_level_start__lt=end,ability_level_end__gt=start)
            items = items.filter(self.filter_ability_level)
        else:
            self.filter_ability_level = Q()

        # filter based on status
        status = form.cleaned_data.get('status')
        if status and status!='any':
            self.filter_status = Q(current_stamp__status=status)
            items = items.filter(self.filter_status)
        else:
            self.filter_status = Q()

        items = items.distinct()

        return items

    def get_context_data(self, **kwargs):
        context = super(SearchView,self).get_context_data(**kwargs)
        context['form'] = self.form
        context['item_types'] = self.form.cleaned_data.get('item_types')
        context['search_query'] = self.query
        context['ability_level_field'] = zip(self.form.fields['ability_levels'].queryset,self.form['ability_levels'])

        return context

class CompileError(Exception):
    def __init__(self, message, stdout='',stderr='',code=0):
        self.message = message
        self.stdout = stdout
        self.stderr = stderr
        self.code = code
    def __str__(self):
        return 'Compilation failed: {}\n Stdout: {}\nStderr: {}\nExit code: {}'.format(self.message, self.stderr, self.stdout, self.code)
    
class CompileObject():
    
    """Compile an exam or question."""

    def compile(self,numbasobject,switches,location,obj):
        """
            Construct a temporary exam/question file and compile it.
            Returns the path to the output produced
        """

        numbasobject.data['extensions'] = [e.extracted_path for e in editor.models.Extension.objects.filter(location__in=numbasobject.data.get('extensions',[]))]
        source = str(numbasobject)

        theme_path = obj.theme_path if hasattr(obj,'theme_path') else 'default'
        locale = obj.locale if hasattr(obj,'locale') else 'en-GB'


        output_location = os.path.join(settings.GLOBAL_SETTINGS['PREVIEW_PATH'], location)
        numbas_command = [
            settings.GLOBAL_SETTINGS['PYTHON_EXEC'],
            os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'],'bin','numbas.py'),
            '--pipein',
            '-p'+settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
            '-o'+output_location,
            '-t'+theme_path,
            '-l'+locale,
        ] + switches

        process = subprocess.Popen(numbas_command, stdout = subprocess.PIPE, stdin=subprocess.PIPE, stderr = subprocess.PIPE)
        stdout,stderr = process.communicate(source.encode('utf-8'))
        code = process.poll()
        if code != 0:
            raise CompileError('Compilation failed.',stdout=stdout,stderr=stderr,code=code)
        else:
            return output_location
    
    def get_error_response(self,error):
        template = get_template("compile/error.html")
        return http.HttpResponseServerError(template.render(RequestContext(self.request,{
            'message': error.message,
            'stdout': error.stdout,
            'stderr': error.stderr,
            'code': error.code,
        })))

class PreviewView(generic.DetailView,CompileObject):
    def preview(self,obj):
        numbasobject = obj.as_numbasobject    #need to catch errors
        location = obj.filename
        switches = ['-c']
        try:
            fsLocation = self.compile(numbasobject, switches, location, obj)
        except CompileError as err:
            return self.get_error_response(err)
        else:
            url = settings.GLOBAL_SETTINGS['PREVIEW_URL'] + location + '/index.html'
            return redirect(url)
        
class ZipView(generic.DetailView,CompileObject):
    def download(self,obj,scorm=False):
        numbasobject= obj.as_numbasobject    #need to catch errors

        switches = ['-cz']

        if settings.GLOBAL_SETTINGS.get('MINIFIER_PATH'):
            switches+=['--minify',settings.GLOBAL_SETTINGS['MINIFIER_PATH']]
        if scorm:
            switches.append('-s')

        location = obj.filename + '.zip'

        try:
            fsLocation = self.compile(numbasobject, switches, location, obj)
        except CompileError as err:
            return self.get_error_response(err)
        else:
            wrapper = FileWrapper(file(fsLocation,'rb'))
            response = http.HttpResponse(wrapper, content_type='application/zip')
            response['Content-Disposition'] = 'attachment; filename={}.zip'.format(obj.filename)
            response['Content-Length'] = os.path.getsize(fsLocation)
            response['Cache-Control'] = 'max-age=0,no-cache,no-store'
            return response

class SourceView(generic.DetailView):
    def source(self,obj):
        source = str(obj.as_numbasobject)
        response = http.HttpResponse(source, 'text/plain')
        response['Content-Disposition'] = 'attachment; filename={}.exam'.format(obj.filename)
        response['Cache-Control'] = 'max-age=0,no-cache,no-store'
        return response

class PublishView(generic.UpdateView):
    model = EditorItem
    fields = ['published']
    
    def get(self):
        return redirect(reverse('{}_edit'.format(ei.item_type), args=(ei.rel_obj.pk,ei.slug,)))

    def post(self,request, *args, **kwargs):
        ei = self.get_object()
        ei.publish()
        ei.save()
        return redirect(reverse('{}_edit'.format(ei.item_type), args=(ei.rel_obj.pk,ei.slug,)))

class SetAccessView(generic.UpdateView):
    model = EditorItem
    form_class = editor.forms.SetAccessForm

    def get_form_kwargs(self):
        kwargs = super(SetAccessView,self).get_form_kwargs()
        kwargs['data'] = self.request.POST.copy()
        kwargs['data'].update({'given_by':self.request.user.pk})
        return kwargs

    def form_valid(self, form):
        item = self.get_object()

        if not item.can_be_edited_by(self.request.user):
            return http.HttpResponseForbidden("You don't have permission to edit this item.")

        self.object = form.save()

        return http.HttpResponse('ok!')

    def form_invalid(self,form):
        return HttpResponse(form.errors.as_text())

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class CompareView(generic.TemplateView):

    template_name = "editoritem/compare.html"

    def get_context_data(self, pk1,pk2, **kwargs):
        context = super(CompareView, self).get_context_data(**kwargs)
        pk1 = int(pk1)
        pk2 = int(pk2)
        ei1 = context['ei1'] = EditorItem.objects.get(pk=pk1)
        ei2 = context['ei2'] = EditorItem.objects.get(pk=pk2)
        context['pr1_exists'] = QuestionPullRequest.objects.open().filter(source=ei1,destination=ei2).exists()
        context['pr2_exists'] = QuestionPullRequest.objects.open().filter(source=ei2,destination=ei1).exists()
        context['pr1_auto'] = ei2.can_be_edited_by(self.request.user)
        context['pr2_auto'] = ei1.can_be_edited_by(self.request.user)
        return context
