from django.conf.urls import patterns,url,include

from editor.models import Project, NewExam, NewQuestion, EditorItem
import editor.models
from django.contrib.auth.models import User

from rest_framework import routers, serializers, viewsets
from rest_framework import generics

class UserSerializer(serializers.HyperlinkedModelSerializer):
    profile = serializers.HyperlinkedIdentityField(view_name='view_profile')
    full_name = serializers.CharField(source='get_full_name')
    class Meta:
        model = User
        fields = ('url', 'profile', 'username', 'email', 'full_name')

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ProjectSerializer(serializers.HyperlinkedModelSerializer):
    homepage = serializers.HyperlinkedIdentityField(view_name='project_index')
    owner = UserSerializer()
    class Meta:
        model = Project
        fields = ('name','pk','description','owner','homepage',)
        depth=2

class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Project.objects.filter(public_view=True)
    serializer_class = ProjectSerializer

class EditorItemHyperlinkedIdentityField(serializers.HyperlinkedIdentityField):
    def get_url(self, obj, view_name, request, format):
        if hasattr(obj, 'pk') and obj.pk in (None, ''):
            return None

        kwargs = {'pk':obj.pk, 'slug':obj.editoritem.slug}
        return self.reverse(view_name, kwargs=kwargs, request=request, format=format)

class EditorItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EditorItem
        fields = ('name',)

class ExamSerializer(serializers.HyperlinkedModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='exams-detail')
    edit = EditorItemHyperlinkedIdentityField(view_name='exam_edit')
    download = EditorItemHyperlinkedIdentityField(view_name='exam_download')
    preview = EditorItemHyperlinkedIdentityField(view_name='exam_preview')
    name = serializers.CharField(source='editoritem.name')
    metadata = serializers.JSONField(source='editoritem.metadata')
    status = serializers.ChoiceField(choices=editor.models.STAMP_STATUS_CHOICES,source='editoritem.current_stamp.status')
    project = serializers.HyperlinkedRelatedField(source='editoritem.project',view_name='project-detail',read_only=True)
    author = UserSerializer(source='editoritem.author')
    class Meta:
        model = NewExam
        fields = ('url','name','project','author','edit','preview','download','metadata','status')

class ExamViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExamSerializer

    def get_queryset(self):
        queryset = NewExam.objects.all()
        projects = Project.objects.filter(public_view=True)
        queryset = queryset.filter(editoritem__project__public_view=True,editoritem__current_stamp__status='ok',editoritem__published=True)
        return queryset

class AvailableExamsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExamSerializer

    def get_queryset(self):
        project_pks = self.request.query_params.getlist('projects[]') + self.request.query_params.getlist('projects')  # jquery's .get uses the 
        queryset = NewExam.objects.all()
        projects = Project.objects.filter(public_view=True)
        if len(project_pks):
            projects = projects.filter(pk__in=[int(pk) for pk in project_pks])
        queryset = queryset.filter(editoritem__project__in=projects,editoritem__current_stamp__status='ok',editoritem__published=True)
        return queryset
    

router = routers.DefaultRouter()
router.register(r'projects',ProjectViewSet)
router.register(r'users', UserViewSet)
router.register(r'exams', ExamViewSet,base_name='exams')
router.register(r'available-exams', AvailableExamsViewSet,base_name='available-exams')


urls = patterns('',
    url(r'^', include(router.urls)),
)
