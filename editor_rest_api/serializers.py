from django.conf import settings
from editor.models import Project, NewExam, NewQuestion, EditorItem, Resource
import editor.models
from django.contrib.auth.models import User
from rest_framework import serializers

class UserSerializer(serializers.HyperlinkedModelSerializer):
    profile = serializers.HyperlinkedIdentityField(view_name='view_profile')
    full_name = serializers.CharField(source='get_full_name')
    class Meta:
        model = User
        fields = ('url', 'profile', 'username', 'email', 'full_name')


class ProjectSerializer(serializers.HyperlinkedModelSerializer):
    homepage = serializers.HyperlinkedIdentityField(view_name='project_index')
    url = serializers.HyperlinkedIdentityField(view_name='project-detail')
    owner = UserSerializer()
    class Meta:
        model = Project
        fields = ('name','pk','description','owner','homepage','url')
        depth=2

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
    url = serializers.HyperlinkedIdentityField(view_name='exam-detail')
    edit = EditorItemHyperlinkedIdentityField(view_name='exam_edit')
    download = EditorItemHyperlinkedIdentityField(view_name='exam_download')
    preview = EditorItemHyperlinkedIdentityField(view_name='exam_preview')
    source = EditorItemHyperlinkedIdentityField(view_name='exam_source')
    name = serializers.CharField(source='editoritem.name')
    metadata = serializers.JSONField(source='editoritem.metadata')
    status = serializers.ChoiceField(choices=editor.models.STAMP_STATUS_CHOICES,source='editoritem.current_stamp.status')
    project = serializers.HyperlinkedRelatedField(source='editoritem.project',view_name='project-detail',read_only=True)
    author = UserSerializer(source='editoritem.author')
    resources = serializers.HyperlinkedRelatedField(many=True,read_only=True,view_name='resource-detail')
    questions = serializers.HyperlinkedRelatedField(many=True,read_only=True,view_name='question-detail')
    class Meta:
        model = NewExam
        fields = ('url','name','project','author','edit','preview','download','source','metadata','status','resources','questions')

class QuestionSerializer(serializers.HyperlinkedModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='question-detail')
    edit = EditorItemHyperlinkedIdentityField(view_name='question_edit')
    download = EditorItemHyperlinkedIdentityField(view_name='question_download')
    preview = EditorItemHyperlinkedIdentityField(view_name='question_preview')
    source = EditorItemHyperlinkedIdentityField(view_name='question_source')
    name = serializers.CharField(source='editoritem.name')
    metadata = serializers.JSONField(source='editoritem.metadata')
    status = serializers.ChoiceField(choices=editor.models.STAMP_STATUS_CHOICES,source='editoritem.current_stamp.status')
    project = serializers.HyperlinkedRelatedField(source='editoritem.project',view_name='project-detail',read_only=True)
    author = UserSerializer(source='editoritem.author')
    resources = serializers.HyperlinkedRelatedField(many=True,read_only=True,view_name='resource-detail')
    class Meta:
        model = NewQuestion
        fields = ('url','name','project','author','edit','preview','download','source','metadata','status','resources')

class MediaField(serializers.URLField):
    def to_representation(self,url):
        request = self.context['request']
        return request.build_absolute_uri(settings.MEDIA_URL+url)

class ResourceSerializer(serializers.ModelSerializer):
    resource_url = MediaField(source='file.name')
    class Meta:
        model = Resource
        fields = ('id','owner','date_created','resource_url')

