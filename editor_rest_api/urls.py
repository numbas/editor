from django.conf.urls import url,include

from rest_framework import routers
from . import viewsets

router = routers.DefaultRouter()
router.register(r'projects',viewsets.ProjectViewSet)
router.register(r'users', viewsets.UserViewSet)
router.register(r'exams', viewsets.ExamViewSet,base_name='exam')
router.register(r'questions', viewsets.QuestionViewSet,base_name='question')
router.register(r'resources',viewsets.ResourceViewSet)
router.register(r'available-exams', viewsets.AvailableExamsViewSet,base_name='available-exams')

urls = [
    url(r'^', include(router.urls)),
    url(r'^handshake$',viewsets.handshake),
]
