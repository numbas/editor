"""
URLconf for registration and activation, using django-registration's
default backend.

If the default behavior of these views is acceptable to you, simply
use a line like this in your root URLconf to set up the default URLs
for registration::

    (r'^accounts/accounts/', include('registration.backends.default.urls')),

This will also automatically set up the views in
``django.contrib.auth`` at sensible default locations.

If you'd like to customize the behavior (e.g., by passing extra
arguments to the various views) or split up the URLs, feel free to set
up your own URL patterns for these views instead.

"""

from django.conf.urls import include, url
from django.urls import path
from django.views.generic import TemplateView

from django.contrib.auth.decorators import login_required

from accounts.views import ActivationView, RegistrationView, RegistrationCompleteView, UserUpdateView, ChangePasswordView, UserProfileView, AllExamsView, AllQuestionsView, UserSearchView
import accounts.views

from numbas import settings

urlpatterns = [
    url(r'search/$', UserSearchView.as_view(), name='user_search'),
    url(r'deactivate/$', accounts.views.DeactivateUserView.as_view(), name='user_deactivate'),
    url(r'reassign-content/$', accounts.views.ReassignContentView.as_view(), name='user_reassign_content'),
    url(r'profile/(?P<pk>\d+)/$',
        UserProfileView.as_view(),
        name='view_profile'),
    url(r'profile/(?P<pk>\d+)/items$',
        accounts.views.UserEditorItemSearchView.as_view(),
        name='profile_editoritem_search'),
    url(r'profile/(?P<pk>\d+)/projects$',
        accounts.views.UserProjectsView.as_view(),
        name='profile_projects'),
    url(r'profile/(?P<pk>\d+)/themes$',
        accounts.views.UserThemesView.as_view(),
        name='theme_list_profile'),
    url(r'profile/(?P<pk>\d+)/extensions$',
        accounts.views.UserExtensionsView.as_view(),
        name='extension_list_profile'),
    url(r'profile/(?P<pk>\d+)/custom_part_types$',
        accounts.views.UserCustomPartTypesView.as_view(),
        name='profile_custom_part_types'),
    url(r'profile/edit$',
        login_required(UserUpdateView.as_view()),
        name='edit_profile'),
    url(r'profile/backup/all-exams$',
        login_required(AllExamsView.as_view()),
        name='all_exams_download'),
    url(r'profile/backup/all-questions$',
        login_required(AllQuestionsView.as_view()),
        name='all_questions_download'),
    url(r'unsubscribe-emails$',
        accounts.views.unsubscribe_emails,
        name='unsubscribe_emails'
    )
]

if settings.CAN_CHANGE_PASSWORD:
    urlpatterns += [
        url(r'profile/change-password$',
            login_required(ChangePasswordView.as_view()),
            name='change_password'
        ),
    ]

    if settings.ALLOW_REGISTRATION:
        urlpatterns += [
            url(r'activate/complete/$',
                TemplateView.as_view(template_name='registration/activation_complete.html'),
                name='registration_activation_complete'),

            # Activation keys get matched by \w+ instead of the more specific
            # [a-fA-F0-9]{40} because a bad activation key should still get to the view;
            # that way it can return a sensible "invalid key" message instead of a
            # confusing 404.
            url(r'activate/(?P<activation_key>\w+)/$',
                ActivationView.as_view(),
                name='registration_activate'),
            url(r'register/$',
                RegistrationView.as_view(),
                {'backend': 'accounts.backend.Backend'},
                name='registration_register'),
            url(r'register/complete/$',
                RegistrationCompleteView.as_view(),
                name='registration_complete'),
            url(r'register/closed/$',
                TemplateView.as_view(template_name='registration/registration_closed.html'),
                name='registration_disallowed'),
            url(r'register/after-first-login/$',
                accounts.views.AfterFirstLoginView.as_view(),
                name='after_first_login'),
        ]

urlpatterns = [path(r'accounts/', include(urlpatterns))]
