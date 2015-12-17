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

from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.template.loader import render_to_string
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.db import transaction
from django import http
from django.shortcuts import render,redirect
from django.views import generic

import reversion

from django_tables2.config import RequestConfig

from editor.tables import EditorItemTable
from editor.models import EditorItem
import editor.models
import editor.views.generic
from editor.views.errors import forbidden
from editor.views.user import find_users
from editor.views.version import version_json
from editor.views.timeline import timeline_json
import editor.forms

from numbasobject import NumbasObject
from examparser import ParseError

class ListView(generic.ListView):
    model = EditorItem
    table_class = EditorItemTable

    def make_table(self):
        config = RequestConfig(self.request, paginate={'per_page': 10})
        results = self.table_class(self.object_list)
        config.configure(results)

        return results

    def get_context_data(self, **kwargs):
        context = super(ListView, self).get_context_data(**kwargs)
        context['results'] = self.make_table()

        return context

class SearchView(ListView):
    
    """Search exams."""
    template_name = 'editoritem/search.html'

    def get_queryset(self):

        data = deepcopy(self.request.GET)
        form = self.form = editor.forms.EditorItemSearchForm(data)
        for field in ('usage','item_types'):
            form.data.setdefault(field,form.fields[field].initial)
        form.is_valid()

        items = EditorItem.objects.filter(EditorItem.filter_can_be_viewed_by(self.request.user))

        # filter based on item type
        item_types = self.item_types = form.cleaned_data.get('item_types')
        if item_types=='exams':
            items = items.filter(exam__isnull=False)
        elif item_types=='questions':
            items = items.filter(question__isnull=False)

        # filter based on query
        query = self.query = form.cleaned_data.get('query')
        filter_query = Q()
        if query:
            words = [w for w in re.split(r'\s+',query) if w!='']
            for word in words:
                filter_query = filter_query & (Q(name__icontains=word) | Q(metadata__icontains=word) )
            print(filter_query)
            items = items.filter(filter_query)

        # filter based on author
        author_term = form.cleaned_data.get('author')
        if author_term:
            authors = find_users(author_term)
            filter_authors = Q(author__in=authors)
            items = items.filter(filter_authors)
        else:
            filter_authors = Q()

        # filter based on subject
        subjects = form.cleaned_data.get('subjects')
        if subjects and len(subjects):
            filter_subjects = Q(subjects__in=subjects)
            items = items.filter(filter_subjects)
        else:
            filter_subjects = Q()

        # filter based on topic
        topics = form.cleaned_data.get('topics')
        if topics and len(topics):
            filter_topics = Q(topics__in=topics)
            items = items.filter(filter_topics)
        else:
            filter_topics = Q()

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
            filter_usage = usage_filters[usage]
            items = items.filter(filter_usage)
        else:
            filter_usage = Q()

        #filter based on status
        status = form.cleaned_data.get('status')
        if status and status!='any':
            filter_status = Q(current_stamp__status=status)
            items = items.filter(filter_status)
        else:
            filter_status = Q()

        items = items.distinct()

        return items

    def get_context_data(self, **kwargs):
        context = super(SearchView,self).get_context_data(**kwargs)
        context['form'] = self.form
        context['item_types'] = self.form.cleaned_data.get('item_types')
        context['search_query'] = self.query
        context['ability_level_field'] = zip(self.form.fields['ability_levels'].queryset,self.form['ability_levels'])

        return context
