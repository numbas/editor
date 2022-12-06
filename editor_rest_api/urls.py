from django.urls import path,include

from rest_framework import routers
from . import viewsets

router = routers.DefaultRouter()
router.register(r'projects',viewsets.ProjectViewSet)
router.register(r'users', viewsets.UserViewSet)
router.register(r'exams', viewsets.ExamViewSet,basename='exam')
router.register(r'questions', viewsets.QuestionViewSet,basename='question')
router.register(r'resources',viewsets.ResourceViewSet)
router.register(r'available-exams', viewsets.AvailableExamsViewSet,basename='available-exams')

urls = [
    path(r'', include(router.urls)),
    path(r'handshake',viewsets.handshake),
]
