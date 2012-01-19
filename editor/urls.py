from django.conf.urls.defaults import *
from django.views.generic import ListView
from editor.models import Exam

urlpatterns = patterns('',
    url(r'^exam/$',
        ListView.as_view(
            queryset=Exam.objects.all(),
            template_name='exam/index.html'),
            name='exam_index'),
#    url(r'^exams/(?P<pk>\d+)/$',
#        DetailView.as_view(
#            model=Exam,
#            template_name='exams/detail.html'),
#            name='exam_details'),
    url(r'^exam/(?P<exam_id>\d+)/$', 'editor.views.exam.edit', name='exam_edit'),
    url(r'^exam/new/$', 'editor.views.exam.new', name='exam_new'),
)