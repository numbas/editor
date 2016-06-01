from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
import settings
import notifications.urls

from django.contrib import admin,auth
admin.autodiscover()


urlpatterns = patterns('',
    url(r'^admin/',include(admin.site.urls)),

	url(r'^login/','django.contrib.auth.views.login',{'template_name':'auth/login.html'},name='login'),
	url(r'^logout/','django.contrib.auth.views.logout',{'next_page':'/'},name='logout'),

	url(r'', include('accounts.urls')),
    
    url(r'', include('editor.urls')),
    url(r'^migrate/', include('migration.urls')),
	url(r'^notifications/', include(notifications.urls,namespace='notifications')),
) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
