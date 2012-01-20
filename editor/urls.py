from django.conf.urls.defaults import *
from django.views.generic import ListView
from editor.models import Exam
from editor.views.exam import ExamCreateView, ExamUpdateView

urlpatterns = patterns('',
    url(r'^exam/$',
        ListView.as_view(
            queryset=Exam.objects.all(),
            template_name='exam/index.html'
        ),
        name='exam_index',
    ),
#    url(r'^exams/(?P<pk>\d+)/$',
#        DetailView.as_view(
#            model=Exam,
#            template_name='exams/detail.html'),
#            name='exam_details'),
    url(r'^exam/new/$', ExamCreateView.as_view(), name='exam_new'),
    url(r'^exam/ajaxtest/$', 'editor.views.exam.ajaxtest', name='exam_ajaxtest'),
    url(r'^exam/(?P<slug>[\w-]+)/$', ExamUpdateView.as_view(), name='exam_edit'),
#    url(r'^exam/new/$', 'editor.views.exam.new', name='exam_new'),
#    url(r'^exam/(?P<exam_id>\d+)/$', 'editor.views.exam.edit', name='exam_edit'),
)