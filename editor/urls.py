from django.conf.urls.defaults import *
from django.views.generic import ListView
from editor.models import Exam

urlpatterns = patterns('',
    url(r'^exams/$',
        ListView.as_view(
            queryset=Exam.objects.all(),
            template_name='exams/index.html'),
            name='exam_index'),
#    url(r'^exams/(?P<pk>\d+)/$',
#        DetailView.as_view(
#            model=Exam,
#            template_name='exams/detail.html'),
#            name='exam_details'),
    url(r'^exams/(?P<exam_id>\d+)/$', 'editor.views.exams.edit', name='exam_edit'),
)