from django.conf.urls import include
from django.conf.urls.static import static
from django.conf import settings
from django.contrib import admin
from django.contrib.auth.views import LogoutView
from django.urls import path
import django.contrib.auth.views
import notifications.urls

admin.autodiscover()

urlpatterns = [
    path('admin/', admin.site.urls),

    path('logout/',LogoutView.as_view(),name='logout'),
    path('', include('django.contrib.auth.urls')),
    path('', include('accounts.urls')),
]

if 'editor_rest_api' in settings.INSTALLED_APPS:
    try:
        from editor_rest_api.urls import urls as rest_urls
        urlpatterns += [
            path('api/', include(rest_urls)),
        ]
    except ImportError:
        pass

if 'feature_survey' in settings.INSTALLED_APPS:
    try:
        from feature_survey.urls import urlpatterns as feature_survey_urls
        urlpatterns += [
            path('feature-survey/', include(feature_survey_urls)),
        ]
    except ImportError:
        pass

urlpatterns += [
    path(r'', include('editor.urls')),
    path(r'migrate/', include('migration.urls')),
    path(r'notifications/', include(notifications.urls, namespace='notifications')),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns = [
            _path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

URL_PREFIX = getattr(settings,'URL_PREFIX','/')
if URL_PREFIX != '/':
				urlpatterns = [path(URL_PREFIX[1:], include(urlpatterns)),]
