from django.urls import path

from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    path('', login_required(views.IndexView.as_view()), name='migrate_index'),
    path('items/', login_required(views.MigrateItemsView.as_view()), name='migrate_items'),
]
