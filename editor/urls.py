from django.conf.urls.defaults import *
from django.views.generic import ListView, TemplateView
from editor.models import Exam, Question
from editor.views.exam import ExamCreateView, ExamDeleteView, ExamUpdateView
from editor.views.question import QuestionCreateView, QuestionDeleteView, QuestionUpdateView

urlpatterns = patterns('',
    url(r'^$', TemplateView.as_view(template_name='index.html'), name='editor_index'),
    url(r'^exam/$',
        ListView.as_view(
            model=Exam,
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
#    url(r'^exam/new/$', 'editor.views.exam.testview', name='exam_new'),
#    url(r'^exam/new2/$', 'editor.views.exam.create_exam_with_question', name='exam_new2'),
    url(r'^exam/(?P<slug>[\w-]+)/$', ExamUpdateView.as_view(), name='exam_edit'),
    url(r'^exam/(?P<slug>[\w-]+)/delete/$', ExamDeleteView.as_view(), name='exam_delete'),
    url(r'^exam/(?P<slug>[\w-]+)/preview/$', 'editor.views.exam.preview', name='exam_preview'),
    url(r'^question/$',
        ListView.as_view(
            model=Question,
            template_name='question/index.html',
#            context_object_name='list'
        ),
        name='question_index',
    ),
    url(r'^question/new/$', QuestionCreateView.as_view(), name='question_new'),
    url(r'^question/(?P<slug>[\w-]+)/$', QuestionUpdateView.as_view(), name='question_edit'),
    url(r'^question/(?P<slug>[\w-]+)/delete/$', QuestionDeleteView.as_view(), name='question_delete'),
#    url(r'^exam/new/$', 'editor.views.exam.new', name='exam_new'),
#    url(r'^exam/(?P<exam_id>\d+)/$', 'editor.views.exam.edit', name='exam_edit'),
)