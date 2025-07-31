from operator import itemgetter

from django.conf import settings
from django.db import transaction
from django.contrib.auth.models import User
from django.db import models
from django.db.models import signals, Q
from django.db.models.functions import Lower
from django.contrib.contenttypes.models import ContentType
from django.dispatch import receiver
from django.urls import reverse

from django_thumbs.db.models import ImageWithThumbsField

from registration import models as regmodels

from sanitizer.models import SanitizedTextField

from editor.models import NewQuestion, EditorTag, Project, TimelineItem, SiteBroadcast, EditorItem, ItemQueue, reassign_content

class RegistrationManager(regmodels.RegistrationManager):
    @transaction.atomic
    def create_inactive_user(self, username, first_name, last_name, email, password,
                             site, send_email=True):
        """
        Create a new, inactive ``User``, generate a
        ``RegistrationProfile`` and email its activation key to the
        ``User``, returning the new ``User``.

        By default, an activation email will be sent to the new
        user. To disable this, pass ``send_email=False``.
        
        """
        new_user = User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)
        new_user.is_active = False
        new_user.save()

        registration_profile = self.create_profile(new_user)

        if send_email:
            registration_profile.send_activation_email(site)

        return new_user

class RegistrationProfile(regmodels.RegistrationProfile):
    objects = RegistrationManager()


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    language = models.CharField(max_length=100, default='en-GB')
    bio = SanitizedTextField(default='', allowed_tags=settings.SANITIZER_ALLOWED_TAGS, allowed_attributes=settings.SANITIZER_ALLOWED_ATTRIBUTES)
    question_basket = models.ManyToManyField(NewQuestion, blank=True, related_name='baskets', through='BasketQuestion')
    personal_project = models.ForeignKey(Project, null=True, on_delete=models.SET_NULL,related_name='personal_project_of')
    avatar = ImageWithThumbsField(upload_to='avatars', sizes=((20, 20), (40, 40), (150, 150)), blank=True, null=True, max_length=255, verbose_name='Profile image')
    wrap_lines = models.BooleanField(default=False,verbose_name='Wrap long lines in the code editor?')
    mathjax_4_url = models.CharField(max_length=300,default='',blank=True,verbose_name='Preferred URL to load MathJax 4 from')
    mathjax_2_url = models.CharField(max_length=300,default='',blank=True,verbose_name='Preferred URL to load MathJax 2 from')

    email_about_stamps = models.BooleanField(default=True, verbose_name='Send emails about feedback on items you\'re watching?')
    email_about_comments = models.BooleanField(default=True, verbose_name='Send emails about comments on items you\'re watching?')
    email_about_item_queue_entries = models.BooleanField(default=True, verbose_name='Send emails about entries on item queues you\'re watching?')
    never_email = models.BooleanField(default=False, verbose_name='Unsubscribe from all emails')

    def sorted_tags(self):
        qs = self.user.own_questions
        tags = EditorTag.objects.filter(question__author=self.user).distinct()
        tag_counts = [(tag, len(qs.filter(tags__id=tag.id))) for tag in tags]
        tag_counts.sort(key=itemgetter(1), reverse=True)

        return tag_counts

    @property
    def recent_questions(self):
        return NewQuestion.objects.filter(editoritem__author=self.user).order_by('-editoritem__last_modified')[:10]

    def projects(self):
        return Project.objects.filter(Q(owner=self.user) | Q(pk__in=self.user.individual_accesses.for_model(Project).values('object_id')))

    def all_timeline(self):
        nonsticky_broadcasts = SiteBroadcast.objects.visible_now().exclude(sticky=True)
        nonsticky_broadcast_timelineitems_filter = Q(object_content_type=ContentType.objects.get_for_model(SiteBroadcast), object_id__in=nonsticky_broadcasts)

        projects = Project.objects.filter(Q(owner=self.user) | Q(pk__in=self.user.individual_accesses.for_model(Project).values('object_id')) | Q(watching_non_members=self.user)).values('pk')
        editoritems = EditorItem.objects.filter(Q(author=self.user) | Q(pk__in=self.user.individual_accesses.for_model(EditorItem).values('object_id'))).values('pk')
        queues = ItemQueue.objects.filter(Q(owner=self.user) | Q(pk__in=self.user.individual_accesses.for_model(ItemQueue).values('object_id'))).values('pk')

        items = TimelineItem.objects.filter(
            nonsticky_broadcast_timelineitems_filter |
            Q(editoritems__in=editoritems) |
            Q(editoritems__project__in=projects) |
            Q(projects__in=projects) |
            Q(item_queue_entries__queue__project__in = projects) |
            Q(item_queue_entries__queue__in = queues) |
            Q(item_queue_entry__queue__project__in = projects) |
            Q(item_queue_entry__queue__in = queues)
        ).order_by('-date')

        return items

    def public_timeline(self):
        return self.user.timelineitems.order_by('-date')

    def get_absolute_url(self):
        return reverse('view_profile', args=(self.user.pk,))

    def available_queues(self):
        return ItemQueue.objects.visible_to(self.user)

class EditorItemViewed(models.Model):
    userprofile = models.ForeignKey(UserProfile, related_name='last_viewed_items', on_delete=models.CASCADE)
    item = models.ForeignKey(EditorItem,related_name='views', on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-date',)

@receiver(signals.post_save, sender=EditorItemViewed)
def truncate_last_viewed_items(instance, created, **kwargs):
    views = EditorItemViewed.objects.filter(userprofile=instance.userprofile)
    old = views[5:].values_list('id',flat=True)
    if old:
        views.filter(pk__in=list(old)).delete()

class BasketQuestion(models.Model):
    class Meta:
        ordering = ['qn_order']
        unique_together = ('profile', 'question')
        
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    question = models.ForeignKey(NewQuestion, on_delete=models.CASCADE)
    qn_order = models.PositiveIntegerField()


@receiver(signals.post_save, sender=User)
def createUserProfile(instance, created, **kwargs):
    """
        Create a UserProfile and personal workspace
    """
    workspace_name = "{}'s workspace".format(instance.first_name)
    if created:
        profile = UserProfile.objects.create(user=instance)
        profile.personal_project = Project.objects.create(name=workspace_name, owner=instance)
        profile.save()
    else:
        if instance.userprofile and instance.userprofile.personal_project:
            instance.userprofile.personal_project.name = workspace_name
            instance.userprofile.personal_project.save()

def deactivate_user(user, reassign_to_user = None):
    if reassign_to_user is not None:
        reassign_content(user, reassign_to_user)

    user.is_active = False
    user.username = 'deactivated_user_{}!'.format(user.pk)
    user.password = ''
    user.email = ''
    user.last_login = None
    user.first_name = ''
    user.last_name = ''
    user.save()

    user.userprofile.bio = ''
    user.userprofile.question_basket.clear()
    user.userprofile.avatar = None
    user.userprofile.mathjax_2_url = ''
    user.userprofile.mathjax_4_url = ''
    user.userprofile.save()

    user.userprofile.personal_project.name = "Deactivated user's workspace"
    user.userprofile.personal_project.save()
