from django.urls import path

from .views import FeaturesView, FeatureView

urlpatterns = [
    path('', FeaturesView.as_view(), name='all_features'),
    path('view', FeatureView.as_view(), name='view_feature'),
]
