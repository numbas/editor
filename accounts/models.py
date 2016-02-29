from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_save
from django.contrib.sites.models import RequestSite
from django.contrib.auth.models import User
from django.db import models

from django_thumbs.db.models import ImageWithThumbsField

from registration import models as regmodels
from registration.signals import user_registered

from sanitizer.models import SanitizedTextField

from operator import itemgetter

from editor.models import NewQuestion, NewExam, Question, Exam, EditorTag, Project

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
        new_user = User.objects.create_user(username, email, password,first_name=first_name,last_name=last_name)
        new_user.is_active = False
        new_user.save()

        registration_profile = self.create_profile(new_user)

        if send_email:
            registration_profile.send_activation_email(site)

        return new_user

class RegistrationProfile(regmodels.RegistrationProfile):
    objects = RegistrationManager()


class UserProfile(models.Model):
    user = models.OneToOneField(User)
    language = models.CharField(max_length=100,default='en-GB')
    bio = SanitizedTextField(default='',allowed_tags=settings.SANITIZER_ALLOWED_TAGS,allowed_attributes=settings.SANITIZER_ALLOWED_ATTRIBUTES)
    question_basket = models.ManyToManyField(NewQuestion,blank=True,related_name='baskets',through='BasketQuestion')
    personal_project = models.ForeignKey(Project,null=True,on_delete=models.SET_NULL)
    avatar = ImageWithThumbsField(upload_to='avatars',sizes=((20,20),(40,40),(150,150)),blank=True,null=True,max_length=255,verbose_name='Profile image')

    def sorted_tags(self):
        qs = self.user.own_questions
        tags = EditorTag.objects.filter(question__author=self.user).distinct()
        tag_counts = [(tag,len(qs.filter(tags__id=tag.id))) for tag in tags]
        tag_counts.sort(key=itemgetter(1),reverse=True)

        return tag_counts

    @property
    def recent_questions(self):
        return Question.objects.filter(author=self.user).order_by('-last_modified')[:10]

    def projects(self):
        return (Project.objects.filter(owner=self.user) | Project.objects.filter(projectaccess__user=self.user)).distinct()
        
class BasketQuestion(models.Model):
    class Meta:
        ordering = ['qn_order']
        unique_together = ('profile','question')
        
    profile = models.ForeignKey(UserProfile)
    question = models.ForeignKey(NewQuestion)
    qn_order = models.PositiveIntegerField()



def createUserProfile(sender, instance, created, **kwargs):
    """Create a UserProfile object each time a User is created ; and link it.
    """
    if created:
        profile = UserProfile.objects.create(user=instance)
        profile.personal_project = Project.objects.create(name="{}'s workspace".format(instance.first_name),owner=instance)
        profile.save()

post_save.connect(createUserProfile, sender=User)
