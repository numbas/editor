from accounts.forms import NumbasRegistrationForm
from registration.views import register as original_register
from django.views.generic import UpdateView, DetailView
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.contrib import messages
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

	def form_valid(self,form):
		messages.success(self.request,'Your profile has been updated.')
		return super(UserUpdateView,self).form_valid(form)

	def get_success_url(self):
		return reverse('edit_profile')

class ChangePasswordView(CurrentUserUpdateView):
	template_name = 'registration/change_password.html'

	form_class = ChangePasswordForm

	def get_object(self,queryset=None):
		return self.request.user
	
	def form_valid(self,form):
		messages.success(self.request,'Your password has been changed.')
		return super(ChangePasswordView,self).form_valid(form)

	def get_success_url(self):
		return reverse('edit_profile')

class UserProfileView(DetailView):

    template_name = 'profile/view.html'

    model = User
