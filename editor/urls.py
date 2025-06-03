from django.urls import path, re_path, include, register_converter

from django.contrib.auth.decorators import login_required

from .views import project, folder, editoritem, exam, question, HomeView, \
    GlobalStatsView, ExploreView, TermsOfUseView, PrivacyPolicyView, TopSearchView, \
    theme, extension, generic, notification, resource, basket, timeline, \
    custom_part_type, queue, site_broadcast, export

class NumbasSlugConverter:
    regex = r'[\w-]+'

    def to_python(self, value):
        return value

    def to_url(self, value):
        return value[:50]

register_converter(NumbasSlugConverter, 'numbasslug')

urlpatterns = [

    # Home

    path('', HomeView.as_view(), name='editor_index'),

    # Global stats

    path('stats/', GlobalStatsView.as_view(), name='global_stats'),

    # Terms of use

    path('terms-of-use/', TermsOfUseView.as_view(), name='terms_of_use'),
    path('privacy-policy/', PrivacyPolicyView.as_view(), name='privacy_policy'),

    # Search

    path('search/', editoritem.SearchView.as_view(), name='search'),
    path('top-search/', TopSearchView.as_view(), name='top-search'),

    # Explore

    path('explore/', ExploreView.as_view(), name='explore'),

    # Site broadcasts
    path('site-broadcast/new', site_broadcast.CreateView.as_view(), name='site_broadcast_new'),

    # Projects

    path('projects/public', project.PublicProjectsView.as_view(), name='public_projects'),
    path('project/new', login_required(project.CreateView.as_view()), name='project_new'),
    path('project/<int:pk>/', project.IndexView.as_view(), name='project_index'),
    path('project/<int:pk>/delete', project.DeleteView.as_view(), name='project_delete'),
    path('project/<int:pk>/settings/options', project.OptionsView.as_view(), name='project_settings_options'),
    path('project/<int:pk>/settings/members', project.ManageMembersView.as_view(), name='project_settings_members'),
    path('project/<int:project_pk>/settings/add_member', project.AddMemberView.as_view(), name='project_settings_add_member'),
    path('project/<int:pk>/settings/transfer_ownership', project.TransferOwnershipView.as_view(), name='project_transfer_ownership'),

    path('project/<int:pk>/watch/', project.WatchProjectView.as_view(), name='project_watch'),
    path('project/<int:pk>/unwatch/', project.UnwatchProjectView.as_view(), name='project_unwatch'),
    path('project/<int:pk>/leave/', project.LeaveProjectView.as_view(), name='project_leave'),

    path('project/<int:pk>/search/', project.SearchView.as_view(), name='project_search'),
    re_path(r'^project/(?P<pk>\d+)/browse/(?P<path>(.*/)*)?$', project.BrowseView.as_view(), name='project_browse'),
    path('project/<int:project_pk>/new_folder', project.NewFolderView.as_view(), name='project_new_folder'),

    path('project/<int:pk>/comment',
        login_required(project.CommentView.as_view()), name='comment_on_project'),

    path('project/<int:pk>/export.zip',
         login_required(export.ProjectExportView.as_view()), name='export_project'),

    path('folder/move', folder.MoveFolderView.as_view(), name='folder_move'),
    path('folder/move_project', folder.MoveProjectView.as_view(), name='folder_move_project'),
    path('folder/<int:pk>/rename', folder.RenameFolderView.as_view(), name='folder_rename'),
    path('folder/<int:pk>/delete', folder.DeleteFolderView.as_view(), name='folder_delete'),

    # Editor items

    path('item/<int:pk>/preview/', editoritem.PreviewView.as_view(), name='item_preview'),

    path('item/<int:pk>/make-lockdown-link', editoritem.MakeLockdownLinkView.as_view(), name='item_make_lockdown_link'),

    path('item/<int:pk>/oembed/', editoritem.OembedView.as_view(), name='item_oembed'),

    path('item/<int:pk>/publish',
        editoritem.PublishView.as_view(), name='item_publish'),

    path('item/<int:pk>/unpublish',
        editoritem.UnPublishView.as_view(), name='item_unpublish'),

    path('item/<int:pk>/set-access',
        editoritem.SetAccessView.as_view(), name='set_access'),

    path('item/<int:pk>/move',
        editoritem.MoveProjectView.as_view(), name='item_move_project'),

    path('item/<int:pk>/transfer_ownership',
        editoritem.TransferOwnershipView.as_view(), name='item_transfer_ownership'),

    path('items/compare/<int:pk1>/<int:pk2>',
        editoritem.CompareView.as_view(), name='editoritem_compare'),

    path('items/recently-published/feed', editoritem.RecentlyPublishedFeed(), name='item_recently_published_feed'),
    path('items/recently-published', editoritem.RecentlyPublishedView.as_view(), name='item_recently_published'),

    # Exams

    path('exam/new/', login_required(exam.CreateView.as_view()), name='exam_new'),
    
    path('exam/upload/', exam.UploadView.as_view(), name='exam_upload'),
                       
    path('exam/<int:pk>/<numbasslug:slug>/', exam.UpdateView.as_view(),
        name='exam_edit'),

    path('exam/<int:pk>/<numbasslug:slug>/copy/', login_required(exam.CopyView.as_view()), name='exam_copy',),
                       
    path('exam/<int:pk>/<numbasslug:slug>/delete/',
        login_required(exam.DeleteView.as_view()), name='exam_delete'),
    
    path('exam/<int:pk>/<numbasslug:slug>/preview/',
        exam.PreviewView.as_view(), name='exam_preview'),
                       
    path('exam/<int:pk>/<numbasslug:slug>/embed/',
        exam.EmbedView.as_view(), name='exam_embed'),
                       
    path('exam/<int:pk>/<numbasslug:slug>.zip',
        exam.ZipView.as_view(), name='exam_download'),

    path('exam/<int:pk>/<numbasslug:slug>.exam',
        exam.SourceView.as_view(), name='exam_source'),
                       
    re_path(r'^exam/share/(?P<access>(view|edit))/(?P<share_uuid>.*)$',
        login_required(exam.ShareLinkView.as_view()), name='share_exam'),

    path('exam/<int:pk>/<numbasslug:slug>/stamp',
        login_required(exam.StampView.as_view()), name='stamp_exam'),

    path('exam/<int:pk>/<numbasslug:slug>/comment',
        login_required(exam.CommentView.as_view()), name='comment_on_exam'),

    path('exam/<int:pk>/<numbasslug:slug>/restore-point',
        login_required(exam.SetRestorePointView.as_view()), name='set_restore_point_on_exam'),

    path('exam/<int:pk>/<numbasslug:slug>/offline-analysis',
        exam.OfflineAnalysisView.as_view(), name='exam_offline_analysis'),

    path('exam/question-lists/<int:pk>/',
        exam.question_lists,
        name='question_lists'),

    # Questions

    path('question/new/', login_required(question.CreateView.as_view()), name='question_new'),

    path('question/<int:pk>/<numbasslug:slug>/',
        question.UpdateView.as_view(), name='question_edit'),

    re_path(r'^question/share/(?P<access>(view|edit))/(?P<share_uuid>.*)$',
        login_required(question.ShareLinkView.as_view()), name='share_question'),

    path('question/<int:pk>/<numbasslug:slug>/comment',
        login_required(question.CommentView.as_view()), name='comment_on_question'),

    path('question/<int:pk>/<numbasslug:slug>/stamp',
        login_required(question.StampView.as_view()), name='stamp_question'),

    path('question/<int:pk>/<numbasslug:slug>/restore-point',
        login_required(question.SetRestorePointView.as_view()), name='set_restore_point_on_question'),

    path('question/<int:pk>/resource/upload',
        login_required(question.UploadResourceView.as_view()), name='upload_resource'),

    path('question/<int:pk>/<numbasslug:slug>/resources/question-resources/<path:resource>',
        resource.view_resource, name='view_resource'),
                       
    path('question/<int:pk>/<numbasslug:slug>/copy/', login_required(question.CopyView.as_view()), name='question_copy',),
                       
    path('question/<int:pk>/<numbasslug:slug>/delete/',
        login_required(question.DeleteView.as_view()), name='question_delete'),
                       
    path('question/<int:pk>/<numbasslug:slug>/preview/',
        question.PreviewView.as_view(), name='question_preview'),
                       
    path('question/<int:pk>/<numbasslug:slug>/embed/',
        question.EmbedView.as_view(), name='question_embed'),
                       
    path('question/<int:pk>/<numbasslug:slug>.zip',
        question.ZipView.as_view(), name='question_download'),

    path('question/<int:pk>/<numbasslug:slug>.exam',
        question.SourceView.as_view(), name='question_source'),

    # Timeline items

    path('timelineitem/<int:pk>/hide',
        timeline.HideTimelineItemView.as_view(), name='timelineitem_hide'),

    path('timelineitem/<int:pk>/unhide',
        timeline.UnhideTimelineItemView.as_view(), name='timelineitem_unhide'),

    path('timelineitem/<int:pk>/delete',
        timeline.DeleteTimelineItemView.as_view(), name='timelineitem_delete'),

    path('stamp/<int:pk>/delete',
        generic.DeleteStampView.as_view(), name='stamp_delete'),

    path('restore_point/<int:pk>/revert',
        generic.RevertRestorePointView.as_view(), name='restore_point_revert'),

    # Themes

    path('theme/new/', login_required(theme.CreateView.as_view()), name='theme_new'),
    path('theme/upload/', login_required(theme.UploadView.as_view()), name='theme_upload'),
    path('themes/<int:pk>/download', login_required(theme.DownloadView.as_view()), name='theme_download'),
    path('themes/<int:pk>/edit', login_required(theme.UpdateView.as_view()), name='theme_edit'),
    path('themes/<int:pk>/edit_source', login_required(theme.EditView.as_view()), name='theme_edit_source'),
    path('themes/<int:pk>/replace_file', login_required(theme.ReplaceFileView.as_view()), name='theme_replace_file'),
    path('themes/<int:pk>/documentation', theme.DocumentationView.as_view(), name='theme_documentation'),
    path('themes/<int:pk>/access', login_required(theme.AccessView.as_view()), name='theme_access'),
    path('themes/<int:theme_pk>/access/add', login_required(theme.AddAccessView.as_view()), name='theme_add_access'),
    path('themes/<int:pk>/delete', login_required(theme.DeleteView.as_view()), name='theme_delete'),
    path('themes/<int:pk>/delete_file', login_required(theme.DeleteFileView.as_view()), name='theme_delete_file'),

    # Extensions

    path('extension/new/', login_required(extension.CreateView.as_view()), name='extension_new'),
    path('extension/upload/', login_required(extension.UploadView.as_view()), name='extension_upload'),
    path('extensions/<int:pk>/download', login_required(extension.DownloadView.as_view()), name='extension_download'),
    path('extensions/<int:pk>/edit', login_required(extension.UpdateView.as_view()), name='extension_edit'),
    path('extensions/<int:pk>/replace_file', login_required(extension.ReplaceFileView.as_view()), name='extension_replace_file'),
    path('extensions/<int:pk>/edit_source', login_required(extension.EditView.as_view()), name='extension_edit_source'),
    path('extensions/<int:pk>/documentation', extension.DocumentationView.as_view(), name='extension_documentation'),
    path('extensions/<int:pk>/access', login_required(extension.AccessView.as_view()), name='extension_access'),
    path('extensions/<int:extension_pk>/access/add', login_required(extension.AddAccessView.as_view()), name='extension_add_access'),
    path('extensions/<int:pk>/delete', login_required(extension.DeleteView.as_view()), name='extension_delete'),
    path('extensions/<int:pk>/delete_file', login_required(extension.DeleteFileView.as_view()), name='extension_delete_file'),

    # Custom part types
    path('part_type/new/', login_required(custom_part_type.CreateView.as_view()), name='custom_part_type_new'),
    path('part_type/upload/', login_required(custom_part_type.UploadView.as_view()), name='custom_part_type_upload'),
    path('part_type/<int:pk>/edit', custom_part_type.UpdateView.as_view(), name='custom_part_type_edit'),
    path('part_type/<int:pk>/copy', custom_part_type.CopyView.as_view(), name='custom_part_type_copy'),
    path('part_type/<int:pk>/delete', login_required(custom_part_type.DeleteView.as_view()), name='custom_part_type_delete'),
    path('part_type/<int:pk>/publish', login_required(custom_part_type.PublishView.as_view()), name='custom_part_type_publish'),
    path('part_type/<int:pk>/unpublish', login_required(custom_part_type.UnPublishView.as_view()), name='custom_part_type_unpublish'),
    path('part_type/<int:pk>/source', custom_part_type.SourceView.as_view(), name='custom_part_type_source'),
    path('part_type/<int:pk>/reupload', login_required(custom_part_type.ReuploadView.as_view()), name='custom_part_type_reupload'),
    path('part_type/<int:pk>/set-access',
        custom_part_type.SetAccessView.as_view(), name='custom_part_type_set_access'),

    # Queues
    path('queue/new/', queue.CreateView.as_view(), name='queue_new'),
    path('queue/<pk>/', queue.DetailView.as_view(), name='queue_view'),
    path('queue/<pk>/complete', queue.CompleteItemsView.as_view(), name='queue_view_complete'),
    path('queue/<pk>/settings/options', queue.UpdateView.as_view(), name='queue_settings_options'),
    path('queue/<pk>/settings/members', queue.ManageMembersView.as_view(), name='queue_settings_members'),
    path('queue/<queue_pk>/settings/add_member', queue.AddMemberView.as_view(), name='queue_settings_add_member'),
    path('queue/<pk>/delete', queue.DeleteView.as_view(), name='queue_delete'),
    path('queue/<pk>/add/', queue.AddEntryView.as_view(), name='queue_add'),
    path('queue-item/<pk>/review/', queue.ReviewEntryView.as_view(), name='queue_entry_review'),
    path('queue-item/<pk>/comment/', queue.CommentView.as_view(), name='queue_entry_comment'),
    path('queue-item/<pk>/edit/', queue.UpdateEntryView.as_view(), name='queue_entry_edit'),
    path('queue-item/<pk>/delete/', queue.DeleteEntryView.as_view(), name='queue_entry_delete'),
    path('queue-item/<pk>/assign_user/', queue.EntryAssignUserView.as_view(), name='queue_entry_assign_user'),
    path('queue-item/<pk>/unassign_user/', queue.EntryUnassignUserView.as_view(), name='queue_entry_unassign_user'),

    # Notifications

    path('notification/<int:pk>/open', notification.OpenNotification.as_view(permanent=False), name='open_notification'),
    path('notifications/unread_json/', notification.UnreadNotificationsList.as_view(), name='unread'),

    # Question basket

    path('question_basket/',
        basket.BasketView.as_view(),
        name='basket'),
    path('question_basket/add/',
        login_required(basket.add_question_to_basket),
        name='add_question_to_basket'),
    path('question_basket/remove/',
        login_required(basket.remove_question_from_basket),
        name='remove_question_from_basket'),
    path('question_basket/create_exam/',
        login_required(basket.CreateExamFromBasketView.as_view()),
        name='create_exam_from_basket'),
    path('question_basket/empty/',
        login_required(basket.empty_question_basket),
        name='empty_question_basket'),

    # Pull requests

    path('pullrequest/create',
        editoritem.CreatePullRequestView.as_view(), name='pullrequest_new'),

    path('pullrequest/<int:pk>/close',
        editoritem.ClosePullRequestView.as_view(), name='pullrequest_close'),
]
