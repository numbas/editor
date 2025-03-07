from django.conf.urls import include
from django.urls import path, re_path
from django.views.generic import TemplateView

from django.contrib.auth.decorators import login_required

from accounts.views import ActivationView, RegistrationView, RegistrationCompleteView, UserUpdateView, ChangePasswordView, UserProfileView, AllExamsView, AllQuestionsView, UserSearchView, WellKnownChangePasswordView, BackupView
import accounts.views

from numbas import settings

urlpatterns = [
    path('search/', UserSearchView.as_view(), name='user_search'),
    path('deactivate/', accounts.views.DeactivateUserView.as_view(), name='user_deactivate'),
    path('reassign-content/', accounts.views.ReassignContentView.as_view(), name='user_reassign_content'),
    path('profile/<int:pk>/',
        UserProfileView.as_view(),
        name='view_profile'),
    path('profile/<int:pk>/items',
        accounts.views.UserEditorItemSearchView.as_view(),
        name='profile_editoritem_search'),
    path('profile/<int:pk>/projects',
        accounts.views.UserProjectsView.as_view(),
        name='profile_projects'),
    path('profile/<int:pk>/themes',
        accounts.views.UserThemesView.as_view(),
        name='theme_list_profile'),
    path('profile/<int:pk>/extensions',
        accounts.views.UserExtensionsView.as_view(),
        name='extension_list_profile'),
    path('profile/<int:pk>/custom_part_types',
        accounts.views.UserCustomPartTypesView.as_view(),
        name='profile_custom_part_types'),
    path('profile/<int:pk>/data-exports',
        accounts.views.UserDataExportsView.as_view(),
        name='profile_data_exports'),
    path('profile/edit',
        login_required(UserUpdateView.as_view()),
        name='edit_profile'),
    path('profile/backup.zip',
        login_required(BackupView.as_view()),
        name='user_backup'),
    path('profile/backup/all-exams',
        login_required(AllExamsView.as_view()),
        name='all_exams_download'),
    path('profile/backup/all-questions',
        login_required(AllQuestionsView.as_view()),
        name='all_questions_download'),
    path('unsubscribe-emails',
        accounts.views.unsubscribe_emails,
        name='unsubscribe_emails'
    )
]

if settings.CAN_CHANGE_PASSWORD:
    urlpatterns += [
        path('profile/change-password',
            login_required(ChangePasswordView.as_view()),
            name='change_password'
        ),
    ]

    if settings.ALLOW_REGISTRATION:
        urlpatterns += [
            path('activate/complete/',
                TemplateView.as_view(template_name='registration/activation_complete.html'),
                name='registration_activation_complete'),

            # Activation keys get matched by \w+ instead of the more specific
            # [a-fA-F0-9]{40} because a bad activation key should still get to the view;
            # that way it can return a sensible "invalid key" message instead of a
            # confusing 404.
            re_path(r'activate/(?P<activation_key>\w+)/$',
                ActivationView.as_view(),
                name='registration_activate'),
            path('register/',
                RegistrationView.as_view(),
                {'backend': 'accounts.backend.Backend'},
                name='registration_register'),
            path('register/complete/',
                RegistrationCompleteView.as_view(),
                name='registration_complete'),
            path('register/closed/',
                TemplateView.as_view(template_name='registration/registration_closed.html'),
                name='registration_disallowed'),
            path('register/after-first-login/',
                accounts.views.AfterFirstLoginView.as_view(),
                name='after_first_login'),
        ]

urlpatterns = [path('accounts/', include(urlpatterns))]

if settings.CAN_CHANGE_PASSWORD:
    urlpatterns += [
        path('.well-known/change-password',
            WellKnownChangePasswordView.as_view(),
            name='well-known-change_password'
        ),
    ]
