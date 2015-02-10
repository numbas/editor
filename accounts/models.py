from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_save
from django.contrib.sites.models import RequestSite
from django.contrib.auth.models import User
from django.db import models

from registration import models as regmodels
from registration.signals import user_registered

from sanitizer.models import SanitizedTextField

from operator import itemgetter

from editor.models import Question, Exam, EditorTag

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
        new_user = User.objects.create_user(username, email, password)
        if first_name:
            new_user.first_name = first_name
        if last_name:
            new_user.last_name = last_name
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
    favourite_questions = models.ManyToManyField(Question,blank=True,related_name='fans')
    favourite_exams = models.ManyToManyField(Exam,blank=True,related_name='fans')

    def sorted_tags(self):
        qs = self.user.own_questions
        tags = EditorTag.objects.filter(question__author=self.user).distinct()
        tag_counts = [(tag,len(qs.filter(tags__id=tag.id))) for tag in tags]
        tag_counts.sort(key=itemgetter(1),reverse=True)

        return tag_counts

def createUserProfile(sender, instance, created, **kwargs):
    """Create a UserProfile object each time a User is created ; and link it.
    """
    if created:
        UserProfile.objects.create(user=instance)

post_save.connect(createUserProfile, sender=User)
