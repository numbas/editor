from django.conf.urls import url
from django.urls import path, re_path, include

from django.contrib.auth.decorators import login_required

from .views import project, folder, editoritem, exam, question, HomeView, \
    GlobalStatsView, ExploreView, TermsOfUseView, PrivacyPolicyView, TopSearchView, \
    theme, extension, generic, notification, resource, basket, timeline, \
    custom_part_type

urlpatterns = [

    # Home

    url(r'^$', HomeView.as_view(), name='editor_index'),

    # Global stats

    url(r'^stats/$', GlobalStatsView.as_view(), name='global_stats'),

    # Terms of use

    url(r'^terms-of-use/$', TermsOfUseView.as_view(), name='terms_of_use'),
    url(r'^privacy-policy/$', PrivacyPolicyView.as_view(), name='privacy_policy'),

    # Search

    url(r'^search/$', editoritem.SearchView.as_view(), name='search'),
    url(r'^top-search/$', TopSearchView.as_view(), name='top-search'),

    # Explore

    url(r'^explore/$', ExploreView.as_view(), name='explore'),

    # Projects

    url(r'^projects/public$', project.PublicProjectsView.as_view(), name='public_projects'),
    url(r'^project/new$', login_required(project.CreateView.as_view()), name='project_new'),
    url(r'^project/(?P<pk>\d+)/$', project.IndexView.as_view(), name='project_index'),
    url(r'^project/(?P<pk>\d+)/delete$', project.DeleteView.as_view(), name='project_delete'),
    url(r'^project/(?P<pk>\d+)/settings/options$', project.OptionsView.as_view(), name='project_settings_options'),
    url(r'^project/(?P<pk>\d+)/settings/members$', project.ManageMembersView.as_view(), name='project_settings_members'),
    url(r'^project/(?P<project_pk>\d+)/settings/add_member$', project.AddMemberView.as_view(), name='project_settings_add_member'),
    url(r'^project/(?P<pk>\d+)/settings/transfer_ownership$', project.TransferOwnershipView.as_view(), name='project_transfer_ownership'),

    url(r'^project/(?P<pk>\d+)/watch/$', project.WatchProjectView.as_view(), name='project_watch'),
    url(r'^project/(?P<pk>\d+)/unwatch/$', project.UnwatchProjectView.as_view(), name='project_unwatch'),
    url(r'^project/(?P<pk>\d+)/leave/$', project.LeaveProjectView.as_view(), name='project_leave'),

    url(r'^project/(?P<pk>\d+)/search/$', project.SearchView.as_view(), name='project_search'),
    re_path(r'^project/(?P<pk>\d+)/browse/(?P<path>(.*/)*)?$', project.BrowseView.as_view(), name='project_browse'),
    path(r'project/<int:project_pk>/new_folder', project.NewFolderView.as_view(), name='project_new_folder'),

    url(r'^project/(?P<pk>\d+)/comment$',
        login_required(project.CommentView.as_view()), name='comment_on_project'),


    path('folder/move', folder.MoveFolderView.as_view(), name='folder_move'),
    path('folder/move_project', folder.MoveProjectView.as_view(), name='folder_move_project'),
    path('folder/<int:pk>/rename', folder.RenameFolderView.as_view(), name='folder_rename'),
    path('folder/<int:pk>/delete', folder.DeleteFolderView.as_view(), name='folder_delete'),

    # Editor items

    url(r'^item/(?P<pk>\d+)/preview/$', editoritem.PreviewView.as_view(), name='item_preview'),

    url(r'^item/(?P<pk>\d+)/oembed/$', editoritem.OembedView.as_view(), name='item_oembed'),

    url(r'^item/(?P<pk>\d+)/publish$',
        editoritem.PublishView.as_view(), name='item_publish'),

    url(r'^item/(?P<pk>\d+)/unpublish$',
        editoritem.UnPublishView.as_view(), name='item_unpublish'),

    url(r'^item/(?P<pk>\d+)/set-access$',
        editoritem.SetAccessView.as_view(), name='set_access'),

    url(r'^item/(?P<pk>\d+)/move$',
        editoritem.MoveProjectView.as_view(), name='item_move_project'),

    url(r'^item/(?P<pk>\d+)/transfer_ownership$',
        editoritem.TransferOwnershipView.as_view(), name='item_transfer_ownership'),

    url(r'^items/compare/(?P<pk1>\d+)/(?P<pk2>\d+)$',
        editoritem.CompareView.as_view(), name='editoritem_compare'),

    url(r'^items/recently-published/feed$', editoritem.RecentlyPublishedFeed(), name='item_recently_published_feed'),
    url(r'^items/recently-published$', editoritem.RecentlyPublishedView.as_view(), name='item_recently_published'),

    # Exams

    url(r'^exam/new/$', login_required(exam.CreateView.as_view()), name='exam_new'),
    
    url(r'^exam/upload/$', exam.UploadView.as_view(), name='exam_upload'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/$', exam.UpdateView.as_view(),
        name='exam_edit'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/copy/$', login_required(exam.CopyView.as_view()), name='exam_copy',),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/delete/$',
        login_required(exam.DeleteView.as_view()), name='exam_delete'),
    
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/preview/$',
        exam.PreviewView.as_view(), name='exam_preview'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/embed/$',
        exam.EmbedView.as_view(), name='exam_embed'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+).zip$',
        exam.ZipView.as_view(), name='exam_download'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+).exam$',
        exam.SourceView.as_view(), name='exam_source'),
                       
    url(r'^exam/share/(?P<access>(view|edit))/(?P<share_uuid>.*)$',
        login_required(exam.ShareLinkView.as_view()), name='share_exam'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/stamp$',
        login_required(exam.StampView.as_view()), name='stamp_exam'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/comment$',
        login_required(exam.CommentView.as_view()), name='comment_on_exam'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)/restore-point$',
        login_required(exam.SetRestorePointView.as_view()), name='set_restore_point_on_exam'),

    url(r'^exam/question-lists/(?P<pk>\d+)/$',
        exam.question_lists,
        name='question_lists'),

    # Questions

    url(r'^question/new/$', login_required(question.CreateView.as_view()), name='question_new'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/$',
        question.UpdateView.as_view(), name='question_edit'),

    url(r'^question/share/(?P<access>(view|edit))/(?P<share_uuid>.*)$',
        login_required(question.ShareLinkView.as_view()), name='share_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/comment$',
        login_required(question.CommentView.as_view()), name='comment_on_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/stamp$',
        login_required(question.StampView.as_view()), name='stamp_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/restore-point$',
        login_required(question.SetRestorePointView.as_view()), name='set_restore_point_on_question'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/resources/(?P<resource>.*)$',
        resource.view_resource, name='view_resource'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/copy/$', login_required(question.CopyView.as_view()), name='question_copy',),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/delete/$',
        login_required(question.DeleteView.as_view()), name='question_delete'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/preview/$',
        question.PreviewView.as_view(), name='question_preview'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)/embed/$',
        question.EmbedView.as_view(), name='question_embed'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+).zip$',
        question.ZipView.as_view(), name='question_download'),

    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+).exam$',
        question.SourceView.as_view(), name='question_source'),

    # Resources

    url(r'^resource/upload',
        login_required(resource.upload_resource), name='upload_resource'),

    # Timeline items

    url(r'^timelineitem/(?P<pk>\d+)/hide$',
        timeline.HideTimelineItemView.as_view(), name='timelineitem_hide'),

    url(r'^timelineitem/(?P<pk>\d+)/unhide$',
        timeline.UnhideTimelineItemView.as_view(), name='timelineitem_unhide'),

    url(r'^timelineitem/(?P<pk>\d+)/delete$',
        timeline.DeleteTimelineItemView.as_view(), name='timelineitem_delete'),

    url(r'^stamp/(?P<pk>\d+)/delete$',
        generic.DeleteStampView.as_view(), name='stamp_delete'),

    url(r'^restore_point/(?P<pk>\d+)/revert$',
        generic.RevertRestorePointView.as_view(), name='restore_point_revert'),

    # Themes

    url(r'^theme/new/$', login_required(theme.CreateView.as_view()), name='theme_new'),
    url(r'^theme/upload/$', login_required(theme.UploadView.as_view()), name='theme_upload'),
    url(r'^themes/(?P<pk>\d+)/download$', login_required(theme.DownloadView.as_view()), name='theme_download'),
    url(r'^themes/(?P<pk>\d+)/edit$', login_required(theme.UpdateView.as_view()), name='theme_edit'),
    url(r'^themes/(?P<pk>\d+)/edit_source$', login_required(theme.EditView.as_view()), name='theme_edit_source'),
    url(r'^themes/(?P<pk>\d+)/replace_file$', login_required(theme.ReplaceFileView.as_view()), name='theme_replace_file'),
    url(r'^themes/(?P<pk>\d+)/documentation$', theme.DocumentationView.as_view(), name='theme_documentation'),
    url(r'^themes/(?P<pk>\d+)/access$', login_required(theme.AccessView.as_view()), name='theme_access'),
    url(r'^themes/(?P<theme_pk>\d+)/access/add$', login_required(theme.AddAccessView.as_view()), name='theme_add_access'),
    url(r'^themes/(?P<pk>\d+)/delete$', login_required(theme.DeleteView.as_view()), name='theme_delete'),
    url(r'^themes/(?P<pk>\d+)/delete_file$', login_required(theme.DeleteFileView.as_view()), name='theme_delete_file'),

    # Extensions

    url(r'^extension/new/$', login_required(extension.CreateView.as_view()), name='extension_new'),
    url(r'^extension/upload/$', login_required(extension.UploadView.as_view()), name='extension_upload'),
    url(r'^extensions/(?P<pk>\d+)/download$', login_required(extension.DownloadView.as_view()), name='extension_download'),
    url(r'^extensions/(?P<pk>\d+)/edit$', login_required(extension.UpdateView.as_view()), name='extension_edit'),
    url(r'^extensions/(?P<pk>\d+)/replace_file$', login_required(extension.ReplaceFileView.as_view()), name='extension_replace_file'),
    url(r'^extensions/(?P<pk>\d+)/edit_source$', login_required(extension.EditView.as_view()), name='extension_edit_source'),
    url(r'^extensions/(?P<pk>\d+)/documentation$', extension.DocumentationView.as_view(), name='extension_documentation'),
    url(r'^extensions/(?P<pk>\d+)/access$', login_required(extension.AccessView.as_view()), name='extension_access'),
    url(r'^extensions/(?P<extension_pk>\d+)/access/add$', login_required(extension.AddAccessView.as_view()), name='extension_add_access'),
    url(r'^extensions/(?P<pk>\d+)/delete$', login_required(extension.DeleteView.as_view()), name='extension_delete'),
    url(r'^extensions/(?P<pk>\d+)/delete_file$', login_required(extension.DeleteFileView.as_view()), name='extension_delete_file'),

    # Custom part types
    url(r'^part_type/new/$', login_required(custom_part_type.CreateView.as_view()), name='custom_part_type_new'),
    url(r'^part_type/upload/$', login_required(custom_part_type.UploadView.as_view()), name='custom_part_type_upload'),
    url(r'^part_type/(?P<pk>\d+)/edit$', custom_part_type.UpdateView.as_view(), name='custom_part_type_edit'),
    url(r'^part_type/(?P<pk>\d+)/copy$', custom_part_type.CopyView.as_view(), name='custom_part_type_copy'),
    url(r'^part_type/(?P<pk>\d+)/delete$', login_required(custom_part_type.DeleteView.as_view()), name='custom_part_type_delete'),
    url(r'^part_type/(?P<pk>\d+)/publish$', login_required(custom_part_type.PublishView.as_view()), name='custom_part_type_publish'),
    url(r'^part_type/(?P<pk>\d+)/unpublish$', login_required(custom_part_type.UnPublishView.as_view()), name='custom_part_type_unpublish'),
    url(r'^part_type/(?P<pk>\d+)/source$', custom_part_type.SourceView.as_view(), name='custom_part_type_source'),

    # Notifications

    url(r'^notification/(?P<pk>\d+)/open', notification.OpenNotification.as_view(permanent=False), name='open_notification'),
    path('notifications/unread_json/', notification.UnreadNotificationsList.as_view(), name='unread'),

    # Question basket

    url(r'^question_basket/$',
        basket.BasketView.as_view(),
        name='basket'),
    url(r'^question_basket/add/$',
        login_required(basket.add_question_to_basket),
        name='add_question_to_basket'),
    url(r'^question_basket/remove/$',
        login_required(basket.remove_question_from_basket),
        name='remove_question_from_basket'),
    url(r'^question_basket/create_exam/$',
        login_required(basket.CreateExamFromBasketView.as_view()),
        name='create_exam_from_basket'),
    url(r'^question_basket/empty/$',
        login_required(basket.empty_question_basket),
        name='empty_question_basket'),

    # Pull requests

    url(r'^pullrequest/create$',
        editoritem.CreatePullRequestView.as_view(), name='pullrequest_new'),

    url(r'^pullrequest/(?P<pk>\d+)/close$',
        editoritem.ClosePullRequestView.as_view(), name='pullrequest_close'),
]
