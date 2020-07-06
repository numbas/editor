import json
import traceback
from copy import deepcopy
import time
import calendar
import re

from datetime import datetime
import os
import subprocess
from pathlib import Path

from wsgiref.util import FileWrapper
from django.core.exceptions import ValidationError, PermissionDenied
from django.conf import settings
from django.contrib import messages
from django.contrib.syndication.views import Feed
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.utils.timezone import make_aware
from django.db.models import Q, Min, Max, Count
from django.db import transaction, IntegrityError
from django import http
from django.shortcuts import redirect, render
from django.views import generic
from django.views.decorators.clickjacking import xframe_options_exempt
from django.template.loader import get_template
from django.template import RequestContext
from editor.context_processors import site_root_url

import reversion

from django_tables2.config import RequestConfig

from accounts.models import UserProfile, EditorItemViewed

from editor.tables import EditorItemTable, RecentlyPublishedTable
from editor.models import EditorItem, Project, Access, Licence, PullRequest, Taxonomy, Contributor, Folder
import editor.models
import editor.views.generic
from editor.views.generic import ProjectQuerysetMixin
from editor.views.errors import forbidden
from editor.views.user import find_users
import editor.forms
from accounts.util import user_json

class MustBeAuthorMixin(object):
    def dispatch(self, request, *args, **kwargs):
        if request.user != self.get_object().author:
            raise PermissionDenied
        return super(MustBeAuthorMixin, self).dispatch(request, *args, **kwargs)

class CreateView(ProjectQuerysetMixin, generic.CreateView):
    model = EditorItem

    def get_initial(self):
        data = self.initial.copy()
        data['author'] = self.request.user
        if 'project' in self.request.GET:
            data['project'] = Project.objects.get(pk=int(self.request.GET['project']))
        else:
            data['project'] = self.request.user.userprofile.personal_project
        if 'folder' in self.request.GET:
            data['folder'] = Folder.objects.get(pk=int(self.request.GET['folder']))
        return data

class CopyView(ProjectQuerysetMixin, generic.FormView, generic.edit.ModelFormMixin):

    template_name = 'editoritem/copy.html'
    form_class = editor.forms.CopyEditorItemForm

    def dispatch(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(CopyView, self).dispatch(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        if request.is_ajax():
            form_class = self.get_form_class()
            data = self.get_initial()
            data.update(request.GET.dict())
            form = form_class(data)

            if form.is_valid():
                return self.form_valid(form)
            else:
                return self.form_invalid(form)
        else:
            return super(CopyView, self).get(request, *args, **kwargs)

    def get_initial(self):
        data = self.initial.copy()
        data['name'] = "{}'s copy of {}".format(self.request.user.first_name, self.object.editoritem.name)
        if self.object.editoritem.project.can_be_edited_by(self.request.user):
            data['project'] = self.object.editoritem.project.pk
        else:
            data['project'] = self.request.user.userprofile.personal_project.pk
        return data

    def form_valid(self, form):
        obj = self.get_object()
        if not obj.editoritem.can_be_copied_by(self.request.user):
            return http.HttpResponseForbidden("You may not copy this question.")

        obj2 = obj.copy(author=self.request.user)

        obj2.editoritem.set_name(form.cleaned_data.get('name'))
        obj2.editoritem.project = form.cleaned_data.get('project')
        if obj2.editoritem.project == obj.editoritem.project:
            obj2.editoritem.folder = obj.editoritem.folder
        obj2.editoritem.save()
        obj2.editoritem.access_rights.clear()
        for c in obj.editoritem.contributors.all():
            try:
                Contributor.objects.create(item=obj2.editoritem,user=c.user,name=c.name,profile_url=c.profile_url)
            except IntegrityError:
                continue

        if self.request.is_ajax():
            return http.HttpResponse(json.dumps(obj2.summary()), content_type='application/json')
        else:
            return redirect(obj2.get_absolute_url())

    def form_invalid(self, form):
        response = super(CopyView, self).form_invalid(form)
        if self.request.is_ajax():
            return http.JsonResponse(form.errors, status=400)
        else:
            return response


class BaseUpdateView(generic.UpdateView):

    """ Base update view for an EditorItem wrapper (i.e. Question or Exam) """

    def get_object(self, *args, **kwargs):
        obj = super(BaseUpdateView, self).get_object(*args, **kwargs)
        self.editable = obj.editoritem.can_be_edited_by(self.request.user)
        self.can_delete = obj.editoritem.can_be_deleted_by(self.request.user)
        self.can_copy = obj.editoritem.can_be_copied_by(self.request.user)
        return obj

    def dispatch(self, request, *args, **kwargs):
        self.user = request.user
        self.object = self.get_object()

        return super(BaseUpdateView, self).dispatch(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        if not self.object.editoritem.can_be_viewed_by(request.user):
            return forbidden(request)
        else:
            if not self.user.is_anonymous:
                self.user.notifications.filter(target_object_id=self.object.editoritem.pk).mark_all_as_read()
                item = self.object.editoritem
                v, created = EditorItemViewed.objects.get_or_create(userprofile=self.user.userprofile,item=item)
                if not created:
                    v.save()

            return super(BaseUpdateView, self).get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        if not self.object.editoritem.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        self.data = json.loads(request.POST['json'])

    def pre_save(self, form):
        """ Do anything that needs to be done before saving the object, after creating self.object from the form """
        raise NotImplementedError

    def form_valid(self, form):
        with transaction.atomic(), reversion.create_revision():
            self.object = form.save(commit=False)
            self.pre_save(form)
            self.object.editoritem.taxonomy_nodes.clear()
            self.object.editoritem.taxonomy_nodes.add(*form.cleaned_data['taxonomy_nodes'])
            self.object.editoritem.ability_levels.clear()
            self.object.editoritem.ability_levels.add(*form.cleaned_data['ability_levels'])
            self.object.editoritem.tags.set(*[t.strip() for t in self.data.get('tags', [])])
            Contributor.objects.get_or_create(item=self.object.editoritem,user=self.user)

            self.object.save()

            reversion.set_user(self.user)

        return http.HttpResponse(json.dumps(self.form_valid_response_dict(form)), content_type='application/json')

    def form_valid_response_dict(self, form):
        return {"result": "success", "url": self.get_success_url()}

    def form_invalid(self, form):
        status = {
            "result": "error",
            "message": "Something went wrong...",
            "traceback": traceback.format_exc(),
        }
        return http.HttpResponseServerError(json.dumps(status),
                                       content_type='application/json')

    def get_context_data(self, **kwargs):
        context = super(BaseUpdateView, self).get_context_data(**kwargs)
        self.object.editoritem.get_parsed_content()

        context['item_type'] = self.object.editoritem.item_type

        context['editable'] = self.editable
        context['can_delete'] = self.can_delete
        context['can_copy'] = self.can_copy

        context['project'] = self.object.editoritem.project

        context['access_rights'] = [{'user': user_json(a.user), 'access_level': a.access} for a in Access.objects.filter(item=self.object.editoritem)]

        licences = [licence.as_json() for licence in Licence.objects.all()]

        taxonomies = [{'pk':taxonomy.pk, 'name': taxonomy.name, 'description': taxonomy.description, 'nodes': taxonomy.json} for taxonomy in Taxonomy.objects.all()]

        self.item_json = context['item_json'] = {
            'itemJSON': self.object.edit_dict(),
            'editable': self.editable,
            'item_type': self.object.editoritem.item_type,

            'licences': licences,
            'taxonomies': taxonomies,

            'ability_frameworks': [editor.views.generic.ability_framework_json(af) for af in editor.models.AbilityFramework.objects.all()],

            'previewURL': reverse('{}_preview'.format(self.object.editoritem.item_type), args=(self.object.pk, self.object.editoritem.slug)),
            'previewWindow': str(calendar.timegm(time.gmtime())),
            'current_stamp': editor.views.generic.stamp_json(self.object.editoritem.get_current_stamp()),
        }

        if self.editable:
            self.item_json['public_access'] = self.object.editoritem.public_access
            self.item_json['access_rights'] = context['access_rights']
            context['versions'] = [] # reversion.get_for_object(self.object)

        context['stamp_choices'] = editor.models.STAMP_STATUS_CHOICES

        context['preferred_locale'] = self.request.user.userprofile.language if not self.request.user.is_anonymous else 'en-GB'
        context['locale_files'] = [code for name, code in settings.GLOBAL_SETTINGS['NUMBAS_LOCALES']]

        breadcrumbs = []
        ei = self.object.editoritem
        f = ei.folder
        while f:
            breadcrumbs.insert(0,f)
            f = f.parent
        context['breadcrumbs'] = breadcrumbs

        stamps_per_user = {}
        for s in ei.stamps.all():
            if not s.user in stamps_per_user:
                stamps_per_user[s.user] = s
        project_members = ei.project.members()
        sorted_stamps = sorted(stamps_per_user.values(), key=lambda s:s.date, reverse=True)
        context['individual_stamps_in_project'] = [s for s in sorted_stamps if s.user in project_members]
        context['individual_stamps_outside_project'] = [s for s in sorted_stamps if s.user not in project_members]

        return context


class ListView(generic.ListView):
    model = EditorItem
    table_class = EditorItemTable
    results_per_page = 10

    def make_table(self):
        config = RequestConfig(self.request, paginate={'per_page': self.results_per_page})
        results = self.table_class(self.object_list)

        order_by = self.form.cleaned_data.get('order_by')
        if order_by in ('last_modified', 'licence'):
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
    
    template_name = 'editoritem/search.html'
    results_per_page = 30

    def base_queryset(self):
        return EditorItem.objects

    def get_viewable_items(self):
        return self.base_queryset().filter(EditorItem.filter_can_be_viewed_by(self.request.user))

    def get_queryset(self):

        data = deepcopy(self.request.GET)
        form = self.form = editor.forms.EditorItemSearchForm(data)
        for field in ('usage', 'item_types', 'order_by', 'tags'):
            form.data.setdefault(field, form.fields[field].initial)
        form.is_valid()

        items = self.get_viewable_items()

        # filter based on tags
        tags = self.tags = form.cleaned_data.get('tags')
        if tags:
            for tag in tags:
                items = items.filter(tags__name__icontains=tag)

        exclude_tags = self.exclude_tags = form.cleaned_data.get('exclude_tags')
        self.filter_exclude_tags = Q()
        if exclude_tags:
            for tag in exclude_tags:
                self.filter_exclude_tags = self.filter_exclude_tags & Q(tags__name__icontains=tag)
            items = items.exclude(self.filter_exclude_tags)

        # filter based on query
        query = self.query = form.cleaned_data.get('query')
        self.filter_query = Q()
        if query:
            words = [w for w in re.split(r'\s+', query) if w != '']
            for word in words:
                self.filter_query = self.filter_query & (Q(name__icontains=word) | Q(metadata__icontains=word))
            items = items.filter(self.filter_query)

        # filter based on item type
        item_types = self.item_types = form.cleaned_data.get('item_types', [])
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
            d = ability_levels.aggregate(Min('start'), Max('end'))
            start = d['start__min']
            end = d['end__max']
            self.filter_ability_level = Q(ability_level_start__lt=end, ability_level_end__gt=start)
            items = items.filter(self.filter_ability_level)
        else:
            self.filter_ability_level = Q()

        # filter based on status
        status = form.cleaned_data.get('status')
        if status == 'draft':
            self.filter_status = Q(current_stamp=None)
            items = items.filter(self.filter_status)
        elif status and status != 'any':
            self.filter_status = Q(current_stamp__status=status)
            items = items.filter(self.filter_status)
        else:
            self.filter_status = Q()

        # filter based on taxonomy nodes
        taxonomy_nodes = form.cleaned_data.get('taxonomy_nodes')
        if taxonomy_nodes.exists():
            self.filter_taxonomy_node = Q(taxonomy_nodes__in=taxonomy_nodes)
            items = items.filter(self.filter_taxonomy_node).annotate(num_nodes=Count('taxonomy_nodes')).filter(num_nodes=taxonomy_nodes.count())
        else:
            self.filter_taxonomy_node = Q()

        items = items.distinct()

        return items

    def get_context_data(self, **kwargs):
        if not hasattr(self,'object_list'):
            self.object_list = self.get_queryset()
        context = super(SearchView, self).get_context_data(**kwargs)

        context['taxonomies'] = [{'pk':taxonomy.pk, 'name': taxonomy.name, 'description': taxonomy.description, 'nodes': taxonomy.json} for taxonomy in Taxonomy.objects.all()]
        context['used_taxonomy_nodes'] = [n.pk for n in self.form.cleaned_data.get('taxonomy_nodes')]
        context['form'] = self.form
        context['item_types'] = self.form.cleaned_data.get('item_types')
        context['search_query'] = self.query
        context['ability_level_field'] = zip(self.form.fields['ability_levels'].queryset, self.form['ability_levels'])
        context['search_params'] = [(k,self.request.GET.get(k,None)) for k in self.form.data if k not in ['query','page']]

        return context

class CompileError(Exception):
    def __init__(self, message, stdout='', stderr='', code=0):
        super(CompileError, self).__init__()
        self.message = message
        self.stdout = stdout
        self.stderr = stderr
        self.code = code
    def __str__(self):
        return 'Compilation failed: {}\n\nStdout:\n{}\nStderr:\n{}\nExit code: {}'.format(self.message, self.stdout, self.stderr, self.code)
    
class ExtensionNotFoundCompileError(CompileError):
    pass

class CompileObject():
    
    """Compile an exam or question."""

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        if self.editoritem.can_be_viewed_by(self.request.user):
            return self.access_valid()
        else:
            token = self.request.GET.get('token','')
            if token==str(self.editoritem.share_uuid_view):
                return self.access_valid()
            else:
                return forbidden(self.request)

    def get_object(self):
        obj = super(CompileObject,self).get_object()
        self.editoritem = obj.editoritem
        self.numbasobject = self.editoritem.as_numbasobject(self.request)
        return obj

    def get_locale(self):
        if self.editoritem.item_type == 'exam':
            return self.editoritem.exam.locale
        elif not self.request.user.is_anonymous:
            return self.request.user.userprofile.language
        else:
            return 'en-GB'

    def add_extensions(self):
        extensions = editor.models.Extension.objects.filter(location__in=self.numbasobject.data.get('extensions', []))
        extension_paths = [Path.cwd() / e.extracted_path for e in extensions]
        for extracted_path in extension_paths:
            if not extracted_path.exists():
                raise ExtensionNotFoundCompileError("Extension not found at {}. Is MEDIA_ROOT configured correctly? It should be the absolute path to your editor media directory.".format(extracted_path))
        self.numbasobject.data['extensions'] = [str(p) for p in extension_paths]

    def output_location(self):
        return Path(settings.GLOBAL_SETTINGS['PREVIEW_PATH']) / self.location

    def compile(self, switches):
        """
            Construct a temporary exam/question file and compile it.
            Returns the path to the output produced
        """

        self.add_extensions()
        source = str(self.numbasobject)

        theme_path = Path(self.editoritem.theme_path if hasattr(self.editoritem, 'theme_path') else 'default')
        if not theme_path.exists():
            raise CompileError("Theme not found at {}. Is MEDIA_ROOT configured correctly? It should be the absolute path to your editor media directory.".format(theme_path))

        output_location = self.output_location()
        locale = self.get_locale()

        numbas_command = [
            settings.GLOBAL_SETTINGS['PYTHON_EXEC'],
            str(Path(settings.GLOBAL_SETTINGS['NUMBAS_PATH']) / 'bin' / 'numbas.py'),
            '--pipein',
            '-p'+settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
            '-o'+str(output_location),
            '-t'+str(theme_path),
            '-l'+locale,
            '--mathjax-url',self.get_mathjax_url()
        ] + switches

        if settings.DEBUG:
            numbas_command += ['--show_traceback']

        process = subprocess.Popen(numbas_command, stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate(source.encode('utf-8'))
        code = process.poll()
        if code != 0:
            raise CompileError('Compilation failed.', stdout=stdout.decode('utf-8'), stderr=stderr.decode('utf-8'), code=code)
        else:
            return output_location

    def get_mathjax_url(self):
        if self.request.user.is_anonymous or self.request.user.userprofile.mathjax_url=='':
            return settings.MATHJAX_URL
        else:
            return self.request.user.userprofile.mathjax_url
    
    def get_error_response(self, error):
        template = get_template("compile/error.html")
        return http.HttpResponseServerError(template.render(RequestContext(self.request, {
            'message': error.message,
            'stdout': error.stdout,
            'stderr': error.stderr,
            'code': error.code,
        }).flatten()))

class PreviewView(CompileObject, generic.DetailView):
    template_name = 'editoritem/preview.html'

    def should_compile(self):
        output_location = self.output_location()
        if not output_location.exists():
            return True
        mtime = make_aware(datetime.fromtimestamp(output_location.stat().st_mtime))
        if mtime<self.editoritem.last_modified:
            return True
        return 'refresh' in self.request.GET

    def access_valid(self):
        self.location = self.editoritem.filename

        switches = ['-c']

        if self.should_compile():
            try:
                self.compile(switches)
            except CompileError as err:
                return self.get_error_response(err)

        if 'refresh' in self.request.GET:
            return redirect(self.request.path)

        exam_url = settings.GLOBAL_SETTINGS['PREVIEW_URL'] + self.location + '/index.html'

        embed_url = reverse(self.editoritem.item_type+'_embed',args=(self.object.pk,self.editoritem.slug))
        if not self.editoritem.published:
            embed_url += '?token='+str(self.editoritem.share_uuid_view)

        context = {
            'item': self.editoritem,
            'exam_url': exam_url,
            'embed_url': embed_url,
        }

        return self.render_to_response(context)

class OembedView(generic.DetailView):
    model = EditorItem

    def render_to_response(self, ctx):
        if not self.object.published:
            return http.HttpResponseNotFound()

        maxwidth = int(self.request.GET.get('maxwidth',600))
        maxheight = int(self.request.GET.get('maxheight',600))

        width = maxwidth
        height = maxheight

        embed_url = reverse(self.object.item_type+'_embed',args=(self.object.rel_obj.pk,self.object.slug))
        SITE_ROOT = site_root_url(self.request)
        return http.JsonResponse({
            'version': '1.0',
            'type': 'rich',
            'html': '<iframe width="{width}" height="{height}" src="{embed_url}"></iframe>'.format(embed_url=SITE_ROOT+embed_url,width=width,height=height),
            'width': width,
            'height': height,
        })

@method_decorator(xframe_options_exempt, name='dispatch')
class EmbedView(PreviewView):
    template_name = 'editoritem/embed.html'
        
class ZipView(CompileObject, generic.DetailView):
    def access_valid(self):
        scorm = 'scorm' in self.request.GET

        switches = ['-cz']

        if settings.GLOBAL_SETTINGS.get('MINIFIER_PATH'):
            switches += ['--minify', settings.GLOBAL_SETTINGS['MINIFIER_PATH']]
        if scorm:
            switches.append('-s')

        self.location = self.editoritem.filename + '.zip'

        try:
            fsLocation = str(self.compile(switches))
        except CompileError as err:
            return self.get_error_response(err)
        else:
            wrapper = FileWrapper(open(fsLocation, 'rb'))
            response = http.HttpResponse(wrapper, content_type='application/zip')
            response['Content-Disposition'] = 'attachment; filename={}.zip'.format(self.editoritem.filename)
            response['Content-Length'] = os.path.getsize(fsLocation)
            response['Cache-Control'] = 'max-age=0,no-cache,no-store'
            return response

class SourceView(generic.DetailView):

    def get_editoritem(self):
        obj = self.get_object()
        self.editoritem = obj.editoritem
        return self.editoritem

    def get(self, request, *args, **kwargs):
        try:
            ei = self.get_editoritem()
        except (ObjectDoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return http.HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')

        source = self.get_source()
        response = http.HttpResponse(str(source), 'text/plain')
        response['Content-Disposition'] = 'attachment; filename={}.exam'.format(ei.filename)
        response['Cache-Control'] = 'max-age=0,no-cache,no-store'
        return response

    def get_source(self):
        source = self.editoritem.as_numbasobject(self.request)
        return source

class PublishView(generic.UpdateView):
    model = EditorItem
    fields = ['published']
    
    def get_success_url(self):
        ei = self.get_object()
        return reverse('{}_edit'.format(ei.item_type), args=(ei.rel_obj.pk, ei.slug,)) 

    def get(self, *args, **kwargs):
        return redirect(self.get_success_url())

    def post(self, request, *args, **kwargs):
        ei = self.get_object()
        ei.publish()
        ei.save()
        editor.models.ItemChangedTimelineItem.objects.create(user=self.request.user, object=ei, verb='published')
        messages.add_message(self.request, messages.SUCCESS, 'This {} has been published to the public database.'.format(ei.item_type))
        return redirect(self.get_success_url())

class UnPublishView(PublishView):
    def post(self, request, *args, **kwargs):
        ei = self.get_object()
        ei.unpublish()
        ei.save()
        messages.add_message(self.request, messages.INFO, 'This {} has been unpublished from the public database.'.format(ei.item_type))
        return redirect(self.get_success_url())

class SetAccessView(generic.UpdateView):
    model = EditorItem
    form_class = editor.forms.SetAccessForm

    def get_form_kwargs(self):
        kwargs = super(SetAccessView, self).get_form_kwargs()
        kwargs['data'] = self.request.POST.copy()
        kwargs['data'].update({'given_by':self.request.user.pk})
        return kwargs

    def form_valid(self, form):
        item = self.get_object()

        if not item.can_be_edited_by(self.request.user):
            return http.HttpResponseForbidden("You don't have permission to edit this item.")

        self.object = form.save()

        return http.HttpResponse('ok!')

    def form_invalid(self, form):
        return http.HttpResponse(form.errors.as_text())

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'], 'GET requests are not allowed at this URL.')

class MoveProjectView(MustBeAuthorMixin, ProjectQuerysetMixin, generic.UpdateView):
    model = EditorItem
    form_class = editor.forms.EditorItemMoveProjectForm
    template_name = 'editoritem/move_project.html'

    def get_success_url(self):
        return self.get_object().get_absolute_url()

class CompareView(generic.TemplateView):

    template_name = "editoritem/compare.html"

    def get_context_data(self, pk1, pk2, **kwargs):
        context = super(CompareView, self).get_context_data(**kwargs)
        pk1 = int(pk1)
        pk2 = int(pk2)
        ei1 = context['ei1'] = EditorItem.objects.get(pk=pk1)
        ei2 = context['ei2'] = EditorItem.objects.get(pk=pk2)
        context['pr1_exists'] = PullRequest.objects.open().filter(source=ei1, destination=ei2).exists()
        context['pr2_exists'] = PullRequest.objects.open().filter(source=ei2, destination=ei1).exists()
        context['pr1_auto'] = ei2.can_be_edited_by(self.request.user)
        context['pr2_auto'] = ei1.can_be_edited_by(self.request.user)
        return context

class CreatePullRequestView(generic.CreateView):
    model = PullRequest
    form_class = editor.forms.CreatePullRequestForm

    template_name = "pullrequest/new.html"

    def form_valid(self, form):
        owner = self.request.user

        source = form.instance.source
        destination = form.instance.destination

        self.pr = PullRequest(owner=owner, source=source, destination=destination, comment=form.instance.comment)
        try:
            self.pr.full_clean()
        except ValidationError:
            return redirect('editoritem_compare', args=(source.pk, destination.pk))

        self.pr.save()

        if self.pr.destination.can_be_edited_by(owner):
            self.pr.accept(owner)
            messages.add_message(self.request, messages.SUCCESS, render_to_string('pullrequest/accepted_message.html', {'pr':self.pr}))
            return redirect(self.pr.destination.get_absolute_url())
        else:
            messages.add_message(self.request, messages.INFO, render_to_string('pullrequest/created_message.html', {'pr':self.pr}))
            return redirect(self.pr.source.get_absolute_url())

    def get_context_data(self, *args, **kwargs):
        context = super(CreatePullRequestView, self).get_context_data(**kwargs)

        context['source'] = EditorItem.objects.get(pk=int(self.request.GET.get('source')))
        context['destination'] = EditorItem.objects.get(pk=int(self.request.GET.get('destination')))

        return context

class ClosePullRequestView(generic.UpdateView):

    model = PullRequest

    def post(self, request, *args, **kwargs):
        pr = self.get_object()

        if not pr.can_be_merged_by(request.user):
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

        action = request.POST.get('action')
        if action == 'accept':
            pr.accept(request.user)
            messages.add_message(self.request, messages.SUCCESS, render_to_string('pullrequest/accepted_message.html', {'pr':pr}))
            return redirect(pr.destination.get_absolute_url())
        elif action == 'reject':
            pr.reject(self.request.user)
            messages.add_message(self.request, messages.INFO, render_to_string('pullrequest/rejected_message.html', {'pr':pr}))
            return redirect(pr.destination.get_absolute_url()+'#network')

class TransferOwnershipView(generic.UpdateView):
    model = EditorItem
    template_name = 'editoritem/transfer_ownership.html'
    form_class = editor.forms.EditorItemTransferOwnershipForm
    context_object_name = 'item'

    def dispatch(self, request, *args, **kwargs):
        ei = self.get_object()
        if request.user not in [ei.author, ei.project.owner]:
            raise PermissionDenied
        return super(TransferOwnershipView, self).dispatch(request, *args, **kwargs)

    def get_success_url(self):
        return self.get_object().get_absolute_url()

    def form_valid(self, form):
        messages.add_message(self.request, messages.SUCCESS, render_to_string('editoritem/ownership_transferred_message.html', {'to':form.cleaned_data.get('user_search'), 'item':self.get_object()}))
        return super(TransferOwnershipView, self).form_valid(form)

class RecentlyPublishedView(ListView):
    template_name = 'editoritem/recently_published.html'
    table_class = RecentlyPublishedTable
    
    def make_table(self):
        config = RequestConfig(self.request, paginate={'per_page': 10})
        results = self.table_class(self.object_list)
        config.configure(results)
        return results

    def get_queryset(self):
        return EditorItem.objects.filter(published=True)

class RecentlyPublishedFeed(Feed):
    title = "{} - Recently published items".format(settings.SITE_TITLE)
    link = '/items/recently-published'
    description = "Recently published exams and questions on {}".format(settings.SITE_TITLE)

    def items(self):
        return EditorItem.objects.filter(published=True).order_by('-published_date')

    def item_title(self, item):
        return item.name

    def item_description(self, item):
        data = item.get_parsed_content()
        metadata = data.data.get('metadata', {})
        return metadata.get('description','No description')
