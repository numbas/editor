from rest_framework import viewsets
from . import serializers
from django.conf import settings
from editor.models import Project, NewExam, NewQuestion, EditorItem, Resource
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

def projects_visible_to_user(user):
    projects = Project.objects.filter(public_view=True)
    if not user.is_anonymous:
        projects = projects | user.userprofile.projects().all()
    return projects

class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Project.objects.filter(public_view=True)
    serializer_class = serializers.ProjectSerializer

    def get_queryset(self):
        return projects_visible_to_user(self.request.user).distinct()

class RetrieveOnlyViewset(viewsets.mixins.RetrieveModelMixin,viewsets.GenericViewSet):
    pass

class UserViewSet(RetrieveOnlyViewset):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer

class ExamViewSet(RetrieveOnlyViewset):
    serializer_class = serializers.ExamSerializer

    def get_queryset(self):
        queryset = NewExam.objects.all()
        queryset = queryset.filter(editoritem__in=EditorItem.objects.filter(EditorItem.filter_can_be_viewed_by(self.request.user)))
        return queryset

class QuestionViewSet(RetrieveOnlyViewset):
    serializer_class = serializers.QuestionSerializer

    def get_queryset(self):
        queryset = NewQuestion.objects.all()
        queryset = queryset.filter(editoritem__in=EditorItem.objects.filter(EditorItem.filter_can_be_viewed_by(self.request.user)))
        return queryset

class AvailableExamsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.ExamSerializer

    def get_queryset(self):
        project_pks = self.request.query_params.getlist('projects[]') + self.request.query_params.getlist('projects')  # jquery's .get uses the []
        queryset = NewExam.objects.all()
        projects = projects_visible_to_user(self.request.user)
        if len(project_pks):
            projects = projects.filter(pk__in=[int(pk) for pk in project_pks])
        queryset = queryset.filter(editoritem__project__in=projects).filter(editoritem__in=EditorItem.objects.filter(EditorItem.filter_can_be_viewed_by(self.request.user)))
        return queryset
    
class ResourceViewSet(RetrieveOnlyViewset):
    serializer_class = serializers.ResourceSerializer
    queryset = Resource.objects.all()

@api_view(['GET'])
@permission_classes([AllowAny])
def handshake(request):
    return Response({'numbas_editor':1,'site_title': settings.SITE_TITLE})
