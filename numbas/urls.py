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
from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
import settings
import notifications

from django.contrib import admin,auth
admin.autodiscover()


urlpatterns = patterns('',
    url(r'^admin/',include(admin.site.urls)),

	url(r'^login/','django.contrib.auth.views.login',{'template_name':'auth/login.html'},name='login'),
	url(r'^logout/','django.contrib.auth.views.logout',{'next_page':'/'},name='logout'),

	url(r'^accounts/', include('accounts.urls')),
    
    url(r'', include('editor.urls')),
	url(r'^notifications/', include(notifications.urls)),
) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
