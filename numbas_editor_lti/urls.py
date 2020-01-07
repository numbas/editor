from django.urls import include, path

from . import views

urls = [
    path('', views.lti_launch, name='lti_launch'),
    path('<int:pk>/set_exam', views.SetExamView.as_view(), name='lti_set_exam'),
    path('<int:pk>/attempt', views.AttemptView.as_view(), name='lti_attempt'),
    path('<int:pk>/post_result', views.PostResultView.as_view(), name='lti_post_result'),
]
