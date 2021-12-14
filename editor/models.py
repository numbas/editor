import uuid
import os
import re
from copy import deepcopy
import shutil
from zipfile import ZipFile
import json
from datetime import datetime
from itertools import groupby
import codecs
from pathlib import Path
import urllib.parse
try:
    # For Python > 2.7
    from collections import OrderedDict
except ImportError:
    # For Python < 2.6 (after installing ordereddict)
    from ordereddict import OrderedDict

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.staticfiles import finders
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.urls import reverse
from django.db import models, transaction
from django.db.models import signals, Max, Min, Exists, OuterRef
from django.db.models.functions import Lower
from django.dispatch import receiver
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.db.models import Q
from django.forms import model_to_dict
from django.utils import timezone
from django.utils.deconstruct import deconstructible
from django.template.loader import get_template
from django.core.mail import send_mail
from .slugify import slugify

import reversion
import reversion.models

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
    """
        An object with controls on who can view, edit, copy and delete it.

        Classes inheriting this must implement:

        * owner : User
        * is_published : () -> bool
        * superuser_sees_everything : bool
        * access : GenericRelation to IndividualAccess
    """

    superuser_sees_everything = True

    @property
    def owner(self):
        raise NotImplementedError

    def is_published(self):
        raise NotImplementedError

    def has_access(self, user, accept_levels):
        if user.is_anonymous:
            return False
        return self.access.filter(user=user, access__in=accept_levels).exists()

    def can_be_viewed_by(self, user):
        if getattr(settings, 'EVERYTHING_VISIBLE', False):
            return True
        
        return (self.superuser_sees_everything and user.is_superuser) or (self.owner == user) or self.is_published() or (self.has_access(user, ('view', 'edit')))

    def can_be_edited_by(self, user):
        return (user.is_superuser) or (self.owner == user) or self.has_access(user, ('edit',))

    def can_be_copied_by(self, user):
        return self.can_be_viewed_by(user)

    def can_be_deleted_by(self, user):
        return user == self.owner

    def __eq__(self, other):
        return True

    @classmethod
    def filter_can_be_edited_by(cls, user):
        if user.is_superuser and cls.superuser_sees_everything:
            return Q()
        elif user.is_anonymous:
            return Q(pk=None)
        else:
            return (Q(access__user=user, access__access='edit')
                    | Q(author=user)
                    | Q(project__access__user=user, project__access__access='edit')
                    | Q(project__owner=user)
                   )
    @classmethod
    def filter_can_be_viewed_by(cls, user):
        if getattr(settings, 'EVERYTHING_VISIBLE', False):
            return Q()
        
        view_perms = ('edit', 'view')
        if user.is_superuser and cls.superuser_sees_everything:
            return Q()
        elif user.is_anonymous:
            return Q(published=True)
        else:
            return (Q(access__user=user, access__access__in=view_perms) 
                    | Q(published=True)
                    | Q(author=user)
                    | Q(project__access__user=user)
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


def reassign_content(from_user,to_user):
    with transaction.atomic():
        for p in from_user.own_projects.all():
            p.owner = to_user
            p.save()

        for pi in from_user.project_invitations.all():
            if not pi.project.has_access(to_user,(pi.access,)):
                pi.user = to_user
                pi.save()

        for e in from_user.own_extensions.all():
            e.author = to_user
            e.save()

        for t in from_user.own_themes.all():
            t.author = to_user
            t.save()

        for a in from_user.individual_accesses.all():
            a.combine_access(to_user)

        for cpt in from_user.own_custom_part_types.all():
            cpt.author = to_user
            cpt.save()

        for r in from_user.resources.all():
            r.owner = to_user
            r.save()

        for ei in from_user.own_items.all():
            ei.author = to_user
            ei.save()

        for sb in from_user.site_broadcasts.all():
            sb.author = to_user
            sb.save()

class Project(models.Model, ControlledObject):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, related_name='own_projects', on_delete=models.CASCADE)

    access = GenericRelation('IndividualAccess', related_query_name='project', content_type_field='object_content_type', object_id_field='object_id')

    timeline = GenericRelation('TimelineItem', related_query_name='projects', content_type_field='timeline_content_type', object_id_field='timeline_id')
    timeline_noun = 'project'

    public_view = models.BooleanField(default=False)
    watching_non_members = models.ManyToManyField(User, related_name='watched_projects')
    unwatching_members = models.ManyToManyField(User, related_name='unwatched_projects')

    icon = 'briefcase'

    description = models.TextField(blank=True)
    default_locale = models.CharField(max_length=10, editable=True, default='en-GB')
    default_licence = models.ForeignKey('Licence', null=True, blank=True, on_delete=models.SET_NULL)

    custom_part_types = models.ManyToManyField('CustomPartType', related_name='projects')

    class Meta:
        ordering = ['name']

    def is_published(self):
        return self.public_view

    def get_absolute_url(self):
        return reverse('project_index', args=(self.pk,))

    def has_access(self, user, levels):
        if user==self.owner:
            return True
        return super().has_access(user,levels)

    def members(self):
        return [self.owner]+self.non_owner_members()

    def non_owner_members(self):
        return list(User.objects.filter(individual_accesses__in=self.access.all()).exclude(pk=self.owner.pk))

    def all_timeline(self):
        items = self.timeline.all() | TimelineItem.objects.filter(
            Q(editoritems__project=self) |
            Q(item_queue_entry__queue__project = self) |
            Q(item_queue_entries__queue__project = self)
        )

        items.order_by('-date')
        return items

    @property
    def watching_users(self):
        q = (User.objects.filter(pk=self.owner.pk) | User.objects.filter(individual_accesses__in=self.access.all()) | self.watching_non_members.all()).distinct()
        return q.exclude(pk__in=self.unwatching_members.all())

    def __str__(self):
        return self.name

    def num_published_questions(self):
        return self.items.questions().filter(published=True).count()

    def num_published_exams(self):
        return self.items.exams().filter(published=True).count()

    def folder_hierarchy(self):
        folders = self.folders.all()
        tree = []
        folder_dict = {f.pk: {'folder': f, 'subfolders': []} for f in folders}
        for f in folders:
            if f.parent and f.parent.pk in folder_dict:
                folder_dict[f.parent.pk]['subfolders'].append(folder_dict[f.pk])
            else:
                tree.append(folder_dict[f.pk])
        return tree

    def get_folder_breadcrumbs(self,path):
        breadcrumbs = []
        if len(path):
            parent = None
            for name in path.split('/'):
                try:
                    folder = self.folders.get(name=urllib.parse.unquote(name),parent=parent)
                except Folder.MultipleObjectsReturned:
                    folders = self.folders.filter(name=urllib.parse.unquote(name),parent=parent)
                    folder = folders[0]
                    with transaction.atomic():
                        for ofolder in folders[1:]:
                            ofolder.merge_into(folder)
                breadcrumbs.append(folder)
                parent = folder
        return breadcrumbs

    def get_folder(self,path):
        breadcrumbs = self.get_folder_breadcrumbs(path)
        if len(breadcrumbs):
            return breadcrumbs[-1]
        else:
            return None

    @classmethod
    def filter_can_be_edited_by(cls, user):
        if user.is_superuser and cls.superuser_sees_everything:
            return Q()
        elif user.is_anonymous:
            return Q(pk=None)
        else:
            return (Q(access__user=user, access__access='edit')
                    | Q(owner=user)
                   )
    @classmethod
    def filter_can_be_viewed_by(cls, user):
        if getattr(settings, 'EVERYTHING_VISIBLE', False):
            return Q()
        
        view_perms = ('edit', 'view')
        if user.is_superuser and cls.superuser_sees_everything:
            return Q()
        elif user.is_anonymous:
            return Q(public_view=True)
        else:
            return (Q(access__user=user, access__access__in=view_perms) 
                    | Q(public_view=True) 
                    | Q(owner=user)
                   )

class IndividualAccess(models.Model, TimelineMixin):
    object_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type', 'object_id')

    user = models.ForeignKey(User, related_name='individual_accesses', on_delete=models.CASCADE)
    access = models.CharField(default='view', editable=True, choices=USER_ACCESS_CHOICES, max_length=6)

    timelineitems = GenericRelation('TimelineItem', related_query_name='individual_accesses', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/access.html'

    def __str__(self):
        return f'{self.access} access granted to {self.user} on {self.object}'

    def combine_access(self, to_user):
        order = ['view','edit']
        try:
            a2 = self.__class__.objects.get(user=to_user, **{self.object_field_name: getattr(self,self.object_field_name)})
            level = sorted([self.access,a2.access],key=order.index)[-1]
            if level != a2.access:
                a2.access = level
                a2.save()
        except self.__class__.DoesNotExist:
            self.user = to_user
            self.save()

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)

    def timeline_object(self):
        return self.object

class ProjectInvitation(models.Model):
    email = models.EmailField()
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_invitations')
    access = models.CharField(default='view', editable=True, choices=USER_ACCESS_CHOICES, max_length=6)
    project = models.ForeignKey(Project, related_name='invitations', on_delete=models.CASCADE)
    applied = models.BooleanField(default=False)

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
        invitations = ProjectInvitation.objects.filter(email__iexact=instance.email)
        for invitation in invitations:
            project = invitation.project
            if not project.has_access(instance,(invitation.access,)):
                try:
                    access = IndividualAccess.objects.get(object=project,user=instance)
                    access.access = invitation.access
                    access.save()
                except IndividualAccess.DoesNotExist:
                    IndividualAccess.objects.create(object=project, user=instance, access=invitation.access)
            invitation.applied = True
            invitation.save()


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

class EditablePackageMixin(object):
    """
    A package whose contents can be edited by users with the right access privileges.
    Extensions and themes are editable packages.
    """

    package_noun = None

    def filenames(self):
        top = Path(self.extracted_path)
        for d,dirs,files in os.walk(str(top)):
            rd = Path(d).relative_to(top)
            if str(rd)=='.' or not re.match(r'^\.',str(rd)):
                for f in sorted(files,key=str):
                    if not re.match(r'^\.',f):
                        yield str(rd / f)

    def write_file(self,filename,content):
        root = os.path.abspath(self.extracted_path)
        path = os.path.abspath(os.path.join(root,filename))
        if not path.startswith(root+os.sep):
            raise Exception("You may not write a file outside the {package_noun}'s directory".format(package_noun=self.package_noun))
        dpath = Path(path).parent
        dpath.mkdir(parents=True,exist_ok=True)
        with open(path,'w',encoding='utf-8') as f:
            f.write(content)

    @property 
    def relative_extracted_path(self):
        raise NotImplementedError

    @property
    def extracted_path(self):
        return os.path.join(os.getcwd(), settings.MEDIA_ROOT, self.relative_extracted_path)

    def url_for(self, filename):
        return settings.MEDIA_URL+self.relative_extracted_path+'/'+filename

    def ensure_extracted_path_exists(self):
        if os.path.exists(self.extracted_path):
            shutil.rmtree(self.extracted_path)
        os.makedirs(self.extracted_path)

    @property
    def readme_filename(self):
        names = ['README.md','README.html','README']
        for name in names:
            if self.has_file(name):
                return name
        return names[0]

    def has_file(self, filename):
        return os.path.exists(os.path.join(self.extracted_path,filename))

class Extension(models.Model, ControlledObject, EditablePackageMixin):
    name = models.CharField(max_length=200, help_text='A human-readable name for the extension')
    location = models.CharField(default='', max_length=200, help_text='A unique identifier for this extension', verbose_name='Short name', blank=True, unique=True)
    url = models.CharField(max_length=300, blank=True, verbose_name='Documentation URL', help_text='Address of a page about the extension. Leave blank to use the README file.')
    public = models.BooleanField(default=False, help_text='Can this extension be seen by everyone?')
    slug = models.SlugField(max_length=200, editable=False, unique=False, default='an-extension')
    author = models.ForeignKey(User, related_name='own_extensions', blank=True, null=True, on_delete=models.CASCADE)
    last_modified = models.DateTimeField(auto_now=True)
    zipfile_folder = 'user-extensions'
    zipfile = models.FileField(upload_to=zipfile_folder+'/zips', blank=True, null=True, max_length=255, verbose_name='Extension package', help_text='A .zip package containing the extension\'s files')
    editable = models.BooleanField(default=True, help_text='Is this extension stored within the editor\'s media folder?')
    runs_headless = models.BooleanField(default=True, help_text='Can this extension run outside a browser?')

    access = GenericRelation('IndividualAccess', related_query_name='extension', content_type_field='object_content_type', object_id_field='object_id')

    superuser_sees_everything = False

    package_noun = 'extension'
    timeline_noun = 'extension'


    class Meta:
        ordering = ['name']
    def __str__(self):
        return self.name

    def has_access(self, user, levels):
        if user==self.author:
            return True
        return super().has_access(user,levels)

    @property
    def owner(self):
        return self.author

    def is_published(self):
        return self.public

    @classmethod
    def filter_can_be_viewed_by(cls, user):
        if getattr(settings, 'EVERYTHING_VISIBLE', False):
            return Q()
        
        view_perms = ('edit', 'view')
        if cls.superuser_sees_everything and user.is_superuser:
            return Q()
        elif user.is_anonymous:
            return Q(public=True)
        else:
            return (Q(access__user=user, access__access__in=view_perms) 
                    | Q(public=True)
                    | Q(author=user)
                   )

    def as_json(self):
        d = {
            'name': self.name,
            'url': reverse('extension_documentation',args=(self.pk,)),
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
    def main_filename(self):
        return self.location+'.js'

    @property
    def script_path(self):
        if self.editable:
            filename = self.main_filename
            local_path = os.path.join(self.extracted_path, filename)
            if os.path.exists(local_path):
                return settings.MEDIA_URL+self.zipfile_folder+'/extracted/'+str(self.pk)+'/'+self.location+'/'+filename
        else:
            path = 'js/numbas/extensions/%s/%s.js' % (self.location, self.location)
            if finders.find(path):
                return settings.STATIC_URL+path
        return None

    @property 
    def relative_extracted_path(self):
        if self.pk is None:
            raise Exception("This object doesn't have an ID yet.")
        return os.path.join(self.zipfile_folder, 'extracted', str(self.pk), self.location)

    @property
    def extracted_path(self):
        if self.editable:
            return super().extracted_path
        else:
            return os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'], 'extensions', self.location)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(Extension, self).save(*args, **kwargs)

    def extract_zip(self):
        if not self.zipfile:
            return
        self.ensure_extracted_path_exists()

        _, extension = os.path.splitext(self.zipfile.name)
        if extension.lower() == '.zip':
            z = ZipFile(self.zipfile.file, 'r')
            z.extractall(self.extracted_path)
        elif extension.lower() == '.js':
            file = open(os.path.join(self.extracted_path, self.location+'.js'), 'wb')
            file.write(self.zipfile.file.read())
            file.close()

    def get_absolute_url(self):
        return reverse('extension_documentation',args=(self.pk,))

    def icon(self):
        return 'wrench'

@receiver(signals.pre_save)
def extract_editable_package_zip_pre(sender,instance,**kwargs):
    if not isinstance(instance,EditablePackageMixin):
        return
    changed_zipfile = False
    if instance.zipfile:
        try:
            old_extension = instance.__class__.objects.get(pk=instance.pk)
            changed_zipfile = old_extension.zipfile != instance.zipfile
        except instance.__class__.DoesNotExist:
            changed_zipfile = True

    instance.__changed_zipfile = changed_zipfile

@receiver(signals.post_save)
def extract_editable_package_zip_post(sender,instance,**kwargs):
    if not isinstance(instance,EditablePackageMixin):
        return
    if getattr(instance,'__changed_zipfile',False):
        instance.extract_zip()

@receiver(signals.pre_delete, sender=Extension)
def delete_extracted_extension(sender,instance,**kwargs):
    if not instance.editable:
        return
    p = Path(instance.extracted_path).parent
    if p.exists():
        shutil.rmtree(str(p))
    

class Theme(models.Model, ControlledObject, EditablePackageMixin):
    name = models.CharField(max_length=200)
    public = models.BooleanField(default=False, help_text='Can this theme be seen by everyone?')
    slug = models.SlugField(max_length=200, editable=False, unique=False)
    author = models.ForeignKey(User, related_name='own_themes', on_delete=models.CASCADE)
    last_modified = models.DateTimeField(auto_now=True)
    zipfile_folder = 'user-themes'
    zipfile = models.FileField(upload_to=zipfile_folder+'/zips', max_length=255, verbose_name='Theme package', help_text='A .zip package containing the theme\'s files')

    access = GenericRelation('IndividualAccess', related_query_name='theme', content_type_field='object_content_type', object_id_field='object_id')

    package_noun = 'theme'
    timeline_noun = 'theme'

    editable = True

    def __str__(self):
        return self.name

    def has_access(self, user, levels):
        if user==self.author:
            return True
        return super().has_access(user,levels)

    @property
    def owner(self):
        return self.author

    def is_published(self):
        return self.public

    @classmethod
    def filter_can_be_viewed_by(cls, user):
        if getattr(settings, 'EVERYTHING_VISIBLE', False):
            return Q()
        
        view_perms = ('edit', 'view')
        if cls.superuser_sees_everything and user.is_superuser:
            return Q()
        elif user.is_anonymous:
            return Q(public=True)
        else:
            return (Q(access__user=user, access__access__in=view_perms) 
                    | Q(public=True)
                    | Q(author=user)
                   )

    @property
    def relative_extracted_path(self):
        return os.path.join(self.zipfile_folder, 'extracted', str(self.pk))

    @property
    def main_filename(self):
        if self.has_file('inherit.txt'):
            return 'inherit.txt'
        else:
            return self.readme_filename

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(Theme, self).save(*args, **kwargs)

    def extract_zip(self):
        if not self.zipfile:
            return

        self.ensure_extracted_path_exists()

        z = ZipFile(self.zipfile.file, 'r')
        z.extractall(self.extracted_path)

    def get_absolute_url(self):
        return reverse('theme_edit',args=(self.pk,))

    def icon(self):
        return 'sunglasses'

@receiver(signals.pre_delete, sender=Theme)
def reset_theme_on_delete(sender, instance, **kwargs):
    default_theme = settings.GLOBAL_SETTINGS['NUMBAS_THEMES'][0][1]
    for exam in instance.used_in_newexams.all():
        exam.custom_theme = None
        exam.theme = default_theme
        exam.save()

CUSTOM_PART_TYPE_PUBLIC_CHOICES = [
    ('restricted', 'Only to permitted users'),
    ('always', 'Always available'),
    ('select', 'When selected'),
]

CUSTOM_PART_TYPE_INPUT_WIDGETS = [
    ('string', 'String'),
    ('number', 'Number'),
    ('jme', 'Mathematical expression'),
    ('matrix', 'Matrix'),
    ('radios', 'Radio buttons'),
    ('checkboxes', 'Choose several from a list'),
    ('dropdown', 'Drop-down box'),
]

class CustomPartType(models.Model, ControlledObject):
    author = models.ForeignKey(User, related_name='own_custom_part_types', on_delete=models.CASCADE)
    name = models.CharField(max_length=200, verbose_name='Name')
    short_name = models.CharField(max_length=200, unique=True, verbose_name='Unique identifier for this part type')
    description = models.TextField(default='', blank=True, verbose_name='What\'s this part type for?')
    input_widget = models.CharField(max_length=200, choices = CUSTOM_PART_TYPE_INPUT_WIDGETS, verbose_name='Answer input method')
    input_options = JSONField(blank=True, verbose_name='Options for the answer input method')
    can_be_gap = models.BooleanField(default=True, verbose_name='Can this part be a gap?')
    can_be_step = models.BooleanField(default=True, verbose_name='Can this part be a step?')
    marking_script = models.TextField(default='', blank=True, verbose_name='Marking algorithm')
    marking_notes = JSONField(blank=True,default='[]', verbose_name='Marking algorithm notes')
    settings = JSONField(blank=True)
    help_url = models.URLField(blank=True, verbose_name='URL of documentation')
    public_availability = models.CharField(max_length=10, choices=CUSTOM_PART_TYPE_PUBLIC_CHOICES, verbose_name='Public availability', default='restricted')
    ready_to_use = models.BooleanField(default=False, verbose_name='Ready to use?')
    copy_of = models.ForeignKey('self', null=True, related_name='copies', on_delete=models.SET_NULL)
    extensions = models.ManyToManyField(Extension, blank=True, related_name='custom_part_types')

    access = GenericRelation('IndividualAccess', related_query_name='custom_part_type', content_type_field='object_content_type', object_id_field='object_id')

    timeline_noun = 'part type'
    icon = 'ok'

    def copy(self, author, name):
        new_type = CustomPartType.objects.get(pk=self.pk)
        new_type.pk = None
        new_type.id = None
        new_type.author = author
        new_type.public_availability = 'restricted'
        new_type.name = name
        new_type.set_short_name(slugify(name))
        new_type.copy_of = self
        new_type.save()
        new_type.extensions.set(self.extensions.all())
        return new_type

    def __str__(self):
        return self.name

    @property
    def filename(self):
        return slugify(self.name)

    def __repr__(self):
        return '<CustomPartType: {}>'.format(self.short_name)

    def get_absolute_url(self):
        return reverse('custom_part_type_edit', args=(self.pk,))

    @property
    def owner(self):
        return self.author

    def is_published(self):
        return self.public_availability in ('always', 'select')

    def set_short_name(self, slug):
        built_in_part_types = ['jme','numberentry','patternmatch','matrix','gapfill','information','extension','1_n_2','m_n_2','m_n_x']
        if slug in built_in_part_types:
            slug = 'custom-'+slug
        short_name = slug
        i = 0
        while CustomPartType.objects.exclude(pk=self.pk).filter(short_name=short_name).exists():
            i += 1
            short_name = '{}-{}'.format(slug,i)
        self.short_name = short_name

    def has_access(self, user, levels):
        if 'view' in levels:
            if self.published:
                return True

        if user==self.owner or user.is_superuser:
            return True

        return super().has_access(user,levels)

    @classmethod
    def filter_can_be_viewed_by(cls, user):
        if getattr(settings, 'EVERYTHING_VISIBLE', False):
            return Q()
        
        q_public = Q(public_availability__in=('always','select'))

        view_perms = ('edit', 'view')
        if cls.superuser_sees_everything and user.is_superuser:
            return Q()
        elif user.is_anonymous:
            return q_public
        else:
            return (Q(access__user=user, access__access__in=view_perms) 
                    | q_public
                    | Q(author=user)
                   )

    @property
    def published(self):
        return self.public_availability != 'restricted'

    def as_json(self):
        return {
            'source': {
                'pk': self.pk,
                'author': {
                    'name': self.author.get_full_name(),
                    'pk': self.author.pk,
                },
                'edit_page': reverse('custom_part_type_edit', args=(self.pk,)),
            },
            'name': self.name,
            'short_name': self.short_name,
            'description': self.description,
            'help_url': self.help_url,
            'input_widget': self.input_widget,
            'input_options': self.input_options,
            'can_be_gap': self.can_be_gap,
            'can_be_step': self.can_be_step,
            'marking_script': self.marking_script,
            'marking_notes': self.marking_notes,
            'settings': self.settings,
            'public_availability': self.public_availability,
            'published': self.published,
            'extensions': [e.location for e in self.extensions.all()],
        }

    def as_source(self):
        obj = self.as_json()
        obj['source'] = {
            'author': {
                'name': self.author.get_full_name(),
            }
        }
        return obj

class Resource(models.Model):
    owner = models.ForeignKey(User, related_name='resources', on_delete=models.CASCADE)
    date_created = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='question-resources/', max_length=255) 
    alt_text = models.TextField(blank=True)

    def __str__(self):
        return self.file.name

    @property
    def resource_url(self):
        return 'resources/%s' % self.file.name

    @property
    def filetype(self):
        name,ext = os.path.splitext(self.file.name)
        return ext

    def get_created_time(self):
        return default_storage.get_created_time(self.file.name)

    def is_image(self):
        return self.filetype.lower() in ('.png','.jpg','.svg','.gif')

    def delete(self, *args, **kwargs):
        self.file.delete(save=False)
        super(Resource, self).delete(*args, **kwargs)

    def as_json(self):
        return {
            'url': self.resource_url,
            'name': self.file.name,
            'pk': self.pk,
            'alt_text': self.alt_text,
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
    framework = models.ForeignKey(AbilityFramework, related_name='levels', on_delete=models.CASCADE)

    class Meta:
        ordering = ('framework', 'start',)

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
    taxonomy = models.ForeignKey(Taxonomy, related_name='nodes', on_delete=models.CASCADE)
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
    tag = models.ForeignKey(EditorTag, related_name='tagged_editoritems', on_delete=models.CASCADE)

class TaggedQuestion(taggit.models.GenericTaggedItemBase):
    tag = models.ForeignKey(EditorTag, related_name='tagged_items', on_delete=models.CASCADE)

NUMBAS_FILE_VERSION = 'exam_results_page_options'

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


class EditorItemManager(models.Manager):
    def questions(self):
        return self.exclude(question=None)

    def exams(self):
        return self.exclude(exam=None)

    def published(self):
        return self.filter(published=True)

class Contributor(models.Model):
    item = models.ForeignKey('EditorItem', on_delete=models.CASCADE, related_name='contributors')
    user = models.ForeignKey(User, related_name='item_contributions', on_delete=models.CASCADE, blank=True, null=True)
    name = models.CharField(max_length=200,blank=True)
    profile_url = models.URLField(blank=True)

    def __str__(self):
        name = self.user.get_full_name() if self.user else self.name
        return '{} on "{}"'.format(name,self.item)

    def as_json(self, request):
        if self.user:
            user = self.user
            profile_url = reverse('view_profile',args=(user.pk,))
            if request:
                profile_url = request.build_absolute_uri(profile_url)
            return {
                'name': user.get_full_name(),
                'profile_url': profile_url,
            }
        else:
            return {
                'name': self.name,
                'profile_url': self.profile_url,
            }

    class Meta:
        unique_together = (("item","user"))

class Folder(models.Model):
    name = models.CharField(max_length=200)

    project = models.ForeignKey(Project, null=False, related_name='folders', on_delete=models.CASCADE)
    parent = models.ForeignKey('Folder', null=True, related_name='folders', on_delete=models.CASCADE)

    class Meta:
        unique_together = (('name', 'project', 'parent'),)
        ordering = ('name',)

    def clean(self):
        if self.parent==self:
            raise ValidationError("A folder can't be its own parent.")

    def __str__(self):
        return '/'.join([self.project.name]+[f.name for f in self.parents()])

    def parents(self):
        bits = []
        f = self
        while f:
            bits.insert(0,f)
            f = f.parent
        return bits

    def path(self):
        return '/'.join(urllib.parse.quote(f.name) for f in self.parents())

    def get_absolute_url(self):
        return reverse('project_browse',args=(self.project.pk, self.path()+'/'))

    def as_json(self):
        return {
            'pk': self.pk,
            'url': self.get_absolute_url(),
            'name': self.name,
        }

    def merge_into(self,folder):
        for item in self.items.all():
            item.folder = folder
            item.save()
        for subfolder in Folder.objects.filter(parent=self):
            subfolder.parent = folder
            subfolder.save()
        self.delete()

    def all_contents(self):
        queue = [self]
        folders = []
        items = []
        while queue:
            f = queue.pop()
            folders.append(f)
            items += f.items.all()
            queue += f.folders.all()
        return folders, items
    
@reversion.register
class EditorItem(models.Model, NumbasObject, ControlledObject):
    """
        Base model for exams and questions - each exam or question has a reference to an instance of this
    """
    objects = EditorItemManager()
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, editable=False, unique=False)

    timeline = GenericRelation('TimelineItem', related_query_name='editoritems', content_type_field='timeline_content_type', object_id_field='timeline_id')
    comments = GenericRelation('Comment', content_type_field='object_content_type', object_id_field='object_id')

    author = models.ForeignKey(User, related_name='own_items', on_delete=models.CASCADE)
    licence = models.ForeignKey(Licence, null=True, blank=True, on_delete=models.SET_NULL)
    project = models.ForeignKey(Project, null=True, related_name='items', on_delete=models.CASCADE)
    folder = models.ForeignKey(Folder, null=True, related_name='items', on_delete=models.SET_NULL)

    access = GenericRelation('IndividualAccess', related_query_name='editoritem', content_type_field='object_content_type', object_id_field='object_id')

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

    taxonomy_nodes = models.ManyToManyField(TaxonomyNode, related_name='editoritems')

    unwatching_users = models.ManyToManyField(User, related_name='unwatched_items')

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

    def __unicode__(self):
        return self.name

    @property
    def watching_users(self):
        q = (User.objects.filter(pk=self.author.pk) | User.objects.filter(individual_accesses__in=self.access.all())).distinct() | self.project.watching_users
        return q.exclude(pk__in=self.unwatching_users.all())

    @property
    def owner(self):
        return self.author

    def is_published(self):
        return self.published

    def get_current_stamp(self):
        if self.current_stamp is not None:
            return self.current_stamp
        else:
            return NewStampOfApproval(object=self,status='draft')

    def has_access(self, user, levels):
        return self.project.has_access(user, levels) or super().has_access(user,levels)

    def can_be_viewed_by(self, user):
        if self.item_type=='exam' and getattr(settings,'EXAM_ACCESS_REQUIRES_QUESTION_ACCESS',False):
            for q in self.exam.questions.all():
                if not q.editoritem.can_be_viewed_by(user):
                    return False
        return super().can_be_viewed_by(user)

    def can_be_copied_by(self, user):
        if not super().can_be_copied_by(user):
            return False
        if self.licence:
            return self.licence.can_reuse and self.licence.can_modify
        else:
            return True

    def publish(self):
        self.published = True
        self.published_date = timezone.now()

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
        e2.published = False
        e2.published_date = None
        e2.copy_of = self
        e2.folder = None
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

    def as_numbasobject(self,request):
        obj = self.exam if self.item_type=='exam' else self.question
        numbasobj = obj.as_numbasobject(request)
        return numbasobj

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
            'published': self.published,
            'metadata': self.metadata,
            'created': str(self.created),
            'last_modified': str(self.last_modified), 
            'author': self.author.get_full_name(), 
            'current_stamp': current_stamp.status,
            'current_stamp_display': current_stamp.get_status_display()
        }
        variables = []
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
def author_contributes_to_editoritem(instance, created, **kwargs):
    if created:
        Contributor.objects.get_or_create(item=instance,user=instance.author)

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

@receiver(signals.post_delete, sender=EditorItem)
def delete_notifications_for_item(instance, **kwargs):
    Notification.objects.filter(target_object_id=instance.pk, target_content_type=ContentType.objects.get_for_model(EditorItem)).delete()

class PullRequestManager(models.Manager):
    def open(self):
        return self.filter(open=True)

class PullRequest(models.Model, ControlledObject, TimelineMixin):
    objects = PullRequestManager()

    # user who created this request
    owner = models.ForeignKey(User, related_name='pullrequests_created', on_delete=models.CASCADE)
    # user who accepted or rejected this request
    closed_by = models.ForeignKey(User, related_name='pullrequests_closed', null=True, blank=True, on_delete=models.SET_NULL)

    source = models.ForeignKey(EditorItem, related_name='outgoing_pull_requests', on_delete=models.CASCADE)
    destination = models.ForeignKey(EditorItem, related_name='incoming_pull_requests', on_delete=models.CASCADE)

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
        return super().can_be_deleted_by(user) or self.destination.can_be_edited_by(user)

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

        if not self.viewing_user.is_anonymous:
            projects = self.viewing_user.own_projects.all() | Project.objects.filter(access__in=self.viewing_user.individual_accesses.all()) | Project.objects.filter(watching_non_members=self.viewing_user)
            queues = ItemQueue.objects.filter(owner=self.viewing_user) | ItemQueue.objects.filter(access__in=self.viewing_user.individual_accesses.all())
            items_for_user = (
                Q(editoritems__in=EditorItem.objects.filter(Q(access__user=self.viewing_user) | Q(author=self.viewing_user))) | 
                Q(editoritems__project__in=projects) |
                Q(projects__in=projects) |
                Q(item_queue_entry__queue__project__in = projects) |
                Q(item_queue_entry__queue__in = queues) |
                Q(item_queue_entries__queue__project__in = projects) |
                Q(item_queue_entries__queue__in = queues) |
                Q(individual_accesses__user=viewing_user)
#                Q(editoritems__accesses__in=self.viewing_user.item_accesses.all()) | 
 #               Q(extension_accesses__user=viewing_user) |
 #               Q(theme_accesses__user=viewing_user) | 
 #               Q(custom_part_type_accesses__user=self.viewing_user) |
            )

            view_filter = view_filter | items_for_user
        filtered_items = items.filter(view_filter)
        if not self.viewing_user.is_anonymous:
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
    timeline_content_type = models.ForeignKey(ContentType, related_name='timelineitem_timeline', null=True, on_delete=models.CASCADE)
    timeline_id = models.PositiveIntegerField(null=True)
    timeline = GenericForeignKey('timeline_content_type', 'timeline_id')

    # Reference to an object representing this item (e.g. a Comment)
    object_content_type = models.ForeignKey(ContentType, related_name='timelineitem_object', on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type', 'object_id')

    user = models.ForeignKey(User, related_name='timelineitems', null=True, on_delete=models.CASCADE)

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
        return self.filter(Q(show_until__gte=timezone.now()) | Q(show_until=None))

class SiteBroadcast(models.Model, TimelineMixin):
    objects = SiteBroadcastManager()

    author = models.ForeignKey(User, related_name='site_broadcasts', on_delete=models.CASCADE)
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

class Tip(models.Model):
    title = models.CharField(max_length=500)
    text = models.TextField()
    link = models.URLField(blank=True, null=True, verbose_name='Link to more information')
    link_text = models.CharField(blank=True, null=True, max_length=200)
    editoritem = models.ForeignKey(EditorItem, related_name='used_in_tips', blank=True, null=True, on_delete=models.SET_NULL, verbose_name='A question or exam demonstrating the tip')

    def __str__(self):
        return self.title

    def __repr__(self):
        return 'Tip "{}"'.format(self.title)

class NewStampOfApproval(models.Model, TimelineMixin):
    object = models.ForeignKey(EditorItem, related_name='stamps', on_delete=models.CASCADE)

    timelineitems = GenericRelation(TimelineItem, related_query_name='stamps', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/stamp.html'

    user = models.ForeignKey(User, related_name='newstamps', on_delete=models.CASCADE)
    status = models.CharField(choices=STAMP_STATUS_CHOICES, max_length=20)

    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '{} said "{}"'.format(self.user.username, self.get_status_display())

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)

    class Meta:
        ordering = ('-date',)

@receiver(signals.post_save, sender=NewStampOfApproval)
@receiver(signals.post_delete, sender=NewStampOfApproval)
def set_current_stamp(instance, **kwargs):
    instance.object.current_stamp = NewStampOfApproval.objects.filter(object=instance.object).order_by('-date').first()
    instance.object.save()


@receiver(signals.post_save, sender=NewStampOfApproval)
def notify_stamp(instance, **kwargs):
    notify_watching(instance.user, target=instance.object, verb='gave feedback on', action_object=instance)

class Comment(models.Model, TimelineMixin):
    object_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type', 'object_id')

    timelineitems = GenericRelation(TimelineItem, related_query_name='comments', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/comment.html'

    user = models.ForeignKey(User, related_name='comments', on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return 'Comment by {} on {}: "{}"'.format(self.user.get_full_name(), str(self.object), self.text[:47]+'...' if len(self.text) > 50 else self.text)

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)

@receiver(signals.post_save, sender=Comment)
def notify_comment(instance, **kwargs):
    notify_watching(instance.user, target=instance.object, verb='commented on', action_object=instance)

class RestorePoint(models.Model, TimelineMixin):
    object = models.ForeignKey(EditorItem, related_name='restore_points', on_delete=models.CASCADE)

    timelineitems = GenericRelation(TimelineItem, related_query_name='restore_points', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/restore_point.html'

    user = models.ForeignKey(User, related_name='restore_points', on_delete=models.CASCADE)
    description = models.TextField()

    revision = models.ForeignKey(reversion.models.Revision, on_delete=models.CASCADE)
    
    def __str__(self):
        return 'Restore point set by {} on {}: "{}"'.format(self.user.get_full_name(), str(self.object), self.description[:47]+'...' if len(self.description) > 50 else self.description)

    def can_be_viewed_by(self, user):
        return self.object.can_be_viewed_by(user)

ITEM_CHANGED_VERBS = [('created', 'created')]
class ItemChangedTimelineItem(models.Model, TimelineMixin):
    object = models.ForeignKey(EditorItem, on_delete=models.CASCADE)
    verb = models.CharField(choices=ITEM_CHANGED_VERBS, editable=False, max_length=10)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='item_changed_timelineitems')

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

    resources = models.ManyToManyField(Resource, blank=True, related_name='questions')
    extensions = models.ManyToManyField(Extension, blank=True, related_name='questions')
    custom_part_types = models.ManyToManyField(CustomPartType, blank=True, related_name='questions')

    theme_path = os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'], 'themes', 'question')

    icon = 'file'

    class Meta:
        verbose_name = 'question'
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

    def as_numbasobject(self,request):
        self.editoritem.get_parsed_content()
        contributor_data = [c.as_json(request) for c in self.editoritem.contributors.all()]
        question_data = self.editoritem.parsed_content.data
        question_data['contributors'] = contributor_data
        data = OrderedDict([
            ('name', self.editoritem.name),
            ('extensions', [e.location for e in self.extensions.all()]),
            ('custom_part_types', [p.as_json() for p in self.custom_part_types.all()]),
            ('resources', self.resource_paths),
            ('navigation', {'allowregen': True, 'showfrontpage': False, 'preventleave': False}),
            ('question_groups', [{'pickingStrategy':'all-ordered', 'questions':[question_data]}]),
        ])
        data['contributors'] = contributor_data
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

        content = self.editoritem.get_parsed_content()
        variables = content.data.get('variables',{})
        tvariables = {k:v for k,v in variables.items() if v.get('can_override')}
        obj['variables'] = tvariables

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

        q2.resources.set(self.resources.all())
        q2.extensions.set(self.extensions.all())
        q2.save()

        return q2

    def merge(self, other):
        self.resources.clear()
        self.resources.add(*other.resources.all())
        self.extensions.clear()
        self.extensions.add(*other.extensions.all())
        self.save()

@receiver(signals.post_save, sender=NewQuestion)
def set_question_custom_part_types(instance, **kwargs):
    q = instance
    c = NumbasObject.get_parsed_content(q.editoritem)
    parts = c.data.get('parts',[])
    all_parts = parts[:]
    for p in parts:
        all_parts += [s for s in p.get('steps',[])] + [g for g in p.get('gaps',[])]
    part_types = set(p['type'] for p in all_parts)
    q.custom_part_types.clear()
    custom_part_types = CustomPartType.objects.filter(short_name__in=part_types)
    q.custom_part_types.add(*custom_part_types)

@reversion.register
class NewExam(models.Model):
    editoritem = models.OneToOneField(EditorItem, on_delete=models.CASCADE, related_name='exam')

    questions = models.ManyToManyField(NewQuestion, through='NewExamQuestion', blank=True, editable=False, related_name='exams')

    theme = models.CharField(max_length=200, default='default', blank=True)  # used if custom_theme is None
    custom_theme = models.ForeignKey(Theme, null=True, blank=True, on_delete=models.SET_NULL, related_name='used_in_newexams')
    locale = models.CharField(max_length=200, default='en-GB')

    icon = 'book'

    class Meta:
        verbose_name = 'exam'

    def __str__(self):
        return self.editoritem.name

    def __unicode__(self):
        return self.editoritem.name

    def get_absolute_url(self):
        return reverse('exam_edit', args=(self.pk, self.editoritem.slug))

    @property
    def resources(self):
        return Resource.objects.filter(questions__in=self.questions.all()).distinct()

    @property
    def resource_paths(self):
        return [(r.file.name, r.file.path) for r in self.resources.all()]

    @property
    def theme_path(self):
        if self.custom_theme:
            return self.custom_theme.extracted_path
        else:
            return os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'], 'themes', self.theme)

    def as_numbasobject(self,request):
        obj = numbasobject.NumbasObject(self.editoritem.content)
        data = obj.data
        question_groups = self.question_groups
        data['contributors'] = [c.as_json(request) for c in self.editoritem.contributors.all()]
        data['extensions'] = [e.location for e in self.extensions]
        data['custom_part_types'] = [p.as_json() for p in self.custom_part_types]
        data['name'] = self.editoritem.name
        if 'question_groups' not in data:
            data['question_groups'] = self.question_groups_dict()
        for i, g in enumerate(data['question_groups']):
            if i < len(question_groups):
                questions = question_groups[i]
            else:
                questions = []
            def question_object(q):
                data = q.editoritem.as_numbasobject(request).data
                del data['question_groups']
                data.update(q.editoritem.parsed_content.data)
                return data
            g['questions'] = [question_object(q) for q in questions]
        data['resources'] = self.resource_paths
        
        return obj

    def edit_dict(self):
        """ 
            Dictionary of information passed to update view 
        """
        exam_dict = self.editoritem.edit_dict()
        exam_dict['locale'] = self.locale
        exam_dict['custom_theme'] = self.custom_theme_id
        exam_dict['theme'] = self.theme
        exam_dict['question_groups'] = self.question_groups_dict()

        return exam_dict

    def question_groups_dict(self):
        groups = groupby(self.newexamquestion_set.order_by('group', 'qn_order'), key=lambda q: q.group)
        return [{'group':group, 'questions':[q.question.summary() for q in qs]} for group, qs in groups]
    
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
        return Extension.objects.filter(questions__in=self.questions.all()).distinct()

    @property
    def custom_part_types(self):
        return CustomPartType.objects.filter(questions__in=self.questions.all()).distinct()

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
        
    exam = models.ForeignKey(NewExam, on_delete=models.CASCADE)
    question = models.ForeignKey(NewQuestion, on_delete=models.CASCADE)
    qn_order = models.PositiveIntegerField()
    group = models.PositiveIntegerField(default=0)

@receiver(signals.post_save, sender=NewQuestion)
@receiver(signals.post_save, sender=NewExam)
def item_created_timeline_event(instance, created, **kwargs):
    if created:
        ItemChangedTimelineItem.objects.create(user=instance.editoritem.author, object=instance.editoritem, verb='created')

class ItemQueueManager(models.Manager):
    def visible_to(self,user):
        return self.filter(ItemQueue.filter_can_be_viewed_by(user))

class ItemQueue(models.Model, ControlledObject):
    objects = ItemQueueManager()
    owner = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='own_queues')
    name = models.CharField(max_length=200)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='queues')
    description = models.TextField(blank=True)
    instructions_submitter = models.TextField(blank=True, verbose_name='Instructions for submitters')
    instructions_reviewer = models.TextField(blank=True, verbose_name='Instructions for reviewers')
    public = models.BooleanField(default=False, verbose_name='Visible to everyone?')

    access = GenericRelation('IndividualAccess', related_query_name='item_queue', content_type_field='object_content_type', object_id_field='object_id')
    timeline_noun = 'queue'

    icon = 'list'

    def __str__(self):
        return self.name

    def is_published(self):
        return self.public

    def can_be_viewed_by(self, user):
        return super().can_be_viewed_by(user) or self.project.can_be_viewed_by(user)

    @classmethod
    def filter_can_be_viewed_by(cls, user):
        if getattr(settings, 'EVERYTHING_VISIBLE', False):
            return Q()
        
        view_perms = ('edit', 'view')
        if cls.superuser_sees_everything and user.is_superuser:
            return Q()
        elif user.is_anonymous:
            return Q(public=True)
        else:
            return (Q(access__user=user, access__access__in=view_perms) 
                    | Q(public=True)
                    | Q(owner=user)
                    | Q(project__in=Project.objects.filter(Project.filter_can_be_viewed_by(user)))
                   )

    @property
    def watching_users(self):
        query = Q(pk=self.owner.pk) | Q(individual_accesses__item_queue=self)
        return User.objects.filter(query).distinct()

    def get_absolute_url(self):
        return reverse('queue_view', args=(self.pk,))

class ItemQueueChecklistItem(models.Model):
    queue = models.ForeignKey(ItemQueue, on_delete=models.CASCADE, related_name='checklist')
    label = models.CharField(max_length=500)

    def as_json(self):
        return {
            'pk': self.pk,
            'queue': self.queue.pk,
            'label': self.label,
        }

class ItemQueueEntryManager(models.Manager):
    def incomplete(self):
        return self.filter(complete=False)

class ItemQueueEntry(models.Model, ControlledObject, TimelineMixin):
    objects = ItemQueueEntryManager()

    icon = 'list'

    class Meta:
        ordering = ['-pk']

    def __str__(self):
        return f'"{self.item.name}" in the queue "{self.queue.name}"'

    def get_absolute_url(self):
        return reverse('queue_entry_review', args=(self.pk,))

    queue = models.ForeignKey(ItemQueue, on_delete=models.CASCADE, related_name='entries')
    item = models.ForeignKey(EditorItem, on_delete=models.CASCADE, related_name='queue_entries')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='queue_entries')
    note = models.TextField(blank=True)
    complete = models.BooleanField(default=False)

    comments = GenericRelation('Comment', content_type_field='object_content_type', object_id_field='object_id', related_query_name='item_queue_entry')
    timeline = GenericRelation('TimelineItem', related_query_name='item_queue_entry', content_type_field='timeline_content_type', object_id_field='timeline_id')

    timelineitems = GenericRelation(TimelineItem, related_query_name='item_queue_entries', content_type_field='object_content_type', object_id_field='object_id')
    timelineitem_template = 'timeline/item_queue_entry.html'

    def timeline_object(self):
        return self.queue

    def checklist_items(self):
        return self.queue.checklist.all().annotate(ticked=Exists(ItemQueueChecklistTick.objects.filter(item=OuterRef('pk'), entry=self)))

    @property
    def name(self):
        return "Review of \"{}\" in \"{}\"".format(self.item.name, self.queue.name)

    def is_published(self):
        return self.public

    @property
    def owner(self):
        return self.created_by

    def can_be_edited_by(self, user):
        return self.queue.can_be_edited_by(user)

    def can_be_viewed_by(self, user):
        return self.queue.can_be_viewed_by(user) or self.project.can_be_viewed_by(user)

    def progress(self):
        total_items = self.queue.checklist.count()
        ticked_items = self.queue.checklist.filter(ticks__entry=self).distinct().count()
        return ticked_items/total_items

    @property
    def watching_users(self):
        query = Q(pk=self.created_by.pk) | Q(comments__item_queue_entry=self)
        return User.objects.filter(query).distinct()

@receiver(signals.post_save, sender=ItemQueueEntry)
def notify_comment(instance, created, **kwargs):
    if created:
        notify_watching(instance.created_by, target=instance.queue, verb='submitted an item to', action_object=instance)

class ItemQueueChecklistTick(models.Model):
    entry = models.ForeignKey(ItemQueueEntry, on_delete=models.CASCADE, related_name='ticks')
    item = models.ForeignKey(ItemQueueChecklistItem, on_delete=models.CASCADE, related_name='ticks')
    date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='queue_entry_ticks')
