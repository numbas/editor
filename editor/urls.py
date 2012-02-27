from django.conf.urls.defaults import *
from django.views.generic import ListView, TemplateView

from editor.models import Exam, Question
from editor.views.exam import ExamCreateView, ExamListView, ExamDeleteView, ExamUpdateView, ExamSearchView
from editor.views.question import QuestionCreateView, QuestionDeleteView, QuestionUpdateView

urlpatterns = patterns('',
    url(r'^$', TemplateView.as_view(template_name='index.html'),
        name='editor_index'),
                       
    url(r'^exam/$',
        ExamListView.as_view(), name='exam_index',),
                       
    url(r'^exam/new/$', ExamCreateView.as_view(), name='exam_new'),
    
    url(r'^exam/search/$', ExamSearchView.as_view(), name='exam_search'),
    
#    url(r'^exam/test/$', 'editor.views.exam.testview', name='exam_new'),

    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)?/$', ExamUpdateView.as_view(),
        name='exam_edit'),
                       
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)?/delete/$', ExamDeleteView.as_view(),
        name='exam_delete'),
    
    url(r'^exam/(?P<pk>\d+)/(?P<slug>[\w-]+)?/preview/$', 'editor.views.exam.preview',
        name='exam_preview'),
                       
    url(r'^question/$',
        ListView.as_view(model=Question, template_name='question/index.html',),
        name='question_index',),
                       
    url(r'^question/new/$', QuestionCreateView.as_view(), name='question_new'),
    
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)?/$', QuestionUpdateView.as_view(),
        name='question_edit'),
                       
    url(r'^question/(?P<pk>\d+)/(?P<slug>[\w-]+)?/delete/$', QuestionDeleteView.as_view(),
        name='question_delete'),
)
