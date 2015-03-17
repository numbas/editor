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
from django.conf.urls import *
from django.views.generic import RedirectView, TemplateView

from django.contrib.auth.decorators import login_required

from editor.views import exam, question, HomeView, theme, extension, version, generic, notification
from editor.views.user import UserSearchView
from editor.views.resource import upload_resource, ImageDeleteView, media_view


urlpatterns = patterns('',
    url(r'^$', HomeView.as_view(), name='editor_index'),

    url(r'^exams/$',exam.IndexView.as_view(), name='exam_index',),
                       
    url(r'^exam/new/$', login_required(exam.CreateView.as_view()), name='exam_new'),
    
    url(r'^exam/upload/$', exam.UploadView.as_view(), name='exam_upload'),
                       
    url(r'^exams/search/$', exam.SearchView.as_view(), name='exam_search'),

    url(r'^exams/starred/$', exam.FavouritesView.as_view(), name='favourite_exams',),
    
    url(r'^exams/highlights/$', exam.HighlightsView.as_view(), name='highlighted_exams',),
    
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/$', exam.UpdateView.as_view(),
        name='exam_edit'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/revert/(?P<version>\d+)$',
        exam.RevertView.as_view(), name='exam_revert'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/copy/$',login_required(exam.CopyView.as_view()), name='exam_copy',),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/delete/$',
        login_required(exam.DeleteView.as_view()), name='exam_delete'),
    
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/preview/$',
        exam.PreviewView.as_view(), name='exam_preview'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+).zip$',
        exam.ZipView.as_view(), name='exam_download'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+).exam$',
        exam.SourceView.as_view(), name='exam_source'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/set-access$',
        exam.SetAccessView.as_view(),name='set_exam_access'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/highlight$',
        login_required(exam.HighlightView.as_view()),name='highlight_exam'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/stamp$',
        login_required(exam.StampView.as_view()),name='stamp_exam'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/comment$',
        login_required(exam.CommentView.as_view()),name='comment_on_exam'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/set-star$',
        login_required(exam.SetStarView.as_view()),name='set_exam_star'),

    url(r'^questions/$', question.IndexView.as_view(), name='question_index',),

    url(r'^question/new/$', login_required(question.CreateView.as_view()), name='question_new'),

    url(r'^question/upload/$', question.UploadView.as_view(), name='question_upload'),

    url(r'^questions/search/(\?q=(?P<query>.+))?$', question.SearchView.as_view(), name='question_search',),

    url(r'^questions/recent/$', question.RecentQuestionsView.as_view(), name='recent_questions',),

    url(r'^questions/starred/$', question.FavouritesView.as_view(), name='favourite_questions',),
    
    url(r'^questions/highlights/$', question.HighlightsView.as_view(), name='highlighted_questions',),
    
    url(r'^questions/search/json$', question.JSONSearchView.as_view(), name='question_search_json',),
    
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/$',
        question.UpdateView.as_view(), name='question_edit'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/revert/(?P<version>\d+)$',
        question.RevertView.as_view(), name='question_revert'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/upload-resource$',
        upload_resource,name='upload_resource'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/set-access$',
        question.SetAccessView.as_view(),name='set_question_access'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/set-star$',
        login_required(question.SetStarView.as_view()),name='set_question_star'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/comment$',
        login_required(question.CommentView.as_view()),name='comment_on_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/stamp$',
        login_required(question.StampView.as_view()),name='stamp_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/highlight$',
        login_required(question.HighlightView.as_view()),name='highlight_question'),

    url(r'^resources/(?P<pk>\d+)/delete$',
        login_required(ImageDeleteView.as_view()), name='delete_resource'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/resources/(?P<resource>.*)$',
        media_view, name='view_resource'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/copy/$',login_required(question.CopyView.as_view()), name='question_copy',),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/delete/$',
        login_required(question.DeleteView.as_view()), name='question_delete'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/preview/$',
        question.PreviewView.as_view(), name='question_preview'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+).zip$',
        question.ZipView.as_view(), name='question_download'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+).exam$',
        question.SourceView.as_view(), name='question_source'),

    url(r'^comment/(?P<pk>\d+)/delete$',
        generic.DeleteCommentView.as_view(), name='delete_comment'),

    url(r'^stamp/(?P<pk>\d+)/delete$',
        generic.DeleteStampView.as_view(), name='delete_stamp'),

    url(r'^users/search/$',UserSearchView.as_view(),name='user_search'),

    url(r'^theme/new/$', login_required(theme.CreateView.as_view()), name='theme_new'),
    url(r'^themes/$', login_required(theme.ListView.as_view()), name='theme_list'),
    url(r'^themes/(?P<pk>\d+)/edit$', login_required(theme.UpdateView.as_view()), name='theme_edit'),
    url(r'^themes/(?P<pk>\d+)/delete$', login_required(theme.DeleteView.as_view()), name='theme_delete'),

    url(r'^extension/new/$', login_required(extension.CreateView.as_view()), name='extension_new'),
    url(r'^extensions/$', login_required(extension.ListView.as_view()), name='extension_list'),
    url(r'^extensions/(?P<pk>\d+)/edit$', login_required(extension.UpdateView.as_view()), name='extension_edit'),
    url(r'^extensions/(?P<pk>\d+)/delete$', login_required(extension.DeleteView.as_view()), name='extension_delete'),

    url(r'version/(?P<pk>\d+)/update', login_required(version.UpdateView.as_view()), name='edit_version'),

	url(r'notification/(?P<pk>\d+)/open', notification.OpenNotification.as_view(), name='open_notification'),
)
