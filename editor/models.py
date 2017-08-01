import uuid
import os
from copy import deepcopy
import shutil
from zipfile import ZipFile
import json
from datetime import datetime
from itertools import groupby
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
from django.core.urlresolvers import reverse
from django.db import models, transaction
from django.db.models import signals, Max, Min
from django.dispatch import receiver
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.forms import model_to_dict
from django.utils.deconstruct import deconstructible
from django.db.models.signals import pre_delete
from django.template.loader import get_template
from django.core.mail import send_mail
from uuslug import slugify

import reversion

from notifications.signals import notify
from notifications.models import Notification

import taggit.models
from taggit.managers import TaggableManager

import numbasobject

from .notify_watching import notify_watching
from .jsonfield import JSONField

PUBLIC_ACCESS_CHOICES = (('hidden', 'Hidden'), ('view', 'Public can view'), ('edit', 'Public can edit'))
USER_ACCESS_CHOICES = (('view', 'Can view'), ('edit', 'Can edit'))

@deconstructible
class ControlledObject(object):

    @property
    def owner(self):
        raise NotImplementedError

    def has_access(self, user, accept_levels):
        raise NotImplementedError

    def can_be_viewed_by(self, user):
        accept_levels = ('view', 'edit')
        try:
            if self.published and self.public_access in accept_levels:
                return True
        except AttributeError:
            pass
        return (user.is_superuser) or (self.owner == user) or (self.has_access(user, accept_levels))

    def can_be_copied_by(self, user):
        if user.is_superuser or self.owner == user or self.has_access(user, ('edit',)):
            return True
        elif not self.licence:
            return False
        else:
            return self.licence.can_reuse and self.licence.can_modify

    def can_be_deleted_by(self, user):
        return user == self.owner

    def can_be_edited_by(self, user):
        return self.public_access == 'edit' or (user.is_superuser) or (self.owner == user) or self.has_access(user, ('edit',))

    def __eq__(self, other):
        return True

    @classmethod
    def filter_can_be_viewed_by(cls, user):
        view_perms = ('edit', 'view')
        if user.is_superuser:
            return Q()
        elif user.is_anonymous():
            return Q(published=True, public_access__in=view_perms)
        else:
            return (Q(access__user=user, access__access__in=view_perms) 
                    | Q(published=True, public_access__in=view_perms) 
                    | Q(author=user)
                    | Q(project__projectaccess__user=user)
                    | Q(project__owner=user)
                   )

class TimelineMixin(object):
    """ 
    A model which produces a timeline item when it is created.
    Models inheriting from this should implement either
     * self.object, or 
     * self.timeline_object() and self.can_be_deleted_by(user)
    as well as a GenericRelation `timelineitems` to TimelineItem
    """
    def can_be_deleted_by(self, user):
        try:
            if self.object.author == user:
                return True
        except AttributeError:
            pass
        return user == self.user

    def can_be_viewed_by(self, user):
        raise NotImplementedError

    def timeline_object(self):
        try:
            return self.object
        except AttributeError:
            ct = ContentType.objects.get(pk=self.object_content_type.pk)
            return ct.get_object_for_this_type(pk=self.object_id)

    @property
    def timelineitem(self):
        return self.timelineitems.get()

LOCALE_CHOICES = [(y, x) for x, y in settings.GLOBAL_SETTINGS['NUMBAS_LOCALES']]

class Project(models.Model, ControlledObject):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, related_name='own_projects')

    permissions = models.ManyToManyField(User, through='ProjectAccess')

    timeline = GenericRelation('TimelineItem', related_query_name='projects', content_type_field='timeline_content_type', object_id_field='timeline_id')

    public_view = models.BooleanField(default=False)
    watching_non_members = models.ManyToManyField(User, related_name='watched_projects')

    icon = 'briefcase'

    description = models.TextField(blank=True)
    default_locale = models.CharField(max_length=10, editable=True, default='en-GB')
    default_licence = models.ForeignKey('Licence', null=True, blank=True)

    def can_be_edited_by(self, user):
        return (user.is_superuser) or (self.owner == user) or self.has_access(user, ('edit',))

    def can_be_viewed_by(self, user):
        return self.public_view or super(Project, self).can_be_viewed_by(user)

    def get_absolute_url(self):
        return reverse('project_index', args=(self.pk,))

    def has_access(self, user, levels):
        if user.is_anonymous():
            return False
        return ProjectAccess.objects.filter(project=self, user=user, access__in=levels).exists()

    def members(self):
        return [self.owner]+list(User.objects.filter(project_memberships__project=self).exclude(pk=self.owner.pk))

    def all_timeline(self):
        items = self.timeline.all() | TimelineItem.objects.filter(editoritems__project=self)
        items.order_by('-date')
        return items

    @property
    def watching_users(self):
        return (User.objects.filter(pk=self.owner.pk) | User.objects.filter(project_memberships__project=self)).distinct()

    def __str__(self):
        return self.name

class ProjectAccess(models.Model, TimelineMixin):
    project = models.ForeignKey(Project)
    user = models.ForeignKey(User, related_name='project_memberships')
    access = models.CharField(default='view', editable=True, choices=USER_ACCESS_CHOICES, max_length=6)

    timelineitems = GenericRelation('TimelineItem', related_query_name='project_accesses', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/access.html'

    def can_be_deleted_by(self, user):
        return self.project.can_be_edited_by(user)

    def can_be_viewed_by(self, user):
        return self.project.can_be_viewed_by(user)

    def timeline_object(self):
        return self.project

    def icon(self):
        return 'eye-open'

    class Meta:
        unique_together = (("project", "user"),)

class ProjectInvitation(models.Model):
    email = models.EmailField()
    invited_by = models.ForeignKey(User)
    access = models.CharField(default='view', editable=True, choices=USER_ACCESS_CHOICES, max_length=6)
    project = models.ForeignKey(Project, related_name='invitations')

    def __str__(self):
        return "Invitation for {} to join {}".format(self.email, self.project)

@receiver(signals.post_save, sender=ProjectInvitation)
def send_project_invitation(instance, created, **kwargs):
    if created:
        template = get_template('project/invitation_email.txt')
        content = template.render({'invitation':instance, 'SITE_TITLE':settings.SITE_TITLE})
        subject = 'Invitation to join project "{}", on {}'.format(instance.project.name, settings.SITE_TITLE)
        send_mail(subject, content, from_email=settings.DEFAULT_FROM_EMAIL, recipient_list=(instance.email,))

@receiver(signals.post_save, sender=User)
def apply_project_invitations(instance, created, **kwargs):
    if created:
        invitations = ProjectInvitation.objects.filter(email=instance.email)
        for invitation in invitations:
            ProjectAccess.objects.create(project=invitation.project, user=instance, access=invitation.access)

class EditorTag(taggit.models.TagBase):
    official = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'tag'
        ordering = ['name']

    def used_count(self):
        return self.tagged_items.count()

#check that the .exam file for an object is valid and defines at the very least a name
def validate_content(content):
    try:
        obj = numbasobject.NumbasObject(content)
        if not 'name' in obj.data:
            raise ValidationError('No "name" property in content.')
    except Exception as err:
        raise ValidationError(err)

class Extension(models.Model):
    name = models.CharField(max_length=200, help_text='A human-readable name for the extension')
    location = models.CharField(default='', max_length=200, help_text='A unique identifier for this extension', verbose_name='Short name', blank=True, unique=True)
    url = models.CharField(max_length=300, blank=True, verbose_name='Documentation URL', help_text='Address of a page about the extension')
    public = models.BooleanField(default=False, help_text='Can this extension be seen by everyone?')
    slug = models.SlugField(max_length=200, editable=False, unique=False, default='an-extension')
    author = models.ForeignKey(User, related_name='own_extensions', blank=True, null=True)
    last_modified = models.DateTimeField(auto_now=True)
    zipfile_folder = 'user-extensions'
    zipfile = models.FileField(upload_to=zipfile_folder+'/zips', blank=True, null=True, max_length=255, verbose_name='Extension package', help_text='A .zip package containing the extension\'s files')

    def __str__(self):
        return self.name

    def as_json(self):
        d = {
            'name': self.name,
            'url': self.url,
            'pk': self.pk,
            'location': self.location,
            'author': self.author.pk if self.author is not None else None,
            'edit_url': reverse('extension_edit', args=(self.pk,)),
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
            local_path = os.path.join(self.extracted_path, filename)
            if os.path.exists(local_path):
                return settings.MEDIA_URL+self.zipfile_folder+'/extracted/'+str(self.pk)+'/'+self.location+'/'+filename
        else:
            path = 'js/numbas/extensions/%s/%s.js' % (self.location, self.location)
            if finders.find(path):
                return settings.STATIC_URL+path
        return None

    @property
    def extracted_path(self):
        if self.zipfile:
            return os.path.join(settings.MEDIA_ROOT, self.zipfile_folder, 'extracted', str(self.pk), self.location)
        else:
            return os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'], 'extensions', self.location)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(Extension, self).save(*args, **kwargs)

        if self.zipfile:
            if os.path.exists(self.extracted_path):
                shutil.rmtree(self.extracted_path)
            os.makedirs(self.extracted_path)

            _, extension = os.path.splitext(self.zipfile.name)
            if extension.lower() == '.zip':
                z = ZipFile(self.zipfile.file, 'r')
                z.extractall(self.extracted_path)
            elif extension.lower() == '.js':
                file = open(os.path.join(self.extracted_path, self.location+'.js'), 'wb')
                file.write(self.zipfile.file.read())
                file.close()

class Theme(models.Model):
    name = models.CharField(max_length=200)
    public = models.BooleanField(default=False, help_text='Can this theme be seen by everyone?')
    slug = models.SlugField(max_length=200, editable=False, unique=False)
    author = models.ForeignKey(User, related_name='own_themes')
    last_modified = models.DateTimeField(auto_now=True)
    zipfile_folder = 'user-themes'
    zipfile = models.FileField(upload_to=zipfile_folder+'/zips', max_length=255, verbose_name='Theme package', help_text='A .zip package containing the theme\'s files')

    def __str__(self):
        return self.name

    @property
    def extracted_path(self):
        return os.path.join(os.getcwd(), settings.MEDIA_ROOT, self.zipfile_folder, 'extracted', str(self.pk))

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(Theme, self).save(*args, **kwargs)

        if os.path.exists(self.extracted_path):
            shutil.rmtree(self.extracted_path)
        os.makedirs(self.extracted_path)
        z = ZipFile(self.zipfile.file, 'r')
        z.extractall(self.extracted_path)

@receiver(pre_delete, sender=Theme)
def reset_theme_on_delete(sender, instance, **kwargs):
    default_theme = settings.GLOBAL_SETTINGS['NUMBAS_THEMES'][0][1]
    for exam in instance.used_in_exams.all():
        exam.custom_theme = None
        exam.theme = default_theme
        exam.save()

class Resource(models.Model):
    owner = models.ForeignKey(User, related_name='resources')
    date_created = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='question-resources/', max_length=255) 

    @property
    def resource_url(self):
        return 'resources/%s' % self.file.name

    def delete(self, *args, **kwargs):
        self.file.delete(save=False)
        super(Resource, self).delete(*args, **kwargs)

    def as_json(self):
        return {
            'url': self.resource_url,
            'name': self.file.name,
            'pk': self.pk,
        }

class Licence(models.Model):
    name = models.CharField(max_length=80, unique=True)
    short_name = models.CharField(max_length=20, unique=True)
    can_reuse = models.BooleanField(default=True)
    can_modify = models.BooleanField(default=True)
    can_sell = models.BooleanField(default=True)
    url = models.URLField(blank=True)
    full_text = models.TextField(blank=True)

    def __str__(self):
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

STAMP_STATUS_CHOICES = (
    ('ok', 'Ready to use'),
    ('dontuse', 'Should not be used'),
    ('problem', 'Has some problems'),
    ('broken', 'Doesn\'t work'),
    ('pleasetest', 'Needs to be tested'),
)

class AbilityFramework(models.Model):
    name = models.CharField(max_length=200, blank=False, unique=True)
    description = models.TextField(blank=False)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

ABILITY_PRECISION = 10

class AbilityLevel(models.Model):
    name = models.CharField(max_length=200, blank=False, unique=True)
    description = models.TextField(blank=False)
    start = models.DecimalField(max_digits=ABILITY_PRECISION+1, decimal_places=ABILITY_PRECISION)
    end = models.DecimalField(max_digits=ABILITY_PRECISION+1, decimal_places=ABILITY_PRECISION)
    framework = models.ForeignKey(AbilityFramework, related_name='levels')

    class Meta:
        ordering = ('framework', 'start',)

    def __str__(self):
        return self.name

class Subject(models.Model):
    name = models.CharField(max_length=200, blank=False, unique=True)
    description = models.TextField(blank=False)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

class Topic(models.Model):
    name = models.CharField(max_length=200, blank=False, unique=True)
    description = models.TextField(blank=False)
    subjects = models.ManyToManyField(Subject)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

class Taxonomy(models.Model):
    name = models.CharField(max_length=200, blank=False, unique=True)
    description = models.TextField(blank=False)
    json = JSONField(blank=True)    # the JSON encoding of the taxonomy's nodes takes a while, and a lot of database queries, to make, so it's stored here and updated each time a node changes

    class Meta:
        verbose_name_plural = 'taxonomies'

    def __str__(self):
        return self.name

    def forest(self):
        """ 
        The nodes in the taxonomy, returned as a list of trees associating each node to its children.
        """
        key = lambda n:(len(n.code),n.code)
        def make_tree(node):
            return [(n,make_tree(n)) for n in sorted(node.children.all(), key=key)]
            
        return [(n,make_tree(n)) for n in sorted(self.nodes.filter(parent=None),key=key)]

    def create_json(self):
        def tree_json(leaves):
            return [{
                'pk': node.pk,
                'name': node.name,
                'code': node.code,
                'children': tree_json(kids)
            } for node,kids in leaves]

        self.json = tree_json(self.forest())
        return self.json

class TaxonomyNode(models.Model):
    name = models.CharField(max_length=200, blank=False, unique=False)
    parent = models.ForeignKey('TaxonomyNode', on_delete = models.CASCADE, related_name='children', blank=True, null=True)
    taxonomy = models.ForeignKey(Taxonomy, related_name='nodes')
    code = models.CharField(max_length=200, blank=False)

    def __str__(self):
        return self.name

@receiver(signals.post_save, sender=TaxonomyNode)
def update_taxonomy_json(instance, **kwargs):
    t = instance.taxonomy
    t.create_json()
    t.save()

class AbilityLevelField(models.FloatField):
    pass

class TaggedItem(taggit.models.GenericTaggedItemBase):
    tag = models.ForeignKey(EditorTag, related_name='tagged_editoritems')

class TaggedQuestion(taggit.models.GenericTaggedItemBase):
    tag = models.ForeignKey(EditorTag, related_name='tagged_items')

class Access(models.Model, TimelineMixin):
    item = models.ForeignKey('EditorItem')
    user = models.ForeignKey(User)
    access = models.CharField(default='view', editable=True, choices=USER_ACCESS_CHOICES, max_length=6)

    timelineitems = GenericRelation('TimelineItem', related_query_name='item_accesses', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/access.html'

    def can_be_viewed_by(self, user):
        return self.item.can_be_viewed_by(user)

    def can_be_deleted_by(self, user):
        return self.item.can_be_deleted_by(user)

    def timeline_object(self):
        return self.item

    def icon(self):
        return 'eye-open'

@receiver(signals.post_save, sender=Access)
def add_watching_user_for_access(instance, **kwargs):
    instance.item.watching_users.add(instance.user)

NUMBAS_FILE_VERSION = 'variables_as_objects'

@deconstructible
class NumbasObject(object):

    def get_parsed_content(self):
        if self.content:
            self.parsed_content = numbasobject.NumbasObject(self.content)
            self.name = self.parsed_content.data['name']
        elif self.name:
            self.parsed_content = numbasobject.NumbasObject(data={'name': self.name}, version=NUMBAS_FILE_VERSION)

        self.metadata = self.parsed_content.data.get('metadata', self.metadata)

        self.content = str(self.parsed_content)
        return self.parsed_content

    def set_name(self, name):
        self.name = name
        if self.content:
            self.get_parsed_content()
            self.parsed_content.data['name'] = name
            self.content = str(self.parsed_content)
        self.save()

    def __eq__(self, other):
        return self.content == other.content

@reversion.register
class EditorItem(models.Model, NumbasObject, ControlledObject):
    """
        Base model for exams and questions - each exam or question has a reference to an instance of this
    """
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, editable=False, unique=False)

    timeline = GenericRelation('TimelineItem', related_query_name='editoritems', content_type_field='timeline_content_type', object_id_field='timeline_id')

    author = models.ForeignKey(User, related_name='own_items')
    public_access = models.CharField(default='view', editable=True, choices=PUBLIC_ACCESS_CHOICES, max_length=6)
    access_rights = models.ManyToManyField(User, through='Access', blank=True, editable=False, related_name='accessed_questions+')
    licence = models.ForeignKey(Licence, null=True, blank=True)
    project = models.ForeignKey(Project, null=True, related_name='items')

    content = models.TextField(blank=True, validators=[validate_content])
    metadata = JSONField(blank=True)

    created = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    copy_of = models.ForeignKey('self', null=True, related_name='copies', on_delete=models.SET_NULL)

    tags = TaggableManager(through=TaggedItem)

    current_stamp = models.ForeignKey('NewStampOfApproval', blank=True, null=True, on_delete=models.SET_NULL)

    share_uuid_view = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    share_uuid_edit = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    published = models.BooleanField(default=False)
    published_date = models.DateTimeField(null=True)

    ability_level_start = AbilityLevelField(null=True)
    ability_level_end = AbilityLevelField(null=True)
    ability_levels = models.ManyToManyField(AbilityLevel)

    subjects = models.ManyToManyField(Subject)
    topics = models.ManyToManyField(Topic)
    taxonomy_nodes = models.ManyToManyField(TaxonomyNode)

    watching_users = models.ManyToManyField(User, related_name='watched_items')

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

    def __unicode__(self):
        return self.name

    @property
    def owner(self):
        return self.author

    def get_current_stamp(self):
        if self.current_stamp is not None:
            return self.current_stamp
        else:
            return NewStampOfApproval(object=self,status='draft')

    def has_access(self, user, levels):
        if user.is_anonymous():
            return False
        return self.project.has_access(user, levels) or Access.objects.filter(item=self, user=user, access__in=levels).exists()

    def publish(self):
        self.published = True
        self.published_date = datetime.now()

    def unpublish(self):
        self.published = False

    def set_licence(self, licence):
        NumbasObject.get_parsed_content(self)
        metadata = self.parsed_content.data.setdefault(u'metadata', {})
        metadata['licence'] = licence.name if licence is not None else None
        self.licence = licence
        self.content = str(self.parsed_content)

    def copy(self, author=None):
        e2 = deepcopy(self)
        e2.id = None
        e2.share_uuid_view = uuid.uuid4()
        e2.share_uuid_edit = uuid.uuid4()
        e2.current_stamp = None
        e2.public_access = 'view'
        e2.copy_of = self
        if author is not None:
            e2.author = author
        return e2

    def get_absolute_url(self):
        return self.rel_obj.get_absolute_url()

    @property
    def item_type(self):
        if hasattr(self, 'exam'):
            return 'exam'
        elif hasattr(self, 'question'):
            return 'question'

    @property
    def rel_obj(self):
        """ the exam/question object corresponding to this item (to make contructing the URLs easier, mainly) """
        if hasattr(self, 'exam'):
            return self.exam
        elif hasattr(self, 'question'):
            return self.question

    @property
    def as_numbasobject(self):
        if self.item_type == 'exam':
            return self.exam.as_numbasobject
        elif self.item_type == 'question':
            return self.question.as_numbasobject

    @property
    def icon(self):
        return self.rel_obj.icon

    @property
    def theme_path(self):
        return self.rel_obj.theme_path

    def edit_dict(self):
        """
            Dictionary of information passed to edit view
        """
        self.get_parsed_content()
        return {
            'id': self.rel_obj.id,
            'editoritem_id': self.id,
            'project_id': self.project.id,
            'author': self.author_id,
            'metadata': self.metadata,
            'published': self.published,
            'JSONContent': self.parsed_content.data,
            'tags': [t.name for t in self.tags.all()],
            'taxonomy_nodes': [n.pk for n in self.taxonomy_nodes.all()],
            'ability_levels': [a.pk for a in self.ability_levels.all()],
        }

    @property
    def filename(self):
        return '{}-{}-{}'.format(self.item_type, self.pk, self.slug)

    @property
    def network(self):
        ei = self
        while ei.copy_of:
            ei = ei.copy_of
        return sorted(ei.descendants(), key=lambda x: x.created)

    def descendants(self):
        return [self]+sum([ei2.descendants() for ei2 in self.copies.all()], [])

    def summary(self, user=None):
        current_stamp = self.get_current_stamp()
        obj = {
            'editoritem_id': self.id, 
            'name': self.name, 
            'metadata': self.metadata,
            'created': str(self.created),
            'last_modified': str(self.last_modified), 
            'author': self.author.get_full_name(), 
            'current_stamp': current_stamp.status,
            'current_stamp_display': current_stamp.get_status_display()
        }
        if self.item_type == 'exam':
            obj['id'] = self.exam.id
        elif self.item_type == 'question':
            obj['id'] = self.question.id

        if user:
            obj['canEdit'] = self.can_be_edited_by(user) 
        return obj

    def merge(self, other):
        oname = self.name
        self.content = other.content
        self.metadata = other.metadata

        self.tags.set(*other.tags.all())

        self.ability_levels.clear()
        self.ability_levels.add(*other.ability_levels.all())

        self.set_name(oname)

        self.rel_obj.merge(other.rel_obj)
        self.save()

@receiver(signals.post_save, sender=EditorItem)
def author_watches_editoritem(instance, created, **kwargs):
    if created:
        instance.watching_users.add(instance.author)

@receiver(signals.pre_save, sender=EditorItem)
def set_editoritem_name(instance, **kwargs):
    NumbasObject.get_parsed_content(instance)
    instance.slug = slugify(instance.name)
    if 'metadata' in instance.parsed_content.data:
        licence_name = instance.parsed_content.data['metadata'].get('licence', None)
    else:
        licence_name = None
    instance.licence = Licence.objects.filter(name=licence_name).first()

@receiver(signals.pre_save, sender=EditorItem)
def set_ability_level_limits(instance, **kwargs):
    if instance.pk is None:
        return
    ends = instance.ability_levels.aggregate(Min('start'), Max('end'))
    instance.ability_level_start = ends.get('start__min', None)
    instance.ability_level_end = ends.get('end__max', None)

class PullRequestManager(models.Manager):
    def open(self):
        return self.filter(open=True)

class PullRequest(models.Model, ControlledObject, TimelineMixin):
    objects = PullRequestManager()

    # user who created this request
    owner = models.ForeignKey(User, related_name='pullrequests_created')
    # user who accepted or rejected this request
    closed_by = models.ForeignKey(User, related_name='pullrequests_closed', null=True, blank=True, on_delete=models.SET_NULL)

    source = models.ForeignKey(EditorItem, related_name='outgoing_pull_requests')
    destination = models.ForeignKey(EditorItem, related_name='incoming_pull_requests')

    open = models.BooleanField(default=True)
    accepted = models.BooleanField(default=False)

    created = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True)

    timelineitems = GenericRelation('TimelineItem', related_query_name='pull_requests', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/pull_request.html'

    @property
    def object(self):
        return self.destination

    def timeline_user(self):
        if self.open:
            return self.owner
        else:
            return self.closed_by

    def has_access(self, user, accept_levels):
        return self.destination.has_access(user, accept_levels) or user == self.owner

    def can_be_merged_by(self, user):
        return self.destination.can_be_edited_by(user)

    def can_be_deleted_by(self, user):
        return user == self.owner or self.destination.can_be_edited_by(user)

    def can_be_viewed_by(self, user):
        return self.source.can_be_viewed_by(user) and self.destination.can_be_viewed_by(user)

    def clean(self):
        if self.source == self.destination:
            raise ValidationError({'source': "Source and destination are the same."})

    def validate_unique(self, exclude=None):
        if self.open and PullRequest.objects.filter(source=self.source, destination=self.destination, open=True).exists():
            raise ValidationError("There's already an open pull request between these items.")

    def accept(self, user):
        self.accepted = True
        self.destination.merge(self.source)
        self.close(user)
        self.save()

    def reject(self, user):
        self.accepted = False
        self.close(user)
        self.save()

    def close(self, user):
        self.open = False
        self.closed_by = user

class Timeline(object):
    def __init__(self, items, viewing_user):
        self.viewing_user = viewing_user
        items = items.prefetch_related('object')

        nonsticky_broadcasts = SiteBroadcast.objects.visible_now().exclude(sticky=True)

        view_filter = Q(editoritems__published=True) | Q(object_content_type=ContentType.objects.get_for_model(SiteBroadcast), object_id__in=nonsticky_broadcasts)

        if not self.viewing_user.is_anonymous():
            projects = self.viewing_user.own_projects.all() | Project.objects.filter(projectaccess__in=self.viewing_user.project_memberships.all()) | Project.objects.filter(watching_non_members=self.viewing_user)
            items_for_user = (
                Q(editoritems__in=self.viewing_user.watched_items.all()) | 
                Q(editoritems__project__in=projects) |
                Q(projects__in=projects)
            )

            view_filter = view_filter | items_for_user
        filtered_items = items.filter(view_filter)
        if not self.viewing_user.is_anonymous():
            filtered_items = filtered_items.exclude(hidden_by=self.viewing_user)
        self.filtered_items = filtered_items

    def __getitem__(self, index):
        return self.filtered_items.__getitem__(index)

class TimelineItemManager(models.Manager):
    def visible_to(self, user):
        objects = self.exclude(hidden_by=user)
        return objects

class TimelineItem(models.Model):
    objects = TimelineItemManager()

    # Object whose timeline this item belongs to
    timeline_content_type = models.ForeignKey(ContentType, related_name='timelineitem_timeline', null=True)
    timeline_id = models.PositiveIntegerField(null=True)
    timeline = GenericForeignKey('timeline_content_type', 'timeline_id')

    # Reference to an object representing this item (e.g. a Comment)
    object_content_type = models.ForeignKey(ContentType, related_name='timelineitem_object')
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type', 'object_id')

    user = models.ForeignKey(User, related_name='timelineitems', null=True)

    hidden_by = models.ManyToManyField(User, related_name='hidden_timelineitems', blank=True)

    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '{}: {}'.format(self.date, str(self.object))

    def can_be_deleted_by(self, user):
        try:
            return self.object.can_be_deleted_by(user)
        except AttributeError:
            return False

    def can_be_viewed_by(self, user):
        return self.user == user or self.object.can_be_viewed_by(user)

    class Meta:
        unique_together = (('object_id', 'object_content_type'),)
        ordering = ('-date',)

@receiver(signals.post_delete, sender=TimelineItem)
def delete_timelineitem_object(instance, *args, **kwargs):
    if instance.object is not None:
        instance.object.delete()

class SiteBroadcastManager(models.Manager):
    def visible_now(self):
        return self.filter(Q(show_until__gte=datetime.now()) | Q(show_until=None))

class SiteBroadcast(models.Model, TimelineMixin):
    objects = SiteBroadcastManager()

    author = models.ForeignKey(User, related_name='site_broadcasts')
    title = models.CharField(max_length=200)
    text = models.TextField()
    sticky = models.BooleanField(default=False)
    show_until = models.DateTimeField(null=True, blank=True)

    timelineitems = GenericRelation(TimelineItem, related_query_name='site_broadcasts', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/site_broadcast.html'

    def can_be_deleted_by(self, user):
        return False

    def can_be_viewed_by(self, user):
        return True

    def timeline_object(self):
        return None

    def __str__(self):
        return self.text[:50]

class NewStampOfApproval(models.Model, TimelineMixin):
    object = models.ForeignKey(EditorItem, related_name='stamps')

    timelineitems = GenericRelation(TimelineItem, related_query_name='stamps', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/stamp.html'

    user = models.ForeignKey(User, related_name='newstamps')
    status = models.CharField(choices=STAMP_STATUS_CHOICES, max_length=20)

    def __str__(self):
        return '{} said "{}"'.format(self.user.username, self.get_status_display())

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)

class Comment(models.Model, TimelineMixin):
    object_content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type', 'object_id')

    timelineitems = GenericRelation(TimelineItem, related_query_name='comments', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/comment.html'

    user = models.ForeignKey(User, related_name='comments')
    text = models.TextField()

    def __str__(self):
        return 'Comment by {} on {}: "{}"'.format(self.user.get_full_name(), str(self.object), self.text[:47]+'...' if len(self.text) > 50 else self.text)

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)

class RestorePoint(models.Model, TimelineMixin):
    object = models.ForeignKey(EditorItem, related_name='restore_points')

    timelineitems = GenericRelation(TimelineItem, related_query_name='restore_points', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/restore_point.html'

    user = models.ForeignKey(User, related_name='restore_points')
    description = models.TextField()

    revision = models.ForeignKey(reversion.models.Revision)
    
    def __str__(self):
        return 'Restore point set by {} on {}: "{}"'.format(self.user.get_full_name(), str(self.object), self.description[:47]+'...' if len(self.description) > 50 else self.description)

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)

ITEM_CHANGED_VERBS = [('created', 'created')]
class ItemChangedTimelineItem(models.Model, TimelineMixin):
    object = models.ForeignKey(EditorItem)
    verb = models.CharField(choices=ITEM_CHANGED_VERBS, editable=False, max_length=10)
    user = models.ForeignKey(User)

    timelineitems = GenericRelation(TimelineItem, related_query_name='item_changes', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/change.html'

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)
    
    def can_be_deleted_by(self, user):
        return False

    def icon(self):
        return {
            'created': 'plus',
            'deleted': 'remove',
            'published': 'globe',
        }[self.verb]

    def __str__(self):
        return '{} {} {}'.format(self.user.get_full_name(), self.verb, str(self.object))

@receiver(signals.post_save)
def create_timelineitem(sender, instance, created, **kwargs):
    if not issubclass(sender, TimelineMixin):
        return
    if created:
        try:
            user = User.objects.get(pk=instance.user.pk)
        except AttributeError:
            user = None
        TimelineItem.objects.create(object=instance, timeline=instance.timeline_object(), user=user)

@reversion.register
class NewQuestion(models.Model):
    editoritem = models.OneToOneField(EditorItem, on_delete=models.CASCADE, related_name='question')

    resources = models.ManyToManyField(Resource, blank=True)
    extensions = models.ManyToManyField(Extension, blank=True)

    theme_path = os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'], 'themes', 'question')

    icon = 'file'

    class Meta:
        ordering = ['editoritem__name']
        permissions = (
              ('highlight', 'Can pick questions to feature on the front page.'),
        )

    def __str__(self):
        return self.editoritem.name

    def __unicode__(self):
        return self.editoritem.name

    def get_absolute_url(self):
        return reverse('question_edit', args=(self.pk, self.editoritem.slug))

    @property
    def resource_paths(self):
        return [(r.file.name, r.file.path) for r in self.resources.all()]

    @property
    def as_numbasobject(self):
        self.editoritem.get_parsed_content()
        data = OrderedDict([
            ('name', self.editoritem.name),
            ('extensions', [e.location for e in self.extensions.all()]),
            ('resources', self.resource_paths),
            ('navigation', {'allowregen': True, 'showfrontpage': False, 'preventleave': False}),
            ('question_groups', [{'pickingStrategy':'all-ordered', 'questions':[self.editoritem.parsed_content.data]}])
        ])
        obj = numbasobject.NumbasObject(data=data, version=self.editoritem.parsed_content.version)
        return obj

    def edit_dict(self):
        d = self.editoritem.edit_dict()
        d['extensions'] = [e.location for e in self.extensions.all()]
        d['resources'] = [res.as_json() for res in self.resources.all()]
        return d

    def summary(self, user=None):
        obj = self.editoritem.summary(user)
        obj['url'] = reverse('question_edit', args=(self.pk, self.editoritem.slug,))
        obj['deleteURL'] = reverse('question_delete', args=(self.pk, self.editoritem.slug))
        return obj

    @property
    def exams_using_this(self):
        return self.exams.distinct()

    def copy(self, author=None):
        q2 = deepcopy(self)
        q2.id = None

        ei2 = self.editoritem.copy(author)
        ei2.save()

        q2.editoritem = ei2
        q2.save()

        q2.resources = self.resources.all()
        q2.extensions = self.extensions.all()
        q2.save()

        return q2

    def merge(self, other):
        self.resources.clear()
        self.resources.add(*other.resources.all())
        self.extensions.clear()
        self.extensions.add(*other.extensions.all())
        self.save()

@reversion.register
class NewExam(models.Model):
    editoritem = models.OneToOneField(EditorItem, on_delete=models.CASCADE, related_name='exam')

    questions = models.ManyToManyField(NewQuestion, through='NewExamQuestion', blank=True, editable=False, related_name='exams')

    theme = models.CharField(max_length=200, default='default', blank=True)  # used if custom_theme is None
    custom_theme = models.ForeignKey(Theme, null=True, blank=True, on_delete=models.SET_NULL, related_name='used_in_newexams')
    locale = models.CharField(max_length=200, default='en-GB')

    icon = 'book'

    def __str__(self):
        return self.editoritem.name

    def __unicode__(self):
        return self.editoritem.name

    def get_absolute_url(self):
        return reverse('exam_edit', args=(self.pk, self.editoritem.slug))

    @property
    def resources(self):
        return Resource.objects.filter(newquestion__in=self.questions.all()).distinct()

    @property
    def resource_paths(self):
        return [(r.file.name, r.file.path) for r in self.resources.all()]

    @property
    def theme_path(self):
        if self.custom_theme:
            return self.custom_theme.extracted_path
        else:
            return os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'], 'themes', self.theme)

    @property
    def as_numbasobject(self):
        obj = numbasobject.NumbasObject(self.editoritem.content)
        data = obj.data
        question_groups = self.question_groups
        data['extensions'] = [e.location for e in self.extensions]
        data['name'] = self.editoritem.name
        for i, g in enumerate(data['question_groups']):
            if i < len(question_groups):
                questions = question_groups[i]
            else:
                questions = []
            g['questions'] = [numbasobject.NumbasObject(q.editoritem.content).data for q in questions]
        data['resources'] = self.resource_paths
        
        return obj

    def edit_dict(self):
        """ 
            Dictionary of information passed to update view 
        """
        exam_dict = self.editoritem.edit_dict()
        exam_dict['local'] = self.locale
        exam_dict['custom_theme'] = self.custom_theme_id
        exam_dict['theme'] = self.theme
        groups = groupby(self.newexamquestion_set.order_by('group', 'qn_order'), key=lambda q: q.group)
        exam_dict['question_groups'] = [{'group':group, 'questions':[q.question.summary() for q in qs]} for group, qs in groups]

        return exam_dict

    
    @property
    def question_groups(self):
        groups = []
        for eq in self.newexamquestion_set.all():
            while len(groups) < eq.group+1:
                groups.append([])
            groups[eq.group].append(eq.question)
        return groups

    @property
    def extensions(self):
        return Extension.objects.filter(newquestion__in=self.questions.all()).distinct()

    def set_question_groups(self, question_groups):
        with transaction.atomic():
            self.questions.clear()
            for group_number, group in enumerate(question_groups):
                for order, pk in enumerate(group):
                    exam_question = NewExamQuestion(exam=self, question=NewQuestion.objects.get(pk=pk), qn_order=order, group=group_number)
                    exam_question.save()

    def copy(self, author=None):
        e2 = deepcopy(self)
        e2.id = None

        ei2 = self.editoritem.copy(author)
        ei2.save()

        e2.editoritem = ei2
        e2.save()

        for eq in NewExamQuestion.objects.filter(exam=self):
            NewExamQuestion.objects.create(exam=e2, question=eq.question, qn_order=eq.qn_order, group=eq.group)
        e2.custom_theme = self.custom_theme
        e2.save()

        return e2

    def merge(self, other):
        with transaction.atomic():
            for eq in other.newexamquestion_set.all():
                exam_question = NewExamQuestion(exam=self, question=eq.question, qn_order=eq.qn_order, group=eq.group)
                exam_question.save()
        self.theme = other.theme
        self.custom_theme = other.custom_theme
        self.locale = other.locale
        self.save()

class NewExamQuestion(models.Model):
    
    """
        Through model for a question belonging to an exam.
        Specifies position the question should appear in.
    """
    
    class Meta:
        ordering = ['qn_order']
        
    exam = models.ForeignKey(NewExam)
    question = models.ForeignKey(NewQuestion)
    qn_order = models.PositiveIntegerField()
    group = models.PositiveIntegerField(default=0)

@receiver(signals.post_save, sender=NewQuestion)
@receiver(signals.post_save, sender=NewExam)
def item_created_timeline_event(instance, created, **kwargs):
    if created:
        ItemChangedTimelineItem.objects.create(user=instance.editoritem.author, object=instance.editoritem, verb='created')

@receiver(signals.post_save, sender=NewStampOfApproval)
@receiver(signals.post_delete, sender=NewStampOfApproval)
def set_current_stamp(instance, **kwargs):
    instance.object.current_stamp = NewStampOfApproval.objects.filter(object=instance.object).last()
    instance.object.save()


@receiver(signals.post_save, sender=NewStampOfApproval)
def notify_stamp(instance, **kwargs):
    notify_watching(instance.user, target=instance.object, verb='gave feedback on', action_object=instance)

@receiver(signals.post_save, sender=Comment)
def notify_comment(instance, **kwargs):
    notify_watching(instance.user, target=instance.object, verb='commented on', action_object=instance)



#    Everything below is to be deleted in Numbas 2.0

class EditorModel(models.Model):
    class Meta:
        abstract = True

    licence = models.ForeignKey(Licence, null=True)

    current_stamp = models.ForeignKey('StampOfApproval', blank=True, null=True, on_delete=models.SET_NULL)

    share_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    published = models.BooleanField(default=False)
    published_date = models.DateTimeField(null=True)

    ability_level_start = AbilityLevelField(null=True)
    ability_level_end = AbilityLevelField(null=True)
    ability_levels = models.ManyToManyField(AbilityLevel)

    subjects = models.ManyToManyField(Subject)
    topics = models.ManyToManyField(Topic)

    def set_licence(self, licence):
        NumbasObject.get_parsed_content(self)
        metadata = self.parsed_content.data.setdefault(u'metadata', {})
        metadata['licence'] = licence.name
        self.licence = licence
        self.content = str(self.parsed_content)

    @property
    def timeline(self):
        return []
    
    @property
    def stamps(self):
        return NewStampOfApproval.objects.filter(object_content_type=ContentType.objects.get_for_model(self.__class__), object_id=self.pk).order_by('-date')

class QuestionManager(models.Manager):
    def viewable_by(self, user):
        if user.is_superuser:
            return self.all()
        elif user.is_anonymous():
            return self.filter(public_access__in=['edit', 'view'])
        else:
            mine_or_public_query = Q(public_access__in=['edit', 'view']) | Q(author=user)
            mine_or_public = self.all().filter(mine_or_public_query)
            given_access = QuestionAccess.objects.filter(access__in=['edit', 'view'], user=user).values_list('question', flat=True)
            return mine_or_public | self.exclude(mine_or_public_query).filter(pk__in=given_access)

@reversion.register
class Question(EditorModel, NumbasObject, ControlledObject):
    
    """Model class for a question.
    
    Many-to-many relation with Exam through ExamQuestion.
    
    """

    objects = QuestionManager()
    
    name = models.CharField(max_length=200, default='Untitled Question')
    theme_path = 'question'
    slug = models.SlugField(max_length=200, editable=False, unique=False)
    author = models.ForeignKey(User, related_name='own_questions')
    filename = models.CharField(max_length=200, editable=False, default='')
    content = models.TextField(blank=True, validators=[validate_content])
    metadata = JSONField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    resources = models.ManyToManyField('Image', blank=True)
    copy_of = models.ForeignKey('self', null=True, related_name='copies', on_delete=models.SET_NULL)
    extensions = models.ManyToManyField(Extension, blank=True)

    public_access = models.CharField(default='view', editable=True, choices=PUBLIC_ACCESS_CHOICES, max_length=6)
    access_rights = models.ManyToManyField(User, through='QuestionAccess', blank=True, editable=False, related_name='accessed_questions+')

    tags = TaggableManager(through=TaggedQuestion)

    class Meta:
        ordering = ['name']
        permissions = (
              ('highlight', 'Can pick questions to feature on the front page.'),
        )

    def __str__(self):
        return '%s' % self.name

    def save(self, *args, **kwargs):
        NumbasObject.get_parsed_content(self)

        self.slug = slugify(self.name)

        if 'metadata' in self.parsed_content.data:
            licence_name = self.parsed_content.data['metadata'].get('licence', None)
        else:
            licence_name = None
        self.licence = Licence.objects.filter(name=licence_name).first()

        super(Question, self).save(*args, **kwargs)

        if 'tags' in self.parsed_content.data:
            self.tags.set(*[t.strip() for t in self.parsed_content.data['tags']])


    def delete(self, *args, **kwargs):
        super(Question, self).delete(*args, **kwargs)

    def get_filename(self):
        return 'question-%i-%s' % (self.pk, self.slug)

    def as_numbasobject(self):
        self.get_parsed_content()
        data = OrderedDict([
            ('name', self.name),
            ('extensions', [e.location for e in self.extensions.all()]),
            ('resources', [[i.image.name, i.image.path] for i in self.resources.all()]),
            ('navigation', {'allowregen': 'true', 'showfrontpage': 'false', 'preventleave': False}),
            ('questions', [self.parsed_content.data])
        ])
        obj = numbasobject.NumbasObject(data=data, version=self.parsed_content.version)
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
            'url': reverse('question_edit', args=(self.pk, self.slug,)),
            'deleteURL': reverse('question_delete', args=(self.pk, self.slug)),
        }
        if user:
            obj['canEdit'] = self.can_be_edited_by(user) 
        return obj

    def set_access(self, user, access_level):
        access = QuestionAccess(user=user, question=self, access=access_level)
        access.save()

    def get_access_for(self, user):
        if user.is_anonymous():
            return 'none'
        try:
            question_access = QuestionAccess.objects.get(question=self, user=user)
            return question_access.access
        except QuestionAccess.DoesNotExist:
            return 'none'

    @property
    def network(self):
        q = self
        while q.copy_of:
            q = q.copy_of
        return sorted(q.descendants(), key=lambda x: x.created)

    def descendants(self):
        return [self]+sum([q2.descendants() for q2 in self.copies.all()], [])

    @property
    def exams_using_this(self):
        return self.exam_set.distinct()

class QuestionAccess(models.Model):
    question = models.ForeignKey(Question)
    user = models.ForeignKey(User)
    access = models.CharField(default='view', editable=True, choices=USER_ACCESS_CHOICES, max_length=6)

@receiver(signals.post_save, sender=QuestionAccess)
def notify_given_question_access(instance, created, **kwargs):
    if created and hasattr(instance, 'given_by'):
        notify.send(instance.given_by, verb='gave you access to', target=instance.question, recipient=instance.user)

class QuestionHighlight(models.Model):
    class Meta:
        ordering = ['-date']

    question = models.ForeignKey(Question)
    picked_by = models.ForeignKey(User)
    note = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)

class QuestionPullRequest(models.Model):
    objects = PullRequestManager()

    owner = models.ForeignKey(User)
    source = models.ForeignKey(Question, related_name='outgoing_pull_requests')
    destination = models.ForeignKey(Question, related_name='incoming_pull_requests')
    open = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True)

    def clean(self):
        if self.source == self.destination:
            raise ValidationError({'source': "Source and destination are the same."})

    def validate_unique(self, exclude=None):
        if self.open and QuestionPullRequest.objects.filter(source=self.source, destination=self.destination, open=True).exists():
            raise ValidationError("There's already an open pull request between these questions.")

    def merge(self, user):
        source, destination = self.source, self.destination
        with transaction.atomic(), reversion.create_revision():
            oname = destination.name
            destination.content = source.content
            destination.metadata = source.metadata
            
            destination.extensions.clear()
            destination.extensions.add(*source.extensions.all())
            
            destination.resources.clear()
            destination.resources.add(*source.resources.all())

            destination.save()
            destination.set_name(oname)
            reversion.set_user(self.owner)
            reversion.set_comment("Merged with {}:\n{}".format(source.name, self.comment))

        if user != self.owner:
            notify.send(user, verb='has accepted your request to merge into', target=self.destination, recipient=self.owner, action_object=self)


    def reject(self, user):
        self.delete()
        if user != self.owner:
            notify.send(user, verb='has rejected your request to merge', target=self.source, recipient=self.owner, action_object=self)

    def can_be_merged_by(self, user):
        return self.destination.can_be_edited_by(user)

    def can_be_deleted_by(self, user):
        return user == self.owner or self.destination.can_be_edited_by(user)

@receiver(signals.pre_save, sender=QuestionPullRequest)
def clean_pull_request_pre_save(sender, instance, *args, **kwargs):
    instance.full_clean()

@receiver(signals.post_save, sender=QuestionPullRequest)
def notify_pull_request(instance, created, **kwargs):
    if created and instance.owner != instance.destination.author:
        notify.send(instance.owner, verb='has sent you a request to merge', target=instance.destination, recipient=instance.destination.author, action_object=instance)



@reversion.register
class Exam(EditorModel, NumbasObject, ControlledObject):
    
    """Model class for an Exam.
    
    Many-to-many relation with Question through ExamQuestion.
    
    """
    
    questions = models.ManyToManyField(Question, through='ExamQuestion',
                                       blank=True, editable=False)
    name = models.CharField(max_length=200, default='Untitled Exam')
    theme = models.CharField(max_length=200, default='default', blank=True)  # used if custom_theme is None
    custom_theme = models.ForeignKey(Theme, null=True, blank=True, on_delete=models.SET_NULL, related_name='used_in_exams')
    locale = models.CharField(max_length=200, default='en-GB')
    slug = models.SlugField(max_length=200, editable=False, unique=False)
    author = models.ForeignKey(User, related_name='own_exams')
    filename = models.CharField(max_length=200, editable=False, default='')
    content = models.TextField(blank=True, validators=[validate_content])
    created = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    metadata = JSONField(blank=True)

    public_access = models.CharField(default='view', editable=True, choices=PUBLIC_ACCESS_CHOICES, max_length=6)
    access_rights = models.ManyToManyField(User, through='ExamAccess', blank=True, editable=False, related_name='accessed_exams+')

    class Meta:
        ordering = ['name']
        permissions = (
              ('highlight', 'Can pick exams to feature on the front page.'),
        )

    def __str__(self):
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

    def set_questions(self, question_list=None, **kwargs):
        """ 
            Set the list of questions for this exam. 
            question_list is an ordered list of question IDs
        """

        if 'question_ids' in kwargs:
            question_list = [Question.objects.get(pk=pk) for pk in kwargs['question_ids']]

        self.questions.clear()
        for order, question in enumerate(question_list):
            exam_question = ExamQuestion(exam=self, question=question, qn_order=order)
            exam_question.save()
    
    def save(self, *args, **kwargs):
        NumbasObject.get_parsed_content(self)
        
        self.slug = slugify(self.name)

        if 'metadata' in self.parsed_content.data:
            licence_name = self.parsed_content.data['metadata'].get('licence', None)
        else:
            licence_name = None
        self.licence = Licence.objects.filter(name=licence_name).first()
            
        super(Exam, self).save(*args, **kwargs)

    def get_filename(self):
        return 'exam-%i-%s' % (self.pk, self.slug)
        
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
        data['resources'] = [[i.image.name, i.image.path] for i in set(resources)]
        
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
            'url': reverse('exam_edit', args=(self.pk, self.slug,)),
            'deleteURL': reverse('exam_delete', args=(self.pk, self.slug)),
        }
        if user:
            obj['canEdit'] = self.can_be_edited_by(user) 
        return obj

    def set_access(self, user, access_level):
        access = ExamAccess(user=user, exam=self, access=access_level)
        access.save()

    def get_access_for(self, user):
        if user.is_anonymous():
            return 'none'
        try:
            exam_access = ExamAccess.objects.get(exam=self, user=user)
            return exam_access.access
        except ExamAccess.DoesNotExist:
            return 'none'

@receiver(signals.post_delete)
def remove_deleted_notifications(sender, instance=None, **kwargs):
    if sender in [NewQuestion, NewExam, NewStampOfApproval, Comment]:
        Notification.objects.filter(target_object_id=instance.pk).delete()
        Notification.objects.filter(action_object_object_id=instance.pk).delete()

class ExamHighlight(models.Model):
    class Meta:
        ordering = ['-date']

    exam = models.ForeignKey(Exam)
    picked_by = models.ForeignKey(User)
    note = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)

class ExamAccess(models.Model):
    exam = models.ForeignKey(Exam)
    user = models.ForeignKey(User)
    access = models.CharField(default='view', editable=True, choices=USER_ACCESS_CHOICES, max_length=6)

@receiver(signals.post_save, sender=ExamAccess)
def notify_given_exam_access(instance, created, **kwargs):
    if created and hasattr(instance, 'given_by'):
        notify.send(instance.given_by, verb='gave you access to', target=instance.exam, recipient=instance.user)
        
class ExamQuestion(models.Model):
    
    """Model class linking exams and questions."""
    
    class Meta:
        ordering = ['qn_order']
        
    exam = models.ForeignKey(Exam)
    question = models.ForeignKey(Question)
    qn_order = models.PositiveIntegerField()

class Image(models.Model):
    # on its way out as of Numbas editor 2.0
    title = models.CharField(max_length=255) 
    image = models.ImageField(upload_to='question-resources/', max_length=255) 

    @property 
    def data_url(self):
        try:
            img = open(self.image.path, "rb") 
            data = img.read() 
            return "data:image/jpg;base64, %s" % codecs.encode(data, 'base64')[:-1]
    
        except IOError:
            return self.image.url

    @property
    def resource_url(self):
        return 'resources/%s' % self.image.name

    def delete(self, *args, **kwargs):
        self.image.delete(save=False)
        super(Image, self).delete(*args, **kwargs)

    def as_json(self):
        return {
            'url': self.resource_url,
            'name': self.image.name,
            'pk': self.pk,
            'delete_url': reverse('delete_resource', args=(self.pk,)),
        }

    def summary(self):
        return json.dumps(self.as_json()),

class StampOfApproval(models.Model, TimelineMixin):
    object_content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type', 'object_id')

    user = models.ForeignKey(User, related_name='stamps')
    status = models.CharField(choices=STAMP_STATUS_CHOICES, max_length=20)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '{} stamped {} as "{}"'.format(self.user.username, self.object.name, self.get_status_display(), self.date)

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)
