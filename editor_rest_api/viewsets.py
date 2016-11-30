from rest_framework import viewsets
from . import serializers
from django.conf import settings
from editor.models import Project, NewExam, NewQuestion, EditorItem, Resource
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer

class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Project.objects.filter(public_view=True)
    serializer_class = serializers.ProjectSerializer

class ExamViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.ExamSerializer

    def get_queryset(self):
        queryset = NewExam.objects.all()
        projects = Project.objects.filter(public_view=True)
        queryset = queryset.filter(editoritem__project__public_view=True,editoritem__current_stamp__status='ok',editoritem__published=True)
        return queryset

class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.QuestionSerializer

    def get_queryset(self):
        queryset = NewQuestion.objects.all()
        projects = Project.objects.filter(public_view=True)
        queryset = queryset.filter(editoritem__project__public_view=True,editoritem__current_stamp__status='ok',editoritem__published=True)
        return queryset

class AvailableExamsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.ExamSerializer

    def get_queryset(self):
        project_pks = self.request.query_params.getlist('projects[]') + self.request.query_params.getlist('projects')  # jquery's .get uses the 
        queryset = NewExam.objects.all()
        projects = Project.objects.filter(public_view=True)
        if len(project_pks):
            projects = projects.filter(pk__in=[int(pk) for pk in project_pks])
        queryset = queryset.filter(editoritem__project__in=projects,editoritem__current_stamp__status='ok',editoritem__published=True)
        return queryset
    
class ResourceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.ResourceSerializer
    queryset = Resource.objects.all()

@api_view(['GET'])
@permission_classes([AllowAny])
def handshake(request):
    return Response({'numbas_editor':1,'site_title': settings.SITE_TITLE})
