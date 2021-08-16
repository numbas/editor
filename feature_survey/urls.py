from django.urls import path

from .import views

urlpatterns = [
    path('', views.FeaturesView.as_view(), name='all_features'),
    path('view', views.FeatureView.as_view(), name='view_feature'),
    path('view_intersection', views.IntersectFeaturesView.as_view(), name='intersect_features'),
]
