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
from django.conf import settings
from django.conf.urls.defaults import *
from django.views.generic import RedirectView, TemplateView
from django.contrib import admin,auth

from django.contrib.auth.decorators import login_required

from editor.views.exam import ExamPreviewView, ExamZipView, ExamSourceView, ExamCreateView, ExamCopyView, ExamUploadView, ExamDeleteView, ExamListView, ExamSearchView, ExamUpdateView
from editor.views.question import QuestionPreviewView, QuestionZipView, QuestionSourceView, QuestionCreateView, QuestionCopyView, QuestionUploadView, QuestionDeleteView, QuestionListView, QuestionSearchView, QuestionUpdateView
from editor.views.user import UserSearchView

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', TemplateView.as_view(template_name='index.html'),
        name='editor_index'),

    url(r'^admin/',include(admin.site.urls)),

	url(r'^login/','django.contrib.auth.views.login',{'template_name':'auth/login.html'},name='login'),
	url(r'^logout/','django.contrib.auth.views.logout',{'next_page':'/'},name='logout'),
                       
    url(r'^exams/$',login_required(ExamListView.as_view()), name='exam_index',),
                       
    url(r'^exam/new/$', login_required(ExamCreateView.as_view()), name='exam_new'),
    
    url(r'^exam/upload/$', ExamUploadView.as_view(), name='exam_upload'),
                       
    url(r'^exam/search/$', ExamSearchView.as_view(), name='exam_search'),
    
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/$', login_required(ExamUpdateView.as_view()),
        name='exam_edit'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/copy/$',ExamCopyView.as_view(), name='exam_copy',),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/delete/$',
        login_required(ExamDeleteView.as_view()), name='exam_delete'),
    
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/preview/$',
        ExamPreviewView.as_view(), name='exam_preview'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+).zip$',
        ExamZipView.as_view(), name='exam_download'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+).exam$',
        ExamSourceView.as_view(), name='exam_source'),
                       
    url(r'^questions/$', login_required(QuestionListView.as_view()), name='question_index',),
    
    url(r'^question/new/$', login_required(QuestionCreateView.as_view()), name='question_new'),

    url(r'^question/upload/$', QuestionUploadView.as_view(), name='question_upload'),

    url(r'^question/search/$', QuestionSearchView.as_view(), name='question_search',),
    
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/$',
        login_required(QuestionUpdateView.as_view()), name='question_edit'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/copy/$',QuestionCopyView.as_view(), name='question_copy',),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/delete/$',
        login_required(QuestionDeleteView.as_view()), name='question_delete'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/preview/$',
        QuestionPreviewView.as_view(), name='question_preview'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+).zip$',
        QuestionZipView.as_view(), name='question_download'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+).exam$',
        QuestionSourceView.as_view(), name='question_source'),

	url(r'^users/search/$',UserSearchView.as_view(),name='user_search'),
)
