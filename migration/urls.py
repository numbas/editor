from django.conf.urls import *

from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = patterns('',
    url(r'^$',views.IndexView.as_view(),name='migrate_index'),
    url(r'^items$',views.MigrateItemsView.as_view(),name='migrate_items'),
)
