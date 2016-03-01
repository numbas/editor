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

from editor.views import project, editoritem, exam, question, HomeView, theme, extension, version, generic, notification
from editor.views.resource import upload_resource, ImageDeleteView, media_view
from editor.views.basket import BasketView,add_question_to_basket,create_exam_from_basket,remove_question_from_basket,empty_question_basket


urlpatterns = patterns('',

    # Home

    url(r'^$', HomeView.as_view(), name='editor_index'),

    # Search

    url(r'^search/$', editoritem.SearchView.as_view(), name='search'),

    # Projects

	url(r'^project/new$', login_required(project.CreateView.as_view()), name='project_new'),
    url(r'^project/(?P<pk>\d+)/$', project.IndexView.as_view(), name='project_index'),
    url(r'^project/(?P<pk>\d+)/delete$', project.DeleteView.as_view(), name='project_delete'),
    url(r'^project/(?P<pk>\d+)/settings/options$', project.OptionsView.as_view(), name='project_settings_options'),
    url(r'^project/(?P<pk>\d+)/settings/members$', project.ManageMembersView.as_view(), name='project_settings_members'),
    url(r'^project/(?P<pk>\d+)/settings/add_member$', project.AddMemberView.as_view(), name='project_settings_add_member'),
    url(r'^project/(?P<pk>\d+)/settings/transfer_ownership$', project.TransferOwnershipView.as_view(), name='project_transfer_ownership'),

    url(r'^project/(?P<pk>\d+)/search/$', project.SearchView.as_view(), name='project_search'),

    # Editor items

    url(r'^item/(?P<pk>\d+)/preview/$', editoritem.PreviewView.as_view(), name='item_preview'),

    url(r'^item/(?P<pk>\d+)/publish$',
        editoritem.PublishView.as_view(),name='item_publish'),

    url(r'^item/(?P<pk>\d+)/set-access$',
        editoritem.SetAccessView.as_view(),name='set_access'),

    # Exams

    url(r'^exam/new/$', login_required(exam.CreateView.as_view()), name='exam_new'),
    
    url(r'^exam/upload/$', exam.UploadView.as_view(), name='exam_upload'),
                       
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
                       
    url(r'^exam/share/(?P<access>(view|edit))/(?P<share_uuid>.*)$',
        login_required(exam.ShareLinkView.as_view()),name='share_exam'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/stamp$',
        login_required(exam.StampView.as_view()),name='stamp_exam'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/comment$',
        login_required(exam.CommentView.as_view()),name='comment_on_exam'),

    url(r'^exams/compare/(?P<pk1>\d+)/(?P<pk2>\d+)$',
        exam.CompareView.as_view(), name='exam_compare'),

    url(r'exam/question-lists/$',
        exam.question_lists,
        name='question_lists'),

    # Questions

    url(r'^question/new/$', login_required(question.CreateView.as_view()), name='question_new'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/$',
        question.UpdateView.as_view(), name='question_edit'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/revert/(?P<version>\d+)$',
        question.RevertView.as_view(), name='question_revert'),

    url(r'^question/share/(?P<access>(view|edit))/(?P<share_uuid>.*)$',
        login_required(question.ShareLinkView.as_view()),name='share_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/comment$',
        login_required(question.CommentView.as_view()),name='comment_on_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/stamp$',
        login_required(question.StampView.as_view()),name='stamp_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/upload-resource$',
        upload_resource,name='upload_resource'),

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

    url(r'^questions/compare/(?P<pk1>\d+)/(?P<pk2>\d+)$',
        question.CompareView.as_view(), name='question_compare'),

    url(r'^questions/merge/(?P<source>\d+)/into/(?P<destination>\d+)$',
        question.CreatePullRequestView.as_view(), name='question_pullrequest'),

    # Resources

    url(r'^resources/(?P<pk>\d+)/delete$',
        login_required(ImageDeleteView.as_view()), name='delete_resource'),

    # Pull requests

    url(r'^pullrequest/(?P<pk>\d+)/accept$',
        question.AcceptPullRequestView.as_view(), name='question_pullrequest_accept'),

    url(r'^pullrequest/(?P<pk>\d+)/reject$',
        question.RejectPullRequestView.as_view(), name='question_pullrequest_reject'),

    # Comments

    url(r'^comment/(?P<pk>\d+)/delete$',
        generic.DeleteCommentView.as_view(), name='delete_comment'),

    # Timeline items

    url(r'^timelineitem/(?P<pk>\d+)/delete$',
        generic.DeleteTimelineItemView.as_view(), name='timelineitem_delete'),

    # Versions

    url(r'version/(?P<pk>\d+)/update', login_required(version.UpdateView.as_view()), name='edit_version'),

    # Themes

    url(r'^theme/new/$', login_required(theme.CreateView.as_view()), name='theme_new'),
    url(r'^themes/$', login_required(theme.ListView.as_view()), name='theme_list'),
    url(r'^themes/(?P<pk>\d+)/edit$', login_required(theme.UpdateView.as_view()), name='theme_edit'),
    url(r'^themes/(?P<pk>\d+)/delete$', login_required(theme.DeleteView.as_view()), name='theme_delete'),

    # Extensions

    url(r'^extension/new/$', login_required(extension.CreateView.as_view()), name='extension_new'),
    url(r'^extensions/$', login_required(extension.ListView.as_view()), name='extension_list'),
    url(r'^extensions/(?P<pk>\d+)/edit$', login_required(extension.UpdateView.as_view()), name='extension_edit'),
    url(r'^extensions/(?P<pk>\d+)/delete$', login_required(extension.DeleteView.as_view()), name='extension_delete'),

    # Notifications

    url(r'notification/(?P<pk>\d+)/open', notification.OpenNotification.as_view(permanent=False), name='open_notification'),

    # Question basket

    url(r'question_basket/$',
        BasketView.as_view(),
        name='basket'),
    url(r'question_basket/add/$',
        login_required(add_question_to_basket),
        name='add_question_to_basket'),
    url(r'question_basket/remove/$',
        login_required(remove_question_from_basket),
        name='remove_question_from_basket'),
    url(r'question_basket/create_exam/$',
        login_required(create_exam_from_basket),
        name='create_exam_from_basket'),
    url(r'question_basket/empty/$',
        login_required(empty_question_basket),
        name='empty_question_basket'),

)
