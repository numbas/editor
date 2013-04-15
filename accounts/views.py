from accounts.forms import NumbasRegistrationForm
from registration.views import register as original_register
from django.views.generic import UpdateView
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from accounts.forms import UserProfileForm,ChangePasswordForm

def register(*args,**kwargs):
    kwargs['form_class'] = NumbasRegistrationForm
    return original_register(*args,**kwargs)

class CurrentUserUpdateView(UpdateView):
	model = User

	def get_object(self,queryset=None):
		return self.request.user

class UserUpdateView(CurrentUserUpdateView):
	template_name = 'registration/update.html'

	form_class = UserProfileForm

	def get_success_url(self):
		return reverse('edit_profile')

class ChangePasswordView(CurrentUserUpdateView):
	template_name = 'registration/change_password.html'

	form_class = ChangePasswordForm

	def get_object(self,queryset=None):
		return self.request.user
	
	def get_success_url(self):
		print(reverse('edit_profile'))
		return reverse('edit_profile')

