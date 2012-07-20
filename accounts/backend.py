from registration.backends import default
from django.contrib.sites.models import Site
from accounts.models import RegistrationProfile
from registration import signals

class Backend(default.DefaultBackend):
    def register(self,request,**kwargs):
        username, email, password = kwargs['username'], kwargs['email'], kwargs['password1']
        first_name, last_name = kwargs['first_name'], kwargs['last_name']
        if Site._meta.installed:
            site = Site.objects.get_current()
        else:
            site = RequestSite(request)
        new_user = RegistrationProfile.objects.create_inactive_user(username, first_name, last_name, email,
                                                                    password, site)
        signals.user_registered.send(sender=self.__class__,
                                     user=new_user,
                                     request=request)
        return new_user
