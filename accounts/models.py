from django.db import transaction
from django.contrib.sites.models import RequestSite
from django.contrib.auth.models import User

from registration import models
class RegistrationManager(models.RegistrationManager):
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
    create_inactive_user = transaction.commit_on_success(create_inactive_user)

class RegistrationProfile(models.RegistrationProfile):
    objects = RegistrationManager()

