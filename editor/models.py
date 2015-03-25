#Copyright 2012 Newcastle University
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import uuid
import os
import shutil
from zipfile import ZipFile
import json
from datetime import datetime
import codecs
try:
  # For Python > 2.7
  from collections import OrderedDict
except ImportError:
  # For Python < 2.6 (after installing ordereddict)
  from ordereddict import OrderedDict

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.staticfiles import finders
from django.core.exceptions import ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.core.urlresolvers import reverse
from django.db import models
from django.db.models import signals
from django.dispatch import receiver
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.forms import model_to_dict
from django.utils.deconstruct import deconstructible
from uuslug import slugify

import reversion

from notifications import notify
from notifications.models import Notification
from editor.notify_watching import notify_watching

from taggit.managers import TaggableManager
import taggit.models

import numbasobject

from jsonfield import JSONField

PUBLIC_ACCESS_CHOICES = (('hidden','Hidden'),('view','Public can view'),('edit','Public can edit'))
USER_ACCESS_CHOICES = (('view','Public can view'),('edit','Public can edit'))

class EditorTag(taggit.models.TagBase):
    official = models.BooleanField(default=False)

    def used_count(self):
        return self.tagged_items.count()

    class Meta:
        verbose_name = 'tag'
        ordering = ['name']

class TaggedQuestion(taggit.models.GenericTaggedItemBase):
    tag = models.ForeignKey(EditorTag,related_name='tagged_items')

@deconstructible
class ControlledObject(object):

    def can_be_viewed_by(self,user):
        accept_levels = ('view','edit')
        return (self.public_access in accept_levels) or (user.is_superuser) or (self.author==user) or (self.get_access_for(user) in accept_levels)

    def can_be_copied_by(self,user):
        if not self.licence or user.is_superuser or self.author==user or self.get_access_for(user)=='edit':
            return True
        else:
            return self.licence.can_reuse and self.licence.can_modify

    def can_be_deleted_by(self,user):
        return user == self.author

    def can_be_edited_by(self, user):
        return self.public_access=='edit' or (user.is_superuser) or (self.author==user) or self.get_access_for(user)=='edit'

    def __eq__(self,other):
        return True

NUMBAS_FILE_VERSION = 'variables_as_objects'

@deconstructible
class NumbasObject(object):

    def get_parsed_content(self):
        if self.content:
            self.parsed_content = numbasobject.NumbasObject(self.content)
            self.name = self.parsed_content.data['name']
        elif self.name:
            self.parsed_content = numbasobject.NumbasObject(data={'name': self.name}, version=NUMBAS_FILE_VERSION)

        self.metadata = self.parsed_content.data.get('metadata',self.metadata)

        self.content = str(self.parsed_content)
        return self.parsed_content

    def set_name(self,name):
        self.name = name
        if self.content:
            self.get_parsed_content()
            self.parsed_content.data['name'] = name
            self.content = str(self.parsed_content)
        self.save()

    def __eq__(self,other):
        return self.content==other.content

#check that the .exam file for an object is valid and defines at the very least a name
def validate_content(content):
    try:
        object = numbasobject.NumbasObject(content)
        if not 'name' in object.data:
            raise ValidationError('No "name" property in content.')
    except Exception as err:
        raise ValidationError(err)

class Extension(models.Model):
    name = models.CharField(max_length=200,help_text='A human-readable name for the extension')
    location = models.CharField(default='',max_length=200,help_text='A unique identifier for this extension',verbose_name='Short name',blank=True,unique=True)
    url = models.CharField(max_length=300,blank=True,verbose_name='Documentation URL',help_text='Address of a page about the extension')
    public = models.BooleanField(default=False,help_text='Can this extension be seen by everyone?')
    slug = models.SlugField(max_length=200,editable=False,unique=False,default='an-extension')
    author = models.ForeignKey(User,related_name='own_extensions',blank=True,null=True)
    last_modified = models.DateTimeField(auto_now=True,default=datetime.utcfromtimestamp(0))
    zipfile_folder = 'user-extensions'
    zipfile = models.FileField(upload_to=zipfile_folder+'/zips', blank=True,null=True, max_length=255, verbose_name = 'Extension package',help_text='A .zip package containing the extension\'s files')

    def __unicode__(self):
        return self.name

    def as_json(self):
        d = {
            'name': self.name,
            'url': self.url,
            'pk': self.pk,
            'location': self.location,
        }
        path = self.script_path
        if path is not None:
            d['hasScript'] = True
            d['scriptURL'] = path
        return d

    @property
    def script_path(self):
        if self.zipfile:
            filename = self.location+'.js'
            local_path = os.path.join(self.extracted_path,filename)
            if os.path.exists(local_path):
                return settings.MEDIA_URL+self.zipfile_folder+'/extracted/'+str(self.pk)+'/'+self.location+'/'+filename
        else:
            path = 'js/numbas/extensions/%s/%s.js' % (self.location,self.location)
            if finders.find(path):
                return settings.STATIC_URL+path
        return None

    @property
    def extracted_path(self):
        if self.zipfile:
            return os.path.join(settings.MEDIA_ROOT,self.zipfile_folder,'extracted',str(self.pk),self.location)
        else:
            return os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'],'extensions',self.location)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(Extension,self).save(*args,**kwargs)

        if self.zipfile:
            if os.path.exists(self.extracted_path):
                shutil.rmtree(self.extracted_path)
            os.makedirs(self.extracted_path)

            name,extension = os.path.splitext(self.zipfile.name)
            if extension.lower() == '.zip':
                z = ZipFile(self.zipfile.file,'r')
                z.extractall(self.extracted_path)
            elif extension.lower() == '.js':
                file = open(os.path.join(self.extracted_path,self.location+'.js'),'w')
                file.write(self.zipfile.file.read())
                file.close()

class Theme( models.Model ):
    name = models.CharField(max_length=200)
    public = models.BooleanField(default=False,help_text='Can this theme be seen by everyone?')
    slug = models.SlugField(max_length=200,editable=False,unique=False)
    author = models.ForeignKey(User,related_name='own_themes')
    last_modified = models.DateTimeField(auto_now=True,default=datetime.utcfromtimestamp(0))
    zipfile_folder = 'user-themes'
    zipfile = models.FileField(upload_to=zipfile_folder+'/zips', max_length=255, verbose_name = 'Theme package',help_text='A .zip package containing the theme\'s files')

    def __unicode__(self):
        return self.name

    @property
    def extracted_path(self):
        return os.path.join(settings.MEDIA_ROOT,self.zipfile_folder,'extracted',str(self.pk))

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(Theme,self).save(*args,**kwargs)

        if os.path.exists(self.extracted_path):
            shutil.rmtree(self.extracted_path)
        os.makedirs(self.extracted_path)
        z = ZipFile(self.zipfile.file,'r')
        z.extractall(self.extracted_path)

class Image( models.Model ):
    title = models.CharField( max_length=255 ) 
    image = models.ImageField( upload_to='question-resources/', max_length=255) 

    @property 
    def data_url( self ):
        try:
            img = open( self.image.path, "rb") 
            data = img.read() 
            return "data:image/jpg;base64,%s" % codecs.encode(data,'base64')[:-1]
    
        except IOError as e:
            return self.image.url

    @property
    def resource_url(self):
        return 'resources/%s' % self.image.name

    def delete(self,*args,**kwargs):
        self.image.delete(save=False)
        super(Image,self).delete(*args,**kwargs)

    def as_json(self):
        return {
            'url': self.resource_url,
            'name': self.image.name,
            'pk': self.pk,
            'delete_url': reverse('delete_resource',args=(self.pk,)),
        }

    def summary(self):
        return json.dumps(self.as_json()),

class Licence(models.Model):
    name = models.CharField(max_length=80,unique=True)
    short_name = models.CharField(max_length=20,unique=True)
    can_reuse = models.BooleanField(default=True)
    can_modify = models.BooleanField(default=True)
    can_sell = models.BooleanField(default=True)
    url = models.URLField(blank=True)
    full_text = models.TextField(blank=True)

    def __unicode__(self):
        return self.name

    def as_json(self):
        return {
                'name': self.name,
                'short_name': self.short_name,
                'can_reuse': self.can_reuse,
                'can_modify': self.can_modify,
                'can_sell': self.can_sell,
                'url': self.url,
                'pk': self.pk,
        }

class TimelineEvent(object):
    def __init__(self,user,date,type,data):
        self.user = user
        self.date = date
        self.type = type
        self.data = data

class StampTimelineEvent(TimelineEvent):
    def __init__(self,stamp):
        super(StampTimelineEvent,self).__init__(user=stamp.user, date=stamp.date, type='stamp', data=stamp)

class VersionTimelineEvent(TimelineEvent):
    def __init__(self,version):
        revision = version.revision
        super(VersionTimelineEvent,self).__init__(user=revision.user, date=revision.date_created, type='version', data=version)

class CommentTimelineEvent(TimelineEvent):
    def __init__(self,comment):
        super(CommentTimelineEvent,self).__init__(user=comment.user, date=comment.date, type='comment', data=comment)

STAMP_STATUS_CHOICES = (
    ('ok','Ready to use'),
    ('dontuse','Should not be used'),
    ('problem','Has some problems'),
    ('broken','Doesn\'t work'),
)

class TimelineMixin(object):
    def can_be_deleted_by(self,user):
        return user==self.user or user==self.object.author

class StampOfApproval(models.Model,TimelineMixin):
    object_content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type','object_id')

    user = models.ForeignKey(User, related_name='stamps')
    status = models.CharField(choices = STAMP_STATUS_CHOICES, max_length=20)
    date = models.DateTimeField(auto_now_add=True,default=datetime.utcfromtimestamp(0))

    def __unicode__(self):
        return '{} as "{}"'.format(self.user.username,self.object.name,self.get_status_display(),self.date)

class Comment(models.Model,TimelineMixin):
    object_content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type','object_id')

    user = models.ForeignKey(User, related_name='comments')
    text = models.TextField()
    date = models.DateTimeField(auto_now_add=True,default=datetime.utcfromtimestamp(0))

    def __unicode__(self):
        return 'Comment by {} on {}: "{}"'.format(self.user.get_full_name(), str(self.object), self.text[:47]+'...' if len(self.text)>50 else self.text)

class EditorModel(models.Model):
    class Meta:
        abstract = True

    licence = models.ForeignKey(Licence,null=True)

    current_stamp = models.ForeignKey(StampOfApproval, blank=True, null=True, on_delete=models.SET_NULL)

    def set_licence(self,licence):
        NumbasObject.get_parsed_content(self)
        metadata = self.parsed_content.data.setdefault(u'metadata',{})
        metadata['licence'] = licence.name
        self.licence = licence
        self.content = str(self.parsed_content)

    @property
    def timeline(self):
        events = [StampTimelineEvent(stamp) for stamp in self.stamps] + [VersionTimelineEvent(version) for version in reversion.get_for_object(self)] + [CommentTimelineEvent(comment) for comment in self.comments]
        events.sort(key=lambda x:x.date, reverse=True)
        return events
    
    @property
    def stamps(self):
        return StampOfApproval.objects.filter(object_content_type=ContentType.objects.get_for_model(self.__class__),object_id=self.pk).order_by('-date')

    @property
    def comments(self):
        return Comment.objects.filter(object_content_type=ContentType.objects.get_for_model(self.__class__),object_id=self.pk).order_by('-date')

    @property
    def watching_users(self):
        """ Users who should be notified when something happens to this object. """
        return [self.author] + list(self.access_rights.all())

@receiver(signals.post_save,sender=StampOfApproval)
def set_current_stamp(instance,**kwargs):
    instance.object.current_stamp = instance
    instance.object.save()

@receiver(signals.post_save,sender=StampOfApproval)
def notify_stamp(instance,**kwargs):
    notify_watching(instance.user,target=instance.object,verb='gave feedback on',action_object=instance)

@receiver(signals.post_save,sender=Comment)
def notify_comment(instance,**kwargs):
    notify_watching(instance.user,target=instance.object,verb='commented on',action_object=instance)

class QuestionManager(models.Manager):
    def viewable_by(self,user):
        if user.is_superuser:
            return self.all()
        elif user.is_anonymous():
            return self.filter(public_access__in=['edit','view'])
        else:
            mine_or_public_query = Q(public_access__in=['edit','view']) | Q(author=user)
            mine_or_public = self.all().filter(mine_or_public_query)
            given_access = QuestionAccess.objects.filter(access__in=['edit','view'],user=user).values_list('question',flat=True)
            return mine_or_public | self.exclude(mine_or_public_query).filter(pk__in=given_access)

@reversion.register
class Question(EditorModel,NumbasObject,ControlledObject):
    
    """Model class for a question.
    
    Many-to-many relation with Exam through ExamQuestion.
    
    """

    objects = QuestionManager()
    
    name = models.CharField(max_length=200,default='Untitled Question')
    theme_path = 'question'
    slug = models.SlugField(max_length=200,editable=False,unique=False)
    author = models.ForeignKey(User,related_name='own_questions')
    filename = models.CharField(max_length=200, editable=False,default='')
    content = models.TextField(blank=True,validators=[validate_content])
    metadata = JSONField(blank=True)
    created = models.DateTimeField(auto_now_add=True,default=datetime.utcfromtimestamp(0))
    last_modified = models.DateTimeField(auto_now=True,default=datetime.utcfromtimestamp(0))
    resources = models.ManyToManyField(Image,blank=True)
    copy_of = models.ForeignKey('self',null=True,related_name='copies',on_delete=models.SET_NULL)
    extensions = models.ManyToManyField(Extension,blank=True)

    public_access = models.CharField(default='view',editable=True,choices=PUBLIC_ACCESS_CHOICES,max_length=6)
    access_rights = models.ManyToManyField(User, through='QuestionAccess', blank=True, editable=False,related_name='accessed_questions+')

    tags = TaggableManager(through=TaggedQuestion)

    class Meta:
        ordering = ['name']
        permissions = (
              ('highlight', 'Can pick questions to feature on the front page.'),
        )

    def __unicode__(self):
        return '%s' % self.name

    def save(self, *args, **kwargs):
        NumbasObject.get_parsed_content(self)

        self.slug = slugify(self.name)

        if 'metadata' in self.parsed_content.data:
            licence_name = self.parsed_content.data['metadata'].get('licence',None)
        else:
            licence_name = None
        self.licence = Licence.objects.filter(name=licence_name).first()

        super(Question, self).save(*args, **kwargs)

        if 'tags' in self.parsed_content.data:
            self.tags.set(*[t.strip() for t in self.parsed_content.data['tags']])


    def delete(self, *args, **kwargs):
        super(Question,self).delete(*args, **kwargs)

    def get_filename(self):
        return 'question-%i-%s' % (self.pk,self.slug)

    def as_numbasobject(self):
        self.get_parsed_content()
        data = OrderedDict([
            ('name',self.name),
            ('extensions',[e.location for e in self.extensions.all()]),
            ('resources',[[i.image.name,i.image.path] for i in self.resources.all()]),
            ('navigation',{'allowregen': 'true', 'showfrontpage': 'false', 'preventleave': False}),
            ('questions',[self.parsed_content.data])
        ])
        obj = numbasobject.NumbasObject(data=data,version=self.parsed_content.version)
        return obj

    def as_source(self):
        return str(self.as_numbasobject())

    def as_json(self):
        self.get_parsed_content()
        d = model_to_dict(self)
        d['JSONContent'] = self.parsed_content.data
        d['metadata'] = self.metadata
        d['tags'] = [ti.tag.name for ti in d['tags']]
        d['resources'] = [res.as_json() for res in self.resources.all()]
        return json.dumps(d)

    def summary(self, user=None):
        """return id, name and url, enough to identify a question and say where to find it"""
        obj = {
            'id': self.id, 
            'name': self.name, 
            'metadata': self.metadata,
            'created': str(self.created),
            'last_modified': str(self.last_modified), 
            'author': self.author.get_full_name(), 
            'url': reverse('question_edit', args=(self.pk,self.slug,)),
            'deleteURL': reverse('question_delete', args=(self.pk,self.slug)),
        }
        if user:
            obj['canEdit'] = self.can_be_edited_by(user) 
        return obj

    def set_access(self,user,access_level):
        access = QuestionAccess(user=user,question=self,access=access_level)
        access.save()

    def get_access_for(self,user):
        if user.is_anonymous():
            return 'none'
        try:
            question_access = QuestionAccess.objects.get(question=self,user=user)
            return question_access.access
        except QuestionAccess.DoesNotExist:
            return 'none'

class QuestionAccess(models.Model):
    question = models.ForeignKey(Question)
    user = models.ForeignKey(User)
    access = models.CharField(default='view',editable=True,choices=USER_ACCESS_CHOICES,max_length=6)

@receiver(signals.post_save,sender=QuestionAccess)
def notify_given_question_access(instance,created,**kwargs):
    if created:
        notify.send(instance.given_by,verb='gave you access to',target=instance.question,recipient=instance.user)

class QuestionHighlight(models.Model):
    class Meta:
        ordering = ['-date']

    question = models.ForeignKey(Question)
    picked_by = models.ForeignKey(User)
    note = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True,default=datetime.utcfromtimestamp(0))

@reversion.register
class Exam(EditorModel,NumbasObject,ControlledObject):
    
    """Model class for an Exam.
    
    Many-to-many relation with Question through ExamQuestion.
    
    """
    
    questions = models.ManyToManyField(Question, through='ExamQuestion',
                                       blank=True, editable=False)
    name = models.CharField(max_length=200,default='Untitled Exam')
    theme = models.CharField(max_length=200,default='default',blank=True)  # used if custom_theme is None
    custom_theme = models.ForeignKey(Theme,null=True,blank=True,on_delete=models.SET_NULL,related_name='used_in_exams')
    locale = models.CharField(max_length=200,default='en-GB')
    slug = models.SlugField(max_length=200,editable=False,unique=False)
    author = models.ForeignKey(User,related_name='own_exams')
    filename = models.CharField(max_length=200, editable=False,default='')
    content = models.TextField(blank=True, validators=[validate_content])
    created = models.DateTimeField(auto_now_add=True,default=datetime.utcfromtimestamp(0))
    last_modified = models.DateTimeField(auto_now=True,default=datetime.utcfromtimestamp(0))
    metadata = JSONField(blank=True)

    public_access = models.CharField(default='view',editable=True,choices=PUBLIC_ACCESS_CHOICES,max_length=6)
    access_rights = models.ManyToManyField(User, through='ExamAccess', blank=True, editable=False,related_name='accessed_exams+')

    class Meta:
        ordering = ['name']
        permissions = (
              ('highlight', 'Can pick exams to feature on the front page.'),
        )

    def __unicode__(self):
        return '%s' %self.name
    
    @property
    def theme_path(self):
        if self.custom_theme:
            return self.custom_theme.extracted_path
        else:
            return self.theme

    @property
    def extensions(self):
        return Extension.objects.filter(question__in=self.questions.all()).distinct()

    def get_questions(self):
        return self.questions.order_by('examquestion')

    def set_questions(self,question_list=None,**kwargs):
        """ 
            Set the list of questions for this exam. 
            question_list is an ordered list of question IDs
        """

        if 'question_ids' in kwargs:
            question_list = [Question.objects.get(pk=pk) for pk in kwargs['question_ids']]

        self.questions.clear()
        for order,question in enumerate(question_list):
            exam_question = ExamQuestion(exam=self,question=question, qn_order=order)
            exam_question.save()
    
    def save(self, *args, **kwargs):
        NumbasObject.get_parsed_content(self)
        
        self.slug = slugify(self.name)

        if 'metadata' in self.parsed_content.data:
            licence_name = self.parsed_content.data['metadata'].get('licence',None)
        else:
            licence_name = None
        self.licence = Licence.objects.filter(name=licence_name).first()
            
        super(Exam, self).save(*args, **kwargs)

    def get_filename(self):
        return 'exam-%i-%s' % (self.pk,self.slug)
        
    def as_numbasobject(self):
        obj = numbasobject.NumbasObject(self.content)
        data = obj.data
        resources = []
        for q in self.get_questions():
            q.get_parsed_content()
            resources += q.resources.all()
        extensions = [e.location for e in self.extensions]
        data['extensions'] = extensions
        data['name'] = self.name
        data['questions'] = [numbasobject.NumbasObject(q.content).data for q in self.get_questions()]
        data['resources'] = [[i.image.name,i.image.path] for i in set(resources)]
        
        return obj

    def as_source(self):
        return str(self.as_numbasobject())
    
    def as_json(self):
        self.get_parsed_content()
        exam_dict = model_to_dict(self)
        exam_dict['questions'] = [q.summary() for q in self.get_questions()]
        exam_dict['JSONContent'] = self.parsed_content.data

        return exam_dict

    def summary(self, user=None):
        """return enough to identify an exam and say where to find it, along with a description"""
        obj = {
            'id': self.id, 
            'name': self.name, 
            'metadata': self.metadata,
            'created': str(self.created), 
            'last_modified': str(self.last_modified), 
            'author': self.author.get_full_name(), 
            'url': reverse('exam_edit', args=(self.pk,self.slug,)),
            'deleteURL': reverse('exam_delete', args=(self.pk,self.slug)),
        }
        if user:
            obj['canEdit'] = self.can_be_edited_by(user) 
        return obj

    def set_access(self,user,access_level):
        access = ExamAccess(user=user,exam=self,access=access_level)
        access.save()

    def get_access_for(self,user):
        if user.is_anonymous():
            return 'none'
        try:
            exam_access = ExamAccess.objects.get(exam=self,user=user)
            return exam_access.access
        except ExamAccess.DoesNotExist:
            return 'none'

@receiver(signals.post_delete)
def remove_deleted_notifications(sender, instance=None,**kwargs):
    if sender in [Question,Exam,StampOfApproval,Comment]:
        Notification.objects.filter(target_object_id=instance.pk).delete()
        Notification.objects.filter(action_object_object_id=instance.pk).delete()

class ExamHighlight(models.Model):
    class Meta:
        ordering = ['-date']

    exam = models.ForeignKey(Exam)
    picked_by = models.ForeignKey(User)
    note = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True,default=datetime.utcfromtimestamp(0))

class ExamAccess(models.Model):
    exam = models.ForeignKey(Exam)
    user = models.ForeignKey(User)
    access = models.CharField(default='view',editable=True,choices=USER_ACCESS_CHOICES,max_length=6)

@receiver(signals.post_save,sender=ExamAccess)
def notify_given_exam_access(instance,created,**kwargs):
    if created:
        notify.send(instance.given_by,verb='gave you access to',target=instance.exam,recipient=instance.user)
        
        
class ExamQuestion(models.Model):
    
    """Model class linking exams and questions."""
    
    class Meta:
        ordering = ['qn_order']
        
    exam = models.ForeignKey(Exam)
    question = models.ForeignKey(Question)
    qn_order = models.PositiveIntegerField()

